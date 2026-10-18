import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");
const SB_URL = process.env.SUPABASE_URL || "";
const SB_KEY = process.env.SUPABASE_KEY || "";
const useSb = !!(SB_URL && SB_KEY);

// ---------- ortak yardımcılar ----------
export function isAdmin(req) {
  const pw = process.env.ADMIN_PASSWORD || "cems123";
  const h = req.headers.get("x-admin-password") || "";
  return h === pw;
}

export function localKey(iso) {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return String(iso || "").slice(0, 10);
  }
}

export function todayKey(d = new Date()) {
  return localKey(d.toISOString());
}

export function orderDay(o) {
  return o.day || localKey(o.createdAt);
}

// ---------- dosya yedeği (SUPABASE yoksa) ----------
let memCache = null;

function seed() {
  return {
    products: [],
    tables: [],
    shops: [],
    orders: [],
    seq: 1,
  };
}

function readFileDb() {
  if (memCache) return memCache;
  try {
    if (!fs.existsSync(DB_PATH)) {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const s = seed();
      fs.writeFileSync(DB_PATH, JSON.stringify(s, null, 2), "utf-8");
      memCache = s;
      return s;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(raw);
    memCache = db;
    return db;
  } catch {
    if (!memCache) memCache = seed();
    return memCache;
  }
}

function writeFileDb(db) {
  memCache = db;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch {}
}

// ---------- Supabase REST ----------
async function sb(path, opts = {}) {
  const r = await fetch(`${SB_URL}/rest/v1${path}`, {
    cache: "no-store",
    ...opts,
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`supabase ${r.status}: ${t}`);
  }
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

function mapOrder(w) {
  return {
    id: w.id,
    createdAt: w.created_at,
    day: w.day || localKey(w.created_at),
    location: w.location,
    name: w.name,
    items: w.items || [],
    total: Number(w.total) || 0,
    tip: Number(w.tip) || 0,
    status: w.status,
    payMethod: w.pay_method || null,
    borrower: w.borrower || null,
    closedAt: w.closed_at || null,
    debtPaid: !!w.debt_paid,
    debtPaidAt: w.debt_paid_at || null,
  };
}

// ---------- ürünler ----------
export async function getProducts() {
  if (!useSb) return (readFileDb().products || []).filter((p) => p.active !== false);
  const rows = await sb(`/products?select=*&order=name`);
  return (rows || []).filter((p) => p.active !== false);
}

export async function addProduct(p) {
  if (!useSb) {
    const db = readFileDb();
    const id = (p.name || "urun").toLowerCase().replace(/[^a-z0-9çğıöşü]+/gi, "-") + "-" + Date.now();
    const maxSira = Math.max(0, ...((db.products || []).map((x) => Number(x.sira) || 0)));
    const row = { id, name: p.name, price: Number(p.price) || 0, cat: p.cat || "Diğer", cost: Number(p.cost) || 0, sira: maxSira + 1, active: true };
    db.products.push(row);
    writeFileDb(db);
    return row;
  }
  const top = await sb(`/products?select=sira&order=sira.desc&limit=1`);
  const sira = (top && top[0] && Number(top[0].sira) || 0) + 1;
  const rows = await sb(`/products`, { method: "POST", body: JSON.stringify({ ...p, sira }) });
  return rows[0];
}

export async function updateProduct(id, patch) {
  if (!useSb) {
    const db = readFileDb();
    const p = (db.products || []).find((x) => x.id === id);
    if (!p) return null;
    Object.assign(p, patch);
    writeFileDb(db);
    return p;
  }
  const rows = await sb(`/products?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
  return rows[0] || null;
}

export async function deleteProduct(id) {
  if (!useSb) {
    const db = readFileDb();
    db.products = (db.products || []).filter((x) => x.id !== id);
    writeFileDb(db);
    return true;
  }
  await sb(`/products?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return true;
}

// ---------- masa / dükkan ----------
export async function getPlaces() {
  if (!useSb) {
    const db = readFileDb();
    return { tables: db.tables || [], shops: db.shops || [] };
  }
  const rows = (await sb(`/places?select=*&order=value`)) || [];
  return {
    tables: rows.filter((x) => x.kind === "table").map((x) => x.value),
    shops: rows.filter((x) => x.kind === "shop").map((x) => x.value),
  };
}

export async function addPlace(kind, value) {
  if (!useSb) {
    const db = readFileDb();
    const key = kind === "shop" ? "shops" : "tables";
    db[key] = db[key] || [];
    if (!db[key].includes(value)) db[key].push(value);
    writeFileDb(db);
    return getPlaces();
  }
  await sb(`/places`, { method: "POST", body: JSON.stringify({ kind, value }) });
  return getPlaces();
}

export async function removePlace(kind, value) {
  if (!useSb) {
    const db = readFileDb();
    const key = kind === "shop" ? "shops" : "tables";
    db[key] = (db[key] || []).filter((x) => x !== value);
    writeFileDb(db);
    return getPlaces();
  }
  await sb(`/places?kind=eq.${encodeURIComponent(kind)}&value=eq.${encodeURIComponent(value)}`, { method: "DELETE" });
  return getPlaces();
}

// ---------- siparişler ----------
export async function getOrders() {
  if (!useSb) {
    return [...(readFileDb().orders || [])].map((o) => ({ ...o, day: orderDay(o) })).sort((a, b) => b.id - a.id);
  }
  const rows = (await sb(`/orders?select=*&order=id.desc&limit=2000`)) || [];
  return rows.map(mapOrder);
}

export async function getOrder(id) {
  if (!useSb) {
    const o = (readFileDb().orders || []).find((x) => String(x.id) === String(id));
    return o ? { ...o, day: orderDay(o) } : null;
  }
  const rows = (await sb(`/orders?select=*&id=eq.${encodeURIComponent(id)}`)) || [];
  return rows.length ? mapOrder(rows[0]) : null;
}

export async function createOrder(o) {
  if (!useSb) {
    const db = readFileDb();
    const id = db.seq || 1;
    db.seq = id + 1;
    const row = { id, ...o };
    db.orders = db.orders || [];
    db.orders.push(row);
    if (db.orders.length > 2000) db.orders = db.orders.slice(-2000);
    writeFileDb(db);
    return row;
  }
  const rows = await sb(`/orders`, {
    method: "POST",
    body: JSON.stringify({
      created_at: o.createdAt,
      day: o.day,
      location: o.location,
      name: o.name,
      items: o.items,
      total: o.total,
      tip: o.tip || 0,
      status: o.status || "bekliyor",
    }),
  });
  return mapOrder(rows[0]);
}

export async function setOrderStatus(id, status) {
  if (!useSb) {
    const db = readFileDb();
    const o = (db.orders || []).find((x) => String(x.id) === String(id));
    if (!o) return null;
    o.status = status;
    writeFileDb(db);
    return o;
  }
  const rows = await sb(`/orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  return rows.length ? mapOrder(rows[0]) : null;
}

export async function closeOrders(ids, { method, borrower }) {
  const now = new Date().toISOString();
  if (!useSb) {
    const db = readFileDb();
    for (const o of db.orders || []) {
      if (ids.map(String).includes(String(o.id))) {
        o.status = "kapandi";
        o.payMethod = method;
        o.borrower = borrower;
        o.closedAt = now;
        o.debtPaid = method === "nakit";
        o.debtPaidAt = method === "nakit" ? now : null;
      }
    }
    writeFileDb(db);
    return true;
  }
  const list = ids.map((x) => encodeURIComponent(x)).join(",");
  await sb(`/orders?id=in.(${list})`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "kapandi",
      pay_method: method,
      borrower,
      closed_at: now,
      debt_paid: method === "nakit",
      debt_paid_at: method === "nakit" ? now : null,
    }),
  });
  return true;
}

export async function collectDebt(borrower) {
  const now = new Date().toISOString();
  if (!useSb) {
    const db = readFileDb();
    for (const o of db.orders || []) {
      if (o.status === "kapandi" && o.payMethod === "borc" && !o.debtPaid && (o.borrower || o.name) === borrower) {
        o.debtPaid = true;
        o.debtPaidAt = now;
      }
    }
    writeFileDb(db);
    return true;
  }
  await sb(`/orders?borrower=eq.${encodeURIComponent(borrower)}&status=eq.kapandi&pay_method=eq.borc&debt_paid=eq.false`, {
    method: "PATCH",
    body: JSON.stringify({ debt_paid: true, debt_paid_at: now }),
  });
  return true;
}
