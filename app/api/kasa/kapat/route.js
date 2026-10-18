import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { closeOrders } from "@/lib/db";

export async function POST(req) {
  const body = await req.json();
  const orderIds = (body.orderIds || []).map(String);
  const method = body.method === "borc" ? "borc" : "nakit";
  const borrower = String(body.borrower || "").trim();
  if (!orderIds.length) return NextResponse.json({ error: "sipariş yok" }, { status: 400 });
  if (method === "borc" && !borrower) return NextResponse.json({ error: "borç ismi gerekli" }, { status: 400 });
  await closeOrders(orderIds, { method, borrower: method === "borc" ? borrower : undefined });
  return NextResponse.json({ ok: true });
}
