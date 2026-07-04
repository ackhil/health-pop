"use client";
import React, { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { C, MOODS, Face, Pill, Tile, computeStreak } from "../design";

export default function CalendarScreen({ logs }) {
  const [poster, setPoster] = useState(false);
  const posterRef = useRef(null);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const byDate = Object.fromEntries(logs.map((l) => [l.date, l]));
  const mLogs = logs.filter((l) => l.date.startsWith(monthKey));

  const totalSteps = mLogs.reduce((a, l) => a + (parseInt(l.steps) || 0), 0);
  const avgSleep = (() => {
    const v = mLogs.map((l) => parseFloat(l.sleepHrs)).filter((x) => !isNaN(x));
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—";
  })();
  const streak = computeStreak(logs, () => true);
  const counts = {};
  mLogs.forEach((l) => l.mood && (counts[l.mood] = (counts[l.mood] || 0) + 1));
  const topMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "happy";

  const download = async () => {
    if (!posterRef.current) return;
    const url = await toPng(posterRef.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.download = `health-pop-${monthKey}.png`;
    a.href = url;
    a.click();
  };

  const grid = Array.from({ length: daysInMonth }, (_, i) => byDate[`${monthKey}-${String(i + 1).padStart(2, "0")}`]);

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 12 }}>
        📅 {now.toLocaleString("en", { month: "long", year: "numeric" })}
      </div>

      {!poster ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {grid.map((l, i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: 12, background: l?.mood ? "transparent" : "#F5F3F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {l?.mood && <Face shape="square" fill={MOODS[l.mood]?.fill} mood={l.mood} size={36} anim="none" />}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
            {[["👟", totalSteps > 999 ? `${Math.round(totalSteps / 1000)}k` : totalSteps], ["📝", `${mLogs.length}/${daysInMonth}`], ["😴", `${avgSleep}h`]].map(([ic, v]) => (
              <Tile key={ic} style={{ border: `2px solid ${C.line}`, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>{ic}</div>
                <div style={{ fontSize: 19, fontWeight: 900 }}>{v}</div>
              </Tile>
            ))}
          </div>
          <Pill style={{ width: "100%", marginTop: 14 }} onClick={() => setPoster(true)}>📤 Make my poster</Pill>
        </>
      ) : (
        <>
          <div ref={posterRef} style={{ background: C.ink, borderRadius: 24, padding: 18, color: "#fff" }}>
            <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.6, letterSpacing: "0.1em" }}>
              MY {now.toLocaleString("en", { month: "long" }).toUpperCase()} · HEALTH POP
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.1, margin: "8px 0 14px" }}>
              Mostly<br />{MOODS[topMood].label} {topMood === "happy" ? "😄" : topMood === "calm" ? "😌" : topMood === "sleepy" ? "😴" : topMood === "angry" ? "😤" : "😜"}
            </div>
            <div style={{ background: "#fff", borderRadius: 18, padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {grid.slice(0, 28).map((l, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "center" }}>
                    {l?.mood
                      ? <Face shape="square" fill={MOODS[l.mood]?.fill} mood={l.mood} size={30} anim="none" />
                      : <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F5F3F8" }} />}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {[["🔥", `${streak}-day streak`], ["👟", `${Math.round(totalSteps / 1000)}k steps`], ["😴", `${avgSleep}h avg`]].map(([ic, t]) => (
                <div key={t} style={{ flex: 1, background: "rgba(255,255,255,.12)", borderRadius: 14, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 20 }}>{ic}</div>
                  <div style={{ fontSize: 11, fontWeight: 800 }}>{t}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, opacity: 0.5, textAlign: "center", marginTop: 10, fontWeight: 700 }}>moods only · no medical data</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Pill small style={{ flex: 1 }} onClick={download}>Download PNG 📤</Pill>
            <Pill small dark={false} style={{ flex: 1 }} onClick={() => setPoster(false)}>Back</Pill>
          </div>
        </>
      )}
    </div>
  );
}
