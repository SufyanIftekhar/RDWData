import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

const RDW_BASE_URL = process.env.RDW_BASE_URL || "https://opendata.rdw.nl/resource";
const DATASETS = {
  main: "m9d7-ebf2",
  fuel: "8ys7-d773",
  apk: "a34c-vvps",
  defects: "hx2c-gt7k",
  recalls: "af5r-44mf",
  body: "vezc-m2t6",
  typeApprovals: "55kv-xf7m",
  defectDescriptions: "tbph-ct3j"
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PLATE_LIMIT = 1200;
const CONCURRENCY = 4;
const RDW_TIMEOUT_MS = Number(process.env.RDW_TIMEOUT_MS ?? 7000);
const RDW_MAX_RETRIES = Number(process.env.RDW_MAX_RETRIES ?? 2);

function loadEnvFromFile(fileName) {
  const filePath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function buildPlateUrl(dataset, plate) {
  const url = new URL(`${RDW_BASE_URL}/${dataset}.json`);
  url.searchParams.set("kenteken", plate);
  return url.toString();
}

function buildSoqlUrl(dataset, clause, limit = 100) {
  const url = new URL(`${RDW_BASE_URL}/${dataset}.json`);
  url.searchParams.set("$where", clause);
  url.searchParams.set("$limit", String(limit));
  return url.toString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RDW_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function shouldRetry(status) {
  return status === 429 || status >= 500;
}

async function fetchRdw(url, { allowErrorStatuses = [] } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= RDW_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url);
      if (response.ok) {
        return await response.json();
      }
      if (allowErrorStatuses.includes(response.status)) {
        return [];
      }
      if (!shouldRetry(response.status) || attempt === RDW_MAX_RETRIES) {
        throw new Error(`RDW ${response.status} ${response.statusText}`);
      }
      await sleep(200 * (attempt + 1));
    } catch (error) {
      lastError = error;
      if (attempt === RDW_MAX_RETRIES) break;
      if (!(error instanceof Error && error.name === "AbortError")) {
        await sleep(200 * (attempt + 1));
      }
    }
  }
  throw lastError ?? new Error("RDW fetch failed");
}

async function fetchPlateList(limit = PLATE_LIMIT) {
  const url = new URL(`${RDW_BASE_URL}/${DATASETS.main}.json`);
  url.searchParams.set("$select", "kenteken");
  url.searchParams.set("$limit", String(limit));
  url.searchParams.set("$order", "kenteken");
  const records = await fetchRdw(url.toString());
  const plates = new Set();
  for (const record of records) {
    if (!record.kenteken) continue;
    plates.add(String(record.kenteken).trim().toUpperCase().replace(/[^A-Z0-9]/g, ""));
  }
  return Array.from(plates);
}

async function fetchDefectDescriptions(codes) {
  if (!codes.length) return {};
  const uniqueCodes = Array.from(new Set(codes.map((code) => String(code).trim()).filter(Boolean)));
  if (uniqueCodes.length === 0) return {};
  const quoted = uniqueCodes.map((code) => `'${code.replace(/'/g, "\\'")}'`).join(",");
  const where = `gebrek_identificatie in (${quoted})`;
  const url = buildSoqlUrl(DATASETS.defectDescriptions, where, codes.length * 2);
  const records = await fetchRdw(url, { allowErrorStatuses: [400, 404] });
  const map = {};
  for (const record of records) {
    if (record.gebrek_identificatie && record.gebrek_omschrijving) {
      map[String(record.gebrek_identificatie)] = String(record.gebrek_omschrijving);
    }
  }
  return map;
}

async function fetchPlateDetails(plate) {
  const normalized = plate.toUpperCase();
  const [main, fuel, apk, defects, recalls, body, typeApprovals] = await Promise.all([
    fetchRdw(buildPlateUrl(DATASETS.main, normalized)),
    fetchRdw(buildPlateUrl(DATASETS.fuel, normalized)),
    fetchRdw(buildPlateUrl(DATASETS.apk, normalized)),
    fetchRdw(buildSoqlUrl(DATASETS.defects, `kenteken='${normalized}'`, 200), { allowErrorStatuses: [400, 404] }),
    fetchRdw(buildSoqlUrl(DATASETS.recalls, `kenteken='${normalized}'`, 100), { allowErrorStatuses: [400, 404] }),
    fetchRdw(buildPlateUrl(DATASETS.body, normalized)),
    fetchRdw(buildPlateUrl(DATASETS.typeApprovals, normalized), { allowErrorStatuses: [400, 404] })
  ]);

  const defectCodes = [];
  for (const rec of [...apk, ...defects]) {
    if (rec && rec.gebrek_identificatie) {
      defectCodes.push(rec.gebrek_identificatie);
    }
  }
  const defectDescriptions = await fetchDefectDescriptions(defectCodes);

  const now = new Date();
  return {
    _id: normalized,
    cachedAt: now,
    expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
    data: {
      plate: normalized,
      displayPlate: normalized,
      fromCache: true,
      vehicle: {},
      inspections: apk,
      defects,
      defectDescriptions,
      recalls,
      typeApprovals,
      raw: {
        main,
        fuel,
        apk,
        defects,
        recalls,
        body,
        typeApprovals
      }
    }
  };
}

async function main() {
  loadEnvFromFile(".env");
  loadEnvFromFile(".env.local");

  const uri = process.env.MONGODB_URI_DIRECT ?? process.env.MONGODB_URI ?? process.env.DATABASE_URL;
  if (!uri) {
    console.error("MONGODB_URI (or DATABASE_URL) must be set.");
    process.exit(1);
  }

  const plates = await fetchPlateList();
  console.log(`Fetched ${plates.length} plates from RDW.`);
  if (!plates.length) return;

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || undefined);
  const collection = db.collection("vehiclecaches");

  const queue = [...plates];
  let cached = 0;
  let failed = 0;

  const worker = async () => {
    while (queue.length) {
      const plate = queue.shift();
      if (!plate) break;
      try {
        const doc = await fetchPlateDetails(plate);
        await collection.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
        cached += 1;
        console.log(`[seed] cached ${plate} (${cached}/${plates.length})`);
      } catch (error) {
        failed += 1;
        console.error(`[seed] failed ${plate}:`, error instanceof Error ? error.message : error);
      }
    }
  };

  await Promise.all(new Array(CONCURRENCY).fill(null).map(() => worker()));
  await client.close();
  console.log(`Seed finished: ${cached} cached, ${failed} failed.`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
