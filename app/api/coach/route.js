// Server-side only — ANTHROPIC_API_KEY never reaches the browser.
import { NextResponse } from "next/server";

const MODES = {
  weekly: `Give personalized weekly recommendations. Structure:
✅ WINS — 2-3 specific positives from their data
⚠️ WATCH — trends worth attention, referencing actual numbers and listed conditions/medications
🎯 DO THIS WEEK — 3-5 concrete actions tied to their goals and habits
Keep each line short and icon-led.`,
  exercise: `Create a simple weekly exercise plan (4 sessions max) tailored to their stated goal, fitness level implied by their logs, and any conditions (adapt intensity for them). Format: Day — emoji — session name — one short safety/pacing note. Keep it scannable.`,
  meals: `Create a one-day meal template (breakfast, lunch, snack, dinner) matching their goal (calorie direction), respecting ALL allergies and conditions. Format: emoji — meal — one-line why. Include approx total kcal. Keep it scannable.`,
};

export async function POST(req) {
  try {
    const { profile, logs, mode, question } = await req.json();
    const recent = (logs || []).slice(-14);

    const task = question
      ? `The user's question: "${question}"\nAnswer using their profile and log data. Be specific — reference their actual numbers and conditions.`
      : MODES[mode] || MODES.weekly;

    const prompt = `You are a holistic health and fitness coach inside a mobile app. Below is the user's health profile and last ${recent.length} daily logs.

HEALTH PROFILE:
${JSON.stringify(profile, null, 2)}

RECENT DAILY LOGS (oldest first):
${JSON.stringify(recent, null, 2)}

${task}

Be warm, direct, minimal text, icon-friendly. Account for conditions, medications, allergies. Under 300 words. End with one short line: general wellness guidance, not medical advice.`;

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
