---
phase: 192
slug: arizona-legislature-seed-headshots
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-08
---

# Phase 192 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a DB data-seeding phase — validation is SQL/HTTP-based (psql + curl against
> production), not an automated unit-test suite (same model as NV 160 and AZ 191).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual SQL/HTTP verification via `psql` + `curl` (no automated test suite for DB-seeding phases) |
| **Config file** | none — `DATABASE_URL` in `C:/EV-Accounts/backend/.env`; psql at `C:/Program Files/PostgreSQL/18/bin/psql` (PostgreSQL 18.1) |
| **Quick run command** | `psql "$DATABASE_URL" -tAc "<per-task assertion>"` |
| **Full suite command** | The verification-plan audit block (6+ assertions) + section-split query for STATE_UPPER/STATE_LOWER |
| **Estimated runtime** | ~5 seconds (single psql round-trip) |

---

## Sampling Rate

- **After every task commit:** Run that task's `<automated>` psql/HTTP assertion.
- **After every plan wave:** Re-run the section-split query for STATE_UPPER + STATE_LOWER at `state='az'` (must stay 0).
- **Before phase close (`/gsd:verify-work`):** Full verification audit must be all-green.
- **Max feedback latency:** ~5 seconds.

---

## Per-Task Verification Map

> Task IDs below are plan-level anchors keyed to Phase 192's requirement AZ-LEG-01. The
> executor binds each to a concrete task ID once the planner emits the PLAN.md files; the
> assertion shape is fixed here (copied from RESEARCH.md § Validation Architecture → Test Map).

| Anchor | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|--------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| seed-senate | 1 | AZ-LEG-01 | T-192-01 | Guarded INSERT keyed on `(district_id, politician_id)`; scoped to State Senate chamber @ `geo_id='04'` | sql | `psql -tAc "SELECT count(*) FROM essentials.offices o JOIN essentials.chambers c ON c.id=o.chamber_id WHERE c.name='State Senate'"` → 30 | ⬜ pending |
| seed-house | 1 | AZ-LEG-01 | T-192-01 / T-192-02 | Two undifferentiated House offices per SLDL district; guard on `(district_id, politician_id)` NOT `(district_id, chamber_id)` (2nd rep must not silently no-op) | sql | `... House offices GROUP BY district_id HAVING count(*) <> 2` → 0 rows AND total = 60 | ⬜ pending |
| district-linkage | 1 | AZ-LEG-01 | T-192-02 | Every office↔district WHERE includes `district_type` (SLDU/SLDL share geo_id space); lowercase `state='az'` | sql | STATE_UPPER count = 30 AND STATE_LOWER count = 30, both `state='az'`, geo_id 04001..04030 | ⬜ pending |
| headshots | 1 | AZ-LEG-01 | T-192-03 / T-192-04 | 90/90 licensed headshots at 600×750; audit-only migration (unregistered); only CURRENT roster surnames fetched | sql+image+http | `politician_images` count = 90 for the AZ-leg ext_id block + PIL 600×750 dim assert + `curl -sI` CDN 200 spot-check | ⬜ pending |
| stances-zero | 2 | AZ-LEG-01 | T-192-05 | 0 compass stances present — deferred by design, verified absent | sql | `SELECT count(*) FROM inform.politician_answers WHERE politician_id IN (<90 AZ-leg ids>)` → 0 | ⬜ pending |
| section-split | 2 | AZ-LEG-01 | T-192-01 | No office attaches under a non-AZ chamber; no cross-state leak | sql | STATE_UPPER/STATE_LOWER OR-direction split query (190-02 Gate 7 shape) → 0 rows | ⬜ pending |
| human-identity | 2 | AZ-LEG-01 | T-192-06 | Photo depicts the RIGHT current member (row-count cannot detect wrong-but-present image) | manual | checkpoint:human-verify — live browse link + spot-check incl. the 3 mid-term appointees | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*None — this is a DB seeding phase with no test files to create. Existing psql infrastructure
(`DATABASE_URL` + PostgreSQL 18.1) + `curl` cover all phase requirements. The seed plan's
pre-check gate (ext_id block free, migration MAX on-disk, greenfield legislature) substitutes
for a Wave 0 scaffold.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshot identity is the RIGHT current member (not a departed member or wrong-person image) | AZ-LEG-01 | A DB row-count confirms an image EXISTS but cannot confirm WHO it depicts; azleg.gov still hosts 3 confirmed-departed filenames (CHAPLIK/MARSHALL/BURCH) | Verification plan: visual spot-check at a live browse link + a sample incl. the 3 mid-term appointee successions (Sears SD-9, Reim HD-3, Allen HD-7) |
| A resident in LD-N sees 1 senator + 2 representatives, all labeled District N | AZ-LEG-01 | Address→jurisdiction rendering is UI-resolved, not a raw DB assertion | Verification plan: CD smoke address in a known LD returns the senator + both reps, correctly labeled |
| Operator-supplied headshot (only if a member is truly unsourceable) | AZ-LEG-01 | If azleg.gov 404s a portrait and no Wikimedia/Ballotpedia fallback exists, needs an operator file (191 Presmyk precedent) | Pause at checkpoint; operator provides source or `photo_license='operator_supplied'` — research reports 90/90 sourceable, so not expected |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are the explicit human-verify checkpoint
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none — DB seeding phase; pre-check gate substitutes)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-08
