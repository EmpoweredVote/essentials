---
phase: 150
slug: downey-deep-seed
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-20
---

# Phase 150 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **This is a SQL data-seeding/reconcile phase** — there is no unit-test framework.
> Validation is performed via (a) idempotent in-migration DB assertions (`DO $$ ... RAISE EXCEPTION $$`)
> and (b) post-migration verification `SELECT` queries run against the live Supabase DB
> (`mcp__supabase-local__execute_sql`). This mirrors the proven 142–149 deep-seed approach.

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
- **After every plan wave:** Run the cross-wave integrity SELECT (bidirectional office↔politician links, one chamber, official_count=5)
- **Before `/gsd:verify-work`:** Wave-4 final reconciliation block must return all-green (5 council seats, 0 duplicate/stale office rows, 0 uncited/0 unpaired stances, split-section check = 0 rows)
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 150-01 (reconcile) | 01 | 1 | DWNY-01 | T-150-01 (idempotent guarded writes) | geo_id backfill guarded `WHERE geo_id IS NULL OR ''`; chamber merge asserts 0 offices before DELETE | DB assertion + SELECT | post-migration SELECT: gov geo_id='0619766', ONE chamber, 6 offices moved into survivor | ✅ | ⬜ pending |
| 150-02 (roster) | 02 | 2 | DWNY-01 | T-150-02 (unlink-not-delete) | departed members' office link nulled, politician+stance+photo rows KEPT | DB assertion + SELECT | SELECT: 5 districted council seats (D1–D5) + rotational Mayor title on Sosa/D2; official_count=5; bidirectional links | ✅ | ⬜ pending |
| 150-03 (headshots) | 03 | 3 | DWNY-01 | T-150-03 (identity-verified images) | no fabricated/wrong-person photos; honest gaps documented | manual verify + SELECT | operator in-browser download (WAF-403); SELECT politician_images for each current member; 600×750 | ❌ W0 (manual) | ⬜ pending |
| 150-04 (stances) | 04 | 4 | DWNY-01 | T-150-04 (evidence-only) | 100% citation; no defaulted/neutral values; NO judicial-* topics | DB assertion + SELECT | SELECT: 0 uncited (answers w/o context), 0 unpaired, 0 rows on inactive topics | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] No test-framework install required — SQL seeding phase
- [x] Wave-1 pre-flight STOP-on-drift SELECT serves as the validation harness baseline (re-confirms gov UUID, both chamber UUIDs, 6 offices + members/ext_ids, both link directions, At-Large row count, Trujillo `last_name='-'` defect, migration counters)

*Existing DB + MCP verification tooling covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshot identity + quality | DWNY-01 (SC 3) | WAF-403 blocks scripted fetch; portrait identity + no-superimposed-text + 4:5→600×750 require human eye | Operator downloads each portrait in-browser; verify it is the correct current member; crop 4:5 first → 600×750 Lanczos q90; blocking human-verify checkpoint |
| Form-of-government correctness | DWNY-01 (SC 2) | "Real form of government" must match official city site | Confirm rotational mayor (Sosa/D2) + 5 districts against downeyca.org before Wave-1 relabel commit |
| Stance evidence sufficiency | DWNY-01 (SC 4) | CHAIRS placement requires human judgment of evidence | Blocking human-verify checkpoint on stance reasoning + source URLs before apply |

---

## Validation Sign-Off

- [x] All tasks have automated verification (DB SELECT/assertion) or are flagged manual-only with instructions
- [x] Sampling continuity: every wave has a verification SELECT (no 3 consecutive unverified migrations)
- [x] Wave 0 covers all MISSING references (pre-flight SELECT baseline)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-20
