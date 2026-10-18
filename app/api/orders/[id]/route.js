import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getOrder, setOrderStatus } from "@/lib/db";

export async function GET(req, { params }) {
  const o = await getOrder(params.id);
  if (!o) return NextResponse.json({ error: "bulunamadı" }, { status: 404 });
  return NextResponse.json(o);
}

export async function PATCH(req, { params }) {
  const body = await req.json();
  const allowed = ["bekliyor", "hazir", "kapandi", "iptal"];
  if (!allowed.includes(body.status)) return NextResponse.json({ error: "geçersiz durum" }, { status: 400 });
  const o = await setOrderStatus(params.id, body.status);
  if (!o) return NextResponse.json({ error: "bulunamadı" }, { status: 404 });
  return NextResponse.json(o);
}
