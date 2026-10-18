import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { getCagrilar, addCagri, kapatCagri } from "@/lib/db";

export async function GET() {
  return NextResponse.json(await getCagrilar());
}

export async function POST(req) {
  const body = await req.json();
  const location = body.location === "disari" ? "disari" : "bahce";
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "isim/masa gerekli" }, { status: 400 });
  return NextResponse.json(await addCagri({ location, name }));
}

export async function PUT(req) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  await kapatCagri(body.id);
  return NextResponse.json({ ok: true });
}
