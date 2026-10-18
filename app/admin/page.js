"use client";
import { useEffect, useState } from "react";
import TeaLogo from "../tea-logo";

export default function Admin() {
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  const [products, setProducts] = useState([]);
  const [places, setPlaces] = useState({ tables: [], shops: [] });
  const [pname, setPname] = useState("");
  const [pprice, setPprice] = useState("");
  const [pcat, setPcat] = useState("");
  const [pcost, setPcost] = useState("");
  const [tval, setTval] = useState("");
  const [sval, setSval] = useState("");
  const [base, setBase] = useState("");
  const [kopya, setKopya] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBase(window.location.origin);
      const s = localStorage.getItem("admin_pw");
      if (s) { setPw(s); setOk(true); }
    }
  }, []);

  const H = () => ({ "Content-Type": "application/json", "x-admin-password": pw });

  async function load() {
    const p = await fetch("/api/products").then((r) => r.json());
    setProducts(p);
    const pl = await fetch("/api/places").then((r) => r.json());
    setPlaces(pl);
  }
  useEffect(() => { if (ok) load(); }, [ok]);

  function giris() { localStorage.setItem("admin_pw", pw); setOk(true); }

  async function addProduct() {
    await fetch("/api/products", { method: "POST", headers: H(), body: JSON.stringify({ name: pname, price: Number(pprice), cat: pcat || "Diğer", cost: Number(pcost) || 0 }) });
    setPname(""); setPprice(""); setPcat(""); setPcost(""); load();
  }
  async function saveProduct(p) {
    const name = prompt("Ürün adı", p.name) ?? p.name;
    const price = prompt("Satış fiyatı", String(p.price)) ?? p.price;
    const cost = prompt("Geliş maliyeti (kar hesabı için)", String(p.cost || 0)) ?? p.cost;
    const cat = prompt("Kategori", p.cat || "Diğer") ?? p.cat;
    await fetch(`/api/products/${p.id}`, { method: "PUT", headers: H(), body: JSON.stringify({ name, price: Number(price), cost: Number(cost), cat }) });
    load();
  }
  async function delProduct(id) {
    if (!confirm("Silinsin mi?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE", headers: H() });
    load();
  }
  async function place(action, value) {
    await fetch("/api/places", { method: "POST", headers: H(), body: JSON.stringify({ action, value }) });
    if (action.includes("table")) setTval("");
    else setSval("");
    load();
  }

  const qr = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`;

  const siraliUrunler = [...products].sort((a, b) =>
    ((a.sira === undefined || a.sira === null ? 9999 : Number(a.sira)) - (b.sira === undefined || b.sira === null ? 9999 : Number(b.sira))) ||
    String(a.name).localeCompare(String(b.name), "tr"));

  async function move(idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= siraliUrunler.length) return;
    const a = siraliUrunler[idx], b = siraliUrunler[j];
    const sa = a.sira === undefined || a.sira === null ? 9999 : Number(a.sira);
    const sbb = b.sira === undefined || b.sira === null ? 9999 : Number(b.sira);
    await fetch(`/api/products/${a.id}`, { method: "PUT", headers: H(), body: JSON.stringify({ sira: sbb }) });
    await fetch(`/api/products/${b.id}`, { method: "PUT", headers: H(), body: JSON.stringify({ sira: sa }) });
    load();
  }

  function duzeltBase(v) {
    v = (v || "").trim();
    if (v && !/^[a-z]+:\/\//i.test(v)) v = "https://" + v;
    return v;
  }

  function baseUyarisi() {
    try {
      const h = new URL(base).hostname;
      if (!h.includes(".")) return "⚠️ Adres hatalı görünüyor — tam adres olmalı, örn: https://solde-cafe.vercel.app";
      return "";
    } catch { return base ? "⚠️ Adres hatalı görünüyor." : ""; }
  }

  async function kopyala(url) {
    try { await navigator.clipboard.writeText(url); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    setKopya(url);
    setTimeout(() => setKopya(""), 2000);
  }

  function LinkSatir({ url, ad }) {
    return (
      <div>
        <div className="row" style={{ marginTop: 6 }}>
          <span className="muted" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</span>
        </div>
        <div className="row" style={{ marginTop: 4 }}>
          <button className="btn ghost" onClick={() => kopyala(url)}>{kopya === url ? "Kopyalandı ✓" : "Kopyala"}</button>
          <button className="btn ghost" onClick={() => paylas(url, ad)}>📤 Paylaş</button>
        </div>
      </div>
    );
  }

  async function paylas(url, ad) {
    const metin = `${ad} — sipariş linki: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: ad, text: metin, url });
        return;
      }
    } catch {}
    try {
      window.open(`https://wa.me/?text=${encodeURIComponent(metin)}`, "_blank");
    } catch {
      kopyala(url);
    }
  }

  if (!ok) {
    return (
      <div className="container" style={{ maxWidth: 400 }}>
        <h2>Admin Giriş (sadece siz)</h2>
        <input type="password" placeholder="Şifre" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={giris}>Giriş</button>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar"><span className="row"><a href="/" className="btn ghost">← Geri</a><TeaLogo size={26} /> / ADMİN</span><div className="row"><a href="/" className="muted">Menü</a><button className="btn ghost" onClick={() => { localStorage.removeItem("admin_pw"); setOk(false); }}>Çıkış</button></div></div>
      <div className="container">
        <div className="grid2">
          <div className="card">
            <b>Ürün / Fiyat</b>
            <div className="row" style={{ marginTop: 8 }}>
              <input placeholder="Ürün adı" value={pname} onChange={(e) => setPname(e.target.value)} />
              <input placeholder="Satış fiyatı" type="number" value={pprice} onChange={(e) => setPprice(e.target.value)} />
              <input placeholder="Geliş maliyeti" type="number" value={pcost} onChange={(e) => setPcost(e.target.value)} />
              <input placeholder="Kategori" value={pcat} onChange={(e) => setPcat(e.target.value)} />
              <button className="btn" onClick={addProduct}>Ekle</button>
            </div>
            <div>Müşteri menüsündeki sırayla aynı. Oklarla yeri değiştir.</div>
            <div style={{ marginTop: 8 }}>
              {siraliUrunler.map((p, i) => (
                <div key={p.id} className="row" style={{ justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #334155" }}>
                  <span>{i + 1}. {p.name} — {p.price} TL (maliyet {p.cost || 0}) [{p.cat || "Diğer"}]</span>
                  <div className="row">
                    <button className="btn ghost" onClick={() => move(i, -1)}>↑</button>
                    <button className="btn ghost" onClick={() => move(i, 1)}>↓</button>
                    <button className="btn ghost" onClick={() => saveProduct(p)}>Düzenle</button>
                    <button className="btn danger" onClick={() => delProduct(p.id)}>Sil</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <b>Masa / Dükkan</b>
            <div className="row" style={{ marginTop: 8 }}>
              <input placeholder="Masa adı örn. Bahçe-9" value={tval} onChange={(e) => setTval(e.target.value)} />
              <button className="btn" onClick={() => place("add-table", tval)}>Masa Ekle</button>
            </div>
            <div className="row" style={{ marginTop: 4 }}>
              {places.tables.map((t) => <span key={t} className="card" style={{ padding: "4px 8px" }}>{t} <button onClick={() => place("remove-table", t)}>x</button></span>)}
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <input placeholder="Dükkan adı örn. Bulut" value={sval} onChange={(e) => setSval(e.target.value)} />
              <button className="btn warn" onClick={() => place("add-shop", sval)}>Dükkan Ekle</button>
            </div>
            <div className="row" style={{ marginTop: 4 }}>
              {places.shops.map((t) => <span key={t} className="card" style={{ padding: "4px 8px" }}>{t} <button onClick={() => place("remove-shop", t)}>x</button></span>)}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <b>QR Kodları + Linkler</b>
          <div className="muted">Yeni masa/dükkan ekleyince QR ve link otomatik oluşur. Linkler doğrudan sipariş ekranını açar.</div>
          <div style={{ marginTop: 8 }}><label>Site adresi (dokunma, otomatik dolar — örn: https://solde-cafe.vercel.app)</label><input value={base} onChange={(e) => setBase(duzeltBase(e.target.value))} placeholder="https://solde-cafe.vercel.app" /></div>
          {baseUyarisi() && <div style={{ color: "#f87171", fontWeight: 700 }}>{baseUyarisi()}</div>}

          <h4>🛵 Dükkan QR'ları (her dükkana ayrı)</h4>
          <div className="row">
            <a className="btn blue" href="/admin/yazdir" target="_blank">🖨️ Tüm QR'ları Yazdır / PDF</a>
          </div>
          <div className="row">
            {places.shops.map((s) => {
              const url = `${base}/s?konum=disari&dukkan=${encodeURIComponent(s)}`;
              return (
                <div key={s} className="card" style={{ textAlign: "center", maxWidth: 260 }}>
                  <b>{s}</b><br />
                  <img src={qr(url)} alt={s} />
                  <LinkSatir url={url} ad={s} />
                </div>
              );
            })}
          </div>
          {!places.shops.length && <div className="muted">Dükkan yok</div>}
          <div className="muted" style={{ marginTop: 4 }}>Genel dışarı linki (yeni/kayıtsız isimler için):</div>
          <LinkSatir url={`${base}/s?konum=disari`} ad="Dışarı Genel" />

          <h4>🌿 Bahçe — Masa QR'ları</h4>
          <div className="row">
            {places.tables.map((t) => {
              const url = `${base}/s?konum=bahce&masa=${encodeURIComponent(t)}`;
              return (
                <div key={t} className="card" style={{ textAlign: "center", maxWidth: 260 }}>
                  <b>{t}</b><br />
                  <img src={qr(url)} alt={t} />
                  <LinkSatir url={url} ad={t} />
                </div>
              );
            })}
          </div>
          {!places.tables.length && <div className="muted">Masa yok</div>}
        </div>
      </div>
    </div>
  );
}
