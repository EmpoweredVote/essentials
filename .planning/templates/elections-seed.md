# Phase Template: Elections Seed

Use this template when planning a phase that seeds election rows, race rows, race candidates, and discovery_jurisdictions configuration for a city.

**Applies to:** Step 6 (Migration step 6) of LOCATION-ONBOARDING.md

---

## Valid election_method Values

`election_method` is a TEXT column on `essentials.chambers`. Valid values (as of v5.0):

| Value | Description |
|-------|-------------|
| `plurality` | Single vote; most votes wins; standard US municipal election |
| `stv_proportional` | Single Transferable Vote; ranked multi-seat election |
| `ranked_choice` | IRV (Instant Runoff Voting); single-seat ranked-choice |
| `runoff` | Top-two runoff if no majority in first round |

Do NOT invent values. If the city uses a method not listed, document it in STATE.md first and update this table before using it in a chambers INSERT.

---

## Pre-Seed Checklist

- [ ] Government row exists for this city
- [ ] Official election date confirmed from city election commission (NOT assumed from state cycle)
- [ ] For odd-year cycle cities (e.g., MA): confirmed NO election exists in even-numbered years; do not seed a 2026 date for a 2027 election
- [ ] State-level elections (primary + general): confirmed both dates from state SoS
- [ ] election_method value confirmed valid (see table above)
- [ ] Next migration number confirmed

## Key Decisions

| Decision | Answer |
|----------|--------|
| City election date | YYYY-MM-DD (from election commission) |
| Primary election date (if any) | YYYY-MM-DD or N/A |
| State/federal election dates | YYYY-MM-DD (from state SoS) |
| Odd-year or even-year cycle? | |
| Discovery active at setup? | yes / no (default: no for elections >6 months out) |

> **Cambridge example (Phase 44 reference):**
> - City election: 2027-11-02 (odd-year; NO 2026 city election — Massachusetts law)
> - State primary: 2026-09-01; State general: 2026-11-03
> - Cambridge discovery row: geoid='2511000', election_date='2027-11-02', would_be_swept=false (intentionally outside 180-day cron horizon until ~May 2027)
> - MA state discovery rows: geoid='25', 2026-09-01 + 2026-11-03, would_be_swept=true
> - Statewide race sentinel: office_id=NULL in essentials.races + e.state='MA' in elections = appears for all MA users via statewide query path

## Elections Table Insert

```sql
-- [VERIFY] Confirm election date from official election commission source before inserting
INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
VALUES (
  gen_random_uuid(),
  '[Year City/State] [Primary|General] Election',
  '[YYYY-MM-DD]',
  '[primary|general|runoff|special]',
  '[city|county|state|federal]',
  '[2-letter state abbrev]'
) ON CONFLICT DO NOTHING;
```

## Races Table Insert

```sql
-- One race row per contested seat/position in this election
INSERT INTO essentials.races (id, election_id, position_name, office_id, primary_party)
VALUES (
  gen_random_uuid(),
  '[election_uuid]',
  '[Position Name]',          -- e.g., 'U.S. Senate — Massachusetts'
  '[office_uuid or NULL]',    -- NULL for statewide races without a specific office row
  '[party string or NULL]'    -- NULL for general; 'Democratic' etc. for primaries
) ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING;
-- [GOTCHA] Partial index syntax required for general races where primary_party IS NULL
-- Standard ON CONFLICT DO NOTHING is not sufficient — there is no unique constraint on (election_id, position_name) alone
-- For primary races (primary_party IS NOT NULL), use: ON CONFLICT (election_id, position_name, primary_party) DO NOTHING
```

## race_candidates Insert

```sql
-- [GOTCHA] race_candidates has NO unique constraint on (race_id, full_name)
-- Always use WHERE NOT EXISTS — ON CONFLICT DO NOTHING is a no-op without a unique constraint
INSERT INTO essentials.race_candidates (id, race_id, full_name, politician_id, is_incumbent)
SELECT
  gen_random_uuid(),
  '[race_uuid]',
  '[Candidate Full Name]',
  '[politician_uuid or NULL]',  -- NULL if no politician row exists yet for this challenger
  [true|false]
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.race_candidates
  WHERE race_id = '[race_uuid]' AND full_name = '[Candidate Full Name]'
);
```

