# 211-01 SUMMARY — Federal deep-dive stance foundation

**Status:** ✅ Complete
**Wave:** 1
**Executed:** 2026-07-19 (orchestrator inline; no worktree — cross-repo/production phase)

## What was built

Shared foundation for the Trump/Vance/Rubio deep-dive pass. All three artifacts live in the
**separate backend repo** `C:\EV-Accounts\backend` (committed there: `703c6475`).

| Artifact | Provides |
|---|---|
| `data/stance-research/2026-07-19-federal-active-topics.json` | 44 live active topics (topic_id, topic_key, question_text, 5 ordered chairs each) — authoritative research-prompt source, pulled live from `inform.compass_topics`/`compass_stances` (NOT the stale 2026-06-07 md) |
| `data/stance-research/2026-07-19-trump-vance-pre-pass-snapshot.json` | D-04 pre-pass snapshot keyed by politician_id — Trump 21 rows, Vance 24 rows, Rubio 0 (empty array) |
| `scripts/apply-federal-deepdive-stances.ts` | Reconcile apply: `--csv`/`--politician-id` args; asserts every CSV row's politician_id == arg (abort on mismatch); upsert answers (`parseInt`, D-12) + context; scoped reconcile-DELETE of answers **and** context for topics not in the researched set (D-05) |

Reproducible generator `scripts/_gen-federal-wave1.ts` produced the two JSON files (gitignored — throwaway).

## Verification

- **Task 1 automated gate: PASS** — `topics 44, trump 21, vance 24`; every topic entry has topic_id + topic_key + exactly 5 chairs.
- Live counts unchanged after Task 1 (Trump 21 / Vance 24 / Rubio 0) — **no production answer write occurred in Wave 1.**
- **Task 2 acceptance greps: PASS** — answers `ON CONFLICT` upsert present; `DELETE FROM inform.politician_answers` **and** `...politician_context` both scoped by `politician_id`; `parseInt(r.value)` used; **no `3 -` polarity token anywhere** (fixed a comment that tripped the grep — Ph202 lesson); no bare/unscoped DELETE; per-row politician_id mismatch abort present.
- **Typecheck:** clean under the project tsconfig (`tsc --noEmit -p tsconfig.json`).

## Deviations / notes

- **Plan verify command was flawed:** `npx tsc --noEmit scripts/<file>.ts` (explicit file) ignores the project tsconfig, so esModuleInterop/module aren't applied → spurious TS1192/TS1259/TS1343. The **identical errors appear for the proven in-production clone base** `apply-khanh-pham-stances.ts`, confirming it's a verify-command artifact, not a defect. Substituted the correct `tsc --noEmit -p tsconfig.json` typecheck (clean).
- **Execution model deviation (whole phase):** ran inline/sequential with no worktree isolation because artifacts target a separate repo (`C:\EV-Accounts`) + production DB, which essentials-repo worktrees cannot isolate; and D-10 forbids parallel research. Committed to EV-Accounts via `git -C` per project convention.

## Enables

Waves 2–4 (Trump/Vance/Rubio) consume the topics JSON as the exact chair-match target and run the
apply script `--politician-id <uuid>`; Wave 5 uses the snapshot to report legacy deltas.
