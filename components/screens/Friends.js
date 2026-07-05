"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { C, Face, Pill, Tile, EvoAvatar, dstr } from "../design";

function FriendAvatar({ friend, size }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!friend.photoPath) { setUrl(null); return; }
    supabase.storage.from("attachments").createSignedUrl(friend.photoPath, 3600).then(({ data }) => data && setUrl(data.signedUrl));
  }, [friend.photoPath]);
  if (url) return <img src={url} alt={friend.name} style={{ width: size, height: size, borderRadius: 999, objectFit: "cover", border: `2px solid ${C.line}` }} />;
  return <EvoAvatar stage={friend.stage} size={size} anim="none" />;
}

export default function Friends({ session, flash }) {
  const [friends, setFriends] = useState([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [nudgedBy, setNudgedBy] = useState([]);
  const uid = session.user.id;
  const today = dstr(new Date());

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: fs } = await supabase.from("friendships").select("user_a, user_b");
    if (!fs?.length) return;
    const ids = fs.map((f) => (f.user_a === uid ? f.user_b : f.user_a));
    const { data: pubs } = await supabase.from("public_profiles").select("*").in("user_id", ids);
    const since = new Date(); since.setDate(since.getDate() - 60);
    const { data: sums } = await supabase.from("daily_summary")
      .select("user_id, log_date, logged, mood").in("user_id", [...ids, uid])
      .gte("log_date", dstr(since)).order("log_date");
    const { data: nudges } = await supabase.from("nudges").select("from_id").eq("to_id", uid).eq("nudge_date", today);
    setNudgedBy((nudges || []).map((n) => n.from_id));

    const mySums = new Set((sums || []).filter((s) => s.user_id === uid).map((s) => s.log_date));
    const list = ids.map((id) => {
      const theirs = (sums || []).filter((s) => s.user_id === id);
      const theirDates = new Set(theirs.map((s) => s.log_date));
      const loggedToday = theirDates.has(today);
      const todayMood = theirs.find((s) => s.log_date === today)?.mood;
      // their solo streak
      let streak = 0; const d = new Date();
      if (!theirDates.has(dstr(d))) d.setDate(d.getDate() - 1);
      while (theirDates.has(dstr(d))) { streak++; d.setDate(d.getDate() - 1); }
      // mutual streak
      let mutual = 0; const md = new Date();
      if (!(theirDates.has(dstr(md)) && mySums.has(dstr(md)))) md.setDate(md.getDate() - 1);
      while (theirDates.has(dstr(md)) && mySums.has(dstr(md))) { mutual++; md.setDate(md.getDate() - 1); }
      const pub = (pubs || []).find((p) => p.user_id === id) || {};
      return { id, name: pub.display_name || "Friend", stage: pub.evo_stage || 0, photoPath: pub.photo_path || null, streak, mutual, loggedToday, todayMood };
    }).sort((a, b) => b.mutual - a.mutual);
    setFriends(list);
  };

  const makeInvite = async () => {
    const code = Math.random().toString(36).slice(2, 10);
    const { error } = await supabase.from("invites").insert({ code, inviter: uid });
    if (error) return flash("Couldn't create invite");
    const url = `${window.location.origin}/invite/${code}`;
    setInviteUrl(url);
    try { await navigator.clipboard.writeText(url); flash("Invite link copied 📋"); } catch { /* shown below */ }
  };

  const nudge = async (friendId, name) => {
    const { error } = await supabase.from("nudges").insert({ from_id: uid, to_id: friendId });
    flash(error ? `Already nudged ${name} today 😅` : `👋 Nudged ${name}!`);
    if (!error) {
      try {
        await fetch("/api/notify-nudge", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ toUserId: friendId }),
        });
      } catch (e) {
        console.error("Nudge notification email failed:", e);
      }
    }
  };

  const best = friends[0];

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 900, textAlign: "center", marginBottom: 4 }}>🤝 Friends</div>
      <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>Log together. Keep the fire alive.</div>

      {nudgedBy.length > 0 && (
        <Tile bg={C.yellow} style={{ marginBottom: 12, textAlign: "center", padding: 13 }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>👋 {nudgedBy.length} friend{nudgedBy.length > 1 ? "s" : ""} nudged you — go log!</div>
        </Tile>
      )}

      {best && (
        <Tile bg={C.orangeSoft} style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
            <EvoAvatar stage={3} size={58} />
            <div style={{ fontSize: 34, fontWeight: 900 }}>🔥 {best.mutual}</div>
            <FriendAvatar friend={best} size={58} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, marginTop: 8 }}>You & {best.name}</div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 700 }}>{best.mutual} days logging together</div>
          {!best.loggedToday && (
            <button onClick={() => nudge(best.id, best.name)} style={{ background: "#fff", border: "none", borderRadius: 14, padding: "10px 16px", marginTop: 10, fontSize: 14, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>
              ⏰ {best.name} hasn't logged today — nudge 👋
            </button>
          )}
        </Tile>
      )}

      {friends.slice(best ? 1 : 0).map((f) => (
        <div key={f.id} style={{ background: "#fff", border: `2px solid ${C.line}`, borderRadius: 20, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <FriendAvatar friend={f} size={44} />
          <div style={{ fontSize: 16, fontWeight: 900 }}>{f.name}</div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>🔥 {f.streak}</div>
            {f.loggedToday
              ? <span style={{ background: C.greenSoft, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>logged ✓</span>
              : <button onClick={() => nudge(f.id, f.name)} style={{ background: C.orangeSoft, border: "none", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 800, fontFamily: "inherit", cursor: "pointer" }}>nudge 👋</button>}
          </div>
        </div>
      ))}

      {friends.length === 0 && (
        <Tile style={{ border: `2px solid ${C.line}`, textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 40 }}>🫂</div>
          <div style={{ fontSize: 15, fontWeight: 900 }}>No friends yet</div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 700 }}>Streaks are 2× stickier together.</div>
        </Tile>
      )}

      <Pill dark={false} style={{ width: "100%", marginTop: 6, borderStyle: "dashed" }} onClick={makeInvite}>＋ Invite a friend</Pill>
      {inviteUrl && (
        <Tile bg={C.greenSoft} style={{ marginTop: 8, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, wordBreak: "break-all" }}>{inviteUrl}</div>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, marginTop: 4 }}>Send this link — valid 7 days, one use.</div>
        </Tile>
      )}
      <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textAlign: "center", marginTop: 10 }}>
        🔒 Friends see streaks & today's mood only — never your health data.
      </div>
    </div>
  );
}