## discovery_jurisdictions Insert

```sql
-- [GOTCHA] Unique constraint: UNIQUE (jurisdiction_geoid, election_date)
-- Use ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING — not bare DO NOTHING
INSERT INTO essentials.discovery_jurisdictions (
  id,
  jurisdiction_geoid,
  election_id,
  election_date,
  jurisdiction_type,
  domain_whitelist,
  would_be_swept,
  is_active,
  notes
) VALUES (
  gen_random_uuid(),
  '[geo_id]',
  '[election_uuid]',
  '[YYYY-MM-DD]',
  '[city|county|state]',
  ARRAY['[domain1.gov]'],
  [true|false],    -- false if election is beyond 180-day cron horizon at setup time
  false,           -- inactive until filing opens
  '[notes]'
) ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING;
```

## Cron Horizon

The discovery cron fires for: `election_date <= CURRENT_DATE + INTERVAL '180 days'`

- Elections more than 180 days out: set `would_be_swept = false`; cron ignores them automatically
- Elections within 180 days: set `would_be_swept = true`; cron will attempt sweeps
- Activate discovery (`is_active = true`) only when candidate filing officially opens

> *Cambridge example:* 2027-11-02 city election was intentionally left with `would_be_swept = false` (set up on 2026-05-17; approximately 533 days before the election — well outside the 180-day horizon). The cron will not attempt Cambridge until filing opens in mid-2027.

## Placeholder Elections

For cities with known future elections but filing not yet open, create a placeholder:

```sql
-- Placeholder: no candidates seeded; discovery inactive; date may shift
INSERT INTO essentials.elections (id, name, election_date, election_type, jurisdiction_level, state)
VALUES (
  gen_random_uuid(),
  '[Year City] General Election (placeholder)',
  '[YYYY-MM-DD]',
  'general',
  'city',
  '[state]'
) ON CONFLICT DO NOTHING;
```

Mark the discovery_jurisdictions row `is_active = false` and `would_be_swept = false`. Update both when filing opens.

## Verification Queries

```sql
-- Confirm elections
SELECT id, name, election_date, election_type, jurisdiction_level
FROM essentials.elections WHERE state = '[state]' ORDER BY election_date;

-- Confirm races with candidate counts
SELECT r.position_name, r.primary_party, COUNT(rc.id) as candidate_count
FROM essentials.races r
LEFT JOIN essentials.race_candidates rc ON r.id = rc.race_id
JOIN essentials.elections e ON r.election_id = e.id
WHERE e.state = '[state]'
GROUP BY r.position_name, r.primary_party
ORDER BY r.position_name;

-- Confirm discovery_jurisdictions
SELECT dj.jurisdiction_geoid, dj.election_date, dj.would_be_swept, dj.is_active
FROM essentials.discovery_jurisdictions dj
WHERE dj.jurisdiction_geoid LIKE '[state_fips]%'
ORDER BY dj.election_date;
```

## Common Mistakes

- Seeding a 2026 election date for a city on an odd-year cycle (e.g., MA municipal elections are 2027, not 2026)
- Using bare `ON CONFLICT DO NOTHING` for race_candidates → no-op (no unique constraint exists on this table)
- Using partial index syntax wrong for general races: must be `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL`
- Setting `would_be_swept = true` for far-future elections → cron will attempt sweeps immediately on every Sunday run
- Activating discovery before filing opens → weekly cron returns 0 candidates and may fire false regression alerts
- Using NULL office_id without a comment explaining it is a statewide sentinel (comment in migration is essential for future maintainers)
- Forgetting the state_fips prefix check in verification queries (e.g., LIKE '25%' for MA, '48%' for TX)
