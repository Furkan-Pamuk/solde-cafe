import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { getProducts, addProduct, isAdmin } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await getProducts());
}

export async function POST(req) {
  if (!isAdmin(req)) return NextResponse.json({ error: "yetkisiz" }, { status: 401 });
  const body = await req.json();
  const p = await addProduct({ name: body.name, price: Number(body.price) || 0, cat: body.cat || "Diğer", cost: Number(body.cost) || 0, active: true });
  return NextResponse.json(p);
}
