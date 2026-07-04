"use client";
import React, { useState } from "react";
import { C, MOODS, Face, Pill, Tile, Eyebrow, computeStreak, dstr } from "../design";

export default function Home({ profile, logs, saveLog, setTab }) {
  const today = dstr(new Date());
  const todayLog = logs.find((l) => l.date === today) || {};
  const yesterday = logs[logs.length - 1] || {};
  const [mood, setMood] = useState(todayLog.mood || "happy");
  const [sleep, setSleep] = useState(todayLog.sleepHrs || "");
  const [steps, setSteps] = useState(todayLog.steps || "");
  const [exercised, setExercised] = useState(!!todayLog.exercised);
  const [healthyFood, setHealthyFood] = useState(!!todayLog.healthyFood);

  const logStreak = computeStreak(logs, () => true);
  const name = (profile.name || "").split(" ")[0];

  // goal-aware greeting
  const goalWeight = parseFloat(profile.goalWeightKg);
  const latestWeight = [...logs].reverse().find((l) => l.weightKg)?.weightKg;
  const kgToGo = goalWeight && latestWeight ? Math.max(0, (latestWeight - goalWeight)).toFixed(1) : null;

  // morning brief
  const avgSleep = (() => {
    const v = logs.slice(-7).map((l) => parseFloat(l.sleepHrs)).filter((x) => !isNaN(x));
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  })();
  const lastSleep = parseFloat(yesterday.sleepHrs);
  const brief = !isNaN(lastSleep) && avgSleep
    ? `Slept ${lastSleep}h — ${lastSleep >= avgSleep ? `${Math.round((lastSleep - avgSleep) * 60)}min above` : `${Math.round((avgSleep - lastSleep) * 60)}min below`} your avg ${lastSleep >= avgSleep ? "👏" : "— early night tonight? 💛"}`
    : "Log a few days and your morning brief appears here ☀️";

  const quickSave = () => saveLog({
    ...todayLog, date: today, mood,
    sleepHrs: sleep, steps, exercised, healthyFood,
  });

  return (
    <div>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Face fill={MOODS[mood].fill} mood={mood} size={42} anim="none" />
        <div style={{ fontSize: 17, fontWeight: 900 }}>{name || "Hi!"}</div>
        <div style={{ marginLeft: "auto", background: C.orangeSoft, borderRadius: 999, padding: "8px 14px", fontSize: 15, fontWeight: 900 }}>
          🔥 {logStreak}
        </div>
      </div>

      {/* goal greeting */}
      <h2 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 14px" }}>
        {name ? `Hi ${name}! ` : "Hi! "}🎯{" "}
        {kgToGo !== null
          ? <span style={{ background: C.green, borderRadius: 10, padding: "0 8px" }}>{kgToGo} kg to go</span>
          : <span style={{ fontSize: 16, color: C.sub }}>Set a goal in Profile →</span>}
      </h2>

      {/* morning brief */}
      <Tile bg={C.purpleSoft} style={{ marginBottom: 12 }}>
        <Eyebrow>☀️ MORNING BRIEF</Eyebrow>
        <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.4, marginTop: 8 }}>{brief}</div>
      </Tile>

      {/* mood chips */}
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>How are you feeling?</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Object.entries(MOODS).map(([key, m]) => (
          <button key={key} onClick={() => setMood(key)} aria-label={m.label} style={{
            background: mood === key ? C.ink : "#fff", cursor: "pointer",
            border: `2px solid ${mood === key ? C.ink : C.line}`, borderRadius: 18,
            padding: "9px 4px", flex: 1, fontFamily: "inherit",
          }}>
            <Face fill={m.fill} mood={key} size={36} anim={mood === key ? "bob" : "none"} />
          </button>
        ))}
      </div>

      {/* quick log */}
      <Tile bg={C.greenSoft} style={{ marginBottom: 12 }}>
        <Eyebrow>⚡ QUICK LOG — today</Eyebrow>
        <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>😴</div>
            <input value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="7.5" inputMode="decimal"
              style={{ width: "100%", border: "none", outline: "none", fontSize: 24, fontWeight: 900, textAlign: "center", fontFamily: "inherit" }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: C.sub }}>hours</div>
          </div>
          <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>👟</div>
            <input value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="8000" inputMode="numeric"
              style={{ width: "100%", border: "none", outline: "none", fontSize: 24, fontWeight: 900, textAlign: "center", fontFamily: "inherit" }} />
            <div style={{ fontSize: 11, fontWeight: 800, color: C.sub }}>steps</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[["🏋️ Moved today", exercised, setExercised], ["🥗 Ate well", healthyFood, setHealthyFood]].map(([l, v, set]) => (
            <button key={l} onClick={() => set(!v)} style={{
              flex: 1, background: v ? C.ink : "#fff", color: v ? "#fff" : C.ink,
              border: `2px solid ${v ? C.ink : C.line}`, borderRadius: 999, padding: "12px 8px",
              fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
            }}>{l} {v ? "✓" : ""}</button>
          ))}
        </div>
        <Pill small style={{ width: "100%" }} onClick={quickSave}>Save ✓ keeps 🔥 alive</Pill>
      </Tile>

      {/* more metrics */}
      <MoreMetrics todayLog={todayLog} today={today} saveLog={saveLog} />

      {/* profile chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
        {[
          profile.goals && ["🎯", profile.goals.slice(0, 22), C.greenSoft],
          profile.conditions && ["🩺", profile.conditions.slice(0, 22), C.blue],
          profile.medications && ["💊", profile.medications.slice(0, 22), C.purpleSoft],
          profile.allergies && ["🚫", profile.allergies.slice(0, 22), C.pink],
        ].filter(Boolean).map(([ic, txt, bg]) => (
          <button key={txt} onClick={() => setTab("profile")} style={{ background: bg, border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>{ic} {txt}</button>
        ))}
      </div>
    </div>
  );
}

function MoreMetrics({ todayLog, today, saveLog }) {
  const [open, setOpen] = useState(false);
  const [m, setM] = useState({ weightKg: todayLog.weightKg || "", waterMl: todayLog.waterMl || "", restingHr: todayLog.restingHr || "", bp: todayLog.bp || "", symptoms: todayLog.symptoms || "" });
  if (!open) return <Pill dark={false} small style={{ width: "100%" }} onClick={() => setOpen(true)}>＋ More metrics (weight, HR, BP…)</Pill>;
  const fields = [["⚖️ Weight kg", "weightKg", "decimal"], ["💧 Water ml", "waterMl", "numeric"], ["❤️ Resting HR", "restingHr", "numeric"], ["🩺 BP (120/80)", "bp", "text"], ["🤒 Symptoms", "symptoms", "text"]];
  return (
    <Tile style={{ border: `2px solid ${C.line}` }}>
      {fields.map(([label, key, mode]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, width: 120 }}>{label}</span>
          <input value={m[key]} onChange={(e) => setM({ ...m, [key]: e.target.value })} inputMode={mode}
            style={{ flex: 1, border: `2px solid ${C.line}`, borderRadius: 12, padding: "8px 12px", fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none" }} />
        </div>
      ))}
      <Pill small style={{ width: "100%", marginTop: 4 }} onClick={() => { saveLog({ ...todayLog, date: today, ...m }); setOpen(false); }}>Save metrics ✓</Pill>
    </Tile>
  );
}
