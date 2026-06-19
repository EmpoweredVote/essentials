# Plan 144-02 Summary — Glendale Roster Completion

**Status:** ✅ Complete
**Wave:** 2
**Migration:** 903 (`C:/EV-Accounts/backend/migrations/903_glendale_complete.sql`) — applied to production + registered in `supabase_migrations.schema_migrations`
**Date:** 2026-06-19

## Certification gate (Task 1 — checkpoint:human-verify)

User confirmed on 2026-06-19: **"Approved — seat Bartrosouf now."** June 2 2026 result is not LA-County-certified until June 26, but Bartrosouf's ~2,800-vote 3rd-place lead is effectively decisive and Najarian did not re-run. Full migration (retire Najarian + seat Bartrosouf) applied.

## What was done

Completed the council to its current post-election 5-member roster:

1. **Retired Ara Najarian (-700100)** — `office_id=NULL, is_incumbent=false, is_active=false`. Row preserved (NOT deleted), 0 stances (departing member, orchestrator #3). Same retire-not-delete pattern as SC Smyth.
2. **Reseated Alek Bartrosouf** into the council (see deviation below).
3. **official_count=5** confirmed; survivor chamber holds exactly 5 offices, 5 active members.

## ⚠️ Pre-flight finding — reseat + seat-swap (deviation from plan's "INSERT new -700101 person")

The plan specified INSERTing a fresh `-700101` Bartrosouf person + a new office. Live DB pre-flight found:

| Finding | Detail |
|---------|--------|
| Existing Bartrosouf person | `66cd60ba-a8b5-495f-9be5-b2360e1041a8` — full_name "Alek Bartrosouf", first/last set, `external_id NULL`, `is_active=true`, `office_id NULL`, `source='race_candidate'` (an election-candidate row) |
| `-700101` | confirmed VACANT (COUNT 0) |
| Junk rows | two inactive `'BARTROSOUF FOR CITY COUNCIL 2026'` cal_access committee rows — left untouched |
| Najarian's seat | office `c6f4e77d` is IN the survivor chamber |

**Decisions (per CONTEXT D-01 "reseat, never duplicate people" + plan Pitfall-4 STOP rule; mirrors SC McLean/Miranda 895):**
- **Reseat** the existing `66cd60ba` row (promoted: `external_id=-700101`, `is_incumbent=true`, `is_appointed=false`, `is_vacant=false`, `source='glendaleca.gov'`) rather than INSERT a duplicate person.
- **Seat-swap**: reassigned Najarian's vacated office `c6f4e77d` (Councilmember, chamber 771727ec, LOCAL district `fdfb8511` "At-Large") to Bartrosouf rather than INSERT a 6th office. Keeps exactly 5 offices, no orphan, no new districts/geofences/LOCAL_EXEC.

## Verification (all green)

| Check | Result |
|-------|--------|
| Najarian (-700100) state | is_incumbent=false / is_active=false / office_id NULL (retired, not deleted) |
| Bartrosouf (66cd60ba) | external_id -700101, is_active=true, is_incumbent=true, office_id c6f4e77d, source glendaleca.gov |
| active roster in 771727ec | 5 — Bartrosouf, Kassakhian (Mayor), Brotman, Asatryan, Gharpetian |
| total offices in chamber | 5 (seat swap — no orphan, no 6th office) |
| official_count | 5 |
| duplicate Bartrosouf person rows | 0 new (reseated existing) |
| new districts/geofences/LOCAL_EXEC | 0 created |
| migration 903 in schema_migrations | yes |
| idempotency re-run | najarian=0, b1=0, b2=0, b3=0, count=0 rows; no error |

## Deviations / notes

- **Reseat + seat-swap** (above) deviates from the plan's insert-fresh approach — avoids a duplicate person (Pitfall 4) and an orphaned office. Plans 03 (headshots) / 04 (stances) retarget Bartrosouf at person `66cd60ba` / external_id `-700101`.
- Pre-existing LOCAL_EXEC "Glendale Mayor" district (`2a857b1e`) exists but has no linked offices — left untouched (Mayor is flagged via title on the council seat per D-08; this stale district is out of scope).
- split-section: chamber/district structure unchanged from Wave 1 (still clean for Glendale).

## key-files
- created: `C:/EV-Accounts/backend/migrations/903_glendale_complete.sql`

## Self-Check: PASSED

Migration 903 applied + registered; Najarian retired (preserved); Bartrosouf reseated via seat-swap with no duplicate person and no orphan office; 5 current active members office-linked; idempotent. Roster is current and complete — ready for headshots (Wave 3).
