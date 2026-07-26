---
phase: 196-marana-deep-seed
plan: 01
status: complete
completed: 2026-07-16
requirements: [SUB-02]
migration: 1345_town_of_marana.sql
commit: 1d8bebb0
---

# Plan 196-01 Summary — Town of Marana structural seed

**Outcome:** Greenfield **Town of Marana, Arizona, US** (`geo_id='0444270'`, `type='Town'`, `state='AZ'`)
seeded to **live production**: 1 government + 1 `Town Council` chamber (`official_count=7`) + 2 new
`essentials.districts` rows (1 `LOCAL_EXEC` Mayor + 1 shared `LOCAL` at-large, both `mtfcc='G4110'`,
`state='az'`) + 7 politicians/offices. Migration `1345` applied with the in-transaction post-verify DO
gate **PASSED** (gov=1, offices=7 [1 LOCAL_EXEC + 6 LOCAL], party NULL, Vice Mayor on -4013002,
section-split=0, office_id backfill complete), COMMIT, ledger registered (`version='1345'`).

## 7 politician UUID manifest (REQUIRED by Plans 02 & 03)

| ext_id | UUID | full_name | seat / title |
|--------|------|-----------|--------------|
| -4013001 | `3b09d8a3-641f-43f9-b3cc-0ce695b54aef` | Jon Post | Mayor (LOCAL_EXEC) |
| -4013002 | `4a9bf58b-fd95-4010-81fa-481e1561633d` | Roxanne Ziegler | Council Member (Vice Mayor) (LOCAL) |
| -4013003 | `cb526b61-89e2-4c0f-b60c-f359e7193192` | Patrick Cavanaugh | Council Member (LOCAL) |
| -4013004 | `ad923125-6ce2-44ea-ac1d-a8eb701bff01` | Patti Comerford | Council Member (LOCAL) |
| -4013005 | `84e71183-dc0c-46de-8b28-d99c41dc8579` | Herb Kai | Council Member (LOCAL) |
| -4013006 | `e974aae0-fd87-4bf7-91dc-6935533a80ba` | Teri Murphy | Council Member (LOCAL) |
| -4013007 | `d2690186-3c41-455f-b2c4-a94cb8eb5ff5` | John Officer | Council Member (LOCAL) |

## [BLOCKING] Roster-currency re-verification (Task 2) — execute-date decision

**Established at execute time (2026-07-16) from LIVE sources** (marana.gov WAF-blocked, so used
tucsonlocalmedia.com/marana/, azluminaria.org, news.azpm.org, tucsonagenda.com, cornerstonerepublic.news
+ Ballotpedia candidate index):

- **Primary date:** July 21, 2026 (nonpartisan mail-in; a >50% primary winner takes office outright).
- **General:** Nov 3, 2026 runoff, only if a seat is not decided at the primary.
- **Certification status:** primary has **NOT occurred** (5 days out from the execute date) — **no
  certified results**. Therefore the roster seeded is the **current sitting 7**, i.e. who represents
  Marana residents today.
- **Operator decision:** APPROVED (AskUserQuestion, 2026-07-16) — seed the current sitting 7-member
  roster; no per-seat outgoing/incoming split needed because nothing has been certified.

**2026 ballot context (confirms RESEARCH, no roster drift):**
- Four council seats + Mayor are on the July 21 ballot: Kai (running), Officer (running), Murphy
  (appointed, seeking approval), **Comerford (full term, NOT seeking re-election — open seat, but STILL
  SITTING until the term rolls over → seeded)**. Ziegler (VM) and Cavanaugh are mid-term (not on the
  2026 ballot). Post is running to finish the remainder of Honea's term.
- **Appointed-not-elected (RESEARCH Pitfall 2):** Jon Post (-4013001) was appointed Mayor Jan 2025 after
  Mayor Ed Honea's death (Nov 2024); Teri Murphy (-4013006) was appointed Jan 2025 to Post's vacated
  council seat. Both flagged in the migration **header** (not via `is_appointed`, which stays FALSE per
  the A4 STATE_EXEC-only convention).
- **Jackie Craig NOT seeded (RESEARCH Pitfall 3, confirmed live):** former councilmember 2020–2024, did
  not seek re-election in 2024, now a **2026 write-in challenger** (cornerstonerepublic.news headline
  "Former Marana Councilwoman… Announces Write-In Candidacy"; her own jackieforcouncil.com labels her a
  write-in). She is not a current officeholder. A stale WebSearch/article summary that lumped her in as
  "sitting" was verified against multiple sources and rejected.

**Seat-title / Vice-Mayor convention confirmed:** Marana elects at-large + nonpartisan with no formal
seat numbering → plain `'Council Member'` (Torrance shape), not `'(Position N)'`. Roxanne Ziegler
confirmed as sitting Vice Mayor → modeled as a title annotation on her -4013002 seat.

## Verification (Task 3 — orchestrator-run, all green)

- Combined boolean assertion returned `t` (gov=1 @ 0444270; 7 offices under Town Council = 1 LOCAL_EXEC +
  6 LOCAL on the two G4110/az districts; party NULL & is_appointed=false on all 7; exactly 1
  `(Vice Mayor)` office and it is Ziegler's -4013002 seat).
- Ledger: `schema_migrations` count for `'1345'` = 1.
- Section-split: 0 offices leaked under a non-Marana government.

## Deviations
None. Disk MAX confirmed 1344 at execute time → structural = 1345, no drift from RESEARCH. (Executor
note: the Task 1 verify grep forbids the former-member's name even inside comments, so the header
describes her without naming her — a known cross-phase gotcha.)

## Next
Plans 02 (headshots) and 03 (stances) consume the 7 UUIDs above. Roster is current-sitting-7; source the
confirmed sitting member for every seat (never Jackie Craig).
