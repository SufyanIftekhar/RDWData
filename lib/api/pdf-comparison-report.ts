import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatDisplayPlate } from "@/lib/rdw/normalize";
import type { VehicleComparisonAiResult } from "./claude-comparison";

type ComparisonPdfArgs = {
  locale: "nl" | "en";
  generatedAt: Date;
  basePlate: string;
  comparePlate: string;
  baseData: Record<string, unknown>;
  compareData: Record<string, unknown>;
  ai: VehicleComparisonAiResult;
};

function s(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

function c(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `EUR ${Math.round(n).toLocaleString("nl-NL")}`;
}

function getFields(data: Record<string, unknown>) {
  const vehicle = (data.vehicle ?? {}) as Record<string, unknown>;
  const engine = (vehicle.engine ?? {}) as Record<string, unknown>;
  const weight = (vehicle.weight ?? {}) as Record<string, unknown>;
  const owners = (vehicle.owners ?? {}) as Record<string, unknown>;
  const enriched = (data.enriched ?? {}) as Record<string, unknown>;
  return {
    title: `${s(vehicle.brand)} ${s(vehicle.tradeName)}`.trim(),
    year: s(vehicle.year),
    fuel: s(vehicle.fuelType),
    body: s(vehicle.bodyType),
    powerKw: s(engine.powerKw),
    doors: s(vehicle.doors),
    seats: s(vehicle.seats),
    weight: s(weight.empty),
    owners: s(owners.count),
    apkChance: s(enriched.apkPassChance),
    risk: s(enriched.maintenanceRiskScore),
    defects: Array.isArray(data.defects) ? String(data.defects.length) : "0",
    recalls: Array.isArray(data.recalls) ? String(data.recalls.length) : "0",
    valueNow: c(enriched.estimatedValueNow),
    valueRange: `${c(enriched.estimatedValueMin)} - ${c(enriched.estimatedValueMax)}`
  };
}

export async function generateVehicleComparisonPdf(args: ComparisonPdfArgs): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([595, 842]);

  page.drawRectangle({ x: 0, y: 780, width: 595, height: 62, color: rgb(0.05, 0.2, 0.45) });
  page.drawText(args.locale === "nl" ? "Voertuigvergelijking Rapport" : "Vehicle Comparison Report", {
    x: 24, y: 812, font: bold, size: 18, color: rgb(1, 1, 1)
  });
  page.drawText(
    `${formatDisplayPlate(args.basePlate)} vs ${formatDisplayPlate(args.comparePlate)} | ${args.generatedAt.toLocaleString(args.locale === "nl" ? "nl-NL" : "en-US")}`,
    { x: 24, y: 794, font: regular, size: 9, color: rgb(0.85, 0.93, 1) }
  );

  const left = getFields(args.baseData);
  const right = getFields(args.compareData);

  page.drawText(args.locale === "nl" ? "AI oordeel" : "AI verdict", { x: 24, y: 758, font: bold, size: 12, color: rgb(0.08, 0.2, 0.45) });
  page.drawText(`${args.locale === "nl" ? "Resultaat" : "Result"}: ${args.ai.verdict}`, { x: 24, y: 741, font: bold, size: 10, color: rgb(0.18, 0.26, 0.38) });
  page.drawText(args.ai.summary.slice(0, 360), { x: 24, y: 724, font: regular, size: 9, color: rgb(0.2, 0.3, 0.4), maxWidth: 546, lineHeight: 12 });

  const startY = 645;
  page.drawRectangle({ x: 24, y: startY - 20, width: 547, height: 20, color: rgb(0.92, 0.95, 1) });
  page.drawText(args.locale === "nl" ? "Vergelijkingstabel" : "Comparison Table", { x: 30, y: startY - 14, font: bold, size: 10, color: rgb(0.08, 0.2, 0.45) });

  const rows: Array<[string, string, string]> = [
    [args.locale === "nl" ? "Voertuig" : "Vehicle", left.title, right.title],
    [args.locale === "nl" ? "Bouwjaar" : "Year", left.year, right.year],
    [args.locale === "nl" ? "Brandstof" : "Fuel", left.fuel, right.fuel],
    [args.locale === "nl" ? "Carrosserie" : "Body", left.body, right.body],
    [args.locale === "nl" ? "Vermogen (kW)" : "Power (kW)", left.powerKw, right.powerKw],
    [args.locale === "nl" ? "Deuren/Zitplaatsen" : "Doors/Seats", `${left.doors}/${left.seats}`, `${right.doors}/${right.seats}`],
    [args.locale === "nl" ? "Leeggewicht (kg)" : "Empty weight (kg)", left.weight, right.weight],
    [args.locale === "nl" ? "Eigenaren" : "Owners", left.owners, right.owners],
    [args.locale === "nl" ? "APK kans %" : "APK chance %", left.apkChance, right.apkChance],
    [args.locale === "nl" ? "Onderhoudsrisico" : "Maintenance risk", left.risk, right.risk],
    [args.locale === "nl" ? "Defecten" : "Defects", left.defects, right.defects],
    [args.locale === "nl" ? "Recalls" : "Recalls", left.recalls, right.recalls],
    [args.locale === "nl" ? "Marktwaarde nu" : "Market value now", left.valueNow, right.valueNow],
    [args.locale === "nl" ? "Waarderange" : "Value range", left.valueRange, right.valueRange]
  ];

  let y = startY - 30;
  for (const row of rows) {
    page.drawRectangle({ x: 24, y: y - 18, width: 547, height: 18, color: rgb(1, 1, 1), borderColor: rgb(0.86, 0.9, 0.96), borderWidth: 0.5 });
    page.drawText(row[0], { x: 30, y: y - 12, font: bold, size: 8.5, color: rgb(0.16, 0.24, 0.35) });
    page.drawText(row[1], { x: 208, y: y - 12, font: regular, size: 8.5, color: rgb(0.2, 0.3, 0.4), maxWidth: 170 });
    page.drawText(row[2], { x: 390, y: y - 12, font: regular, size: 8.5, color: rgb(0.2, 0.3, 0.4), maxWidth: 170 });
    y -= 18;
  }

  page.drawText(args.locale === "nl" ? "Aanbeveling" : "Recommendation", { x: 24, y: y - 20, font: bold, size: 11, color: rgb(0.08, 0.2, 0.45) });
  page.drawText(args.ai.recommendation.slice(0, 420), { x: 24, y: y - 36, font: regular, size: 9, color: rgb(0.2, 0.3, 0.4), maxWidth: 546, lineHeight: 12 });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
