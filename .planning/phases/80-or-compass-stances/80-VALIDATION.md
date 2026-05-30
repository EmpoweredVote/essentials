---
phase: 80
slug: or-compass-stances
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 80 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual SQL (mcp__supabase-local) + curl spot-checks — no automated test framework for stance ingestion |
| **Config file** | none |
| **Quick run command** | `SELECT p.full_name, COUNT(pa.id) AS stances FROM essentials.politicians p LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id WHERE p.external_id IN (-4100001,-4100002,-4100003,-4100004,-4100005) GROUP BY p.full_name ORDER BY p.full_name` |
| **Full suite command** | Coverage summary query (see Per-Wave Sampling below) |
| **Estimated runtime** | ~5 seconds (SQL queries via mcp__supabase-local) |

---

## Sampling Rate

- **After every apply script run (per politician):** Run value-range check query
- **After every plan wave:** Run the per-wave sampling query for that wave's group
- **Before `/gsd-verify-work`:** Full coverage summary + browser compass render spot-check
- **Max feedback latency:** ~10 seconds (SQL queries return immediately)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 80-01 stance apply | 01 | 1 | SC-1 | — | N/A (data ingestion) | SQL | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON p.id=pa.politician_id WHERE p.external_id BETWEEN -4100005 AND -4100001` | ✅ | ⬜ pending |
| 80-02 stance apply | 02 | 2 | SC-1 | — | N/A | SQL | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON p.id=pa.politician_id WHERE p.external_id BETWEEN -4102006 AND -4102001` | ✅ | ⬜ pending |
| 80-03 stance apply | 03 | 3 | SC-2 | — | N/A | SQL | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON p.id=pa.politician_id WHERE p.external_id BETWEEN -690020 AND -690001 AND p.is_appointed=false` | ✅ | ⬜ pending |
| 80-04 verification | 04 | 4 | SC-3, SC-4 | — | Compass renders without error | manual | See Manual-Only Verifications | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test stubs or framework installs needed — stance ingestion uses established apply scripts from prior phases.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Compass renders on Kotek profile | SC-4 | Browser rendering cannot be automated via SQL | Navigate to `/politician/66c3bd97-94d1-4287-b1b8-86605a38cb97`; verify CompassCard is visible (not null) |
| All ingestion ran one-at-a-time | SC-3 | Process audit — not checkable via DB | Review execution log; confirm each apply script completed before the next research run started |
| Value range is integers 1–5 only | SC-1, SC-2 | Spot-check for outlier values | Run: `SELECT pa.value, COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON p.id=pa.politician_id WHERE p.external_id BETWEEN -4102006 AND -690001 GROUP BY pa.value ORDER BY pa.value` — expect only values 1,2,3,4,5 |

---

## Per-Wave Sampling Queries

### After Plan 01 (OR Constitutional Officers)

```sql
-- SC-1: All 5 executives have stances
SELECT p.full_name, COUNT(pa.id) AS stance_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -4100005 AND -4100001
GROUP BY p.full_name
ORDER BY p.full_name;
-- Expected: 5 rows, each with COUNT > 0 (Kotek expected ≥10, others ≥3)
```

### After Plan 02 (OR US House Reps)

```sql
-- SC-1: All 6 House reps have stances
SELECT p.full_name, COUNT(pa.id) AS stance_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -4102006 AND -4102001
GROUP BY p.full_name
ORDER BY p.full_name;
-- Expected: 6 rows, each with COUNT > 0 (Bonamici/Hoyle expected ≥10, others ≥5)
```

### After Plan 03 (Portland Council/Mayor/Auditor)

```sql
-- SC-2: Portland officials processed (some may have 0 by design)
SELECT p.full_name, p.external_id, COUNT(pa.id) AS stance_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.external_id BETWEEN -690020 AND -690001
  AND p.is_appointed = false
GROUP BY p.full_name, p.external_id
ORDER BY p.external_id;
-- Expected: 13 rows; Rede may have 0 (D-04); Ryan/Smith/Novick/Wilson expected ≥3
```

### Full Coverage Summary (Plan 04 / Pre-Verify)

```sql
-- Complete OR compass stance coverage check
SELECT
  p.full_name,
  p.external_id,
  COUNT(pa.id) AS stance_count
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE (p.external_id BETWEEN -4102006 AND -4100001
    OR p.external_id BETWEEN -690020 AND -690001)
  AND p.external_id NOT IN (-690003, -690004, -4101001, -4101002)  -- skip appointed + already-done senators
  AND p.is_appointed = false
GROUP BY p.full_name, p.external_id
ORDER BY p.external_id;
-- Expected: 25 rows — 5 executives + 6 House reps + 13 Portland officials + Auditor
-- At least 1 stance per row required for SC-1/SC-2 (except Rede which may be 0)
```

---

## Nyquist Spot-Check Targets (Minimum 3)

| Politician | Group | UUID | Check |
|-----------|-------|------|-------|
| Tina Kotek | Constitutional officer | 66c3bd97-94d1-4287-b1b8-86605a38cb97 | COUNT(stances) ≥ 10; compass renders at profile |
| Val Hoyle | US House rep | f6202cef-4e46-4db5-a9c0-c69ac9a8eccd | COUNT(stances) ≥ 8; all values integers 1–5 |
| Dan Ryan | Portland council (prior tenure) | 60fa9870-d984-46a7-a6ed-5f6fbebe72ce | COUNT(stances) ≥ 3; compass renders at profile |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or manual verification instructions
- [ ] Sampling continuity: per-wave queries cover all three politician groups
- [ ] Wave 0 not needed — existing infrastructure covers all requirements
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s (SQL queries via mcp__supabase-local)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
