"use client";
import { useEffect, useRef, useState } from "react";
import TeaLogo from "../tea-logo";

function saat(iso) {
  try { return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function tone(ctx, freq, delay = 0) {
  if (!ctx) return;
  const play = () => {
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      o.stop(ctx.currentTime + 0.7);
    } catch {}
  };
  try {
    if (ctx.state === "suspended") ctx.resume().then(() => setTimeout(play, delay)).catch(play);
    else if (delay) setTimeout(play, delay);
    else play();
  } catch { play(); }
}

function konus(metin, kuyruk = false) {
  try {
    if (!kuyruk) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(metin);
    u.lang = "tr-TR"; u.rate = 0.95; u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch {}
}

const SECENEKLER = [
  { id: "zil", etiket: "🔔 Zil sesi" },
  { id: "caylar", etiket: "📢 Çaylar!" },
  { id: "ozet", etiket: "🗣️ Siparişi söyle" },
  { id: "detay", etiket: "📝 İçeriği de oku" },
];

export default function Ekran() {
  const [orders, setOrders] = useState([]);
  const [alarm, setAlarm] = useState(false);
  const [alarmMsg, setAlarmMsg] = useState("");
  const prevIds = useRef(new Set());
  const [sound, setSound] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [bildirim, setBildirim] = useState(() => {
    try { return localStorage.getItem("bildirim_tipi") || "caylar"; }
    catch { return "caylar"; }
  });
  const alarmTimer = useRef(null);
  const audioRef = useRef(null);

  function getCtx() {
    try {
      if (!audioRef.current) audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
      return audioRef.current;
    } catch { return null; }
  }

  async function unlockAudio() {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") { try { await ctx.resume(); } catch {} }
    setUnlocked(true);
  }

  useEffect(() => {
    const h = () => unlockAudio();
    window.addEventListener("click", h);
    window.addEventListener("keydown", h);
    window.addEventListener("touchstart", h);
    return () => {
      window.removeEventListener("click", h);
      window.removeEventListener("keydown", h);
      window.removeEventListener("touchstart", h);
    };
  }, []);

  function secTip(id) {
    setBildirim(id);
    try { localStorage.setItem("bildirim_tipi", id); } catch {}
  }

  function ornekle(id) {
    const ornek = { name: "Bahçe-9", items: [{ qty: 2, name: "Çay" }] };
    const ornek2 = { name: "Eczane", items: [{ qty: 3, name: "Çay" }] };
    unlockAudio();
    if (id === "zil") { tone(getCtx(), 880); tone(getCtx(), 659, 280); }
    else if (id === "caylar") konus("Çaylar!");
    else if (id === "ozet") { konus("Bahçe 9 yeni sipariş"); konus("Eczane yeni sipariş", true); }
    else { konus(`${ornek.name.replace(/-/g, " ")}, 2 Çay`); konus(`${ornek2.name}, 3 Çay`, true); }
  }

  function duyur(yeniler) {
    if (!yeniler.length) return;
    const ilk3 = yeniler.slice(0, 3);
    setAlarmMsg(ilk3.map((o) => `${o.name}: ${o.items.map((i) => `${i.qty} ${i.name}`).join(", ")}`).join(" • "));
    setAlarm(true);
    if (alarmTimer.current) clearTimeout(alarmTimer.current);
    alarmTimer.current = setTimeout(() => setAlarm(false), 8000);
    if (!sound) return;
    if (bildirim === "zil") { tone(getCtx(), 880); tone(getCtx(), 659, 280); return; }
    try { window.speechSynthesis.cancel(); } catch {}
    ilk3.forEach((o, i) => {
      const ad = o.name.replace(/-/g, " ");
      const icerik = o.items.map((x) => `${x.qty} ${x.name}`).join(", ");
      if (bildirim === "caylar") konus("Çaylar!", i > 0);
      else if (bildirim === "ozet") konus(`${ad} yeni sipariş`, i > 0);
      else konus(`${ad}, ${icerik}`, i > 0);
    });
  }

  async function load() {
    const r = await fetch("/api/orders?bugun=1");
    const j = await r.json();
    const aktif = j.filter((o) => o.status === "bekliyor" || o.status === "hazir");
    const ids = new Set(aktif.map((o) => o.id));
    const yeniler = aktif.filter((o) => !prevIds.current.has(o.id));
    if (yeniler.length > 0 && prevIds.current.size > 0) duyur(yeniler);
    prevIds.current = ids;
    // Önce hazırlanmamış (en eski üstte), sonra hazırlar (soluk, altta)
    aktif.sort((a, b) => {
      if (a.status !== b.status) return a.status === "bekliyor" ? -1 : 1;
      return a.id - b.id;
    });
    setOrders(aktif);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [sound, bildirim]);

  function testSes() {
    const v = !sound;
    setSound(v);
    if (v) ornekle(bildirim);
  }

  async function setStatus(id, status) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const bahce = orders.filter((o) => o.location === "bahce");
  const disari = orders.filter((o) => o.location === "disari");

  function Kart({ o }) {
    const hazir = o.status === "hazir";
    return (
      <div className={`order-card ${o.location} ${o.status}`} style={hazir ? { opacity: 0.55, filter: "saturate(.6)" } : {}}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <b>#{o.id} {o.name}</b>
          <b>{saat(o.createdAt)}</b>
        </div>
        <div className="big" style={{ margin: "6px 0" }}>
          {o.items.map((i) => `${i.qty} ${i.name}`).join(" • ")}
        </div>
        <div className="muted">{o.total} TL — {o.status === "bekliyor" ? "BEKLİYOR" : "HAZIR ✓"}</div>
        <div className="row" style={{ marginTop: 8 }}>
          {o.status === "bekliyor" && <button className="btn" onClick={() => setStatus(o.id, "hazir")}>Hazırlandı ✓</button>}
          {o.status === "hazir" && <button className="btn blue" onClick={() => setStatus(o.id, "bekliyor")}>Geri Al</button>}
          <button className="btn ghost" onClick={() => setStatus(o.id, "iptal")}>İptal</button>
        </div>
      </div>
    );
  }

  const bugun = new Date().toLocaleDateString("tr-TR");

  return (
    <div>
      <div className="topbar">
        <a href="/" className="btn ghost">← Geri</a>
        <TeaLogo />
        <span className="muted">SİPARİŞ AKIŞI • Bugün {bugun} • gece 12'de arşivlenir</span>
        <div className="row">
          <button className="btn ghost" onClick={testSes}>{sound ? "🔔 Ses: Açık" : "🔇 Ses: Kapalı"}</button>
          <a href="/s" className="btn blue">➕ Sipariş Gir</a>
          <a href="/" className="muted">Menü</a>
        </div>
      </div>
      {alarm && <div className="caylar-alarm">{alarmMsg || "ÇAYLARRRR! Yeni sipariş geldi"}</div>}
      <div className="container" style={{ maxWidth: 1400 }}>
        {!unlocked && <div className="card" style={{ borderLeft: "6px solid #f59e0b", marginTop: 8 }}>🔇 Bildirim sesi için ekrana <b>bir kez dokun</b> (tarayıcı kilidi).</div>}
        <div className="card" style={{ marginTop: 8 }}>
          <div className="row">
            <b>Bildirim tipi:</b>
            {SECENEKLER.map((s) => (
              <button key={s.id} className={bildirim === s.id ? "btn" : "btn ghost"} onClick={() => secTip(s.id)}>{s.etiket}</button>
            ))}
            <button className="btn blue" onClick={() => ornekle(bildirim)}>▶ Dene</button>
          </div>
          <div className="muted" style={{ marginTop: 4 }}>
            {bildirim === "zil" && "Yeni siparişte zil sesi çalar."}
            {bildirim === "caylar" && "Yeni siparişte “Çaylar!” diye seslenir."}
            {bildirim === "ozet" && "Örn: “Bahçe 9 yeni sipariş”, “Eczane yeni sipariş”."}
            {bildirim === "detay" && "Örn: “Eczane, 3 çay 2 su” — içeriği de okur."}
          </div>
        </div>
        <div className="grid2" style={{ marginTop: 8 }}>
          <div>
            <h2 style={{ color: "#22c55e" }}>🌿 BAHÇE ({bahce.length})</h2>
            {bahce.map((o) => <Kart key={o.id} o={o} />)}
            {!bahce.length && <div className="muted">Sipariş yok</div>}
          </div>
          <div>
            <h2 style={{ color: "#f59e0b" }}>🛵 DIŞARI ({disari.length})</h2>
            {disari.map((o) => <Kart key={o.id} o={o} />)}
            {!disari.length && <div className="muted">Sipariş yok</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
