# Health Pop

Next.js 14 + Supabase health/streak tracker. Full architecture, data model, and setup steps are in [README.md](README.md) — don't duplicate that here, only project-operating notes that don't belong in either file.

## Roadmap discipline

[ROADMAP.md](ROADMAP.md) is the source of truth for what's being built next (Now/Next/Later). Before starting new work in this repo:
- Check it against `ROADMAP.md`.
- If a request doesn't map to a listed item, say so, do the work anyway if the user still wants it, and afterward ask whether the roadmap should be updated.
- Log completed-but-unplanned work in its "Shipped this session" section instead of letting the file go stale.
- Flag it yourself (don't wait to be asked) when a Now-tier item ships or priorities visibly shift mid-conversation, and offer to re-rank the file.

## Branching

- `main` = production, auto-deploys to health-pop-mauve.vercel.app on push.
- `dev` = integration branch. New work branches off `dev` or merges into it; `dev` → `main` only when ready to ship.
- The user pushes and merges themselves — don't push to remote or open PRs without being asked each time.

## Known environment gaps

- **No staging Supabase project yet.** `dev`'s Vercel preview and `main`'s production deploy currently point at the *same* Supabase project — there's no data isolation between testing and real usage. (Tracked as a Next-tier roadmap item.)
- **No local `.env.local`.** Testing requires either the deployed production URL or a Vercel preview deployment; there's no local dev loop set up with real credentials.
- `supabase/schema.sql` is idempotent (every `create policy` has a `drop policy if exists` first) — safe to re-run in the SQL Editor after any change, but it's still one hand-maintained file, not versioned Supabase CLI migrations.

## Delegation

The higher your tier, the more you delegate. Push the work down, keep your own context for judgment. Brief every child: the context, the why, what done looks like. It starts blank and inherits nothing.

| Model | Best for | Delegate? | Effort |
|---|---|---|---|
| Haiku | bulk mechanical | never | low |
| Sonnet | scoped research | when it helps | medium |
| Opus 4.8 | multi-step reasoning | on clear benefit | xhigh |
| Fable 5 | judgment, taste | by default | medium |

Fable goes xhigh only for the hardest calls. Skip high.

## Escalation

The parent doesn't have to be the top model. An Opus parent spawns a Fable child for the one hard call. The child answers and returns.

Work above your tier? Return it, don't burn tokens on it.
