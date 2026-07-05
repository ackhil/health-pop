"use client";
import React from "react";

export const C = {
  bg: "#EFEAF4", card: "#FFFFFF", ink: "#141414", sub: "#6E6B78",
  green: "#B5EC9E", greenSoft: "#D6F5C8", orange: "#F5A45E", orangeSoft: "#FBD9BC",
  purple: "#C7B6F2", purpleSoft: "#E4DBFA", blue: "#A9C7F7", pink: "#F6A8C5",
  yellow: "#F7D45E", line: "#E6E2EC",
};
export const font = `'Inter', 'Helvetica Neue', Arial, sans-serif`;

export const MOODS = {
  happy: { fill: C.green, label: "Happy", nudge: "You're glowing 🌟 A 20-min walk locks it in." },
  calm: { fill: C.blue, label: "Calm", nudge: "Steady 🧘 Keep tonight's wind-down." },
  sleepy: { fill: C.yellow, label: "Sleepy", nudge: "Low battery 🔋 Lights out by 10:45." },
  angry: { fill: C.orange, label: "Stressed", nudge: "Tough day 💛 5 slow breaths + short walk." },
  wink: { fill: C.pink, label: "Playful", nudge: "Great energy ⚡ Perfect day for that run." },
};

export const FUTURE_CHIPS = ["🏃 Endurance", "💪 Strength", "😴 Rested", "⚡ Energy", "🧘 Calm"];

export const Face = ({ shape = "circle", fill = C.green, mood = "calm", size = 64, rotate = 0, anim = "bob", delay = 0 }) => {
  const eyes = {
    calm: <><path d="M20 28 q4 4 8 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M36 28 q4 4 8 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>,
    happy: <><circle cx="24" cy="27" r="2.6" fill="#141414"/><circle cx="40" cy="27" r="2.6" fill="#141414"/></>,
    angry: <><path d="M19 24 l10 4" stroke="#141414" strokeWidth="2.5" strokeLinecap="round"/><path d="M45 24 l-10 4" stroke="#141414" strokeWidth="2.5" strokeLinecap="round"/></>,
    sleepy: <><path d="M20 28 h8" stroke="#141414" strokeWidth="2.5" strokeLinecap="round"/><path d="M36 28 h8" stroke="#141414" strokeWidth="2.5" strokeLinecap="round"/></>,
    wink: <><circle cx="24" cy="27" r="2.6" fill="#141414"/><path d="M36 27 h8" stroke="#141414" strokeWidth="2.5" strokeLinecap="round"/></>,
  }[mood] || null;
  const mouth = {
    calm: <path d="M26 40 q6 5 12 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    happy: <path d="M24 38 q8 9 16 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    angry: <path d="M26 44 q6 -5 12 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    sleepy: <ellipse cx="32" cy="42" rx="4" ry="5" fill="#141414"/>,
    wink: <path d="M25 39 q7 7 14 0" stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
  }[mood] || null;
  const shapes = {
    circle: <circle cx="32" cy="32" r="30" fill={fill}/>,
    square: <rect x="4" y="4" width="56" height="56" rx="16" fill={fill}/>,
    blob: <path d="M32 3 C48 3 61 12 61 30 C61 50 50 61 32 61 C14 61 3 50 3 32 C3 14 16 3 32 3 Z" fill={fill}/>,
    bolt: <path d="M36 2 L10 36 L28 36 L24 62 L54 26 L34 26 Z" fill={fill}/>,
  }[shape];
  const animMap = { bob: "faceBob 2.6s ease-in-out infinite", wiggle: "faceWiggle 3s ease-in-out infinite", pulse: "facePulse 2.2s ease-in-out infinite", none: "none" };
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ transform: `rotate(${rotate}deg)`, animation: animMap[anim], animationDelay: `${delay}s`, transformOrigin: "center" }}>
      {shapes}{eyes}{mouth}
    </svg>
  );
};

/* Evolution avatar: adds energy/gear/aura per stage — never body shape. */
export const EvoAvatar = ({ stage = 0, size = 64, anim = "bob" }) => (
  <svg width={size} height={size} viewBox="0 0 72 72" style={{ animation: anim === "none" ? "none" : "faceBob 2.6s ease-in-out infinite", transformOrigin: "center" }}>
    {stage >= 4 && <circle cx="36" cy="36" r="34" fill={C.yellow} opacity="0.35" />}
    {stage >= 2 && <circle cx="36" cy="36" r="31" fill={C.greenSoft} />}
    <circle cx="36" cy={38 - stage} r="26" fill={C.green} />
    {stage >= 1 && <rect x="14" y={20 - stage} width="44" height="7" rx="3.5" fill={C.orange} />}
    {stage >= 3
      ? <><path d={`M25 ${31 - stage} q3 -4 6 0`} stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d={`M41 ${31 - stage} q3 -4 6 0`} stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>
      : <><circle cx="28" cy={31 - stage} r="2.6" fill="#141414"/><circle cx="44" cy={31 - stage} r="2.6" fill="#141414"/></>}
    <path d={`M${28 - stage} ${41 - stage} q${8 + stage} ${8 + stage * 1.5} ${16 + stage * 2} 0`} stroke="#141414" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {stage >= 3 && <><line x1="36" y1="60" x2="36" y2="65" stroke="#141414" strokeWidth="2"/><circle cx="36" cy="67" r="4.5" fill={C.yellow} stroke="#141414" strokeWidth="1.5"/></>}
    {stage >= 5 && <path d="M36 2 L32 10 L36 8 L40 10 Z" fill={C.orange} />}
  </svg>
);

/* stage from streaks: every 5 combined streak-days = a stage, cap 5 */
export const stageFromStreaks = (exStreak, foodStreak, logStreak) =>
  Math.min(5, Math.floor((exStreak + foodStreak + logStreak) / 5));

