import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getOrders } from "@/lib/db";

function groupOpen(orders) {
  const map = {};
  for (const o of orders) {
    if (o.status === "kapandi" || o.status === "iptal") continue;
    const key = `${o.location}||${o.name}`;
    if (!map[key]) map[key] = { location: o.location, name: o.name, orders: [], total: 0 };
    map[key].orders.push(o);
    map[key].total += Number(o.total) || 0;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

export async function GET() {
  return NextResponse.json(groupOpen(await getOrders()));
}
