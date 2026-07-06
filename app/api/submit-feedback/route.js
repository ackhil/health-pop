// Server-side only — RESEND_API_KEY never reaches the browser.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp, checkIpLimit } from "../../../lib/rateLimit";

const DAILY_IP_LIMIT = 10;

const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const npsCategory = (nps) => (nps >= 9 ? "🟢 Promoter" : nps >= 7 ? "🟡 Passive" : "🔴 Detractor");

export async function POST(req) {
  try {
    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const ip = getClientIp(req);
    const underIpLimit = await checkIpLimit(anonClient, ip, "submit-feedback", DAILY_IP_LIMIT);
    if (!underIpLimit) return NextResponse.json({ error: "Too many requests from this network — try again tomorrow." }, { status: 429 });

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const { nps, message, attachmentPath } = await req.json();
    if (typeof nps !== "number" || nps < 0 || nps > 10) return NextResponse.json({ error: "Invalid score" }, { status: 400 });

    const { error: insertError } = await userClient.from("feedback").insert({
      user_id: userData.user.id, nps, message: message || null, attachment_path: attachmentPath || null,
    });
    if (insertError) {
      console.error("Feedback insert failed:", insertError);
      return NextResponse.json({ error: `Couldn't save feedback: ${insertError.message} (${insertError.code || "no code"})` }, { status: 502 });
    }

    let attachmentUrl = null;
    if (attachmentPath) {
      const { data } = await userClient.storage.from("attachments").createSignedUrl(attachmentPath, 60 * 60 * 24 * 30);
      attachmentUrl = data?.signedUrl || null;
    }

    const reportEmail = process.env.FEEDBACK_REPORT_EMAIL;
    if (reportEmail) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL,
          to: reportEmail,
          subject: `📋 Health Pop feedback: NPS ${nps}/10 (${npsCategory(nps)})`,
          html: `
            <div style="font-family:Arial,sans-serif;padding:24px;background:#EFEAF4">
              <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;padding:24px">
                <h2 style="margin:0 0 4px;color:#141414">Feedback report</h2>
                <p style="color:#6E6B78;font-size:13px;margin:0 0 16px">${new Date().toLocaleString("en-GB")}</p>
                <p style="font-size:15px"><strong>NPS:</strong> ${nps}/10 — ${npsCategory(nps)}</p>
                <p style="font-size:15px"><strong>From:</strong> ${escapeHtml(userData.user.email || "unknown")}</p>
                ${message ? `<p style="font-size:15px"><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>` : ""}
                ${attachmentUrl ? `<p style="font-size:15px"><a href="${attachmentUrl}">View attachment 📷</a> (link expires in 30 days)</p>` : ""}
              </div>
            </div>`,
        }),
      });
      if (!r.ok) console.error("Feedback report email failed:", await r.text());
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
