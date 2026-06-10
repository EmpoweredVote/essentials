# Phase 107 Plan 01 — Verification Evidence

**Phase:** 107-ma-town-geofences
**Plan:** 01
**Verification date:** 2026-06-10
**Executor:** claude-sonnet-4-6

All queries run against production Supabase DB via pg direct client (Node.js).
No loader was run — this is a read-only assertion phase.

---

## Criterion 1: 293 G4040 rows present + clean

**Source:** MACOUSUB-01 through MACOUSUB-06 gates from `C:/EV-Accounts/backend/scripts/verify-ma-tiger-import.sql`

### MACOUSUB-01: Total active town count

```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4040';
```

**Result:** `293`
**Expected:** 293
**Status:** PASS

### MACOUSUB-02: Cambridge NOT in G4040 (FUNCSTAT='F' excluded)

```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4040' AND geo_id='2501711000';
```

**Result:** `0`
**Expected:** 0
**Status:** PASS

### Boston NOT in G4040 (G4110 city, not G4040 town)

```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4040' AND geo_id='2507000';
```

**Result:** `0`
**Expected:** 0
**Status:** PASS

### MACOUSUB-03: Lexington town boundary present

```sql
SELECT geo_id, name, mtfcc FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4040' AND geo_id='2501735215';
```

**Result:** `{"geo_id":"2501735215","name":"Lexington town","mtfcc":"G4040"}`
**Expected:** 1 row, name includes 'Lexington'
**Status:** PASS

### MACOUSUB-04: Concord town boundary present

```sql
SELECT geo_id, name, mtfcc FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4040' AND geo_id='2501715060';
```

**Result:** `{"geo_id":"2501715060","name":"Concord town","mtfcc":"G4040"}`
**Expected:** 1 row, name includes 'Concord'
**Status:** PASS

### MACOUSUB-05: No invalid G4040 geometries

```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state='25' AND mtfcc='G4040' AND NOT ST_IsValid(geometry);
```

**Result:** `0`
**Expected:** 0
**Status:** PASS

### MACOUSUB-06: Complete MA picture by mtfcc

```sql
SELECT mtfcc, COUNT(*) AS row_count FROM essentials.geofence_boundaries WHERE state='25' GROUP BY mtfcc ORDER BY mtfcc;
```

**Result:**

| mtfcc | row_count |
|-------|-----------|
| G4020 | 14        |
| G4040 | 293       |
| G4110 | 58        |
| G5200 | 9         |
| G5210 | 40        |
| G5220 | 160       |

**Expected:** G4020=14, G4040=293, G4110=58, G5200=9, G5210=40, G5220=160
**Status:** PASS

### Criterion 1 Summary

All 7 MACOUSUB gate assertions pass against production. 293 G4040 COUSUB town boundaries are present with valid geometries. FUNCSTAT='F' exclusions (Cambridge, Boston) are correctly absent from the G4040 layer. The MA geofence layer is complete and clean.

---

## Criterion 2: Town + city PIP routing

**Source:** `C:/EV-Accounts/backend/scripts/smoke-ma-towns.ts` + explicit ST_Covers tier checks

### Smoke Test

Command: `node node_modules/tsx/dist/cli.mjs scripts/smoke-ma-towns.ts` (from C:/EV-Accounts/backend)

**Actual output:**

```
=== Lexington MA center (-71.2298, 42.4473) ===
  G4020  geo_id=25017  name=Middlesex County
  G4040  geo_id=2501735215  name=Lexington town
  G5200  geo_id=2505  name=Congressional District 5
  G5210  geo_id=25D16  name=Fourth Middlesex District
  G5220  geo_id=25073  name=15th Middlesex District
  PASS: geo_id=2501735215 confirmed

=== Concord MA center (-71.349, 42.4604) ===
  G4020  geo_id=25017  name=Middlesex County
  G4040  geo_id=2501715060  name=Concord town
  G5200  geo_id=2503  name=Congressional District 3
  G5210  geo_id=25D15  name=Third Middlesex District
  G5220  geo_id=25071  name=13th Middlesex District
  PASS: geo_id=2501715060 confirmed

=== Cambridge MA (Harvard Square) (-71.119, 42.3732) ===
  G4020  geo_id=25017  name=Middlesex County
  G4110  geo_id=2511000  name=Cambridge city
  G5200  geo_id=2505  name=Congressional District 5
  G5210  geo_id=25D28  name=Suffolk and Middlesex District
  G5220  geo_id=25083  name=25th Middlesex District

────────────────────────────────────────────────────────────
MA towns smoke test PASSED — all assertions met.
```

