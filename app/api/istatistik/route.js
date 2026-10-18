import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getOrders, getProducts, localKey } from "@/lib/db";

// GET /api/istatistik?ay=YYYY-MM
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const ay = searchParams.get("ay") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const orders = await getOrders();
  const products = await getProducts();
  const costMap = Object.fromEntries(products.map((p) => [p.id, Number(p.cost) || 0]));
  const profitOf = (o) =>
    (o.items || []).reduce((s, it) => s + ((Number(it.price) || 0) - (costMap[it.id] || 0)) * (Number(it.qty) || 0), 0);

  const closed = orders.filter(
    (o) => o.status === "kapandi" && o.closedAt && localKey(o.closedAt).slice(0, 7) === ay
  );

  const sum = (arr) => arr.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const karOf = (arr) => arr.reduce((s, o) => s + profitOf(o), 0);
  const bahsisOf = (arr) => arr.reduce((s, o) => s + (Number(o.tip) || 0), 0);

  const bahceMap = {};
  for (const o of closed.filter((x) => x.location === "bahce")) {
    for (const it of o.items || []) {
      if (!bahceMap[it.name]) bahceMap[it.name] = { name: it.name, qty: 0, total: 0, kar: 0 };
      bahceMap[it.name].qty += Number(it.qty) || 0;
      bahceMap[it.name].total += (Number(it.qty) || 0) * (Number(it.price) || 0);
      bahceMap[it.name].kar += ((Number(it.price) || 0) - (costMap[it.id] || 0)) * (Number(it.qty) || 0);
    }
  }

  const dukMap = {};
  for (const o of closed.filter((x) => x.location === "disari")) {
    const key = o.borrower || o.name;
    if (!dukMap[key]) dukMap[key] = { name: key, siparis: 0, total: 0, kar: 0, urunler: {} };
    dukMap[key].siparis += 1;
    dukMap[key].total += Number(o.total) || 0;
    dukMap[key].kar += profitOf(o);
    for (const it of o.items || []) {
      if (!dukMap[key].urunler[it.name]) dukMap[key].urunler[it.name] = { name: it.name, qty: 0, total: 0 };
      dukMap[key].urunler[it.name].qty += Number(it.qty) || 0;
      dukMap[key].urunler[it.name].total += (Number(it.qty) || 0) * (Number(it.price) || 0);
    }
  }

  const saatMap = {};
  for (const o of closed) {
    const h = new Date(o.createdAt).getHours();
    if (!saatMap[h]) saatMap[h] = { saat: h, adet: 0, ciro: 0, urunler: {} };
    saatMap[h].adet += 1;
    saatMap[h].ciro += Number(o.total) || 0;
    for (const it of o.items || []) {
      saatMap[h].urunler[it.name] = (saatMap[h].urunler[it.name] || 0) + (Number(it.qty) || 0);
    }
  }
  const saatler = Object.values(saatMap)
    .sort((a, b) => a.saat - b.saat)
    .map((s) => ({
      ...s,
      top: Object.entries(s.urunler).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, q]) => `${n} x${q}`).join(", "),
    }));

  const karMap = {};
  for (const o of closed) {
    for (const it of o.items || []) {
      if (!karMap[it.name]) karMap[it.name] = { name: it.name, qty: 0, total: 0, kar: 0 };
      karMap[it.name].qty += Number(it.qty) || 0;
      karMap[it.name].total += (Number(it.qty) || 0) * (Number(it.price) || 0);
      karMap[it.name].kar += ((Number(it.price) || 0) - (costMap[it.id] || 0)) * (Number(it.qty) || 0);
    }
  }

  const gunMap = {};
  for (const o of closed) {
    const g = localKey(o.closedAt);
    if (!gunMap[g]) gunMap[g] = { gun: g, adet: 0, ciro: 0, kar: 0, nakit: 0, borc: 0, bahsis: 0 };
    gunMap[g].adet += 1;
    gunMap[g].ciro += Number(o.total) || 0;
    gunMap[g].kar += profitOf(o) + (Number(o.tip) || 0);
    gunMap[g].bahsis += Number(o.tip) || 0;
    if (o.payMethod === "nakit") gunMap[g].nakit += Number(o.total) || 0;
    if (o.payMethod === "borc") gunMap[g].borc += Number(o.total) || 0;
  }

  return NextResponse.json({
    ay,
    ozet: {
      siparis: closed.length,
      ciro: sum(closed),
      kar: karOf(closed) + bahsisOf(closed),
      bahsis: bahsisOf(closed),
      nakit: sum(closed.filter((o) => o.payMethod === "nakit")),
      borc: sum(closed.filter((o) => o.payMethod === "borc")),
      bahce: sum(closed.filter((o) => o.location === "bahce")),
      disari: sum(closed.filter((o) => o.location === "disari")),
    },
    bahce: Object.values(bahceMap).sort((a, b) => b.qty - a.qty),
    dukkanlar: Object.values(dukMap)
      .map((d) => ({ ...d, urunler: Object.values(d.urunler).sort((a, b) => b.qty - a.qty) }))
      .sort((a, b) => b.total - a.total),
    saatler,
    enKarli: Object.values(karMap).sort((a, b) => b.kar - a.kar),
    gunluk: Object.values(gunMap).sort((a, b) => (a.gun < b.gun ? 1 : -1)),
  });
}
