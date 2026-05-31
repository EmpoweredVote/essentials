---
phase: 79
slug: or-landing-elections-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 79 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL assertions via Supabase MCP (no test framework — pure data migration phase) |
| **Config file** | none — live DB queries via mcp__supabase-local |
| **Quick run command** | SQL: `SELECT COUNT(*) FROM essentials.elections WHERE state='OR'` |
| **Full suite command** | All verification queries in § Per-Task Verification Map |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run the post-plan count assertion SQL
- **After every plan wave:** Run full OR race count + section-split check
- **Before `/gsd-verify-work`:** All count assertions must match expected values
- **Max feedback latency:** 30 seconds (live DB query)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 79-01-01 | 01 | 1 | Landing.jsx entry | — | N/A | manual | View Landing.jsx COVERAGE_AREAS array for Portland OR entry | ✅ | ⬜ pending |
| 79-01-02 | 01 | 1 | OR elections rows | — | N/A | sql | `SELECT name, election_date FROM essentials.elections WHERE state='OR' ORDER BY election_date` → 2 rows | ✅ | ⬜ pending |
| 79-02-01 | 02 | 1 | Statewide races | — | N/A | sql | `SELECT COUNT(*) FROM essentials.races r JOIN essentials.elections e ON e.id=r.election_id WHERE e.state='OR'` → 8 | ✅ | ⬜ pending |
| 79-03-01 | 03 | 2 | Legislative races | — | N/A | sql | Same COUNT(*) → 98 | ✅ | ⬜ pending |
| 79-04-01 | 04 | 2 | Portland city races | — | N/A | sql | Same COUNT(*) → 105 | ✅ | ⬜ pending |
| 79-05-01 | 05 | 2 | Discovery jurisdictions | — | N/A | sql | `SELECT jurisdiction_geoid, election_date FROM essentials.discovery_jurisdictions WHERE state='OR'` → 2 rows | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This is a pure data migration phase — no test framework installation needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Landing.jsx Portland OR entry renders | D-01 | JSX array edit requires visual/code review | Read src/pages/Landing.jsx and confirm `{ county: 'Portland', state: 'Oregon', browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR' }` is present |
| Section-split check | All plans | SQL assertion on geofence/district join | Run section-split SQL after each migration; expect 0 rows |

---

## Validation Architecture (from RESEARCH.md)

### After Plan 01 — elections rows
```sql
SELECT name, election_date FROM essentials.elections WHERE state='OR' ORDER BY election_date;
-- Expected: 2 rows (OR 2026 Primary 2026-05-19, OR 2026 General 2026-11-03)
```

### After Plan 02 — statewide race rows
```sql
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id=r.election_id
WHERE e.state='OR';
-- Expected: 8 (1 Gov + 1 Senate + 6 House)
```

### After Plan 03 — OR legislative races
```sql
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id=r.election_id
WHERE e.state='OR';
-- Expected: 98 (8 + 90 legislative)
```

### After Plan 04 — Portland city races
```sql
SELECT COUNT(*) FROM essentials.races r
JOIN essentials.elections e ON e.id=r.election_id
WHERE e.state='OR';
-- Expected: 105 (98 + 7 Portland)
```

### After Plan 05 — discovery jurisdictions
```sql
SELECT jurisdiction_geoid, jurisdiction_name, election_date
FROM essentials.discovery_jurisdictions WHERE state='OR';
-- Expected: 2 rows (geo_id='41' + geo_id='4159000')
```

### Section-split check (run after every plan)
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.state='41'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts WHERE state IN ('or','OR','41'));
-- Expected: 0
```

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