export const Pill = ({ children, dark = true, style, small, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: dark ? C.ink : "#fff", color: dark ? "#fff" : C.ink,
    border: dark ? "none" : `2px solid ${C.ink}`, borderRadius: 999,
    padding: small ? "12px 18px" : "16px 28px", fontSize: small ? 14 : 16,
    fontWeight: 800, fontFamily: font, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1, ...style,
  }}>{children}</button>
);
export const Tile = ({ bg = "#fff", children, style }) => (
  <div style={{ background: bg, borderRadius: 22, padding: 16, ...style }}>{children}</div>
);
export const Eyebrow = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, opacity: 0.6, letterSpacing: "0.02em" }}>{children}</div>
);
export const inputStyle = {
  border: `2px solid ${C.line}`, borderRadius: 14, padding: "12px 14px",
  fontSize: 16, fontFamily: font, color: C.ink, background: "#fff",
  outline: "none", width: "100%", boxSizing: "border-box", fontWeight: 700,
};

/* Bottom sheet: replaces native prompt()/confirm() dialogs so they match the design language. */
export const Sheet = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,.45)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "28px 28px 0 0", padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
        width: "100%", maxWidth: 480, margin: "0 auto", maxHeight: "80vh", overflowY: "auto", boxSizing: "border-box",
      }}>
        <div style={{ width: 40, height: 5, background: C.line, borderRadius: 999, margin: "0 auto 14px" }} />
        {title && <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 14 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
};

/* Small dismissible callout used for first-time-user coach marks. */
export const Callout = ({ children, onDismiss, style }) => (
  <div style={{
    position: "absolute", zIndex: 60, background: C.ink, color: "#fff", borderRadius: 16,
    padding: "12px 16px", fontSize: 13.5, fontWeight: 800, lineHeight: 1.4, boxShadow: "0 8px 24px rgba(0,0,0,.25)",
    display: "flex", alignItems: "center", gap: 10, ...style,
  }}>
    <span style={{ flex: 1 }}>{children}</span>
    <button onClick={onDismiss} aria-label="Dismiss tip" style={{
      background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 999,
      width: 22, height: 22, fontSize: 13, fontWeight: 900, cursor: "pointer", flexShrink: 0, fontFamily: "inherit",
    }}>✕</button>
  </div>
);

/* Compact markdown renderer for Coach output — headers, bullets, tables, bold. Not full CommonMark:
   scoped to what the Coach prompt is asked to produce, not arbitrary user markdown. */
export const Markdown = ({ text }) => {
  const lines = (text || "").split("\n");
  const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
  const isSeparatorRow = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
  const isBullet = (l) => /^\s*[-*•]\s+/.test(l);
  const isHeading = (l) => /^#{1,4}\s+/.test(l);

  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isTableRow(line)) {
      const tableLines = [];
      while (i < lines.length && isTableRow(lines[i])) { tableLines.push(lines[i]); i++; }
      const rows = tableLines.filter((l) => !isSeparatorRow(l)).map((l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
      if (rows.length) blocks.push({ type: "table", rows });
      continue;
    }
    if (isBullet(line)) {
      const items = [];
      while (i < lines.length && isBullet(lines[i])) { items.push(lines[i].replace(/^\s*[-*•]\s+/, "")); i++; }
      blocks.push({ type: "list", items });
      continue;
    }
    if (isHeading(line)) { blocks.push({ type: "heading", text: line.replace(/^#{1,4}\s+/, "") }); i++; continue; }
    if (line.trim() === "") { i++; continue; }
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== "" && !isBullet(lines[i]) && !isHeading(lines[i]) && !isTableRow(lines[i])) { paraLines.push(lines[i]); i++; }
    blocks.push({ type: "para", text: paraLines.join(" ") });
  }

  const inline = (str) => str.split(/(\*\*[^*]+\*\*)/g).map((p, idx) =>
    p.startsWith("**") && p.endsWith("**") ? <strong key={idx}>{p.slice(2, -2)}</strong> : <React.Fragment key={idx}>{p}</React.Fragment>);

  return (
    <div>
      {blocks.map((b, idx) => {
        if (b.type === "heading") return <div key={idx} style={{ fontSize: 15, fontWeight: 900, marginTop: idx ? 14 : 0, marginBottom: 6 }}>{inline(b.text)}</div>;
        if (b.type === "list") return (
          <ul key={idx} style={{ margin: "0 0 10px", paddingLeft: 20 }}>
            {b.items.map((it, j) => <li key={j} style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.55, marginBottom: 4 }}>{inline(it)}</li>)}
          </ul>
        );
        if (b.type === "table") return (
          <table key={idx} style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => {
                    const Tag = r === 0 ? "th" : "td";
                    return <Tag key={c} style={{ border: "1px solid rgba(0,0,0,.12)", padding: "6px 8px", fontSize: 13, fontWeight: r === 0 ? 900 : 700, textAlign: "left", background: r === 0 ? "rgba(0,0,0,.06)" : "transparent" }}>{inline(cell)}</Tag>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        );
        return <p key={idx} style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.6, margin: "0 0 10px" }}>{inline(b.text)}</p>;
      })}
    </div>
  );
};

/* streak helpers */
export const dstr = (d) => d.toISOString().slice(0, 10);
export const computeStreak = (logs, pred) => {
  const byDate = Object.fromEntries(logs.map((l) => [l.date, l]));
  let streak = 0;
  const d = new Date();
  // today doesn't break the streak if not yet logged
  if (!byDate[dstr(d)] || !pred(byDate[dstr(d)])) d.setDate(d.getDate() - 1);
  while (byDate[dstr(d)] && pred(byDate[dstr(d)])) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};
