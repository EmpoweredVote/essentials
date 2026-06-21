---
phase: 151
slug: el-monte-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-21
---

# Phase 151 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **This is a SQL data-seeding/reconcile phase** — there is no unit-test framework.
> Validation is performed via (a) idempotent in-migration DB assertions (`DO $$ ... RAISE EXCEPTION $$`)
> and (b) post-migration verification `SELECT` queries run against the live Supabase DB
> (`mcp__supabase-local__execute_sql`). This mirrors the proven 142–150 deep-seed approach.

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
- **After every plan wave:** Run the cross-wave integrity SELECT (bidirectional office↔politician links, ONE chamber, official_count=7)
- **Before `/gsd:verify-work`:** Wave-4 final reconciliation block must return all-green (Mayor + 6 districted council seats D1–D6, 0 duplicate/stale office rows, 0 uncited/0 unpaired stances, split-section check = 0 rows)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 151-01 (reconcile) | 01 | 1 | ELMN-01 | T-151-01 (idempotent guarded writes) | geo_id backfill guarded `WHERE geo_id IS NULL OR ''`; dual-chamber merge asserts 0 offices before DELETE of doomed chamber | DB assertion + SELECT | post-migration SELECT: gov `f5fe3651` geo_id='0622230', ONE chamber, all offices moved into survivor | ✅ | ⬜ pending |
| 151-02 (roster + by-district) | 02 | 2 | ELMN-01 | T-151-02 (unlink-not-delete; verified relabel) | 5 existing council rows relabeled At-Large→D1–D5 by verified per-person mapping; D6 + Cortez created; Mayor (Ancona) untouched; any departed member office-link nulled, politician+stance+photo KEPT | DB assertion + SELECT | SELECT: Mayor + 6 districted seats (D1–D6); official_count=7; bidirectional links; Cortez ext_id present | ✅ | ⬜ pending |
| 151-03 (headshots) | 03 | 3 | ELMN-01 | T-151-03 (identity-verified images) | no fabricated/wrong-person photos; honest gaps documented | manual verify + SELECT | direct curl `ci.el-monte.ca.us/ImageRepository/Document?documentId=NNNN` (no WAF); SELECT politician_images per current member; 600×750 4:5 | ❌ W0 (manual checkpoint) | ⬜ pending |
| 151-04 (stances) | 04 | 4 | ELMN-01 | T-151-04 (evidence-only) | 100% citation; no defaulted/neutral values; NO judicial-* topics | DB assertion + SELECT | SELECT: 0 uncited (answers w/o context), 0 unpaired, 0 rows on inactive topics | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] No test-framework install required — SQL seeding phase
- [x] Wave-1 pre-flight STOP-on-drift SELECT serves as the validation harness baseline (re-confirms gov UUID, both 'City Council' chamber UUIDs, the 6 existing offices + members/ext_ids, both link directions, current district label rows, and the live `schema_migrations` MAX + on-disk MAX before numbering)

*Existing DB + MCP verification tooling covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshot identity + quality | ELMN-01 (SC 3) | Portrait identity + no-superimposed-text + 4:5→600×750 require human eye | Verify each of the 7 portraits is the correct current member; crop 4:5 first → 600×750 Lanczos q90; blocking human-verify checkpoint |
| Form-of-government correctness | ELMN-01 (SC 2) | "Real form of government" must match official city site | **RESEARCH-CONFIRMED by-district (Ord. 3010): 6 districts D1–D6 + directly-elected citywide Mayor.** Re-confirm Wave-1 per-person district mapping against ci.el-monte.ca.us before relabel commit |
| Stance evidence sufficiency | ELMN-01 (SC 4) | CHAIRS placement requires human judgment of evidence | Blocking human-verify checkpoint on stance reasoning + source URLs before apply |

---

## Validation Sign-Off

- [x] All tasks have automated verification (DB SELECT/assertion) or are flagged manual-only with instructions
- [x] Sampling continuity: every wave has a verification SELECT (no 3 consecutive unverified migrations)
- [x] Wave 0 covers all MISSING references (pre-flight SELECT baseline)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-21
