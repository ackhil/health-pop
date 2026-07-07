# Health Pop Roadmap

**Last updated:** 2026-07-06
**Status legend:** ✅ Done &nbsp; 🔧 In progress &nbsp; ⬜ Not started

This file is the source of truth for what we're building next and in what order. Rule for future work: **before starting something new, check it against this file.** If a request doesn't map to a Now/Next/Later item, that's not a blocker — just flag it, do the work if the user still wants it, and then ask whether this file should be updated to reflect the new priority. Revisit and re-rank this file whenever priorities shift, not on a fixed schedule.

---

## Now (this cycle)

| Item | Area | Status | Notes |
|---|---|---|---|
| Auth-gate `/api/coach` | Backend | ✅ Done | JWT verification + 30/day rate limit via `coach_usage` table + `increment_coach_usage()` RPC. Merged to `main`. |
| Global React error boundary | Frontend | ⬜ Not started | We patched two specific spots (invite page, magic-link sign-in) with local try/catch, but there's still no app-wide boundary catching an unhandled error anywhere else in the screen tree. |
| Error monitoring (Sentry or similar) | Infra | ⬜ Not started | The Resend SMTP outage was only caught because a user hit it and reported it — still no automated alerting. |
| Move `schema.sql` → Supabase CLI migrations | Infra/Backend | ⬜ Not started | `schema.sql` was made idempotent (safe to re-run) this session, but it's still one hand-pasted file, not versioned migrations. |

## Security (tracked separately — reviewed 2026-07-06)

| Item | Status | Notes |
|---|---|---|
| Auth-gate + rate-limit `/api/coach` | ✅ Done | JWT required, 30/day/user via `coach_usage`. |
| Server-side re-verification on `/api/notify-nudge` | ✅ Done | Friendship re-checked server-side before using the service-role key; not trusted from the client. |
| HTML-escape user-controlled text in transactional emails | ✅ Done | `display_name` was being interpolated raw into the nudge notification email HTML — a stored HTML-injection vector. Fixed; audit any future email template the same way before shipping it. |
| IP-based rate limiting on `/api/coach` and `/api/notify-nudge` | ✅ Done | Reused the existing Postgres-counter pattern (`coach_usage`) rather than adding Upstash/Vercel KV — no new service, no new free-tier ceiling to track. New `ip_rate_limit` table + `increment_ip_rate_limit()` RPC, RLS-locked with zero policies so only the RPC can touch it. Coach capped at 100/day/IP, notify-nudge at 20/day/IP. Fails open on a DB error since the pre-existing per-user check already fails closed. |
| Check/tune Supabase Auth rate limits | ⬜ **Needs the founder to check** | Dashboard → Authentication → Rate Limits — this is the real backstop against magic-link/signup spam and isn't configurable from code. Confirm the defaults fit expected traffic. |
| Global error boundary + Sentry | ⬜ Not started | Same item as under Now — flagged again here since unhandled errors/lack of alerting are a security-monitoring gap, not just a UX one. |
| Session storage is `localStorage`, not httpOnly cookies | ⬜ Not urgent | Standard for `supabase-js` browser clients; fine given no user-controlled raw-HTML rendering exists in the app today (React escapes everywhere checked). Reassess if that changes. Would mean migrating to `@supabase/ssr`. |
| Invite-code creation has no per-user rate limit | ⬜ Low priority | Cheap DB writes, unbounded growth possible but not a data-exposure risk. |

## Next (1–3 months)

