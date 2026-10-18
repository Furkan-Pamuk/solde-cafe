"use client";
import { useEffect, useState } from "react";
import TeaLogo from "../tea-logo";

export default function Istatistik() {
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  const d = new Date();
  const [ay, setAy] = useState(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  const [data, setData] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("admin_pw");
    if (s) { setPw(s); setOk(true); }
  }, []);

  async function load() {
    const r = await fetch(`/api/istatistik?ay=${ay}`);
    setData(await r.json());
  }
  useEffect(() => { if (ok) load(); }, [ok, ay]);

  if (!ok) {
    return (
      <div className="container" style={{ maxWidth: 400 }}>
        <h2>İstatistik Giriş (sadece siz)</h2>
        <input type="password" placeholder="Şifre" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn" style={{ marginTop: 8, width: "100%" }} onClick={() => { localStorage.setItem("admin_pw", pw); setOk(true); }}>Giriş</button>
      </div>
    );
  }

  const maxSaat = data ? Math.max(1, ...data.saatler.map((s) => s.ciro)) : 1;

  return (
    <div>
      <div className="topbar"><span className="row"><a href="/" className="btn ghost">← Geri</a><TeaLogo /></span><div className="row"><a href="/" className="muted">Menü</a></div></div>
      <div className="container" style={{ maxWidth: 1100 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>📊 Aylık İstatistik + Arşiv</h2>
          <div className="row"><input type="month" value={ay} onChange={(e) => setAy(e.target.value)} style={{ maxWidth: 180 }} /><button className="btn ghost" onClick={load}>Yenile</button></div>
        </div>
        {!data && <div className="muted">Yükleniyor...</div>}
        {data && (
          <>
            <div className="grid2">
              <div className="card"><div className="muted">Ciro ({data.ozet.siparis} sipariş)</div><div className="big">{data.ozet.ciro} TL</div></div>
              <div className="card"><div className="muted">Kar (tahmini)</div><div className="big" style={{ color: "#22c55e" }}>{data.ozet.kar} TL</div></div>
              <div className="card"><div className="muted">Bahçe / Dışarı</div><div className="big">{data.ozet.bahce} / {data.ozet.disari} TL</div></div>
              <div className="card"><div className="muted">Nakit / Borca yazılan / Bahşiş</div><div className="big">{data.ozet.nakit} / {data.ozet.borc} / {data.ozet.bahsis ?? 0} TL</div></div>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <b>🏆 En çok neyden para kazanıldı</b>
              {data.enKarli.slice(0, 10).map((p, i) => (
                <div key={p.name} className="row" style={{ justifyContent: "space-between", padding: "4px 0" }}>
                  <span>{i + 1}. {p.name} x{p.qty}</span><b>{p.total} TL ciro • {p.kar} TL kar</b>
                </div>
              ))}
              {!data.enKarli.length && <div className="muted">Veri yok</div>}
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <b>🌿 Bahçeye neyden ne kadar satıldı</b>
              {data.bahce.map((p) => (
                <div key={p.name} className="row" style={{ justifyContent: "space-between", padding: "4px 0" }}>
                  <span>{p.name} x{p.qty}</span><b>{p.total} TL</b>
                </div>
              ))}
              {!data.bahce.length && <div className="muted">Veri yok</div>}
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <b>🛵 Hangi dükkana neyden ne kadar satıldı</b>
              {data.dukkanlar.map((x) => (
                <details key={x.name} style={{ marginTop: 6 }}>
                  <summary><b>{x.name}</b> — {x.siparis} sipariş, {x.total} TL</summary>
                  <div style={{ paddingLeft: 12 }}>
                    {x.urunler.map((p) => <div key={p.name} className="muted">{p.name} x{p.qty} — {p.total} TL</div>)}
                  </div>
                </details>
              ))}
              {!data.dukkanlar.length && <div className="muted">Veri yok</div>}
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <b>⏰ En çok hangi saatlerde ne satıldı</b>
              {data.saatler.map((s) => (
                <div key={s.saat} style={{ marginTop: 6 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}><b>{String(s.saat).padStart(2, "0")}:00</b><span className="muted">{s.adet} sipariş • {s.ciro} TL</span></div>
                  <div style={{ background: "#334155", borderRadius: 6, height: 10 }}><div style={{ width: `${Math.round((s.ciro / maxSaat) * 100)}%`, background: "#22c55e", height: 10, borderRadius: 6 }} /></div>
                  <div className="muted">{s.top}</div>
                </div>
              ))}
              {!data.saatler.length && <div className="muted">Veri yok</div>}
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <b>🗓️ Günlük özet arşivi ({ay})</b>
              {data.gunluk.map((g) => (
                <div key={g.gun} className="row" style={{ justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #334155" }}>
                  <span>{g.gun} — {g.adet} sipariş</span><b>{g.ciro} TL ciro • {g.kar} TL kar{g.bahsis ? ` • ${g.bahsis} bahşiş` : ""}</b>
                </div>
              ))}
              {!data.gunluk.length && <div className="muted">Veri yok</div>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
