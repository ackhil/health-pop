// Server-side only — ANTHROPIC_API_KEY never reaches the browser.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DAILY_COACH_LIMIT = 30;

const MODES = {
  weekly: `Give personalized weekly recommendations as three sections, each a "## " heading followed by a bullet list:
## ✅ Wins — 2-3 specific positives from their data
## ⚠️ Watch — trends worth attention, referencing actual numbers and listed conditions/medications
## 🎯 Do this week — 3-5 concrete actions tied to their goals and habits
Each bullet under 12 words.`,
  exercise: `Create a simple weekly exercise plan (4 sessions max) tailored to their stated goal, fitness level implied by their logs, and any conditions (adapt intensity for them). Format as a markdown table with a header row: | Day | Session | Note |, one row per session, Note = a short safety/pacing tip.`,
  meals: `Create a one-day meal template matching their goal (calorie direction), respecting ALL allergies and conditions. Format as a markdown table with a header row: | Meal | What | Why |, one row per meal (breakfast/lunch/snack/dinner). Add one bullet below the table with the approx total kcal.`,
};

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

    const { data: usageCount, error: usageError } = await userClient.rpc("increment_coach_usage");
    if (usageError) {
      console.error("Coach usage check failed:", usageError);
      return NextResponse.json({ error: "Coach unavailable" }, { status: 502 });
    }
    if (usageCount > DAILY_COACH_LIMIT) {
      return NextResponse.json({ error: "Daily coach limit reached — try again tomorrow." }, { status: 429 });
    }

    const { profile, logs, mode, question } = await req.json();
    const recent = (logs || []).slice(-14);

    const task = question
      ? `The user's question: "${question}"\nAnswer using their profile and log data. Be specific — reference their actual numbers and conditions. Use a markdown table if you're comparing options, or a short bullet list if giving steps — avoid long paragraphs.`
      : MODES[mode] || MODES.weekly;

    const prompt = `You are a holistic health and fitness coach inside a mobile app. Below is the user's health profile and last ${recent.length} daily logs.

HEALTH PROFILE:
${JSON.stringify(profile, null, 2)}

RECENT DAILY LOGS (oldest first):
${JSON.stringify(recent, null, 2)}

${task}

Formatting rules: use markdown — "## " for section headers, "- " for bullets, "| |" tables (with a header row and a "---" separator row) for anything structured or comparative. No long paragraphs. Be warm, direct, icon-friendly. Account for conditions, medications, allergies. Under 200 words total. End with one short separate line: general wellness guidance, not medical advice.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      console.error("Anthropic error:", await r.text());
      return NextResponse.json({ error: "Coach unavailable" }, { status: 502 });
    }
    const data = await r.json();
    const text = (data.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
    return NextResponse.json({ text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
