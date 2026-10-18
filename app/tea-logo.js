export default function TeaLogo({ size = 30, light = false }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size * 1.2} viewBox="0 0 40 48" aria-label="çay bardağı">
        <ellipse cx="20" cy="44" rx="15" ry="3.5" fill={light ? "#94a3b8" : "#475569"} />
        <path
          d="M11 5 h18 l-1.5 7 c.8 5 2.5 7 2.5 13 0 8-4.5 13-10 13 S10 33 10 25c0-6 1.7-8 2.5-13 Z"
          fill="#f8fafc" opacity="0.16" stroke={light ? "#0f172a" : "#e2e8f0"} strokeWidth="1.5"
        />
        <path d="M11.5 20 c-.6 2-1 3.5-1 5.5 0 6.5 4 10.5 9.5 10.5 s9.5-4 9.5-10.5c0-2-.4-3.5-1-5.5 Z" fill="#dc2626" />
        <ellipse cx="20" cy="20" rx="8.5" ry="2.2" fill="#fca5a5" />
        <rect x="13.5" y="24" width="3" height="10" rx="1.5" fill="#fecaca" opacity="0.7" />
      </svg>
      <b>SOLDE Cafe</b>
    </span>
  );
}
