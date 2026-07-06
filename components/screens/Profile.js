"use client";
import React, { useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { C, MOODS, Face, Pill, Tile, Eyebrow, EvoAvatar, Sheet, FUTURE_CHIPS, inputStyle, computeStreak, stageFromStreaks, dstr } from "../design";
import FeedbackSheet from "../FeedbackSheet";

const STANDARD = [
  ["👤", "name", "Name"],
  ["🎂", "age", "Age"],
  ["📏", "heightCm", "Height (cm)"],
  ["⚖️", "goalWeightKg", "Goal weight (kg)", false, "Your target, not your current weight"],
  ["🩺", "conditions", "Current conditions", true, "e.g. \"I have knee pain, I sleep well\""],
  ["💊", "medications", "Medications & supplements", true, "e.g. \"Metformin 500mg twice daily\""],
  ["🚫", "allergies", "Allergies & intolerances", true, "e.g. \"Peanuts, shellfish — avoid in meal plans\""],
  ["📋", "medicalHistory", "Medical history", false, "e.g. \"Knee surgery 2019, nothing else major\""],
  ["👪", "familyHistory", "Family history", false, "e.g. \"Father: type 2 diabetes\""],
  ["🏠", "lifestyle", "Lifestyle & habits", false, "e.g. \"Desk job, sit most of the day\""],
  ["🎯", "goals", "Health & fitness goals", true, "e.g. \"Lose 5kg, build strength, sleep better\""],
];

function CustomMetricCard({ metric, onAnswer }) {
  const [val, setVal] = useState("");
  const answers = metric.answers || [];
  const latest = answers[answers.length - 1];
  const history = answers.slice(0, -1).slice(-3).reverse();
  const submit = () => { if (!val.trim()) return; onAnswer(val); setVal(""); };
  return (
    <div style={{ background: "#fff", border: `2px solid ${C.line}`, borderRadius: 20, padding: "13px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>📊</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{metric.question}</div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 700 }}>
            {latest ? `Latest: ${latest.value} · ${latest.date}` : "No answers logged yet"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Log today's answer…"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ flex: 1, border: `2px solid ${C.line}`, borderRadius: 12, padding: "8px 12px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", outline: "none" }} />
        <Pill small onClick={submit}>Log ✓</Pill>
      </div>
      {history.length > 0 && (
        <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginTop: 8, lineHeight: 1.6 }}>
          {history.map((a, i) => <div key={i}>{a.date}: {a.value}</div>)}
        </div>
      )}
    </div>
  );
}

// Backward-compat for custom sections created before the recurring-metric redesign.
function LegacyCustomSection({ c }) {
  return (
    <div style={{ background: "#fff", border: `2px solid ${C.line}`, borderRadius: 20, padding: "13px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 22 }}>📌</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{c.title}</div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 700 }}>{c.value || "—"}</div>
        </div>
      </div>
      {(c.images || []).length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {c.images.map((path) => <SignedThumb key={path} path={path} />)}
        </div>
      )}
    </div>
  );
}

export default function Profile({ session, profile, logs, saveProfile, flash }) {
  const [p, setP] = useState(profile);
  const [editing, setEditing] = useState(null);
  const [avatarMode, setAvatarMode] = useState(p.photoPath ? "photo" : "mood");
  const [photoUrl, setPhotoUrl] = useState(null);
  const fileRef = useRef(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const uid = session.user.id;

  const todayLog = logs.find((l) => l.date === dstr(new Date()));
  const mood = todayLog?.mood || "happy";
  const stage = stageFromStreaks(computeStreak(logs, (l) => l.exercised), computeStreak(logs, (l) => l.healthyFood), computeStreak(logs, () => true));

  // load photo signed URL once
  React.useEffect(() => {
    if (p.photoPath) supabase.storage.from("attachments").createSignedUrl(p.photoPath, 3600)
      .then(({ data }) => data && setPhotoUrl(data.signedUrl));
  }, [p.photoPath]);

  const uploadPhoto = async (file) => {
    const path = `${uid}/profile-photo-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("attachments").upload(path, file, { upsert: true });
    if (error) return flash("Upload failed");
    const next = { ...p, photoPath: path };
    setP(next); saveProfile(next); setAvatarMode("photo");
  };

  const toggleFuture = (chip) => {
    const cur = p.futureYou || [];
    const next = { ...p, futureYou: cur.includes(chip) ? cur.filter((c) => c !== chip) : [...cur, chip] };
    setP(next); saveProfile(next);
  };

  const addCustomMetric = () => {
    if (!newQuestion.trim()) return;
    const answers = newAnswer.trim() ? [{ date: dstr(new Date()), value: newAnswer.trim() }] : [];
    const next = { ...p, custom: [...(p.custom || []), { id: Date.now().toString(36), question: newQuestion.trim(), answers }] };
    setP(next); saveProfile(next);
    setNewQuestion(""); setNewAnswer(""); setShowAddSheet(false);
  };

  const addAnswer = (metricId, value) => {
    const custom = (p.custom || []).map((c) => c.id === metricId
      ? { ...c, answers: [...(c.answers || []), { date: dstr(new Date()), value }] }
      : c);
    const next = { ...p, custom };
    setP(next); saveProfile(next);
  };

  const replayTour = () => {
    saveProfile({ ...p, onboarding: { ...p.onboarding, seenMarks: [] } });
    setShowHelp(false);
    flash("Tour reset — tips will show again ✨");
  };

  return (
    <div>
      {/* hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => e.target.files[0] && uploadPhoto(e.target.files[0])} />

      {/* avatar: mood or photo */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {avatarMode === "photo" && photoUrl
            ? <img src={photoUrl} alt="Profile" style={{ width: 84, height: 84, borderRadius: 999, objectFit: "cover", border: `3px solid ${C.ink}` }} />
            : <Face fill={MOODS[mood].fill} mood={mood} size={84} />}
          <button onClick={() => fileRef.current.click()} aria-label="Upload photo"
            style={{ position: "absolute", right: -4, bottom: 2, width: 34, height: 34, borderRadius: 999, background: C.ink, color: "#fff", border: "3px solid #fff", fontSize: 14, cursor: "pointer" }}>📷</button>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{p.name || "Your name"}</div>
        <div style={{ display: "inline-flex", background: "#F5F3F8", borderRadius: 999, padding: 3, marginTop: 6 }}>
          {[["mood", "😊 Mood avatar"], ["photo", "📷 My photo"]].map(([v, l]) => (
            <button key={v} onClick={() => setAvatarMode(v)} style={{
              background: avatarMode === v ? C.ink : "transparent", color: avatarMode === v ? "#fff" : C.sub,
              border: "none", borderRadius: 999, padding: "7px 13px", fontSize: 12, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* mood nudge */}
      <Tile bg={MOODS[mood].fill} style={{ padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.45, textAlign: "center" }}>{MOODS[mood].nudge}</div>
      </Tile>

      {/* Future You */}
      <Tile bg={C.purpleSoft} style={{ marginBottom: 14, padding: 14 }}>
        <Eyebrow>✨ FUTURE YOU</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 10 }}>
          <div style={{ textAlign: "center" }}>
            <EvoAvatar stage={stage} size={64} anim="none" />
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.sub }}>today</div>
          </div>
          <div style={{ fontSize: 22 }}>→</div>
          <div style={{ textAlign: "center" }}>
            <EvoAvatar stage={5} size={64} />
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.sub }}>future you</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, justifyContent: "center" }}>
          {FUTURE_CHIPS.map((chip) => {
            const on = (p.futureYou || []).includes(chip);
            return (
              <button key={chip} onClick={() => toggleFuture(chip)} style={{
                background: on ? C.ink : "#fff", color: on ? "#fff" : C.ink, borderRadius: 999,
                padding: "8px 14px", fontSize: 13, fontWeight: 800, border: `2px solid ${on ? C.ink : C.line}`,
                fontFamily: "inherit", cursor: "pointer",
              }}>{chip}</button>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginTop: 10, textAlign: "center" }}>
          Streaks evolve your avatar — energy & confidence, never body shape. 💛
        </div>
        <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginTop: 4, textAlign: "center" }}>
          💬 Your coach tailors plans toward the chips you select.
        </div>
      </Tile>

      {/* standard questions */}
      <Eyebrow>STANDARD HEALTH QUESTIONS</Eyebrow>
      <div style={{ marginTop: 8, marginBottom: 12 }}>
        {STANDARD.map(([ic, key, label, usedByCoach, hint]) => (
          <div key={key} style={{ background: "#fff", border: `2px solid ${C.line}`, borderRadius: 20, padding: "13px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setEditing(editing === key ? null : key)}>
              <span style={{ fontSize: 22 }}>{ic}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>
                  {label} {usedByCoach && <span style={{ background: C.blue, borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800, marginLeft: 4 }}>💬 used by Coach</span>}
                </div>
                <div style={{ fontSize: 13, color: C.sub, fontWeight: 700 }}>{p[key] || "Tap to add"}</div>
              </div>
              <span style={{ background: p[key] ? C.greenSoft : "#F5F3F8", borderRadius: 999, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900 }}>
                {p[key] ? "✓" : "＋"}
              </span>
            </div>
            {editing === key && (
              <div style={{ marginTop: 10 }}>
                {hint && <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, marginBottom: 6, fontStyle: "italic" }}>{hint}</div>}
                <textarea autoFocus value={p[key] || ""} onChange={(e) => setP({ ...p, [key]: e.target.value })}
                  placeholder={hint} style={{ ...inputStyle, minHeight: 44 }} />
                <Pill small style={{ width: "100%", marginTop: 8 }} onClick={() => { saveProfile(p); setEditing(null); }}>Save ✓</Pill>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* custom recurring metrics */}
      <Eyebrow>METRICS YOU TRACK</Eyebrow>
      <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, margin: "6px 0 8px" }}>
        Define a question once, then log an answer any time — H-pop reads your history to give better advice.
      </div>
      <div style={{ marginTop: 8 }}>
        {(p.custom || []).map((c) => (
          c.question
            ? <CustomMetricCard key={c.id} metric={c} onAnswer={(v) => addAnswer(c.id, v)} />
            : <LegacyCustomSection key={c.id} c={c} />
        ))}
        <button onClick={() => setShowAddSheet(true)} style={{ width: "100%", background: "transparent", border: `2px dashed ${C.sub}`, borderRadius: 20, padding: 15, fontSize: 15, fontWeight: 900, color: C.sub, fontFamily: "inherit", cursor: "pointer" }}>
          ＋ Track a new metric
        </button>
      </div>

      <Sheet open={showAddSheet} onClose={() => setShowAddSheet(false)} title="Track a new metric">
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, textAlign: "left" }}>Question (e.g. "How many days did I go to the gym?")</div>
        <input autoFocus style={{ ...inputStyle, marginBottom: 12 }} value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6, textAlign: "left" }}>Today's answer (optional)</div>
        <input style={{ ...inputStyle, marginBottom: 14 }} value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <Pill small dark={false} style={{ flex: 1 }} onClick={() => setShowAddSheet(false)}>Cancel</Pill>
          <Pill small style={{ flex: 1 }} disabled={!newQuestion.trim()} onClick={addCustomMetric}>Save ✓</Pill>
        </div>
      </Sheet>

      <button onClick={() => setShowHelp(true)} style={{ width: "100%", background: "#fff", border: `2px solid ${C.line}`, borderRadius: 20, padding: "13px 14px", marginTop: 16, fontSize: 15, fontWeight: 900, color: C.ink, fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
        ❓ Help & Tips
      </button>
      <button onClick={() => setShowFeedback(true)} style={{ width: "100%", background: "#fff", border: `2px solid ${C.line}`, borderRadius: 20, padding: "13px 14px", marginTop: 8, fontSize: 15, fontWeight: 900, color: C.ink, fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
        💬 Send Feedback
      </button>
      <Pill dark={false} small style={{ width: "100%", marginTop: 8 }} onClick={() => supabase.auth.signOut()}>Sign out</Pill>

      <FeedbackSheet open={showFeedback} onClose={() => setShowFeedback(false)} session={session} />

      <Sheet open={showHelp} onClose={() => setShowHelp(false)} title="Help & Tips">
        <Pill small style={{ width: "100%", marginBottom: 14 }} onClick={replayTour}>↻ Replay the app tour</Pill>

        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>🏠 Home</div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginBottom: 14, lineHeight: 1.5 }}>
          Your daily 30-second check-in — mood, sleep, steps, and whether you moved or ate well. H-pop's plan teaser lives here too, once you've generated one.
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>📖 Journey</div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginBottom: 14, lineHeight: 1.5 }}>
          Watch your avatar evolve as streaks build, browse past months, and share your progress as a poster.
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>🤝 Friends</div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginBottom: 14, lineHeight: 1.5 }}>
          Invite friends to keep each other accountable — see the privacy note below for exactly what they can see.
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>💬 H-pop</div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginBottom: 14, lineHeight: 1.5 }}>
          Your AI coach — weekly plans, exercise & meal templates, and open Q&A, built from your Profile and last 14 logs.
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>👤 Profile</div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginBottom: 14, lineHeight: 1.5 }}>
          Your health details power H-pop's advice. Track custom recurring questions here too — like "how many gym days this week" — and H-pop reads your answer history.
        </div>

        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>How stages & streaks work</div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginBottom: 14, lineHeight: 1.5 }}>
          Every 5 combined streak-days across logging, exercise, and healthy eating evolves your avatar one stage, up to stage 6. It's attributes only — energy, confidence — never body shape.
        </div>
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>How friend privacy works</div>
        <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginBottom: 14, lineHeight: 1.5 }}>
          Friends only ever see your mood and whether you logged, exercised, or ate well that day — never your raw health data, conditions, medications, or notes.
        </div>
        <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, lineHeight: 1.5 }}>
          Health Pop is general wellness guidance, not a medical device or medical advice.
        </div>
      </Sheet>
    </div>
  );
}

function SignedThumb({ path }) {
  const [url, setUrl] = useState(null);
  React.useEffect(() => {
    supabase.storage.from("attachments").createSignedUrl(path, 3600).then(({ data }) => data && setUrl(data.signedUrl));
  }, [path]);
  return url
    ? <img src={url} alt="attachment" style={{ width: 64, height: 64, borderRadius: 14, objectFit: "cover" }} />
    : <div style={{ width: 64, height: 64, borderRadius: 14, background: "#F5F3F8" }} />;
}
