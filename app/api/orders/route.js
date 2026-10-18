import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getOrders, createOrder, getProducts, todayKey } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const location = searchParams.get("location");
  const bugun = searchParams.get("bugun");
  const today = todayKey();
  let orders = await getOrders();
  if (bugun) orders = orders.filter((o) => o.day === today);
  if (status) orders = orders.filter((o) => o.status === status);
  if (location) orders = orders.filter((o) => o.location === location);
  return NextResponse.json(orders.slice(0, 500));
}

export async function POST(req) {
  const body = await req.json();
  const location = body.location === "disari" ? "disari" : "bahce";
  const name = String(body.name || "").trim();
  const items = Array.isArray(body.items) ? body.items.filter((i) => i.qty > 0) : [];
  if (!name) return NextResponse.json({ error: "isim/masa gerekli" }, { status: 400 });
  if (!items.length) return NextResponse.json({ error: "ürün seçilmedi" }, { status: 400 });

  const products = await getProducts();
  const pmap = Object.fromEntries(products.map((p) => [p.id, p]));
  const tip = Math.max(0, Number(body.tip) || 0);
  let total = 0;
  const norm = items.map((i) => {
    const p = pmap[i.id];
    const price = p ? Number(p.price) : Number(i.price) || 0;
    const iname = p ? p.name : String(i.name || "Ürün");
    const qty = Number(i.qty) || 0;
    total += price * qty;
    return { id: i.id, name: iname, price, qty };
  });

  const now = new Date();
  const order = await createOrder({
    createdAt: now.toISOString(),
    day: todayKey(now),
    location,
    name,
    items: norm,
    total: total + tip,
    tip,
    status: "bekliyor",
  });
  return NextResponse.json(order);
}
