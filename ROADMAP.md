# Health Pop Roadmap

**Last updated:** 2026-07-05
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
| Friends: nudge cooldown + "Nudged ✓" sent-state | Frontend | Nudge button currently gives no feedback that it worked. |
| Friends: mutual-streak explainer + richer empty state | Frontend | "Mutual streak" is never defined on-screen; empty state should sell the privacy model harder. |
| Coach: checkable plan items instead of text blob | Frontend/Backend | Turns Coach from a reading screen into a doing screen — checking an item off could write the same field Home does. Highest-value single Coach feature from the review. |
| Coach: staleness indicator, loading state, Q&A history | Frontend | A week-old plan looks identical to a fresh one; the Claude call has no loading state today. |
| Poster + invite: `navigator.share` alongside clipboard/download | Frontend | Mobile share-sheet is the organic growth channel; also a down payment on Year Wrapped (Later). |

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

## How "keeping you true to it" works

- New work gets checked against this file before I start.
- If it's on-roadmap: proceed normally.
- If it's off-roadmap (a new bug, an ad hoc request, scope creep on an existing item): I'll say so explicitly, still do it if you want it done, and ask afterward whether this file needs updating.
- After any Now-tier item is completed, or when priorities visibly shift (like they did this session), I'll flag that this file is stale and offer to re-rank it — rather than letting it silently drift out of sync with reality.