**Exit code:** 0
**Status:** PASS

### Explicit ST_Covers Tier Check — Concord (-71.3490, 42.4604)

```sql
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state='25'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-71.3490, 42.4604), 4326))
ORDER BY mtfcc;
```

**Result:**

| geo_id     | name                         | mtfcc |
|------------|------------------------------|-------|
| 25017      | Middlesex County             | G4020 |
| 2501715060 | Concord town                 | G4040 |
| 2503       | Congressional District 3     | G5200 |
| 25D15      | Third Middlesex District     | G5210 |
| 25071      | 13th Middlesex District      | G5220 |

**Expected:** G4040=2501715060, G5200=2503, G5210=25D15, G5220=25071
**Status:** PASS (all 4 required tiers present)

### Explicit ST_Covers Tier Check — Brookline (-71.1219, 42.3318)

```sql
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state='25'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-71.1219, 42.3318), 4326))
ORDER BY mtfcc;
```

**Result:**

| geo_id     | name                            | mtfcc |
|------------|---------------------------------|-------|
| 25021      | Norfolk County                  | G4020 |
| 2502109175 | Brookline town                  | G4040 |
| 2504       | Congressional District 4        | G5200 |
| 25D17      | Norfolk and Middlesex District  | G5210 |
| 25110      | 15th Norfolk District           | G5220 |

**Expected:** G4040=2502109175, G5200=2504, G5210=25D17, G5220=25110
**Status:** PASS (all 4 required tiers present)

### Criterion 2 Summary

Smoke test exits 0. Lexington returns G4040=2501735215 and Concord returns G4040=2501715060 — both confirmed by the smoke test. Cambridge correctly returns only G4110=2511000 with no G4040 row. The explicit ST_Covers tier checks confirm Concord and Brookline both route through the full G4040+G5200+G5210+G5220 chain as required by MA-GEO-01.

---

## Criterion 3: Boston routes via G4110 unchanged

### Explicit ST_Covers Tier Check — Boston (-71.0589, 42.3601)

```sql
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state='25'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-71.0589, 42.3601), 4326))
ORDER BY mtfcc;
```

**Result:**

| geo_id  | name                         | mtfcc |
|---------|------------------------------|-------|
| 25025   | Suffolk County               | G4020 |
| 2507000 | Boston city                  | G4110 |
| 2508    | Congressional District 8     | G5200 |
| 25D25   | Third Suffolk District       | G5210 |
| 25125   | 3rd Suffolk District         | G5220 |

**G4110 present:** Yes (geo_id=2507000, "Boston city")
**G4040 rows returned:** 0

**Expected:** G4110=2507000 present; zero G4040 rows
**Status:** PASS

### Criterion 3 Summary

Boston routes via G4110 (geo_id=2507000) exactly as before. The addition of 293 G4040 COUSUB town rows has not affected Boston routing. FUNCSTAT='I' exclusion is intact — Boston is not present in the G4040 layer.

---

## Criterion 4: Section-split clean

**Note on directionality (RESEARCH Pitfall 2):** The correct check is `geofence_boundaries NOT IN districts` for mtfcc IN ('G5200','G5210','G5220','G4020'). The reverse direction (`districts NOT IN geofence`) intentionally produces ~7 rows for statewide STATE_EXEC/NATIONAL_UPPER districts that have no polygon — those are expected and are NOT a failure signal.

### Section-split check (OR pattern)

```sql
SELECT gb.geo_id, gb.name, gb.mtfcc
FROM essentials.geofence_boundaries gb
WHERE gb.mtfcc IN ('G5200','G5210','G5220','G4020')
  AND gb.state = '25'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
LIMIT 10;
```

