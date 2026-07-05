// Server-side only — SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY never reach the browser.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
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
    const fromUser = userData.user;

    const { toUserId } = await req.json();
    if (!toUserId) return NextResponse.json({ error: "Missing toUserId" }, { status: 400 });

    // Defense in depth — don't trust the client's claim that they're friends.
    const { data: isFriend, error: friendError } = await userClient.rpc("are_friends", { a: fromUser.id, b: toUserId });
    if (friendError || !isFriend) return NextResponse.json({ error: "Not friends" }, { status: 403 });

    const { data: fromPub } = await userClient.from("public_profiles").select("display_name").eq("user_id", fromUser.id).maybeSingle();
    const fromName = fromPub?.display_name || "A friend";

    // Service-role client only to resolve the recipient's email (auth.users isn't otherwise queryable) — never sent to the browser.
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: toUserData, error: toUserError } = await adminClient.auth.admin.getUserById(toUserId);
    if (toUserError || !toUserData?.user?.email) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: toUserData.user.email,
        subject: `👋 ${fromName} nudged you on Health Pop`,
        html: `<div style="font-family:Arial,sans-serif;padding:32px 16px;background:#EFEAF4"><div style="max-width:420px;margin:0 auto;background:#fff;border-radius:24px;padding:28px;text-align:center"><div style="font-size:40px;margin-bottom:8px">👋</div><h2 style="margin:0 0 8px;color:#141414">${fromName} nudged you!</h2><p style="color:#6E6B78;font-weight:600;margin:0 0 20px">Your streak's waiting — a quick log keeps it alive.</p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://health-pop-mauve.vercel.app"}" style="display:inline-block;background:#141414;color:#fff;text-decoration:none;border-radius:999px;padding:14px 28px;font-weight:800;font-size:15px">Open Health Pop →</a></div></div>`,
      }),
    });

    if (!r.ok) {
      console.error("Resend nudge email error:", await r.text());
      return NextResponse.json({ error: "Notification failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
