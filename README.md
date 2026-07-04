# 🎨 Health Pop — Personal Health Tracker

A playful, AI-coached personal health tracker. Log mood, sleep, steps, exercise, and eating in under 30 seconds a day; watch your avatar evolve toward "Future You"; keep streaks alive with friends; and get personalized weekly plans, exercise schedules, and meal templates from an AI coach that knows your full health profile.

**Live design language:** lavender canvas, ink-black pills, pastel doodle faces ("Mood Pop"), large type, icon-first, accessible by default (`prefers-reduced-motion` respected, 44px+ tap targets).

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER (browser / PWA)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                    VERCEL (free tier)                        │
│  ┌─────────────────────┐   ┌─────────────────────────────┐  │
│  │  Next.js 14 frontend │   │  /api/coach (serverless)    │  │
│  │  app/page.js         │   │  holds ANTHROPIC_API_KEY    │  │
│  │  6 screens           │   │  → api.anthropic.com        │  │
│  └──────────┬──────────┘   └─────────────────────────────┘  │
└─────────────┼───────────────────────────────────────────────┘
              │ supabase-js (anon key + user JWT)
┌─────────────▼───────────────────────────────────────────────┐
│                   SUPABASE (free tier)                       │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌────────────┐  │
│  │  Auth    │ │  Postgres     │ │ Storage  │ │  RPC fns   │  │
│  │  magic   │ │  + RLS        │ │ private  │ │  accept_   │  │
│  │  links   │ │  + triggers   │ │ bucket   │ │  invite    │  │
│  └──────────┘ └──────────────┘ └──────────┘ └────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Why this stack (frugal-startup reasoning):**
- **One repo, zero servers.** Next.js gives the frontend and the only backend piece we need (the coach proxy) in a single deployable unit. Vercel free tier hosts it.
- **Postgres as the product.** Supabase free tier provides auth, database, file storage, and RPC — four services for £0. Row Level Security means authorization lives in the database, not in app code, so a frontend bug cannot leak health data.
- **The AI key never ships to the browser.** All Anthropic calls go through `/api/coach`, a server-side route. Payloads are capped at the last 14 logs to bound token cost.
- **Monthly cost: £0 hosting + pennies of Anthropic usage** (set a spend cap in the Anthropic console).

## 2. Data model

| Table | Purpose | Who can access |
|---|---|---|
| `profiles` | Full health profile as JSONB: name, conditions, meds, allergies, goals, Future You chips, custom sections, photo path | **Owner only** |
| `logs` | One row per user per day, JSONB: mood, sleep, steps, exercised, healthyFood, weight, HR, BP, symptoms | **Owner only** |
| `daily_summary` | Derived: logged ✓/✗, mood, exercised, healthy_food. Populated **automatically by a Postgres trigger** on every log write | Owner + **friends (read-only)** |
| `public_profiles` | display_name + evolution stage | Owner + friends |
| `friendships` | One row per pair (`least(a,b), greatest(a,b)` — no duplicates) | Participants |
| `invites` | Single-use codes, 7-day expiry | Inviter |
| `nudges` | PK `(from, to, date)` — the primary key **is** the rate limit (1 nudge/friend/day) | Sender + recipient |
| Storage `attachments/` | Profile photos + custom-section images, path-scoped `{user_id}/…` | Owner only, signed URLs |

**The privacy invariant:** friends can never query `logs` or `profiles` — RLS rejects it at the database layer. The only friend-visible surface is `daily_summary` (mood + booleans) and `public_profiles` (name + avatar stage). This is enforced by schema, not by frontend discipline.

JSONB for logs/profile means **new metrics require zero migrations** — add a key in the UI and it just works.

## 3. Key flows

**Daily log → streaks → evolution:**
1. User saves quick log (mood, sleep, steps, moved ✓, ate well ✓)
2. Trigger writes `daily_summary`
3. Client computes exercise/food/logging streaks from own logs
4. `stage = min(5, floor(totalStreakDays / 5))` — avatar evolves through 6 stages (sweatband → glow → medal → aura → crown). **Attributes only, never body shape** — deliberate anti-body-shaming design.

**Friend invite:**
1. User taps Invite → random code inserted into `invites` → link copied: `/invite/{code}`
2. Friend opens link. Not signed in? Code is stashed in `localStorage`, they sign in via magic link, and the app auto-accepts on load.
3. `accept_invite()` (SECURITY DEFINER RPC) validates code, creates the friendship, burns the code.

**AI coach:** client POSTs profile + last 14 logs to `/api/coach` with a mode (`weekly` | `exercise` | `meals` | free question). The route builds a prompt that instructs Claude to respect conditions, medications, and allergies, and returns a compact icon-led answer.

**Share poster:** the poster is a DOM node rendered client-side and exported to PNG with `html-to-image`. It contains mood faces and streak/steps/sleep counts only — the export path physically cannot include medical fields.

## 4. Project structure

