---
phase: 152
slug: west-covina-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-21
---

# Phase 152 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **This is a SQL data-seeding/reconcile phase** — there is no unit-test framework.
> Validation is performed via (a) idempotent in-migration DB assertions (`DO $$ ... RAISE EXCEPTION $$`)
> and (b) post-migration verification `SELECT` queries run against the live Supabase DB
> (`mcp__supabase-local__execute_sql`). This mirrors the proven 142–151 deep-seed approach.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — DB assertion gates + verification SELECTs (no unit-test runner for SQL seeding) |
| **Config file** | none |
| **Quick run command** | `mcp__supabase-local__execute_sql` per-wave verification SELECT (see Per-Task map) |
| **Full suite command** | Wave-4 final reconciliation SELECT block (roster count, link integrity, 0-uncited/0-unpaired stance checks, split-section check) |
| **Estimated runtime** | ~5 seconds per verification query |

---

## Sampling Rate

- **After every migration applied:** Run that wave's verification SELECT; confirm expected row counts + 0 drift
- **After every plan wave:** Run the cross-wave integrity SELECT (bidirectional office↔politician links for all 5 seats, ONE chamber, official_count=5)
- **Before `/gsd:verify-work`:** Wave-4 final reconciliation block must return all-green (5 districted council seats D1–D5 = 5 offices total, council chamber official_count=5, 0 duplicate/stale office rows, distinct district_id per seat — no shared At-Large UUID, 0 uncited/0 unpaired stances, split-section check = 0 rows)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 152-01 (reconcile) | 01 | 1 | WCOV-01 | T-152-01 (idempotent guarded writes) | geo_id backfill guarded `WHERE geo_id IS NULL OR ''`; dual-chamber merge asserts 0 offices before DELETE of doomed chamber `b1a2c4cb`; one-directional links (Diaz, Gutierrez) repaired to bidirectional | DB assertion + SELECT | post-migration SELECT: gov `1982a9fa` geo_id='0684200', ONE chamber (survivor `12c9360a`), all 5 offices moved into survivor, all 5 `politicians.office_id` ↔ `offices.politician_id` consistent | ✅ | ⬜ pending |
| 152-02 (roster + by-district relabel) | 02 | 2 | WCOV-01 | T-152-02 (verified relabel; unlink-not-delete) | 5 existing At-Large rows relabeled to D1–D5 by RESEARCH-confirmed per-person mapping (D1 Gutierrez, D2 Lopez-Viado=Mayor, D3 Diaz, D4 Cantos=MPT, D5 Wu); rotational Mayor recorded as a title on D2, NOT a separate office; any departed member office-link nulled both directions, politician+stance+photo KEPT | DB assertion + SELECT | SELECT: 5 districted seats D1–D5 = 5 offices; each office a DISTINCT district_id (no shared At-Large UUID); council chamber official_count=5; bidirectional links | ✅ | ⬜ pending |
| 152-03 (headshots) | 03 | 3 | WCOV-01 | T-152-03 (identity-verified images) | no fabricated/wrong-person photos; honest gaps documented; low-res city thumbnails upscaled or replaced by higher-res fallback | manual verify + SELECT | direct curl `westcovina.gov/ImageRepository/Document?documentID=NNNN` (no WAF; capital-D `documentID`); SELECT politician_images per current member; 600×750 4:5 | ❌ W0 (manual checkpoint) | ⬜ pending |
| 152-04 (stances) | 04 | 4 | WCOV-01 | T-152-04 (evidence-only) | 100% citation; no defaulted/neutral values; NO judicial-* topics | DB assertion + SELECT | SELECT: 0 uncited (answers w/o context), 0 unpaired, 0 rows on inactive topics | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] No test-framework install required — SQL seeding phase
- [x] Wave-1 pre-flight STOP-on-drift SELECT serves as the validation harness baseline (re-confirms gov UUID `1982a9fa`, both 'City Council' chamber UUIDs `12c9360a`/`b1a2c4cb`, the 5 existing offices + members/ext_ids, both link directions, **whether the 5 At-Large offices share one district_id or have distinct rows** (Pomona/Torrance shared-district defect check — JOIN before relabel), and the live `schema_migrations` MAX + on-disk file MAX before numbering)

*Existing DB + MCP verification tooling covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshot identity + quality | WCOV-01 (SC 3) | Portrait identity + no-superimposed-text + 4:5→600×750 require human eye | Verify each of the 5 portraits is the correct current member; city thumbnails are low-res (4–7 KB; Wu 147×190 PNG) — upscale or prefer high-res fallback (Cantos via RespectAbility); crop 4:5 first → 600×750 Lanczos q90; blocking human-verify checkpoint |
| Form-of-government correctness | WCOV-01 (SC 2) | "Real form of government" must match official city site | **RESEARCH-CONFIRMED by-district (Ord. 2310 Jan 2017 + *Sanchez v. City of West Covina* CVRA settlement; first district elections Nov 2018): 5 districts D1–D5, rotational council-selected Mayor (NO separate mayor office — opposite of El Monte).** Re-confirm Wave-2 per-person district mapping + current Mayor against westcovina.gov/177 before relabel commit |
| Stance evidence sufficiency | WCOV-01 (SC 4) | CHAIRS placement requires human judgment of evidence | Blocking human-verify checkpoint on stance reasoning + source URLs before apply; Wu/Cantos richer record, Diaz/Gutierrez (elected Nov 2024) thinner — honest blanks expected |

---

## Validation Sign-Off

- [x] All tasks have automated verification (DB SELECT/assertion) or are flagged manual-only with instructions
- [x] Sampling continuity: every wave has a verification SELECT (no 3 consecutive unverified migrations)
- [x] Wave 0 covers all MISSING references (pre-flight SELECT baseline incl. shared-district JOIN)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-21
