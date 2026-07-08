---
phase: 149-pasadena-deep-seed
plan: 01
type: execute
status: complete
completed: 2026-06-20
migration: 946_pasadena_reconcile.sql (structural, registered version 946)
---

# 149-01 SUMMARY — Pasadena structural reconcile

## What was done

Migration **946** (`pasadena_reconcile`, structural, registered in `schema_migrations`) applied to
production. Idempotent (re-apply changes 0 rows, no error).

1. **geo_id backfill** — gov `d25619a9` geo_id NULL → `'0656000'` (empty-string-safe guard); state already CA.
2. **Chamber merge** — moved BOTH doomed-chamber (`bdd1acad`) offices (Gordo/Mayor `fc5e372a` + Hampton
   `0c357b48`) into the survivor `2e7f01d0` first, inline-asserted `bdd1acad` empty, then deleted it.
   End state: ONE 'City Council' chamber (`2e7f01d0`) with **8 offices**.
3. **By-district relabel** — the wrongly-'At-Large' council rows relabeled to the RESEARCH §3 occupant map:
   Hampton D1 · Cole D2 · Jones D3 · Masuda D4 · Rivas D5 · Madison D6 · Lyon D7; `Pasadena Mayor`
   LOCAL_EXEC (Gordo) kept as-is.
4. **Lyon image dedupe** — 2 rows pointed at the same storage object; deleted the `cc_by_sa_4.0` duplicate
   (`81333d16`), kept the `press_use` row (`95d15841`). Now 1 image.

## Deviation from plan (anticipated by RESEARCH / Assumptions A2/A3)

- **Shared-district defect FOUND.** Madison (office `f2cb13dd`) AND Rivas (office `7bdb4f77`) both pointed
  at district `4c08b6d3`. The plan assumed each office had its own At-Large row and said "create District 7."
  In reality D7 (Lyon's `b8f9ba37`) already existed and just needed relabel; the **missing** district was D5.
- **Resolution (cleaner than plan's "create new row"):** repurposed an **unused orphan At-Large row
  `ab0a29ee`** (0 office refs, geo_id 0656000) as Rivas's **District 5** — repointed Rivas's office off the
  shared `4c08b6d3`, then relabeled `4c08b6d3` → District 6 (Madison). No new row created; no orphan left.

## District UUIDs (for Plan 02)

| District | district_id | office | member | external_id |
|---|---|---|---|---|
| Pasadena Mayor (LOCAL_EXEC) | 3bb6c470-8fb6-4ea0-bab3-3c403e3e89c0 | fc5e372a | Victor M. Gordo | -200901 |
| District 1 | c9408f3e-ba83-4249-9998-2e19a07e4043 | 0c357b48 | Tyron Hampton | -201094 |
| District 2 | f34e6ce9-f96b-4937-a003-58ad0fa01bbd | 7ab2730c | Rick Cole | 657577 |
| District 3 | 9747b1a0-438d-495e-b369-049711aa9646 | e3617ff5 | Justin Jones | 657578 |
| District 4 | 5bb79df7-028e-43b7-a4cf-6a587c1bbada | 0bc62efd | Gene Masuda | 657579 |
| District 5 | ab0a29ee-67dc-4f1b-ac42-78ecdaa7cace (repurposed orphan) | 7bdb4f77 | Jess Rivas | -700150 |
| District 6 | 4c08b6d3-a63c-4125-bc52-3b7d35ab94a3 | f2cb13dd | Steve Madison | 657581 |
| District 7 | b8f9ba37-9540-44e4-9d1f-076c1b87c916 | 0cd97f4e | Jason Lyon | 657582 |

## Findings for Plan 02

- **Cole/Williams (Pitfall 2 / Open Q2):** ext_id 657577 reads **"Rick Cole"** (NOT Felicia Williams). Plan 02
  must verify whether Rick Cole is the CURRENT D2 holder against cityofpasadena.net (D-03 roster currency —
  Madison/Masuda/Cole flagged as likely-stale longtime members).
- **Rivas** (-700150, office `7bdb4f77`, now District 5): 0 images / 0 stances — correctly linked, confirmed.
- **official_count** NOT set here (survivor still 8) — Plan 02 sets council `official_count=7` per convention.
- Back-pointers (`politicians.office_id`) NOT touched — Plan 02 repairs bidirectional links.

## Out-of-scope note

- `South Pasadena Mayor` district (`66e1c2b0`) carries geo_id `0656000` (cross-gov mislabel, belongs to
  South Pasadena gov `1446b161`). UNTOUCHED — out of scope for this phase.

## Verification (all green)
- gov geo_id `0656000`/CA · one 'City Council' chamber (`2e7f01d0`), `bdd1acad` deleted · survivor 8 offices
- districts: Pasadena Mayor (LOCAL_EXEC) + District 1–7 (LOCAL), each office on its correct district
- Lyon 1 image · Rivas linked to office 7bdb4f77 on District 5 · split-section check = 0 rows for Pasadena
- migration 946 registered (structural) · idempotent (second apply = 0 rows changed)

## Self-Check: PASSED