```
app/
  page.js                 # shell: auth gate, data layer, tab nav
  layout.js               # fonts, animations, global CSS
  api/coach/route.js      # server-side Anthropic proxy
  invite/[code]/page.js   # invite acceptance
components/
  design.js               # tokens, Face, EvoAvatar, primitives, streak math
  screens/
    Home.js               # goal greeting, morning brief, mood, quick log
    Journal.js            # evolution track, streaks, month/year views
    CalendarScreen.js     # month grid + shareable poster
    Friends.js            # invites, mutual streaks, nudges
    Coach.js              # weekly / exercise / meals + Q&A
    Profile.js            # photo, Future You, standard Qs, custom + images
lib/supabase.js
supabase/schema.sql       # entire database incl. RLS, triggers, RPCs
```

## 5. Setup & deployment (step by step)

### A. GitHub (~3 min)
1. Create a GitHub account at github.com if you don't have one
2. Create a new **private** repository named `health-pop` (private — this is a health app)
3. On your machine:
   ```bash
   cd health-pop
   git init && git add -A && git commit -m "Health Pop v2"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/health-pop.git
   git push -u origin main
   ```

### B. Supabase (~7 min)
1. Sign up at supabase.com (free) → New project (choose a strong DB password, region close to you, e.g. London)
2. **SQL Editor → New query** → paste the entire `supabase/schema.sql` → **Run** (creates all tables, RLS, triggers, RPCs, and the storage bucket)
3. **Authentication → Providers** → Email is on by default (magic links)
4. **Project Settings → API** → copy `Project URL` and `anon public` key

### C. Anthropic (~3 min)
1. console.anthropic.com → sign up → **API Keys** → create key
2. **Billing** → set a monthly spend limit (e.g. $5) — coach calls cost fractions of a cent

### D. Vercel (~5 min)
1. vercel.com → sign up **with your GitHub account** (one click)
2. **New Project** → import `health-pop` → Next.js auto-detected
3. **Environment Variables** — add all three:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from step B4 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step B4 |
   | `ANTHROPIC_API_KEY` | from step C |
4. **Deploy** → copy your live URL
5. Back in **Supabase → Authentication → URL Configuration** → set **Site URL** to your Vercel URL (so magic links redirect correctly)

### E. Use it
Open the URL → email → magic link → done. On your phone: **Add to Home Screen** for an app-like icon. Every `git push` to `main` auto-deploys.

### Local development
```bash
npm install
cp .env.example .env.local   # fill in the three values
npm run dev                  # http://localhost:3000
```

## 6. Security checklist
- ✅ RLS on every table; sensitive tables owner-only
- ✅ Friends limited to derived summaries by database policy
- ✅ Anthropic key server-side only
- ✅ Storage bucket private; images served via 1-hour signed URLs, path-scoped per user
- ✅ Invite codes single-use, 7-day expiry; nudges rate-limited by primary key
- ✅ Keep the GitHub repo **private**; enable 2FA on GitHub, Supabase, Vercel, Anthropic
- ⚠️ Not a medical device — general wellness guidance only (stated in-app)

## 7. Roadmap

**v2.1 — Habit engine (next)**
- [ ] Streak freeze ❄️ (1/week bank, auto-consumed on a missed day)
- [ ] Morning Brief push notification (web push, VAPID — free) with one insight + one action
- [ ] Evening 2-tap close-out reminder
- [ ] PWA manifest + service worker → installable app, offline log queue

**v2.2 — Data & sensors**
- [ ] Apple Health / Google Fit sync (kills manual entry for sleep/steps)
- [ ] CSV export of all logs (data ownership)
- [ ] Correlation insights: "stressed days follow <6.5h sleep 80% of the time"
- [ ] Weight/sleep trend charts with goal projection date

**v2.3 — Social & brag layer**
- [ ] Nudges as real push notifications (currently in-app banner)
- [ ] Milestone badges as collectible doodle characters (first 10k, 30-day streak…)
- [ ] Pair streak freezes; friend "high-five" reactions
- [ ] Year Wrapped (December): happiest month, total steps, biggest comeback

**v2.4 — Coach depth**
- [ ] Coach memory: references last week's plan and adherence
- [ ] Scheduled Sunday auto-review (Supabase cron + Edge Function)
- [ ] Image understanding: coach reads attached scans/reports (Claude vision) with user consent per attachment
- [ ] Grocery list generated from the week's meal plan

**v3 — Scale (only when needed)**
- [ ] React Native wrapper for app stores
- [ ] Households/teams; paid tier (advanced insights, unlimited history)
- [ ] Regional data residency options

## 8. Cost model
| Service | Free tier covers | You pay when |
|---|---|---|
| Vercel | 100GB bandwidth/mo | ~never for personal use |
| Supabase | 500MB DB, 1GB storage, 50k MAU auth | ~5,000 photos or years of logs |
| Anthropic | pay-per-use | ~£0.002 per coach request; cap it at $5/mo |
| **Total** | | **£0/month + pennies** |
