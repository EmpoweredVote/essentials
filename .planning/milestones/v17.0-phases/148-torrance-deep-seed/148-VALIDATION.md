---
phase: 148
slug: torrance-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-20
---

# Phase 148 — Validation Strategy

> Per-phase validation contract. DB-migration phase — no unit-test runner. Validation is **SQL verification
> queries** against the live Supabase Postgres DB (via `mcp__supabase-local__execute_sql`), plus manual render
> spot-checks. ROSTER DECISION (user, 2026-06-20): seat the **CURRENTLY-SEATED** council (Mayor George Chen +
> 6 council), NOT the unofficial June-2026 winners — a later update handles post-certification turnover.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL verification queries (no JS/py test runner) |
| **Quick run** | `mcp__supabase-local__execute_sql` (per-migration post-checks) |
| **Full suite** | Roster + headshot + stance coverage for the Torrance gov `b3e97e65-2b89-4594-b38e-65c531fa801c` (geo_id `0680000` after backfill), survivor chamber `f6fcb0ba-bc72-4176-9ca3-dc6c9973301d` |
| **Runtime** | ~seconds per query |

---

## Sampling Rate
- After every task commit: run that task's post-check query.
- After every wave: run the full roster/headshot/stance coverage set.
- Before close: directly-elected Mayor + 6 council = 7 seated; geo_id set; one surviving City Council chamber; split-check 0; Brigitte-Lewis duplicate gone; all back-pointers consistent.

---

## Per-Task Verification Map

> Torrance facts confirmed live 2026-06-20. AT-LARGE city (districts labeled 'At-Large' + 'Torrance Mayor' LOCAL_EXEC) — NOT by-district. Planner finalizes exact SQL.

| Task | Wave | Requirement | SQL assertion (gist) | Status |
|------|------|-------------|----------------------|--------|
| 148-01-* | 1 | TORR-01 | geo_id `0680000` set on gov `b3e97e65` (guarded IS NULL); **Brigitte Lewis -201101** typo-dup (office `bf157ee7` + politician `7f74014f`) DELETED (NOT moved — Bridgett Lewis `683366` is the real one, kept); remaining 3 doomed-chamber offices (Chen/Mayor `c5b5b1b3`, Mattucci `220e2cb5`, Sheikh `0542b22b`) moved into survivor `f6fcb0ba`; shared At-Large district `84e45ab7` resolved so each moved council office has its own At-Large row; doomed chamber `2583b565` asserted empty then DELETED; split-check 0 rows; migration 936 | ⬜ |
| 148-02-* | 2 | TORR-01 | broken `politicians.office_id = NULL` repaired for Chen `-201036`/Mattucci `-201103`/Sheikh `-201102` (survivor members Gerson/Kaji/Kalani/Bridgett-Lewis already linked); directly-elected Mayor Chen reused on 'Torrance Mayor' LOCAL_EXEC `a99b86b0` (title 'Mayor'); survivor `official_count`=7; all 7 active w/ consistent bidirectional links; migration 937 | ⬜ |
| 148-03-* | 3 | TORR-01 | each of 7 current members 1 `type='default'` 600×750 image at canonical `{uuid}-headshot.jpg`; torranceca.gov has NO WAF → curl directly (Kaji/Kalani have showpublishedimage source URLs; Mattucci/Sheikh already imaged; Chen reprocess from old `/default.jpeg` path; Gerson/Bridgett-Lewis source from city site); honest gaps documented; audit-only | ⬜ |
| 148-04-* | 4 | TORR-01 | evidence-only stances, 100% citation (paired answers+context), no judicial topics (appointed City Attorney), no retired topic_ids, no defaults; Torrance Watch + OneMeeting (primegov) evidence; one agent at a time; audit-only | ⬜ |

---

## Wave 0 Requirements
Existing infrastructure covers all requirements — no test framework to install. Pre-flight SELECTs (re-confirm both chambers + offices, the Brigitte/Bridgett duplicate, the shared At-Large district `84e45ab7`, the 4 NULL back-pointers, current roster) run before Wave 1 writes and **STOP on drift**.

---

## Manual-Only Verifications

| Behavior | Why Manual | Instructions |
|----------|------------|--------------|
| Roster currency | June-2026 election certifies June 26 — per user, seat CURRENT council, not incoming winners | Confirm Chen still seated Mayor + Gerson/Kaji/Kalani/Bridgett-Lewis/Mattucci/Sheikh current at apply time |
| Brigitte≠Bridgett dedup | Typo-duplicate, not two people | Confirm `-201101` "Brigitte Lewis" is the dup to delete and `683366` "Bridgett Lewis" is the kept real member |
| Headshot identity | torranceca.gov no WAF | Visually confirm each portrait is the correct person, no overlay, 4:5 600×750, before/after upload |
| Compass render | Visual | Load Torrance browse/compass view; 7 members render w/ photos + non-defaulted stances, no duplicate/stale rows |

---

## Validation Sign-Off
- [ ] All tasks have a SQL verify or documented manual-only entry
- [ ] Wave 0 pre-flight covers existence + drift-stop
- [ ] `nyquist_compliant: true` set when finalized

**Approval:** pending
