"use client";
import { useEffect, useState } from "react";
import TeaLogo from "../tea-logo";

export default function Kasa() {
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  const [tab, setTab] = useState("acik");
  const [acik, setAcik] = useState([]);
  const [borc, setBorc] = useState([]);
  const [rapor, setRapor] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [borrower, setBorrower] = useState("");

  useEffect(() => {
    if (localStorage.getItem("kasa_pw")) { setPw(localStorage.getItem("kasa_pw")); setOk(true); }
  }, []);

  function giris() {
    localStorage.setItem("kasa_pw", pw);
    setOk(true);
    load();
  }

  async function load() {
    const a = await fetch("/api/kasa/acik").then((r) => r.json());
    setAcik(a);
    const b = await fetch("/api/kasa/borc").then((r) => r.json());
    setBorc(b);
    const rp = await fetch(`/api/rapor?date=${date}`).then((r) => r.json());
    setRapor(rp);
  }

  useEffect(() => { if (ok) load(); }, [ok, tab, date]);

  async function kapat(group, method) {
    const bName = method === "borc" ? (borrower || group.name) : undefined;
    if (method === "borc" && !bName) { alert("Borç ismi girin"); return; }
    await fetch("/api/kasa/kapat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds: group.orders.map((o) => o.id), method, borrower: bName }),
    });
    setBorrower("");
    load();
  }

  async function tahsil(name) {
    if (!confirm(`${name} borcu tahsil edilsin mi?`)) return;
    await fetch("/api/kasa/borc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrower: name }),
    });
    load();
  }

  if (!ok) {
    return (
      <div className="container" style={{ maxWidth: 400 }}>
        <h2>Kasa Giriş</h2>
        <input type="password" placeholder="Şifre" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={giris}>Giriş</button>
        <p className="muted">Varsayılan: cems123 (.env ADMIN_PASSWORD ile değişir)</p>
      </div>
    );
  }

  return (
    <div>
      <div className="topbar"><span className="row"><a href="/" className="btn ghost">← Geri</a><TeaLogo size={26} /> / KASA-BORÇ</span><div className="row"><a href="/" className="muted">Menü</a><button className="btn ghost" onClick={() => { localStorage.removeItem("kasa_pw"); setOk(false); }}>Çıkış</button></div></div>
      <div className="container" style={{ maxWidth: 1100 }}>
        <div className="row">
          <button className={tab === "acik" ? "btn" : "btn ghost"} onClick={() => setTab("acik")}>Açık Hesaplar ({acik.length})</button>
          <button className={tab === "borc" ? "btn warn" : "btn ghost"} onClick={() => setTab("borc")}>Borç Defteri ({borc.length})</button>
          <button className={tab === "rapor" ? "btn blue" : "btn ghost"} onClick={() => setTab("rapor")}>Günlük Rapor</button>
          <button className="btn ghost" onClick={load}>Yenile</button>
        </div>

        {tab === "acik" && (
          <div style={{ marginTop: 12 }}>
            <div className="card" style={{ marginBottom: 8 }}>
              <label>Borç ismi (borca yazarken kullanılır, boşsa hesap adı yazılır)</label>
              <input placeholder="örn. Bulut" value={borrower} onChange={(e) => setBorrower(e.target.value)} />
            </div>
            {acik.map((g, i) => (
              <div key={i} className="card" style={{ marginBottom: 8 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b>{g.location === "bahce" ? "🌿" : "🛵"} {g.name} — {g.total} TL</b>
                  <div className="row">
                    <button className="btn" onClick={() => kapat(g, "nakit")}>Nakit Al</button>
                    <button className="btn warn" onClick={() => kapat(g, "borc")}>Borca Yaz</button>
                  </div>
                </div>
                <div className="muted">{g.orders.map((o) => `#${o.id}: ${o.items.map((x) => `${x.qty} ${x.name}`).join(", ")}${o.tip > 0 ? ` (+${o.tip} bahşiş)` : ""}`).join(" | ")}</div>
              </div>
            ))}
            {!acik.length && <div className="muted">Açık hesap yok</div>}
          </div>
        )}

        {tab === "borc" && (
          <div style={{ marginTop: 12 }}>
            {borc.map((b, i) => (
              <div key={i} className="card" style={{ marginBottom: 8 }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b>{b.name} — {b.total} TL ({b.orders.length} kapatma)</b>
                  <button className="btn" onClick={() => tahsil(b.name)}>Tahsil Et</button>
                </div>
                <div className="muted">{b.orders.map((o) => `#${o.id} ${new Date(o.closedAt).toLocaleDateString("tr-TR")} ${o.total}TL`).join(" | ")}</div>
              </div>
            ))}
            {!borc.length && <div className="muted">Borç yok</div>}
          </div>
        )}

        {tab === "rapor" && (
          <div style={{ marginTop: 12 }}>
            <div className="row"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 200 }} /></div>
            {rapor && (
              <>
                <div className="grid2" style={{ marginTop: 8 }}>
                  <div className="card"><div className="muted">Ciro</div><div className="big">{rapor.ciro} TL ({rapor.adet} sipariş)</div></div>
                  <div className="card"><div className="muted">Kar (tahmini)</div><div className="big" style={{ color: "#22c55e" }}>{rapor.kar ?? 0} TL</div></div>
                  <div className="card"><div className="muted">Bahşiş</div><div className="big">{rapor.bahsis ?? 0} TL</div></div>
                  <div className="card"><div className="muted">Nakit / Borca / Tahsilat</div><div className="big">{rapor.nakitToplam} / {rapor.borcToplam} / {rapor.tahsilToplam} TL</div></div>
                  <div className="card"><div className="muted">Bahçe</div><div className="big">{rapor.bahce} TL</div></div>
                  <div className="card"><div className="muted">Dışarı</div><div className="big">{rapor.disari} TL</div></div>
                </div>
                <div className="card" style={{ marginTop: 8 }}>
                  <b>Ürün kırılımı</b>
                  {rapor.byProduct.map((p) => <div key={p.name} className="row" style={{ justifyContent: "space-between" }}><span>{p.name} x{p.qty}</span><b>{p.total} TL (kar {p.kar ?? 0})</b></div>)}
                </div>
                <div className="card" style={{ marginTop: 8 }}>
                  <b>Arşiv ({rapor.orders.length})</b>
                  {rapor.orders.map((o) => <div key={o.id} className="muted">#{o.id} {new Date(o.closedAt).toLocaleTimeString("tr-TR")} {o.location}/{o.name} — {o.items.map((x) => `${x.qty} ${x.name}`).join(", ")} — {o.total}TL ({o.payMethod})</div>)}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
