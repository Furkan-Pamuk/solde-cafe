"use client";
import { useEffect, useState } from "react";

export default function Yazdir() {
  const [places, setPlaces] = useState({ tables: [], shops: [] });
  const [base, setBase] = useState("");

  useEffect(() => {
    setBase(window.location.origin);
    fetch("/api/places").then((r) => r.json()).then(setPlaces);
  }, []);

  const qr = (data) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;

  const kartlar = [
    ...places.shops.map((s) => ({ ad: s, url: `${base}/s?konum=disari&dukkan=${encodeURIComponent(s)}` })),
    ...places.tables.map((t) => ({ ad: t, url: `${base}/s?konum=bahce&masa=${encodeURIComponent(t)}` })),
  ];

  return (
    <div className="print-page">
      <div className="no-print" style={{ padding: 16 }}>
        <button className="btn" onClick={() => window.print()}>🖨️ Yazdır / PDF Kaydet</button>
        <span className="muted" style={{ marginLeft: 8 }}>Yazdırma penceresinde "PDF olarak kaydet"i seçebilirsin.</span>
      </div>
      <div className="qr-grid">
        {kartlar.map((k) => (
          <div key={k.ad} className="qr-print-card">
            <div className="qr-print-ad">{k.ad}</div>
            <img src={qr(k.url)} alt={k.ad} />
            <div className="qr-print-sub">Okut, siparişini ver</div>
            <div className="qr-print-url">{k.url}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
