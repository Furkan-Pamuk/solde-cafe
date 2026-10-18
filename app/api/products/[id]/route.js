import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { updateProduct, deleteProduct, isAdmin } from "@/lib/db";

export async function PUT(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "yetkisiz" }, { status: 401 });
  const body = await req.json();
  const patch = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.price !== undefined) patch.price = Number(body.price);
  if (body.cat !== undefined) patch.cat = body.cat;
  if (body.cost !== undefined) patch.cost = Number(body.cost);
  if (body.sira !== undefined) patch.sira = Number(body.sira);
  if (body.active !== undefined) patch.active = body.active;
  const p = await updateProduct(params.id, patch);
  if (!p) return NextResponse.json({ error: "bulunamadı" }, { status: 404 });
  return NextResponse.json(p);
}

export async function DELETE(req, { params }) {
  if (!isAdmin(req)) return NextResponse.json({ error: "yetkisiz" }, { status: 401 });
  await deleteProduct(params.id);
  return NextResponse.json({ ok: true });
}
