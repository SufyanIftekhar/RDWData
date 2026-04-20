import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { connectMongo } from "@/lib/db/mongodb";
import { UserAccountModel } from "@/models/UserAccount";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = getAdminSessionFromCookies();
  if (!session) return unauthorized();

  await connectMongo();
  const result = await UserAccountModel.findByIdAndDelete(params.id);
  if (!result) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
