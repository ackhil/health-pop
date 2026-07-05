"use client";
import React, { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { C, MOODS, Face, Pill, Tile, Eyebrow, EvoAvatar, computeStreak, stageFromStreaks } from "../design";

export default function Journal({ logs, profile }) {
  const [view, setView] = useState("month");
  const [poster, setPoster] = useState(false);
  const posterRef = useRef(null);
  const now = new Date();
  const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]);

  const exStreak = computeStreak(logs, (l) => l.exercised);
  const foodStreak = computeStreak(logs, (l) => l.healthyFood);
  const logStreak = computeStreak(logs, () => true);
  const stage = stageFromStreaks(exStreak, foodStreak, logStreak);
  const toNext = stage >= 5 ? 0 : (stage + 1) * 5 - (exStreak + foodStreak + logStreak);

  const monthKey = `${ym[0]}-${String(ym[1] + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(ym[0], ym[1] + 1, 0).getDate();
  const byDate = Object.fromEntries(logs.map((l) => [l.date, l]));
  const mLogs = logs.filter((l) => l.date.startsWith(monthKey));

  const futureLabel = profile.futureYou?.length ? profile.futureYou.join(" · ") : "Set Future You in Profile →";

  // month-scoped stats, power both the stat tiles and the poster
  const totalSteps = mLogs.reduce((a, l) => a + (parseInt(l.steps) || 0), 0);
  const avgSleep = (() => {
    const v = mLogs.map((l) => parseFloat(l.sleepHrs)).filter((x) => !isNaN(x));
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—";
  })();
  const moodCounts = {};
  mLogs.forEach((l) => l.mood && (moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1));
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "happy";
  const monthGrid = Array.from({ length: daysInMonth }, (_, i) => byDate[`${monthKey}-${String(i + 1).padStart(2, "0")}`]);

  const downloadPoster = async () => {
    if (!posterRef.current) return;
    const url = await toPng(posterRef.current, { pixelRatio: 2 });
    const a = document.createElement("a");
    a.download = `health-pop-${monthKey}.png`;
    a.href = url;
    a.click();
  };

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 12 }}>📖 Journey</div>

      {/* journey to future you */}
      <Tile bg={C.purpleSoft} style={{ marginBottom: 12, textAlign: "center", padding: 14 }}>
        <Eyebrow>YOUR JOURNEY · STAGE {stage + 1} OF 6</Eyebrow>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "12px 4px 6px" }}>
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <div key={s} style={{ opacity: s <= stage ? 1 : 0.28 }}>
              <EvoAvatar stage={s} size={s === stage ? 52 : 38} anim={s === stage ? "bob" : "none"} />
            </div>
          ))}
        </div>
        <div style={{ height: 8, background: "#fff", borderRadius: 999, overflow: "hidden", margin: "4px 2px 10px" }}>
          <div style={{ width: `${((stage + 0.6) / 6) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.green}, ${C.orange})` }} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 900 }}>✨ Future You: {futureLabel}</div>
        {stage < 5 && <div style={{ fontSize: 12.5, color: C.sub, fontWeight: 700 }}>{toNext} more streak days → next stage</div>}
      </Tile>

      {/* streak chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["🏋️", exStreak, "exercise", C.orangeSoft], ["🥗", foodStreak, "healthy eating", C.greenSoft], ["📝", logStreak, "logging", C.purpleSoft]].map(([ic, n, label, bg]) => (
          <Tile key={label} bg={bg} style={{ flex: 1, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 20 }}>{ic}</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>🔥 {n}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.sub }}>{label}</div>
          </Tile>
        ))}
      </div>

      {/* toggle */}
      <div style={{ display: "flex", background: "#F5F3F8", borderRadius: 999, padding: 4, marginBottom: 12 }}>
        {[["month", "Month"], ["year", "Year"]].map(([v, l]) => (
          <button key={v} onClick={() => { setView(v); setPoster(false); }} style={{
            flex: 1, background: view === v ? C.ink : "transparent", color: view === v ? "#fff" : C.ink,
            border: "none", borderRadius: 999, padding: "10px 0", fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>

      {view === "month" ? (
        poster ? (
          <>
            <div ref={posterRef} style={{ background: C.ink, borderRadius: 24, padding: 18, color: "#fff" }}>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.6, letterSpacing: "0.1em" }}>
                MY {new Date(ym[0], ym[1]).toLocaleString("en", { month: "long" }).toUpperCase()} · HEALTH POP
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.1, margin: "8px 0 14px" }}>
                Mostly<br />{MOODS[topMood].label} {topMood === "happy" ? "😄" : topMood === "calm" ? "😌" : topMood === "sleepy" ? "😴" : topMood === "angry" ? "😤" : "😜"}
              </div>
              <div style={{ background: "#fff", borderRadius: 18, padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                  {monthGrid.slice(0, 28).map((l, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "center" }}>
                      {l?.mood
                        ? <Face shape="square" fill={MOODS[l.mood]?.fill} mood={l.mood} size={30} anim="none" />
                        : <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F5F3F8" }} />}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {[["🔥", `${logStreak}-day streak`], ["👟", `${Math.round(totalSteps / 1000)}k steps`], ["😴", `${avgSleep}h avg`]].map(([ic, t]) => (
                  <div key={t} style={{ flex: 1, background: "rgba(255,255,255,.12)", borderRadius: 14, padding: "10px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 20 }}>{ic}</div>
                    <div style={{ fontSize: 11, fontWeight: 800 }}>{t}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, opacity: 0.5, textAlign: "center", marginTop: 10, fontWeight: 700 }}>moods only · no medical data</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Pill small style={{ flex: 1 }} onClick={downloadPoster}>Download PNG 📤</Pill>
              <Pill small dark={false} style={{ flex: 1 }} onClick={() => setPoster(false)}>Back</Pill>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <button onClick={() => setYm(ym[1] === 0 ? [ym[0] - 1, 11] : [ym[0], ym[1] - 1])} style={navBtn}>‹</button>
              <div style={{ fontSize: 15, fontWeight: 900 }}>{new Date(ym[0], ym[1]).toLocaleString("en", { month: "long", year: "numeric" })}</div>
              <button onClick={() => setYm(ym[1] === 11 ? [ym[0] + 1, 0] : [ym[0], ym[1] + 1])} style={navBtn}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = `${monthKey}-${String(i + 1).padStart(2, "0")}`;
                const l = byDate[d];
                return (
                  <div key={d} style={{ textAlign: "center" }}>
                    {l?.mood
                      ? <Face shape="square" fill={MOODS[l.mood]?.fill || C.line} mood={l.mood} size={36} anim={["bob", "wiggle", "pulse"][i % 3]} delay={(i % 7) * 0.15} />
                      : <div style={{ width: 36, height: 36, borderRadius: 10, background: "#F5F3F8", margin: "0 auto" }} />}
                    <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 2 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: l?.exercised ? C.orange : C.line }} />
                      <span style={{ width: 7, height: 7, borderRadius: 999, background: l?.healthyFood ? C.green : C.line }} />
                    </div>
                    <div style={{ fontSize: 9.5, color: C.sub, fontWeight: 800 }}>{i + 1}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 8, fontSize: 11.5, fontWeight: 800, color: C.sub }}>
              <span><Dot c={C.orange} />🏋️ moved</span>
              <span><Dot c={C.green} />🥗 ate well</span>
            </div>

            {/* month stat tiles — scoped to whichever month is being viewed */}
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
        )
      ) : (
        <YearView logs={logs} year={ym[0]} onMonthTap={(m) => { setYm([ym[0], m]); setView("month"); }} />
      )}
    </div>
  );
}

const navBtn = { background: "#fff", border: `2px solid ${C.line}`, borderRadius: 999, width: 38, height: 38, fontSize: 18, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" };
const Dot = ({ c }) => <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: c, marginRight: 4 }} />;

function YearView({ logs, year, onMonthTap }) {
  const months = Array.from({ length: 12 }, (_, m) => {
    const key = `${year}-${String(m + 1).padStart(2, "0")}`;
    const mLogs = logs.filter((l) => l.date.startsWith(key));
    if (!mLogs.length) return null;
    // dominant mood + rough stage from activity density
    const counts = {};
    mLogs.forEach((l) => l.mood && (counts[l.mood] = (counts[l.mood] || 0) + 1));
    const mood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const active = mLogs.filter((l) => l.exercised || l.healthyFood).length;
    const stage = Math.min(5, Math.floor(active / 5));
    return { mood, stage };
  });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
      {months.map((m, i) => (
        <button key={i} onClick={() => onMonthTap(i)} style={{ background: m ? "#fff" : "#F5F3F8", border: `2px solid ${C.line}`, borderRadius: 18, padding: "10px 4px", textAlign: "center", cursor: "pointer", fontFamily: "inherit" }}>
          {m ? <EvoAvatar stage={m.stage} size={44} anim="none" /> : <div style={{ height: 44 }} />}
          <div style={{ fontSize: 13, fontWeight: 900, marginTop: 2, color: m ? C.ink : C.sub }}>
            {new Date(year, i).toLocaleString("en", { month: "short" })}
          </div>
        </button>
      ))}
    </div>
  );
}
