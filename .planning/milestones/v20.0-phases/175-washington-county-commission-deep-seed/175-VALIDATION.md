---
phase: 175
slug: washington-county-commission-deep-seed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-30
---

# Phase 175 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a backend/data deep-seed: verification is **DB-state assertion via `psql` queries**
> against the live EV-Accounts Postgres, not a unit-test framework.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `psql` DB-verification queries (read-only SELECTs) against EV-Accounts Postgres |
| **Config file** | `C:/EV-Accounts/backend/.env` (`DATABASE_URL`) |
| **Quick run command** | `psql "$DATABASE_URL" -f <verify-query>.sql` (per-gate SELECT) |
| **Full suite command** | Run all phase DB gates: government row, roster count, geofence routing, section-split scan, headshot count, stance citation/unpaired/inactive scans |
| **Estimated runtime** | ~5–15 seconds per gate |

---

## Sampling Rate

- **After every migration applied (`psql -f`):** Run that migration's in-DO-block gate output + a targeted SELECT confirming the rows landed.
- **After the structural migration wave:** Run the section-split scan (must = 0 rows) + roster-count check (5 offices: Chair + D1–D4) + geofence routing probe (a WashCo address returns Chair + exactly 1 commissioner).
- **Before phase verification:** All DB gates green; stance scans (0 uncited, 0 unpaired, 0 inactive-topic) pass.
- **Max feedback latency:** ~15 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 175-01-* | 01 | 1 | WASH-01 | — / — | Standalone county govt + 5 offices exist; 0 section-split | db-assert | `psql "$DATABASE_URL" -c "<gov+roster+split scan>"` | ❌ W0 (planner defines) | ⬜ pending |
| 175-0X-* | 0X | 2 | WASH-01 | — / — | 4 per-district geofences (X0018, COMMDIST 1–4) loaded; address returns Chair + 1 commissioner | db-assert | `psql "$DATABASE_URL" -c "<routing + geofence count>"` | ❌ W0 | ⬜ pending |
| 175-0X-* | 0X | 3 | WASH-01 | — / — | Headshots present (600×750); stances 100% cited, 0 unpaired, 0 inactive | db-assert | `psql "$DATABASE_URL" -c "<headshot + stance scans>"` | ❌ W0 | ⬜ pending |

*Exact task IDs, plan splits, and SQL assertions are defined by the planner. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Confirm DB ledger MAX migration number (`schema_migrations`) → next file number (est. 1118).
- [ ] Verify/establish COUNTY district row for geo_id `41067` (state `'or'` lowercase — uppercase silently zero-matches routing).
- [ ] Confirm external_id block -410100 / -410110..-410113 is unused (no collision).
- [ ] Confirm X0018 is the next unused custom mtfcc (X0017 highest used).
- [ ] Confirm `https://gispub.co.washington.or.us/server/rest/services/BOC_CAO/CoCommissioners/FeatureServer/0` returns GeoJSON (4 polygons, `COMMDIST` 1–4, SR 4326).

*Wave 0 establishes DB facts; no test-framework install needed (DB-assertion model).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Commissioner profiles render with headshots + compass stances | WASH-01 | Frontend render not assertable from DB alone | Open `essentials.empowered.vote/results?browse_government_list=41067&browse_skip_overlap=1` (or county browse link); confirm Chair-first ordering + populated compass |
| Purple `hasContext` chip surfaces for Washington County, OR | WASH-01 | Visual surfacing in coverage.js → UI | Confirm `'Washington County, OR'` chip appears (label disambiguated from Utah's `'Washington County'`) |
| Per-district routing returns the correct single commissioner | WASH-01 | Requires PIP against live geofence + real addresses | Enter 2–3 distinct WashCo addresses in different districts; confirm each returns Chair + its one matched commissioner, no section-split |

---

## Validation Sign-Off

- [ ] All tasks have a DB-assertion verify or Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated (DB) verify
- [ ] Wave 0 covers all MISSING references (DB facts above)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
