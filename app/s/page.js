"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import TeaLogo from "../tea-logo";

function Icerik() {
  const sp = useSearchParams();
  const [products, setProducts] = useState([]);
  const [places, setPlaces] = useState({ tables: [], shops: [] });
  const [location, setLocation] = useState(sp.get("konum") === "disari" ? "disari" : "bahce");
  const [name, setName] = useState(sp.get("masa") || "");
  const [cart, setCart] = useState({});
  const [tip, setTip] = useState(0);
  const [ozel, setOzel] = useState(false);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [lastOrder, setLastOrder] = useState(null); // {id, day}
  const [orderStatus, setOrderStatus] = useState(null);

  function bugunKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/places").then((r) => r.json()).then(setPlaces);
    const m = sp.get("masa");
    if (m) { setName(m); setLocation("bahce"); setOzel(false); }
    const dk = sp.get("dukkan");
    if (dk) { setName(dk); setLocation("disari"); setOzel(false); }
    const k = sp.get("konum");
    if (k === "disari" || k === "bahce") setLocation(k);
    try {
      const saved = JSON.parse(localStorage.getItem("son_siparis") || "null");
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (saved && saved.day === today) setLastOrder(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (!lastOrder) { setOrderStatus(null); return; }
    let stop = false;
    async function check() {
      try {
        const r = await fetch(`/api/orders/${lastOrder.id}`);
        if (r.ok && !stop) setOrderStatus(await r.json());
      } catch {}
    }
    check();
    const t = setInterval(check, 3000);
    return () => { stop = true; clearInterval(t); };
  }, [lastOrder]);

  const itemsTotal = Object.entries(cart).reduce((s, [id, q]) => {
    const p = products.find((x) => x.id === id);
    return s + (p ? p.price * q : 0);
  }, 0);
  const total = itemsTotal + (Number(tip) || 0);

  function setQty(id, d) {
    setCart((c) => {
      const n = Math.max(0, (c[id] || 0) + d);
      const nc = { ...c };
      if (n === 0) delete nc[id];
      else nc[id] = n;
      return nc;
    });
  }

  async function gonder() {
    setSending(true);
    setMsg("");
    const items = Object.entries(cart).map(([id, qty]) => ({ id, qty }));
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, name, items, tip: Number(tip) || 0 }),
    });
    const j = await res.json();
    setSending(false);
    if (!res.ok) { setMsg(j.error || "Hata"); return; }
    setCart({});
    setTip(0);
    const saved = { id: j.id, day: j.day };
    setLastOrder(saved);
    try { localStorage.setItem("son_siparis", JSON.stringify(saved)); } catch {}
    setMsg("");
  }

  function yeniSiparis() {
    setLastOrder(null);
    setOrderStatus(null);
    setCart({});
    setTip(0);
    setMsg("");
    try { localStorage.removeItem("son_siparis"); } catch {}
  }

  function durumMetni(s) {
    if (s === "bekliyor") return "⏳ Siparişin hazırlanıyor...";
    if (s === "hazir") return "✅ Teslim edildi — Afiyet olsun!";
    if (s === "kapandi") return "🧾 Hesap kapatıldı — Teşekkürler!";
    if (s === "iptal") return "❌ Sipariş iptal edildi";
    return s;
  }

  const names = location === "bahce" ? places.tables : places.shops;

  const sVal = (p) => (p.sira === undefined || p.sira === null ? 9999 : Number(p.sira));
  const grouped = {};
  for (const p of products) {
    const c = p.cat || "Diğer";
    if (!grouped[c]) grouped[c] = [];
    grouped[c].push(p);
  }
  for (const c of Object.keys(grouped)) grouped[c].sort((a, b) => sVal(a) - sVal(b) || a.name.localeCompare(b.name, "tr"));
  const catSira = {};
  for (const c of Object.keys(grouped)) catSira[c] = Math.min(...grouped[c].map(sVal));
  const cats = Object.keys(grouped).sort((a, b) => (catSira[a] ?? 9999) - (catSira[b] ?? 9999) || a.localeCompare(b, "tr"));

  return (
    <div className="light">
      <div className="topbar"><span className="row"><TeaLogo size={26} /><span> — Sipariş</span></span><span className="muted">canlı</span></div>
      <div className="container" style={{ maxWidth: 640 }}>
        {orderStatus && (
          <div className="card" style={{ borderLeft: "6px solid #38bdf8", marginBottom: 12 }}>
            <div className="big">{durumMetni(orderStatus.status)}</div>
            <div className="muted">#{orderStatus.id} {orderStatus.name} — {(orderStatus.items || []).map((i) => `${i.qty} ${i.name}`).join(", ")} — {orderStatus.total} TL{(orderStatus.tip > 0) ? ` (bahşiş ${orderStatus.tip} TL)` : ""}</div>
            <button className="btn ghost" style={{ marginTop: 8 }} onClick={yeniSiparis}>+ Yeni Sipariş</button>
          </div>
        )}
        <div className="card">
          <div className="row">
            <button className={location === "bahce" ? "btn" : "btn ghost"} onClick={() => setLocation("bahce")}>Bahçe</button>
            <button className={location === "disari" ? "btn warn" : "btn ghost"} onClick={() => setLocation("disari")}>Dışarı</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>{location === "bahce" ? "Masa seç" : "Dükkan / İsim seç veya yaz"}</label>
            <select
              value={names.includes(name) ? name : (ozel ? "__yeni" : "")}
              onChange={(e) => {
                if (e.target.value === "__yeni") { setOzel(true); setName(""); }
                else { setOzel(false); setName(e.target.value); }
              }}
            >
              <option value="">Seç...</option>
              {names.map((n) => <option key={n} value={n}>{n}</option>)}
              <option value="__yeni">✏️ Listede yok, yaz...</option>
            </select>
            {ozel && (
              <input style={{ marginTop: 8 }} placeholder="İsim yazın" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          {cats.map((cat) => (
            <div key={cat} style={{ marginBottom: 12 }}>
              <h3 style={{ margin: "8px 0" }}>{cat}</h3>
              {grouped[cat].map((p) => (
                <div key={p.id} className="card" style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div className="big" style={{ fontSize: 17 }}>{p.name}</div><div className="muted">{p.price} TL</div></div>
                  <div className="qty">
                    <button onClick={() => setQty(p.id, -1)}>-</button>
                    <b>{cart[p.id] || 0}</b>
                    <button onClick={() => setQty(p.id, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="card" style={{ position: "sticky", bottom: 8, marginTop: 12 }}>
          <div style={{ marginBottom: 8 }}>
            <label>💰 Bahşiş (masa hesabına eklenir)</label>
            <div className="row">
              {[0, 5, 10, 20].map((v) => (
                <button key={v} className={Number(tip) === v ? "btn" : "btn ghost"} onClick={() => setTip(v)}>{v} TL</button>
              ))}
              <input type="number" min="0" placeholder="Diğer" value={tip || ""} onChange={(e) => setTip(Number(e.target.value) || 0)} style={{ maxWidth: 110 }} />
            </div>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="big">Toplam: {total} TL</div>
            <button className="btn" disabled={!name || total === 0 || sending} onClick={gonder}>
              {sending ? "..." : "Siparişi Gönder"}
            </button>
          </div>
          {msg && <div style={{ marginTop: 8, fontWeight: 700 }}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}

export default function SiparisVer() {
  return (
    <Suspense><Icerik /></Suspense>
  );
}
