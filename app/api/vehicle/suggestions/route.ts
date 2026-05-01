import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { VehicleCacheModel } from "@/models/VehicleCache";
import { parsePlateOrThrow } from "@/lib/api/plate";
import { normalizePlate } from "@/lib/rdw/normalize";

export const runtime = "nodejs";

type Suggestion = {
  plate: string;
  label: string;
  year: number | null;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const plate = parsePlateOrThrow(url.searchParams.get("plate") ?? "");
    const brand = String(url.searchParams.get("brand") ?? "").trim();
    const tradeName = String(url.searchParams.get("tradeName") ?? "").trim();
    const fuelType = String(url.searchParams.get("fuelType") ?? "").trim();
    const year = Number(url.searchParams.get("year"));

    await connectMongo();
    const query: Record<string, unknown> = {
      _id: { $ne: plate }
    };
    if (brand) query["data.vehicle.brand"] = brand;
    if (tradeName) query["data.vehicle.tradeName"] = tradeName;
    if (fuelType) query["data.vehicle.fuelType"] = fuelType;
    if (Number.isFinite(year)) {
      query["data.vehicle.year"] = { $gte: year - 2, $lte: year + 2 };
    }

    const docs = await VehicleCacheModel.find(query, { _id: 1, "data.vehicle.brand": 1, "data.vehicle.tradeName": 1, "data.vehicle.year": 1 })
      .sort({ cachedAt: -1 })
      .limit(12)
      .lean<Array<{ _id: string; data?: { vehicle?: { brand?: string; tradeName?: string; year?: number } } }>>();

    const unique = new Map<string, Suggestion>();
    for (const doc of docs) {
      const normalized = normalizePlate(doc._id);
      if (!normalized || normalized === plate || unique.has(normalized)) continue;
      const vehicle = doc.data?.vehicle;
      unique.set(normalized, {
        plate: normalized,
        label: [vehicle?.brand, vehicle?.tradeName].filter(Boolean).join(" ").trim() || normalized,
        year: Number.isFinite(Number(vehicle?.year)) ? Number(vehicle?.year) : null
      });
    }

    return NextResponse.json({
      items: Array.from(unique.values()).slice(0, 8)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load suggestions.";
    return NextResponse.json({ error: message, items: [] }, { status: 400 });
  }
}
