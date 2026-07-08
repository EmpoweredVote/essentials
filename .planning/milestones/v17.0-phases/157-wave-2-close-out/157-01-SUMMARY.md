# 157-01 SUMMARY — v17.0 Milestone Audit (DB-verified)

**Plan:** 157-01 · **Wave:** 1 · **Status:** ✅ Complete · **Requirement:** LAC2-RETRO-01

## What was done
Ran read-only (SELECT-only) verification against the production DB (`mcp__supabase-local`) for all 15
Wave-2 cities and wrote `.planning/v17.0-MILESTONE-AUDIT.md` (root planning dir, mirroring the v16.0
audit). Verified the D-08 shared-UI fix. No DB writes; no code changes.

## Key results (DB-verified 2026-06-22)
- **15/15 cities structure-PASS** (gov + chamber + correct current roster). No structural defects.
- **92 active officials** · **91/92 headshots** (only Lancaster **Ken Mann** missing) · **83/92 with
  evidence-only stances** (9 honest blanks) · **445 total stance rows**.
- **Split-section scan: 0 rows across all 15 cities (clean).**
- **Wrong-person headshot spot-checks all correct:** Glendale (5/5 distinct), West Covina Gutierrez
  (official westcovina.gov), Pomona (no Gonzalez/Torres seated; no bad `/2025/02/` PCE path in use).
- District joins used `geo_id` (government_id is NULL). Roster counted survivor-chamber active seats only.
- Roster-vs-council deltas all explained by directly-elected mayors (El Monte/Inglewood/Pasadena) and
  Long Beach charter citywide officers — not defects.

## >=1-stance city set (D-02 purple-chip input for Wave 2)
**ALL 15 cities have ≥1 seeded stance** → every city keeps `hasContext: true`. **No 0-stance cities;
no chip needs to be dropped in Wave 2.** Thinnest = Bellflower (2 officials / 7 rows); richest =
Long Beach (113 rows).

## D-08 shared UI fix
`src/lib/groupHierarchy.js` Mayor>Mayor-Pro-Tem ordering+label fix committed to main at **a235f25**,
clean working tree. Production deploy still pending — documented item, not a blocker, no deploy performed.

## Deferred / carry-forward
- Split-section cleanup for 5 NON-Wave-2 councils (Whittier, Compton, Carson, South El Monte,
  South Pasadena) — pre-existing, out of scope, future cleanup phase.
- Lancaster Ken Mann headshot backfill; 9 honest blank-spoke officials to revisit as records accrue.

## Self-Check: PASSED
- File exists at `.planning/v17.0-MILESTONE-AUDIT.md`; all 15 geo_ids + `v17.0` present (verify cmd exit 0).
- Every DB interaction was read-only (SELECT). No INSERT/UPDATE/DELETE issued.
- groupHierarchy.js unchanged by this plan.
