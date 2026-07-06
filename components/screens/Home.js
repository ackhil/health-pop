"use client";
import React, { useState } from "react";
import { C, MOODS, Face, Pill, Tile, Eyebrow, Callout, computeStreak, dstr } from "../design";

// indexed by Date#getDay(): 0=Sun … 6=Sat
const DAY_TIPS = [
  "Active rest counts today — a walk beats the couch.",
  "Start the week with your easiest session — build momentum.",
  "Midweek slump is real — a short walk resets energy fast.",
  "Halfway there — check in on your goal progress today.",
  "Plan your weekend activity now, don't wing it.",
  "Wrap the week's wins — note what actually worked.",
  "Weekend: keep it light, keep it moving.",
];

const firstBullet = (text) => {
  if (!text) return null;
  const line = text.split("\n").find((l) => /^\s*[-*]\s+/.test(l));
  return line ? line.replace(/^\s*[-*]\s+/, "").trim() : null;
};

function IconEdit({ size = 16, color = C.ink }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 20l.9-4.2L15.8 5 19 8.2 8.2 19 4 20Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M13.5 6.7 17.3 10.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Home({ profile, logs, saveLog, setTab, onboarding, markSeen }) {
  const today = dstr(new Date());
  const todayLog = logs.find((l) => l.date === today) || {};
  const yesterday = logs[logs.length - 1] || {};
  const hasLoggedToday = !!logs.find((l) => l.date === today);
  const [editing, setEditing] = useState(() => !hasLoggedToday);
  const [mood, setMood] = useState(todayLog.mood || "happy");
  const [sleep, setSleep] = useState(todayLog.sleepHrs || "");
  const [steps, setSteps] = useState(todayLog.steps || "");
  const [exercised, setExercised] = useState(!!todayLog.exercised);
  const [healthyFood, setHealthyFood] = useState(!!todayLog.healthyFood);

  const logStreak = computeStreak(logs, () => true);
  const name = (profile.name || "").split(" ")[0];
  const isEvening = new Date().getHours() >= 19;

  const showMoodMark = onboarding && !(onboarding.seenMarks || []).includes("mood");
  const pickMood = (key) => {
    setMood(key);
    if (showMoodMark) markSeen?.("mood");
  };

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

  // streak-at-risk: evening, streak alive, nothing logged yet today
  const showStreakRisk = !hasLoggedToday && logStreak > 0 && isEvening;
  // steps-specific evening reminder: they logged today but haven't recorded actual steps yet
  const showStepsReminder = hasLoggedToday && !todayLog.steps && isEvening;

  // H-pop plan teaser — real persisted plan once generated, rotating tip before that
  const weeklyPlan = profile.coachHistory?.weekly;
  const planDay = weeklyPlan ? Math.max(1, Math.floor((Date.now() - new Date(weeklyPlan.generatedAt).getTime()) / 86400000) + 1) : null;
  const planExcerpt = weeklyPlan ? firstBullet(weeklyPlan.text) : null;
  const dayTip = DAY_TIPS[new Date().getDay()];

  const quickSave = () => {
    saveLog({ ...todayLog, date: today, mood, sleepHrs: sleep, steps, exercised, healthyFood });
    setEditing(false);
  };

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

      {showStreakRisk && (
        <Tile bg={C.orange} style={{ marginBottom: 12, padding: 13 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: "#fff" }}>🔥 {logStreak}-day streak ends at midnight — log now to keep it alive.</div>
        </Tile>
      )}
      {showStepsReminder && (
        <Tile bg={C.ink} style={{ marginBottom: 12, padding: 13 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: "#fff" }}>🌙 Day's done — pop in your actual steps below.</div>
        </Tile>
      )}

      {/* morning brief */}
      <Tile bg={C.purpleSoft} style={{ marginBottom: 12 }}>
        <Eyebrow>☀️ MORNING BRIEF</Eyebrow>
        <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.4, marginTop: 8 }}>{brief}</div>
      </Tile>

      {/* H-pop plan teaser */}
      <Tile bg={C.green} style={{ marginBottom: 12 }}>
        <Eyebrow>{weeklyPlan ? `📋 YOUR PLAN — DAY ${planDay}` : "📋 YOUR PLAN"}</Eyebrow>
        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.4, margin: "8px 0 10px" }}>
          {weeklyPlan ? (planExcerpt || "Check H-pop for this week's full focus.") : dayTip}
        </div>
        <Pill small dark={false} style={{ background: "#fff" }} onClick={() => setTab("coach")}>
          {weeklyPlan ? "See full plan in H-pop →" : "Get your plan →"}
        </Pill>
      </Tile>

      {/* mood chips */}
      <div style={{ position: "relative", marginBottom: showMoodMark ? 44 : 12 }}>
        <Eyebrow>😊 MOOD</Eyebrow>
        <div style={{ fontSize: 14, fontWeight: 800, margin: "6px 0 6px" }}>How are you feeling?</div>
        <div style={{ display: "flex", gap: 6 }}>
          {Object.entries(MOODS).map(([key, m]) => (
            <button key={key} onClick={() => pickMood(key)} aria-label={m.label} style={{
              background: mood === key ? C.ink : "#fff", cursor: "pointer",
              border: `2px solid ${mood === key ? C.ink : C.line}`, borderRadius: 18,
              padding: "9px 4px 7px", flex: 1, fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <Face fill={m.fill} mood={key} size={36} anim={mood === key ? "bob" : "none"} />
              <span style={{ fontSize: 9.5, fontWeight: 800, color: mood === key ? "#fff" : C.sub }}>{m.label}</span>
            </button>
          ))}
        </div>
        {showMoodMark && (
          <Callout onDismiss={() => markSeen?.("mood")} style={{ top: "100%", left: 0, right: 0, marginTop: 8 }}>
            👆 Tap how you're feeling. That's a log.
          </Callout>
        )}
      </div>

      {/* quick log */}
      {!editing ? (
        <Tile bg={C.greenSoft} style={{ marginBottom: 12 }}>
          <Eyebrow>⚡ TODAY</Eyebrow>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 800 }}>
              ✓ {sleep ? `${sleep}h` : "—"} · {steps ? `${steps} steps` : "—"} {exercised ? "· moved 🏋️" : ""} {healthyFood ? "· ate well 🥗" : ""}
            </div>
            <button onClick={() => setEditing(true)} aria-label="Edit today's log" style={{
              background: "#fff", border: `2px solid ${C.line}`, borderRadius: 999, width: 34, height: 34,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
            }}>
              <IconEdit size={15} color={C.ink} />
            </button>
          </div>
        </Tile>
      ) : (
        <Tile bg={C.greenSoft} style={{ marginBottom: 12 }}>
          <Eyebrow>⚡ QUICK LOG — today</Eyebrow>
          <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
            <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>😴</div>
              <input value={sleep} onChange={(e) => setSleep(e.target.value)} placeholder="7.5" inputMode="decimal" pattern="[0-9]*\.?[0-9]*"
                style={{ width: "100%", border: "none", outline: "none", fontSize: 24, fontWeight: 900, textAlign: "center", fontFamily: "inherit" }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: C.sub }}>hours</div>
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 16, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>👟</div>
              <input value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="8000" inputMode="numeric" pattern="[0-9]*"
                style={{ width: "100%", border: "none", outline: "none", fontSize: 24, fontWeight: 900, textAlign: "center", fontFamily: "inherit" }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: C.sub }}>{isEvening ? "actual steps" : "target steps"}</div>
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
      )}

      {/* more metrics */}
      <MoreMetrics todayLog={todayLog} today={today} saveLog={saveLog} />

      {/* goal chip */}
      {profile.goals && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => setTab("profile")} style={{ background: C.greenSoft, border: "none", borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>
            🎯 {profile.goals.slice(0, 40)}
          </button>
        </div>
      )}
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
