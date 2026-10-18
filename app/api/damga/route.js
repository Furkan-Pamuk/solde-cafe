import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { getDamgaTumu, damgaKullan } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await getDamgaTumu());
}

export async function POST(req) {
  const body = await req.json();
  if (body.action === "kullan" && body.name) {
    return NextResponse.json(await damgaKullan(String(body.name)));
  }
  return NextResponse.json({ error: "bilinmeyen işlem" }, { status: 400 });
}
