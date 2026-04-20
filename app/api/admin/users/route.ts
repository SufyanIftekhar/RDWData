import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { connectMongo } from "@/lib/db/mongodb";
import { UserAccountModel } from "@/models/UserAccount";
import { SavedVehicleModel } from "@/models/SavedVehicle";
import { ReportDownloadModel } from "@/models/ReportDownload";
import { PlatePaymentModel } from "@/models/PlatePayment";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const session = getAdminSessionFromCookies();
  if (!session) return unauthorized();

  await connectMongo();
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    UserAccountModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    UserAccountModel.countDocuments()
  ]);

  const userIds = users.map((u) => String(u._id));

  const [savedCounts, reportCounts, payCounts] = await Promise.all([
    SavedVehicleModel.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } }
    ]),
    ReportDownloadModel.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } }
    ]),
    PlatePaymentModel.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } }
    ])
  ]);

  const savedMap = Object.fromEntries(savedCounts.map((s: { _id: string; count: number }) => [s._id, s.count]));
  const reportMap = Object.fromEntries(reportCounts.map((r: { _id: string; count: number }) => [r._id, r.count]));
  const payMap = Object.fromEntries(payCounts.map((p: { _id: string; count: number }) => [p._id, p.count]));

  const enriched = users.map((u) => {
    const id = String(u._id);
    return {
      _id: id,
      email: u.email,
      createdAt: u.createdAt,
      savedVehicles: savedMap[id] ?? 0,
      reports: reportMap[id] ?? 0,
      payments: payMap[id] ?? 0
    };
  });

  return NextResponse.json({ items: enriched, total, page, pages: Math.ceil(total / limit) });
}
