"use client";
import React, { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { C, Face, Pill, Tile, Markdown } from "../design";

function ResultCard({ bg, text, suggestions, onSuggestion, onRefresh, refreshing, filename, updatedAt }) {
  const ref = useRef(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  };
  const download = async () => {
    if (!ref.current) return;
    const url = await toPng(ref.current, { pixelRatio: 2, backgroundColor: bg });
    const a = document.createElement("a");
    a.download = `${filename}.png`;
    a.href = url;
    a.click();
  };

  return (
    <Tile bg={bg} style={{ marginBottom: 12 }}>
      {updatedAt && (
        <div style={{ fontSize: 11, color: C.sub, fontWeight: 800, marginBottom: 8 }}>
          📅 From {new Date(updatedAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} — tap Refresh for something new
        </div>
      )}
      <div ref={ref} style={{ padding: 2 }}>
        <Markdown text={text} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {onRefresh && (
          <Pill small dark={false} style={{ background: "transparent" }} onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Thinking…" : "Refresh ⟳"}
          </Pill>
        )}
        <Pill small dark={false} style={{ background: "transparent" }} onClick={copy}>{copied ? "Copied ✓" : "Copy 📋"}</Pill>
        <Pill small dark={false} style={{ background: "transparent" }} onClick={download}>Download 📤</Pill>
      </div>
      {suggestions?.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid rgba(0,0,0,.08)` }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 800, marginBottom: 6 }}>💡 ASK H-POP NEXT</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => onSuggestion(s)} style={{
                textAlign: "left", background: "#fff", border: `2px solid ${C.line}`, borderRadius: 14, padding: "9px 12px",
                fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", color: C.ink,
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </Tile>
  );
}

export default function Coach({ session, profile, logs, saveProfile }) {
  const [tab, setTab] = useState("weekly");
  const history = profile.coachHistory || {};
  const [out, setOut] = useState(() => ({
    weekly: history.weekly?.text, exercise: history.exercise?.text, meals: history.meals?.text, question: history.question?.text,
  }));
  const [suggestions, setSuggestions] = useState(() => ({
    weekly: history.weekly?.suggestions, exercise: history.exercise?.suggestions, meals: history.meals?.suggestions, question: history.question?.suggestions,
  }));
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const ask = async (mode, question = null) => {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ profile, logs, mode, question }),
      });
      const data = await r.json();
      if (r.status === 429) throw new Error(data.error);
      if (!r.ok || !data.text) throw new Error();
      const key = question ? "question" : mode;
      const generatedAt = new Date().toISOString();
      setOut((o) => ({ ...o, [key]: data.text }));
      setSuggestions((s) => ({ ...s, [key]: data.suggestions }));
      saveProfile({
        ...profile,
        coachHistory: { ...profile.coachHistory, [key]: { text: data.text, suggestions: data.suggestions, question, generatedAt } },
      });
      if (question) setQ("");
    } catch (e) {
      setErr(e?.message || "Coach is unavailable — try again in a moment.");
    } finally { setLoading(false); }
  };

  const tabs = [["weekly", "📋 Weekly"], ["exercise", "🏃 Exercise"], ["meals", "🍽️ Meals"]];
  const bgFor = { weekly: C.greenSoft, exercise: C.orangeSoft, meals: C.purpleSoft };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Face shape="blob" fill={C.yellow} mood="wink" size={48} anim="wiggle" />
        <div>
          <div style={{ fontSize: 19, fontWeight: 900 }}>H-pop</div>
          <div style={{ fontSize: 12, color: C.sub, fontWeight: 700 }}>Built from your profile + last 14 logs</div>
        </div>
      </div>

      <div style={{ display: "flex", background: "#F5F3F8", borderRadius: 999, padding: 4, marginBottom: 12 }}>
        {tabs.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            flex: 1, background: tab === v ? C.ink : "transparent", color: tab === v ? "#fff" : C.ink,
            border: "none", borderRadius: 999, padding: "11px 0", fontSize: 13.5, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
          }}>{l}</button>
        ))}
      </div>

      {out[tab] ? (
        <ResultCard
          bg={bgFor[tab]} text={out[tab]} suggestions={suggestions[tab]} onSuggestion={(s) => ask(null, s)}
          onRefresh={() => ask(tab)} refreshing={loading} filename={`health-pop-${tab}`}
          updatedAt={history[tab]?.generatedAt}
        />
      ) : (
        <Tile style={{ border: `2px solid ${C.line}`, textAlign: "center", marginBottom: 12, padding: 24 }}>
          <div style={{ fontSize: 36 }}>{tab === "weekly" ? "📋" : tab === "exercise" ? "🏃" : "🍽️"}</div>
          <div style={{ fontSize: 15, fontWeight: 900, margin: "8px 0 12px" }}>
            {tab === "weekly" ? "Wins, watch points & this week's plan" : tab === "exercise" ? "A weekly plan built for your goal" : "A day of meals matched to your goal"}
          </div>
          <Pill dark={false} style={{ background: C.yellow, border: "none", color: C.ink }} onClick={() => ask(tab)} disabled={loading}>{loading ? "Thinking…" : "Generate ✨"}</Pill>
          {logs.length < 3 && <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, marginTop: 10 }}>Tip: log a few days first for better advice.</div>}
        </Tile>
      )}

      {out.question && (
        <ResultCard
          bg={C.blue} text={out.question} suggestions={suggestions.question} onSuggestion={(s) => ask(null, s)}
          filename="health-pop-answer" updatedAt={history.question?.generatedAt}
        />
      )}
      {err && <Tile style={{ border: `2px solid ${C.orange}`, marginBottom: 12 }}><span style={{ color: C.orange, fontWeight: 800 }}>{err}</span></Tile>}

      <div style={{ display: "flex", gap: 8 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && q.trim() && ask(null, q)}
          placeholder='"How is my sleep affecting my energy?"'
          style={{ flex: 1, background: "#fff", border: `2px solid ${C.line}`, borderRadius: 999, padding: "14px 16px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", outline: "none" }} />
        <Pill small dark={false} style={{ borderRadius: 999, width: 50, padding: 0, height: 50, fontSize: 18, background: C.yellow, border: "none", color: C.ink }} onClick={() => q.trim() && ask(null, q)} disabled={loading}>↑</Pill>
      </div>
      <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textAlign: "center", marginTop: 10 }}>
        General wellness guidance from H-pop — not medical advice.
      </div>
    </div>
  );
}
