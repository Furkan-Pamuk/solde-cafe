import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getPlaces, addPlace, removePlace, isAdmin } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await getPlaces());
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "yetkisiz" }, { status: 401 });
  const body = await req.json();
  const v = String(body.value || "").trim();
  if (!v) return NextResponse.json({ error: "değer boş" }, { status: 400 });
  if (body.action === "add-table") return NextResponse.json(await addPlace("table", v));
  if (body.action === "remove-table") return NextResponse.json(await removePlace("table", v));
  if (body.action === "add-shop") return NextResponse.json(await addPlace("shop", v));
  if (body.action === "remove-shop") return NextResponse.json(await removePlace("shop", v));
  return NextResponse.json({ error: "bilinmeyen işlem" }, { status: 400 });
}
