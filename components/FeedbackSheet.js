"use client";
import React, { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { C, Pill, Sheet, inputStyle } from "./design";

export default function FeedbackSheet({ open, onClose, session }) {
  const [nps, setNps] = useState(null);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const reset = () => { setNps(null); setMessage(""); setFile(null); setDone(false); setErr(""); };
  const close = () => { onClose(); reset(); };

  const submit = async () => {
    if (nps === null) return setErr("Pick a score first");
    setSubmitting(true); setErr("");
    try {
      let attachmentPath = null;
      if (file) {
        const uid = session.user.id;
        attachmentPath = `${uid}/feedback-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from("attachments").upload(attachmentPath, file);
        if (upErr) throw new Error("Couldn't upload the screenshot — try again.");
      }
      const r = await fetch("/api/submit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ nps, message, attachmentPath }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Couldn't send feedback — try again.");
      setDone(true);
    } catch (e) {
      setErr(e?.message || "Couldn't send feedback — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onClose={close} title={done ? undefined : "💬 Send Feedback"}>
      {done ? (
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <div style={{ fontSize: 40 }}>💛</div>
          <div style={{ fontSize: 16, fontWeight: 900, marginTop: 8 }}>Thanks for the feedback!</div>
          <div style={{ fontSize: 13, color: C.sub, fontWeight: 700, marginTop: 4 }}>It genuinely shapes what we build next.</div>
          <Pill small style={{ marginTop: 16, width: "100%" }} onClick={close}>Done</Pill>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>How likely are you to recommend Health Pop to a friend?</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {Array.from({ length: 11 }, (_, i) => (
              <button key={i} onClick={() => setNps(i)} aria-label={`Score ${i}`} style={{
                flex: 1, aspectRatio: "1", borderRadius: 10, fontSize: 12.5, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
                background: nps === i ? C.ink : "#fff", color: nps === i ? "#fff" : C.ink, border: `2px solid ${nps === i ? C.ink : C.line}`,
              }}>{i}</button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.sub, fontWeight: 700, marginBottom: 18 }}>
            <span>Not likely</span><span>Very likely</span>
          </div>

          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>What could make Health Pop better? (optional)</div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us anything…"
            style={{ ...inputStyle, minHeight: 70, marginBottom: 12 }} />

          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0] || null)} />
          <button onClick={() => fileRef.current.click()} style={{
            width: "100%", background: "transparent", border: `2px dashed ${C.sub}`, borderRadius: 16, padding: 12,
            fontSize: 13, fontWeight: 800, color: C.sub, fontFamily: "inherit", cursor: "pointer", marginBottom: 14, textAlign: "left",
          }}>{file ? `📷 ${file.name}` : "📷 Attach a screenshot (optional)"}</button>

          {err && <div style={{ color: C.orange, fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{err}</div>}
          <Pill style={{ width: "100%" }} onClick={submit} disabled={submitting}>{submitting ? "Sending…" : "Send feedback ✓"}</Pill>
        </>
      )}
    </Sheet>
  );
}
