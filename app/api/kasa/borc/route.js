import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getOrders, collectDebt } from "@/lib/db";

export async function GET() {
  const orders = await getOrders();
  const map = {};
  for (const o of orders) {
    if (o.status !== "kapandi" || o.payMethod !== "borc" || o.debtPaid) continue;
    const key = o.borrower || o.name;
    if (!map[key]) map[key] = { name: key, orders: [], total: 0 };
    map[key].orders.push(o);
    map[key].total += Number(o.total) || 0;
  }
  return NextResponse.json(Object.values(map).sort((a, b) => b.total - a.total));
}

export async function POST(req) {
  const body = await req.json();
  const borrower = String(body.borrower || "").trim();
  if (!borrower) return NextResponse.json({ error: "isim gerekli" }, { status: 400 });
  await collectDebt(borrower);
  return NextResponse.json({ ok: true });
}
