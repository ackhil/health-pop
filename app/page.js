"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { C, font, MOODS, Face, Pill, Tile, inputStyle, computeStreak, stageFromStreaks, dstr } from "../components/design";
import Home from "../components/screens/Home";
import Journal from "../components/screens/Journal";
import CalendarScreen from "../components/screens/CalendarScreen";
import Friends from "../components/screens/Friends";
import Coach from "../components/screens/Coach";
import Profile from "../components/screens/Profile";

function AuthGate() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const send = async () => {
    setErr("");
    try {
      const inviterName = typeof window !== "undefined" ? localStorage.getItem("pendingInviteName") : null;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          data: inviterName ? { inviter_name: inviterName } : undefined,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      console.error("Magic link send failed:", e);
      const readable = e?.message && !e.message.trim().startsWith("{");
      setErr(readable ? e.message : "Couldn't send the sign-in email right now — please try again shortly.");
    }
  };
  return (
    <div style={{ fontFamily: font, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Tile style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <Face fill={C.green} mood="happy" size={44} />
          <Face fill={C.orange} mood="wink" size={44} anim="wiggle" shape="square" />
          <Face fill={C.purple} mood="calm" size={44} anim="pulse" shape="blob" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Health Pop</h1>
        <p style={{ color: C.sub, fontSize: 14, fontWeight: 700, marginTop: 0 }}>No passwords — we email you a sign-in link.</p>
        {sent ? (
          <p style={{ fontWeight: 800, fontSize: 16 }}>📬 Link sent — check your inbox!</p>
        ) : (
          <>
            <input style={inputStyle} type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && email && send()} />
            <Pill onClick={send} disabled={!email} style={{ width: "100%", marginTop: 12 }}>Send magic link ✨</Pill>
            {err && <p style={{ color: C.orange, fontSize: 13, fontWeight: 700 }}>{err}</p>}
          </>
        )}
      </Tile>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("home");
  const [profile, setProfile] = useState({});
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const uid = session.user.id;
      const { data: p } = await supabase.from("profiles").select("data").eq("user_id", uid).maybeSingle();
      if (p?.data) setProfile(p.data);
      const { data: l } = await supabase.from("logs").select("log_date, data").eq("user_id", uid).order("log_date");
      if (l) setLogs(l.map((r) => ({ date: r.log_date, ...r.data })));
      // handle pending invite (stored before auth redirect)
      const code = localStorage.getItem("pendingInvite");
      if (code) {
        localStorage.removeItem("pendingInvite");
        localStorage.removeItem("pendingInviteName");
        const { data: res } = await supabase.rpc("accept_invite", { invite_code: code });
        if (res === "ok") flash("🤝 Friend added!");
      }
    })();
  }, [session]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2500); };

  const saveProfile = async (next) => {
    setProfile(next);
    const { error } = await supabase.from("profiles").upsert({ user_id: session.user.id, data: next, updated_at: new Date().toISOString() });
    // keep friend-visible display info in sync
    const logStreak = computeStreak(logs, (l) => true);
    const exStreak = computeStreak(logs, (l) => l.exercised);
    const foodStreak = computeStreak(logs, (l) => l.healthyFood);
    await supabase.from("public_profiles").upsert({
      user_id: session.user.id,
      display_name: next.name || "Friend",
      evo_stage: stageFromStreaks(exStreak, foodStreak, logStreak),
    });
    flash(error ? "Save failed — try again" : "Saved ✓");
  };

  const saveLog = async (entry) => {
    const { date, ...data } = entry;
    const { error } = await supabase.from("logs").upsert({ user_id: session.user.id, log_date: date, data, updated_at: new Date().toISOString() });
    if (error) return flash("Save failed — try again");
    const next = [...logs.filter((l) => l.date !== date), entry].sort((a, b) => a.date.localeCompare(b.date));
    setLogs(next);
    flash("Saved ✓ 🔥 streak alive");
  };

  if (!ready) return <div style={{ fontFamily: font, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: C.sub }}>Loading…</div>;
  if (!session) return <AuthGate />;

  const screens = { home: Home, journal: Journal, calendar: CalendarScreen, friends: Friends, coach: Coach, profile: Profile };
  const Screen = screens[tab];
  const nav = [["home", "🏠"], ["journal", "📖"], ["calendar", "📅"], ["friends", "🤝"], ["coach", "💬"], ["profile", "👤"]];

  return (
    <div style={{ fontFamily: font, color: C.ink, maxWidth: 480, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {toast && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", background: C.ink, color: "#fff", borderRadius: 999, padding: "12px 22px", fontWeight: 800, fontSize: 15, zIndex: 50 }}>
          {toast}
        </div>
      )}
      <main style={{ flex: 1, padding: "16px 16px 96px" }}>
        <Screen
          session={session} profile={profile} logs={logs}
          saveProfile={saveProfile} saveLog={saveLog} flash={flash} setTab={setTab}
        />
      </main>
      <nav style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: C.ink, display: "flex", justifyContent: "space-around", padding: "16px 8px calc(16px + env(safe-area-inset-bottom))", borderRadius: "26px 26px 0 0" }}>
        {nav.map(([id, ic]) => (
          <button key={id} onClick={() => setTab(id)} aria-label={id}
            style={{ background: "none", border: "none", fontSize: 26, cursor: "pointer", opacity: tab === id ? 1 : 0.4, transition: "opacity .15s" }}>
            {ic}
          </button>
        ))}
      </nav>
    </div>
  );
}
