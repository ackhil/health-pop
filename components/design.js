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
