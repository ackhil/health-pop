"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { C, font, Face, Pill, Tile } from "../../../components/design";

export default function InvitePage() {
  const { code } = useParams();
  const router = useRouter();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // remember the invite, then send them to sign in
        localStorage.setItem("pendingInvite", code);
        setStatus("signin");
        return;
      }
      const { data: res, error } = await supabase.rpc("accept_invite", { invite_code: code });
      if (error || res !== "ok") setStatus(res === "self" ? "self" : "invalid");
      else setStatus("ok");
    })();
  }, [code]);

  const msg = {
    checking: ["⏳", "Checking your invite…"],
    signin: ["✉️", "Sign in first — your invite is saved and will connect automatically."],
    ok: ["🤝", "You're connected! Streaks start today."],
    self: ["😄", "That's your own invite link!"],
    invalid: ["😕", "This invite is invalid or expired. Ask your friend for a new one."],
  }[status];

  return (
    <div style={{ fontFamily: font, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <Tile style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        <Face fill={C.orange} mood="wink" size={64} shape="blob" />
        <div style={{ fontSize: 40, margin: "8px 0" }}>{msg[0]}</div>
        <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 16 }}>{msg[1]}</div>
        <Pill onClick={() => router.push("/")}>Open Health Pop →</Pill>
      </Tile>
    </div>
  );
}
