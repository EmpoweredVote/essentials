---
phase: 176
slug: city-of-beaverton-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 176 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **data deep-seed** phase — validation is via **SQL audit gates run over the live DB**
> (psql against C:/EV-Accounts/backend/.env DATABASE_URL), not a unit-test framework.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL audit queries (psql) + backend `/representatives/me` PIP check |
| **Config file** | C:/EV-Accounts/backend/.env (DATABASE_URL) — orchestrator applies + audits; executor has NO DB |
| **Quick run command** | `psql "$DATABASE_URL" -f <audit>.sql` (section-split scan, roster count, headshot/stance coverage) |
| **Full suite command** | Section-split scan (0 rows) + roster=7 + headshot coverage + stance evidence audit + coverage.js build |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every structural migration:** run the in-migration DO-block gates (gov + chamber + 7 offices + 0 section-split)
- **After headshot migration:** run headshot coverage audit (rows in politician_images for all 7)
- **After each stance migration:** verify ON CONFLICT upsert count + 100%-cited (no NULL/default values)
- **Before verify:** section-split scan returns 0 rows; a real Beaverton address resolves Mayor + correct council roster via `/representatives/me`
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 176-01-* | 01 | 0 | WASH-02 | — | Wave-0 DB probes confirm ext_id block free + migration MAX + no duplicate Beaverton gov | audit | `psql "$DATABASE_URL" -f probe.sql` | ❌ W0 | ⬜ pending |
| 176-02-* | 02 | 1 | WASH-02 | T-176-01 | Idempotent seed (WHERE NOT EXISTS on gov; office guard on (district_id, politician_id)); 0 section-split | audit | `psql "$DATABASE_URL" -f seed_gates.sql` | ❌ W0 | ⬜ pending |
| 176-03-* | 03 | 2 | WASH-02 | — | All 7 officials have a 600×750 image row; genuine gaps documented | audit | `psql "$DATABASE_URL" -c "SELECT ... FROM essentials.politician_images"` | ❌ W0 | ⬜ pending |
| 176-04-* | 04 | 2 | WASH-02 | — | Stances 100% cited; ZERO default/neutral values; topic_id resolved via is_live JOIN | audit | `psql "$DATABASE_URL" -f stance_audit.sql` | ❌ W0 | ⬜ pending |
| 176-05-* | 05 | 3 | WASH-02 | — | Beaverton row present in coverage.js OR block, hasContext:true; prod build passes | build | `npm run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] DB probe: confirm no existing Beaverton city government (avoid duplicate seed)
- [ ] DB probe: confirm ext_id block -4105351..-4105357 is unused (no collision)
- [ ] DB probe: confirm migration ledger MAX + disk MAX (expected next = 1131) agree
- [ ] DB probe: confirm city geo_id 4105350 geofence exists + exact state casing for office/district linkage
- [ ] DB probe: confirm Position 1 councilor (Hartmeier-Prigg) has not vacated early (2026 runoff timing)
- [ ] Resolve live compass topic_key list (is_live=true) for stance ingestion

*Existing OR TIGER city geofence (4105350) and inform/essentials schema cover all infrastructure — no new framework install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A real Beaverton address returns Mayor Beaty + all 6 at-large councilors, no empty LOCAL section | WASH-02 | Requires geocoding a live address through the PIP resolver | Browse essentials.empowered.vote/results?browse_geo_id=4105350&browse_mtfcc=G4110 and/or enter a Beaverton address |
| Headshots render at 600×750 with no text/graphic overlays | WASH-02 | Visual inspection of mirrored Storage images | Open each official's profile; confirm crop/quality |
| Party never displays (antipartisan) | WASH-02 | Visual inspection | Confirm no party label on any Beaverton profile |

---

## Validation Sign-Off

- [ ] All tasks have an automated audit gate or Wave 0 dependency
- [ ] Sampling continuity: every migration followed by an audit
- [ ] Wave 0 covers all DB probes before any write
- [ ] Section-split scan returns 0 rows
- [ ] `nyquist_compliant: true` set in frontmatter (after planner finalizes task IDs)

**Approval:** pending
