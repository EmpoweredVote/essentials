---
phase: 144
slug: glendale-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 144 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This phase ships DB migrations + headshot uploads + evidence-only stances — there is no
> unit-test framework. Validation is **SQL verification queries** against the live Supabase
> Postgres DB (via `mcp__supabase-local__execute_sql` or `psql -f` using
> `C:/EV-Accounts/backend/.env` `DATABASE_URL`), plus manual render spot-checks.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL verification queries (no JS/py test runner applies) |
| **Config file** | none — queries run via MCP `execute_sql` or `psql -f` |
| **Quick run command** | `mcp__supabase-local__execute_sql` (per-migration post-checks) |
| **Full suite command** | Roster + headshot + stance coverage queries for gov `a7433437-341a-48e7-907e-a61318954f0a` |
| **Estimated runtime** | ~seconds per query |

---

## Sampling Rate

- **After every migration:** Run the migration's post-verification query (row counts, no NULLs, no duplicate chamber names, no orphan offices)
- **After the structure wave:** Verify gov `geo_id=0630000`; exactly ONE `'City Council'` chamber remains (empty duplicate `c019a553` `-200687` deleted); survivor `771727ec` (`10450`) holds 5 offices; Kassakhian (`686339`) office title flags `Mayor`; run `feedback_section_split_check` query (0 rows for Glendale)
- **After the roster wave:** Najarian (`-700100`) retired (`office_id NULL, is_incumbent=false, is_active=false`); Bartrosouf (`-700101`) seated in `771727ec` (subject to certification gate); active members in survivor chamber = 5
- **Before `/gsd:verify-work`:** Full roster (5 current councilmembers) seated, Kassakhian flagged Mayor; headshots present-or-documented; stance coverage complete with 100% citation and honest blanks
- **Max feedback latency:** seconds (interactive SQL)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 144-01-01 | 01 | 1 | GLEN-01 | — | N/A (read-only verification) | sql | `SELECT geo_id FROM essentials.governments WHERE id='a7433437-...'` returns `0630000` | ✅ | ⬜ pending |
| 144-01-02 | 01 | 1 | GLEN-01 | — | N/A | sql | Empty duplicate chamber `c019a553` (`-200687`) deleted (asserted 0 offices first); exactly 1 `'City Council'` chamber (`10450` / `771727ec`) remains; split-section check returns 0 rows for Glendale | ✅ | ⬜ pending |
| 144-01-03 | 01 | 1 | GLEN-01 | — | N/A | sql | Kassakhian (`686339`) office `b1c10c09` title = `'Mayor'`; other 4 seats title = `'Councilmember'` | ✅ | ⬜ pending |
| 144-02-01 | 02 | 2 | GLEN-01 | — | N/A | sql | Najarian (`-700100`) `office_id IS NULL AND is_incumbent=false AND is_active=false` (retired, not deleted) | ✅ | ⬜ pending |
| 144-02-02 | 02 | 2 | GLEN-01 | — | N/A | sql | Bartrosouf (`-700101`) seated in `771727ec`, `is_active=true, is_incumbent=true` (after certification gate); active members in survivor chamber = 5; no duplicate person rows | ✅ | ⬜ pending |
| 144-03-01 | 03 | 3 | GLEN-01 | — | N/A | sql | `politician_images` exactly 1 `type='default'` per current member; Brotman sourced; Gharpetian re-sourced off `scraped_no_license`/old path to canonical `{uuid}-headshot.jpg` `press_use` 600×750; Najarian/Bartrosouf present-or-documented | ✅ | ⬜ pending |
| 144-04-01 | 04 | 4 | GLEN-01 | — | N/A | sql | `inform.politician_answers` rows > 0 for each member with a findable record; paired `politician_context` (100% citation); no judicial topic_ids; no retired/non-live topic_ids; blanks honest; no defaults | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · Task IDs are indicative — finalize against PLAN.md.*

---

## Wave 0 Requirements

- Existing DB + MCP/psql access covers all phase verification. No test framework install required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Roster currency (the 5 seated are the CURRENT post-June-2-election council; Najarian excluded, Bartrosouf included) | GLEN-01 | Requires cross-check vs glendaleca.gov + LA County certification | Confirm 5 members against the live city-council page; confirm Najarian departed; confirm Bartrosouf result at lavote.gov (certified June 26) |
| Bartrosouf certification gate | GLEN-01 | Results uncertified until 2026-06-26 | Executor confirms final/certified LA County result before applying the Bartrosouf INSERT |
| Stance evidence quality (every value cites a real public-record source; no defaulted values; Armenian/Artsakh resolutions left as EXTRA/blank, not forced) | GLEN-01 | Evidence judgment can't be automated | Spot-check each `politician_answers` row has a citation; confirm blank spokes where record is silent |
| Headshot correctness (right person, 600×750, no superimposed text, no stretch) | GLEN-01 | Visual check + glendaleca.gov WAF (Akamai 403) blocks automation | `checkpoint:human-verify` for Brotman + Gharpetian (browser download); confirm crop/quality |
| Browse render spot-check (roster + photos display) | GLEN-01 | UI render | Load a Glendale address in the app; confirm roster + photos appear (existing browse/compass UI, no frontend change) |

---

## Validation Sign-Off

- [ ] Every migration has a post-verification SQL check
- [ ] Structure wave passes `feedback_section_split_check` (one chamber, no split sections, no orphan offices)
- [ ] Najarian retired (detached, not deleted); Bartrosouf seated after certification gate; roster complete: 5 current councilmembers seated and linked
- [ ] Kassakhian flagged Mayor; no separate LOCAL_EXEC row
- [ ] Headshots: 1 `type='default'` per member or documented gap; Gharpetian off bad-license path
- [ ] Stances: full coverage with 100% citation, honest blanks, no defaults, no judicial topics
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
