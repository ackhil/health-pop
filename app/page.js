"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { C, font, MOODS, Face, Pill, Tile, Callout, IconHome, IconBook, IconPeople, IconChat, IconPerson, inputStyle, computeStreak, stageFromStreaks, dstr } from "../components/design";
import Home from "../components/screens/Home";
import Journal from "../components/screens/Journal";
import Friends from "../components/screens/Friends";
import Coach from "../components/screens/Coach";
import Profile from "../components/screens/Profile";
import Setup from "../components/screens/Setup";

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
          data: { inviter_name: inviterName || "" },
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
  const [needsSetup, setNeedsSetup] = useState(false);

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
      const { data: l } = await supabase.from("logs").select("log_date, data").eq("user_id", uid).order("log_date");
      const loadedLogs = l ? l.map((r) => ({ date: r.log_date, ...r.data })) : [];
      const loadedProfile = p?.data || {};
      setLogs(loadedLogs);

      if (!loadedProfile.onboarding) {
        // Migration: an existing user predating this feature has real data already —
        // skip onboarding for them instead of forcing a "first run" screen retroactively.
        const isExistingUser = Object.keys(loadedProfile).length > 0 || loadedLogs.length > 0;
        if (isExistingUser) {
          const backfilled = { ...loadedProfile, onboarding: { setupDone: true, seenMarks: ["mood", "journey", "friends"] } };
          setProfile(backfilled);
          supabase.from("profiles").upsert({ user_id: uid, data: backfilled, updated_at: new Date().toISOString() });
        } else {
          setProfile(loadedProfile);
          setNeedsSetup(true);
        }
      } else {
        setProfile(loadedProfile);
      }

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
      photo_path: next.photoPath || null,
    });
    flash(error ? "Save failed — try again" : "Saved ✓");
  };

  const finishSetup = async (next) => {
    const withOnboarding = { ...next, onboarding: { setupDone: true, seenMarks: [] } };
    setProfile(withOnboarding);
    setNeedsSetup(false);
    await supabase.from("profiles").upsert({ user_id: session.user.id, data: withOnboarding, updated_at: new Date().toISOString() });
    await supabase.from("public_profiles").upsert({ user_id: session.user.id, display_name: withOnboarding.name || "Friend", evo_stage: 0 });
  };

  const markSeen = (id) => {
    setProfile((prev) => {
      const seenMarks = prev.onboarding?.seenMarks || [];
      if (seenMarks.includes(id)) return prev;
      const next = { ...prev, onboarding: { ...prev.onboarding, seenMarks: [...seenMarks, id] } };
      supabase.from("profiles").upsert({ user_id: session.user.id, data: next, updated_at: new Date().toISOString() });
      return next;
    });
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
  if (needsSetup) return <Setup onDone={finishSetup} />;

  const screens = { home: Home, journal: Journal, friends: Friends, coach: Coach, profile: Profile };
  const Screen = screens[tab];
  const nav = [
    ["home", "Home", IconHome],
    ["journal", "Journey", IconBook],
    ["coach", "H-pop", IconChat],
    ["friends", "Friends", IconPeople],
    ["profile", "Profile", IconPerson],
  ];

  const seenMarks = profile.onboarding?.seenMarks || [];
  const showProfileMark = tab !== "profile" && seenMarks.includes("mood") && !seenMarks.includes("profile");
  const showJourneyMark = tab !== "journal" && logs.length >= 1 && !seenMarks.includes("journey");
  const showFriendsMark = tab !== "friends" && logs.length >= 3 && !seenMarks.includes("friends") && seenMarks.includes("journey");

  const goTab = (id) => {
    setTab(id);
    if (id === "profile") markSeen("profile");
    if (id === "journal") markSeen("journey");
    if (id === "friends") markSeen("friends");
  };

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
          saveProfile={saveProfile} saveLog={saveLog} flash={flash} setTab={goTab}
          onboarding={profile.onboarding} markSeen={markSeen}
        />
      </main>
      <div style={{ position: "fixed", bottom: 88, left: 0, right: 0, margin: "0 auto", width: "100%", maxWidth: 420, padding: "0 16px", zIndex: 55, boxSizing: "border-box" }}>
        {showProfileMark && (
          <Callout onDismiss={() => markSeen("profile")} style={{ position: "static", marginBottom: 8 }}>
            👆 Add your health details in Profile — it helps H-pop give better advice.
          </Callout>
        )}
        {showJourneyMark && (
          <Callout onDismiss={() => markSeen("journey")} style={{ position: "static", marginBottom: 8 }}>
            👆 Check Journey — your avatar grows here. A 3-day streak unlocks the first evolution.
          </Callout>
        )}
        {showFriendsMark && (
          <Callout onDismiss={() => markSeen("friends")} style={{ position: "static", marginBottom: 8 }}>
            👆 Streaks survive better with friends. Invite one in Friends — they only ever see your mood.
          </Callout>
        )}
      </div>
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, margin: "0 auto", width: "100%", maxWidth: 480, boxSizing: "border-box", background: C.ink, display: "flex", justifyContent: "space-around", alignItems: "flex-end", padding: "12px 6px calc(10px + env(safe-area-inset-bottom))", borderRadius: "26px 26px 0 0" }}>
        {nav.map(([id, label, Icon]) => {
          const active = tab === id;
          if (id === "coach") {
            return (
              <button key={id} onClick={() => goTab(id)} aria-label={label} style={{
                background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "0 6px",
              }}>
                <div className="coach-pop" style={{ width: 56, height: 56, marginTop: -26, lineHeight: 0 }}>
                  <Face shape="circle" fill={C.yellow} mood="wink" size={56} anim="none" />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 900, color: active ? C.green : "#fff", marginTop: -2 }}>{label}</span>
              </button>
            );
          }
          const color = active ? C.green : "rgba(255,255,255,0.45)";
          return (
            <button key={id} onClick={() => goTab(id)} aria-label={label} style={{
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "2px 6px", transition: "color .15s",
            }}>
              <Icon active={active} color={color} size={23} />
              <span style={{ fontSize: 10.5, fontWeight: 800, color }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