| Item | Area | Notes |
|---|---|---|
| Weekly streak report email w/ AI recommendations | Backend + Frontend | Reuse existing Coach `weekly` prompt + Resend. Needs scheduled trigger, `notification_prefs` table, unsubscribe link. |
| Account deletion + data export | Backend | Hard requirement for iOS App Store approval later — build while the data model is still simple. |
| Staging environment | Infra | Second Supabase project + Vercel preview envs. Blocked on the migrations item above being done first. |
| CI: lint + build on PR | Infra | GitHub Actions, cheap insurance. |
| Basic analytics (PostHog free tier) | Infra | **Needs a decision from the founder**: no PostHog account exists yet — can't be built until one's created. Once it lands, instrument the loop (log-completion rate, D1/D7 retention, streak-break events, nudge→log and invite→signup conversion, Coach generate/refresh counts), not pageviews. |
| Android app via Capacitor | Frontend/Infra | Wrap existing Next.js/React code, don't rewrite. Needs Play Developer account + privacy policy + Data Safety form. Sequence *after* the screen-merge/onboarding work below, since restructuring nav post-launch costs store screenshots and review churn. |
| Timezone / day-boundary rule for streaks | Backend | **Needs a decision from the founder.** Mutual streaks, nudge cooldowns, and midnight cutoffs all depend on "whose midnight?" — currently implicit local-device-time. Cheap to decide now, painful after Android ships and users travel across timezones. |
| Friends: day-detail bottom sheet on calendar tap | Frontend | Journey's calendar grid currently looks tappable but isn't — from the screen review. |
| Friends: one-emoji reactions to a logged✓ badge | Frontend/Backend | Smallest possible social feature; needs a small reactions table + RLS. |
| Friends: nudge cooldown + "Nudged ✓" sent-state | Frontend | Nudge button still gives no visual feedback that it worked (email notification now sends, but the button itself doesn't reflect state). |
| ~~Env vars for nudge emails~~ | Infra | ✅ Done — all three (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`) confirmed added in Vercel. |
| Friends: mutual-streak explainer + richer empty state | Frontend | "Mutual streak" is never defined on-screen; empty state should sell the privacy model harder. |
| Coach: checkable plan items instead of text blob | Frontend/Backend | Turns Coach from a reading screen into a doing screen — checking an item off could write the same field Home does. Highest-value single Coach feature from the review. |
| Coach: loading state, deeper Q&A history | Frontend | Staleness ("From {date}") and persistence shipped in the demo-prep sprint below; a proper loading skeleton and multi-turn Q&A history (currently only the single latest exchange persists) are still open. |
| Invite link: `navigator.share` alongside clipboard copy | Frontend | Journey's poster now shares natively (shipped below) — the invite-link flow still only copies to clipboard. |
| Contextual NPS trigger (e.g. after a milestone streak) | Frontend | The feedback feature shipped this session is a static Profile entry point; prompting right after a positive moment would get better response rates, but needs its own trigger/cooldown logic similar to the onboarding coach-marks. |
| `FEEDBACK_REPORT_EMAIL` env var | Infra | **Needs the founder to add this in Vercel** (value: `ackhil.n@gmail.com`) — feedback submissions save to the DB either way, but the email report only sends once this is set. |

## Later (3–6+ months)

| Item | Area |
|---|---|
| iOS app (same Capacitor codebase) | Frontend/Infra |
| Native push: FCM (Android) → APNs (iOS) | Backend/Infra |
| Health sync (Apple Health / Google Fit) | Backend |
| Monetization / paid tier (Stripe) | Backend |
| Social layer expansion, Year Wrapped, households | Frontend |

---

## Shipped this session (not originally on the roadmap)

Reactive fixes and a full screen-by-screen UX review came up mid-session and got acted on rather than deferred — logged here for visibility, not as a process violation:

- Invite page raw `{}` error → proper try/catch + friendly status messages
- Resend custom SMTP outage (expired/misconfigured) → diagnosed and resolved
- Supabase Auth `Site URL` misconfiguration (literal `/**` in redirect, causing 404s) → diagnosed and fixed
- Magic-link email template: full aesthetic + email-client-compatibility rewrite (dark-mode safety, bulletproof button, preheader text)
- Personalized invite email ("X invited you to Health Pop") — `invite_inviter_first_name()` RPC, client-side plumbing through `localStorage` → `signInWithOtp` → email template conditional
- `dev`/`main` git branch workflow established
- **Full screen-by-screen UX review** (all 6 screens, order/content/features/clubbing/intuitiveness/onboarding), then implemented its top-5 ranked recommendations:
  - Merged Journal + Calendar into one "Journey" screen (5 tabs instead of 6); poster/stat-tiles now scoped to whichever month is viewed, not locked to the current month
  - Home: post-save collapsed summary state with edit toggle; evening streak-at-risk banner; trimmed bottom chip row to just the goal chip
  - Profile: replaced native `prompt()` custom-section dialogs with a proper bottom sheet (`Sheet` component, reusable); confirmed and surfaced that Future You chips already feed the Coach prompt; added "used by Coach" tags on the fields Claude actually reads
  - First-time-user onboarding: one-screen name+aspiration setup gate (skipped automatically for existing users via a migration check), 3 sequential dismissible coach marks (mood row, Journey tab, Friends tab), replayable via a new Help & Tips sheet in Profile
- Everything **not** in the top-5 (listed individually under Next above) was deferred rather than bundled into the same push, to keep the diff reviewable
- **Nudge → email notification**: new `/api/notify-nudge` route (service-role lookup of the friend's email + Resend API send), triggered after a successful nudge insert. Blocked on the three env vars flagged under Next until the founder adds them.
- **Friend-visible profile photo**: `public_profiles.photo_path` column + a storage policy scoped *only* to `profile-photo-%` filenames (not custom-section images, which can hold sensitive attachments) so friends can see an uploaded photo without widening the private-attachments privacy boundary.
- **Coach output formatting**: custom lightweight markdown renderer (headers/bullets/tables/bold — not a new npm dependency), tightened and restructured prompts asking for tables/bullets instead of prose, plus Copy and Download-as-image buttons on every generated result.
- **Bottom nav redesign**: replaced raw emoji tab icons with a custom SVG icon set (`IconHome`/`IconBook`/`IconPeople`/`IconChat`/`IconPerson` in `design.js`) using filled-when-active/outline-when-inactive duality, plus text labels under each icon — the readability complaint was specifically about the footer being hard to read with no labels. Scoped to the nav only; other in-app emoji (Coach's tabs, screen headers) weren't touched — offered as a follow-up if wanted.
- **Rich link previews for invites**: split `/invite/[code]/page.js` into a Server Component (personalized `generateMetadata`, reusing the existing `invite_inviter_first_name` RPC) wrapping the existing client logic (now `InviteCard.js`), plus a generated `opengraph-image.js` share card reusing the actual `Face` component's SVG paths. Hit and fixed a real Satori bug along the way (it doesn't support React Fragments) via the actual crash log, then visually confirmed the fix.
- **Feedback feature**: new `feedback` table (NPS 0–10 + optional message + optional screenshot, owner-only RLS), `/api/submit-feedback` route (IP-rate-limited at 10/day, same pattern as `/api/coach` and `/api/notify-nudge`) that saves the submission and emails a formatted report via Resend. Entry point is a "💬 Send Feedback" row in Profile next to Help & Tips, opening a `FeedbackSheet` with the NPS grid, optional free-text box, and optional attachment upload (reuses the existing `attachments` storage bucket — no new storage policy needed since it writes to the user's own folder, already covered by the owner-only policies).

## Shipped 2026-07-06 — investor-demo-prep sprint

Founder brought a day-of-real-usage backlog across all 5 screens the night before an investor demo, prioritized "solve the feedback bug first" and "use higher models for strategy" — an Opus strategic-triage pass classified every backlog item as buildable-now / needs-a-decision / needs-infra before implementation started, in that order:

- **Feedback bug — RESOLVED (2026-07-07)**: root cause was *not* code. The `feedback` table never existed in production (`PGRST205`) because `schema.sql` paste-runs into the SQL Editor were silently aborting — the editor runs each paste as one transaction, and stray non-SQL clipboard content (a markdown `## Heading`) caused a `42601` that rolled back everything, error banner unnoticed. Fixed by running an isolated `supabase/feedback-only.sql` snippet. This failure mode is the strongest argument yet for the Now-tier "Supabase CLI migrations" item — hand-pasted migrations have now silently failed three times.

- **Coach → "H-pop" rebrand, made the app's flagship feature**: reordered to 3rd tab; nav icon replaced with a real `Face` (mood: wink) in a floating, glowing badge (CSS animation, respects `prefers-reduced-motion`) instead of a generic chat icon — substitutes for the founder's "moving gif" ask, which isn't buildable in this stack (no image/video generation available). Iterated the color twice on founder feedback (purple → yellow → green) and fixed a real bug along the way (a leftover shadow color check plus a rectangular-shadow-around-a-circle artifact).
- **Coach persistence + suggested follow-ups**: weekly/exercise/meals plans and the last free-text Q&A now persist to `profile.data.coachHistory` (JSONB, zero migration) and reappear with a "From {date}" label instead of starting blank. Claude now also returns 3 tappable follow-up suggestions per response.
- **Fixed a real onboarding-tooltip race condition**: `markSeen()` computed updates from a variable that could go stale if two coach-mark dismissals fired close together (e.g. fast tab-switching), silently reverting an earlier dismissal so it reappeared after reload. Now uses a functional state update, immune to ordering.
- **Home**: added a 4th onboarding coach-mark pointing new users at Profile; a plan-teaser card that shows a real excerpt from the persisted H-pop weekly plan once one exists (rotating day-of-week tip before that — no fake "day 2 of a plan you never got" claims); mood chips now show labels; target-steps (day) vs actual-steps (evening) framing plus an evening in-app reminder banner (true scheduled push notifications need service-worker/Push-API/VAPID infra this app doesn't have — already ruled out earlier); Edit button is now an icon instead of a text pill.
- **Journey**: "Make my poster" now shares natively via `navigator.share` (image + steps/streak/mood caption) to WhatsApp/social apps, falling back to download; evolution-track tile recolored from purple to blue.
- **Friends**: reordered to 4th tab (Coach took 3rd); added a non-identifiable "momentum" indicator (Just started / Building / Strong) computed client-side from each friend's last-7-days exercised/healthy-food booleans — data already fetched and already friend-visible, so no schema change and no new privacy exposure.
- **Profile**: inline example hints on non-obvious fields (especially "used by Coach" ones); "Your Custom Sections" redesigned into "Metrics You Track" — a recurring question with dated answers logged over time instead of a static one-off text blob, and the Coach prompt now explicitly treats these as user-prioritized signal; Help & Tips expanded with a per-screen explainer (a full *interactive* guided tour was scoped as a separate, bigger post-demo item).
- **Deliberately deferred past the demo** (flagged during the strategic triage, not silently dropped): Friends' day-detail bottom sheet, one-emoji reactions, nudge cooldown/sent-state, and mutual-streak explainer; Coach's checkable plan items and a proper loading state; a fully interactive Help & Tips tour. All still listed individually under Next above.

## How "keeping you true to it" works

- New work gets checked against this file before I start.
- If it's on-roadmap: proceed normally.
- If it's off-roadmap (a new bug, an ad hoc request, scope creep on an existing item): I'll say so explicitly, still do it if you want it done, and ask afterward whether this file needs updating.
- After any Now-tier item is completed, or when priorities visibly shift (like they did this session), I'll flag that this file is stale and offer to re-rank it — rather than letting it silently drift out of sync with reality.