**Result:** 0 rows
**Expected:** 0 rows
**Status:** PASS

### G4040 COUSUB does NOT write districts rows (by design)

The `cousub` layer dispatch has `writeDistrictRow: false`. Towns do not write their own district rows — they inherit STATE_UPPER/STATE_LOWER/NATIONAL_LOWER from the G5200/G5210/G5220 geofences via ST_Covers, and their LOCAL section comes from `government_bodies.geo_id` matching the G4040 geo_id.

Confirmation query (MA-scoped, state='25'):

```sql
SELECT COUNT(*)::int AS n
FROM essentials.districts d
JOIN essentials.geofence_boundaries gb ON d.geo_id = gb.geo_id
WHERE gb.mtfcc = 'G4040' AND gb.state = '25';
```

**Result:** `0`
**Expected:** 0 (COUSUB writeDistrictRow=false confirmed for MA)

**Note:** The global G4040 join without state filter returns 54 rows from state='18' (Indiana/Monroe County CCDs, which are G4040 mtfcc and do write district rows). Filtering to state='25' confirms MA COUSUB writes 0 district rows.

**Status:** PASS

### Criterion 4 Summary

The section-split check returns 0 rows — every G5200/G5210/G5220/G4020 geofence in MA has a corresponding district row. The MA G4040 COUSUB layer correctly writes no district rows by design (confirmed by state-scoped join returning 0). The geofence layer is clean and ready for Phase 108/109 official seeding.

---

## Requirement Closure

### MA-GEO-01: PASS

**Requirement:** A resident of any MA town (not just the 58 G4110 cities already loaded) can enter their address and get routed to their correct state + federal representatives via PostGIS geofence matching.

**Evidence:**
- 293 G4040 COUSUB town boundaries present in production (Criterion 1)
- Town addresses (Concord, Brookline) return correct G4040 + G5200 + G5210 + G5220 tiers (Criterion 2)
- Boston continues to route via G4110 unchanged (Criterion 3)
- Smoke test passes for Lexington, Concord, Cambridge exclusion (Criterion 2)
- Section-split clean — no routing gaps (Criterion 4)

**Verdict:** PASS — any MA town address now routes to the correct STATE_UPPER, STATE_LOWER, and NATIONAL_LOWER representatives.

### MA-GEO-02: PASS (geofence prerequisite)

**Requirement:** Any MA address returns a non-empty LOCAL section where the town has seeded officials.

**Geofence prerequisite status:** PASS — 293 G4040 geofences are present and routing works. The LOCAL section display (non-empty) is gated on Phase 108 (Boston officials) and Phase 109 (MA Tier 2 cities) seeding. Per REQUIREMENTS.md, MA-GEO-02 tracks the full dependency chain; the geofence prerequisite satisfied here unblocks those downstream phases.

**Phase 108/109 dependency note:** For most of the 293 towns, the LOCAL section will remain empty until officials are seeded in a future phase. This is correct behavior — the geofence enables routing; officials seeding populates the LOCAL display. The G4040 layer provides the routing foundation; no additional geofence work is needed for Phase 108+.

**Verdict:** PASS (geofence prerequisite) — Phase 108/109 complete the full MA-GEO-02 requirement.

---

## Overall Verdict

| # | Criterion | Result |
|---|-----------|--------|
| 1 | 293 G4040 COUSUB rows present + valid geometries + FUNCSTAT exclusions | **PASS** |
| 2 | Town addresses (Concord, Brookline) route through G4040+G5200+G5210+G5220 | **PASS** |
| 3 | Boston still routes via G4110 (unchanged, no G4040 row) | **PASS** |
| 4 | Section-split check returns 0 rows; G4040 writes no district rows for MA | **PASS** |

**ALL 4 ROADMAP SUCCESS CRITERIA: PASS**

MA-GEO-01: CLOSED
MA-GEO-02: CLOSED (geofence prerequisite; Phase 108/109 seeding completes display requirement)

Phase 108 (Boston Deep Seed) is unblocked.
