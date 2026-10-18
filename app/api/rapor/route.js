import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getOrders, getProducts, todayKey, localKey } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayKey();
  const orders = await getOrders();
  const products = await getProducts();
  const costMap = Object.fromEntries(products.map((p) => [p.id, Number(p.cost) || 0]));
  const closed = orders.filter((o) => o.status === "kapandi" && o.closedAt && localKey(o.closedAt) === date);
  const nakit = closed.filter((o) => o.payMethod === "nakit");
  const borc = closed.filter((o) => o.payMethod === "borc");
  const tahsil = orders.filter((o) => o.debtPaidAt && localKey(o.debtPaidAt) === date && o.payMethod === "borc");
  const sum = (arr) => arr.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const profitOf = (o) => (o.items || []).reduce((s, it) => s + ((Number(it.price) || 0) - (costMap[it.id] || 0)) * (Number(it.qty) || 0), 0);
  const kar = (arr) => arr.reduce((s, o) => s + profitOf(o), 0);
  const byProduct = {};
  for (const o of closed) {
    for (const it of o.items || []) {
      if (!byProduct[it.name]) byProduct[it.name] = { name: it.name, qty: 0, total: 0, kar: 0 };
      byProduct[it.name].qty += Number(it.qty) || 0;
      byProduct[it.name].total += (Number(it.qty) || 0) * (Number(it.price) || 0);
      byProduct[it.name].kar += ((Number(it.price) || 0) - (costMap[it.id] || 0)) * (Number(it.qty) || 0);
    }
  }
  const bahce = sum(closed.filter((o) => o.location === "bahce"));
  const disari = sum(closed.filter((o) => o.location === "disari"));
  const bahsis = closed.reduce((s, o) => s + (Number(o.tip) || 0), 0);
  return NextResponse.json({
    date,
    adet: closed.length,
    nakitToplam: sum(nakit),
    borcToplam: sum(borc),
    tahsilToplam: sum(tahsil),
    ciro: sum(closed),
    kar: kar(closed) + bahsis,
    bahsis,
    bahce,
    disari,
    byProduct: Object.values(byProduct).sort((a, b) => b.qty - a.qty),
    orders: closed.sort((a, b) => b.id - a.id),
  });
}
