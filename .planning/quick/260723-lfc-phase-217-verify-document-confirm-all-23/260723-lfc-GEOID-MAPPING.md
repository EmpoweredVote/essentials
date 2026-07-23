# Phase 217 — Corrected geo_id Mapping & 5-City Follow-Up Log

**Verified:** 2026-07-23
**Scope:** Verify + document only. No `src/` edits, no migrations, no DB writes.

## 1. Corrected geo_id mapping (all 5 previously-flagged cities)

`coverage.js` (`COVERAGE_STATES` Texas block, `src/lib/coverage.js`) **already carries
the corrected geo_ids** for all 5 previously-flagged cities. The phantom `4863000`-style
codes that the roadmap/REQUIREMENTS premise cited do not appear anywhere in current
`src` — `Landing.jsx` §`handleAreaClick` reads the browse geo_id solely from
`coverage.js`; there is no second hardcoded Collin list carrying stale codes.

| City label | Current `coverage.js` geo_id | Resolved government | Seated count | Phantom code (never in current `src`) |
|---|---|---|---|---|
| Plano | `4858016` | City of Plano | 8 | `4863000` |
| Richardson | `4861796` | City of Richardson | 7 | `4863500` |
| Prosper | `4859696` | Town of Prosper | 7 (6 confirmed on this live pull — see §2 note) | `4863276` |
| Princeton | `4859576` | City of Princeton | 7 | `4863432` |
| Van Alstyne | `4874924` | City of Van Alstyne | 5 | `4875960` |

All **24** Texas `coverage.js` entries (23 Collin County governments + Longview) resolve
to a real `essentials.governments` row in production — this was confirmed during the
2026-07-23 discuss session (per `217-CONTEXT.md` canonical_refs) and re-confirmed live in
§2 below for the 5 previously-flagged cities specifically.

## 2. Live browse spot-check (read-only, 2026-07-23)

Read-only GET/POST spot-check performed against the live production stack — no
localStorage mutation, no seeding, no writes. Two evidence layers were captured per
city:

**(a) SPA shell — `GET /results?browse_government_list=<geo_id>&browse_label=<City>&browse_state=TX`:**

| City | Live browse URL | HTTP |
|---|---|---|
| Plano | https://essentials.empowered.vote/results?browse_government_list=4858016&browse_label=Plano&browse_state=TX | 200 |
| Richardson | https://essentials.empowered.vote/results?browse_government_list=4861796&browse_label=Richardson&browse_state=TX | 200 |
| Prosper | https://essentials.empowered.vote/results?browse_government_list=4859696&browse_label=Prosper&browse_state=TX | 200 |
| Princeton | https://essentials.empowered.vote/results?browse_government_list=4859576&browse_label=Princeton&browse_state=TX | 200 |
| Van Alstyne | https://essentials.empowered.vote/results?browse_government_list=4874924&browse_label=Van+Alstyne&browse_state=TX | 200 |

**(b) Backend endpoint — `POST /api/essentials/browse/by-government-list` on
`accounts-api.empowered.vote`, `{"government_geo_ids":["<geo_id>"]}` (this is the
strongest evidence tier: actual seated officials returned, not just SPA shell load):**

| City | Officials returned for this government | Sample officeholder confirmed |
|---|---|---|
| Plano (4858016) | 8 | Council Member Place 4 — Chris Krupa Downs |
| Richardson (4861796) | 7 | Council Member District 1 — Curtis Dorian |
| Prosper (4859696) | 6 | Mayor — David F. Bristol; Council Members Place 1/2/3/4/6 |
| Princeton (4859576) | 7 | Mayor — Eugene Escobar Jr. |
| Van Alstyne (4874924) | 5 | Council Member Place 1 — Ryan Neal |

**Resolution result per city:** All 5 cities render a working browse page (HTTP 200
SPA shell) **and** resolve to a real government returning seated officials via the
backend browse endpoint — the strongest tier of live evidence, live HTTP, not a
217-CONTEXT.md fallback. All 5 flagged cities are confirmed WORKING in production.

**Note on Prosper count:** this live pull returned 6 seated Council/Mayor officials for
Town of Prosper, one below the 7 recorded in `217-CONTEXT.md`'s canonical_refs /
specifics table (7 offices, 0 vacant as of the same 2026-07-23 discuss session). Only
"Council Member Place 5" is absent from this pull's result set — all other 6 places
(Mayor + Places 1/2/3/4/6) match. This is a 1-seat delta on a non-blocking data point;
it does not affect the core finding that Prosper resolves to a real government with a
seated roster (6 of 7 confirmed live, matching city label → geo_id → government
correctly). Logged below as a completeness note, not fixed in this plan (per D-04).

## 3. 5-city completeness follow-up log (log-not-absorb, per D-04 — NOT fixed here)

Reproduced from `217-CONTEXT.md` specifics (production DB, 2026-07-23):

| City | offices | vacant | races | web_form_url | email gaps |
|---|---|---|---|---|---|
| Plano | 9 | 1 | 0 | 0/8 | — |
| Richardson | 7 | 0 | 0 | 0/7 | — |
| Prosper | 7 | 0 | 2 | 0/7 | 0 emails |
| Princeton | 8 | 1 | 1 | 0/7 | 0 emails |
| Van Alstyne | 7 | 2 | 0 | 0/5 | 0 emails |

**Explicit follow-up items (documented only, not fixed in Phase 217 / this quick task):**

- **Vacant offices (4 total):** Plano 1, Princeton 1, Van Alstyne 2.
- **Zero-race cities (3 total):** Plano, Richardson, Van Alstyne.
- **`web_form_url` empty across all 5** flagged cities.
- **Missing emails** in Prosper, Princeton, Van Alstyne.
- `valid_to` is populated for all seated officials in these 5 governments (no gap).

These 5 governments (Plano, Richardson, Prosper, Princeton, Van Alstyne) are **outside
the shared 18-government set** that Phases 218 (Vacancies & Missing People), 219
(Elections & Candidates Backfill), and 220 (Contact Data Backfill) operate on. They are
candidates for a follow-up phase or a scoped extension of 218/219/220 to include these
5 disjoint governments — not addressed here per D-04 ("log as follow-ups" over "fix now
in 217").

## 4. Roadmap reconciliation note

Phase 217's ROADMAP.md success criteria (browse-reconcile for the 5 flagged cities) are
satisfied by this quick task's verification + documentation. `ROADMAP.md` itself is NOT
edited by this quick task (per constraints) — the operator should reconcile Phase 217's
status in `ROADMAP.md` at milestone close or via the phase-completion workflow.

## 5. Live browse links (for operator confirmation)

- Plano: https://essentials.empowered.vote/results?browse_government_list=4858016&browse_label=Plano&browse_state=TX
- Richardson: https://essentials.empowered.vote/results?browse_government_list=4861796&browse_label=Richardson&browse_state=TX
- Prosper: https://essentials.empowered.vote/results?browse_government_list=4859696&browse_label=Prosper&browse_state=TX
- Princeton: https://essentials.empowered.vote/results?browse_government_list=4859576&browse_label=Princeton&browse_state=TX
- Van Alstyne: https://essentials.empowered.vote/results?browse_government_list=4874924&browse_label=Van+Alstyne&browse_state=TX
