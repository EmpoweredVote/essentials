# Phase Template: Discovery Setup

Use this template when planning a phase that configures the candidate discovery pipeline for a city.

**Applies to:** Step 6 (Migration step 6, discovery portion) of LOCATION-ONBOARDING.md

---

## Pre-Configuration Checklist

- [ ] Government row exists for this city
- [ ] Election row exists (next election date confirmed from election commission)
- [ ] Election date is more than 6 months away (if not, verify filing has opened before activating)
- [ ] Domain whitelist confirmed: what is the city's official election domain? (e.g., cambridgema.gov/Departments/electioncommission)
- [ ] Confirmed whether discovery should be marked INACTIVE until filing opens (recommended for far-future elections)
- [ ] Next migration number confirmed

## Key Decisions

| Decision | Answer |
|----------|--------|
| Election date (from election commission) | YYYY-MM-DD |
| Discovery domain(s) to whitelist | |
| Active at setup? | yes / no (default: no for elections >6 months out) |
| Jurisdiction level | city / county / state |

> **Cambridge example:**
> - Election date: 2027-11-04 (next Cambridge municipal election — Massachusetts odd-year requirement means NO 2026 city election)
> - Primary discovery domain: cambridgema.gov/Departments/electioncommission
> - Active at setup: NO — mark inactive; do not activate until filing opens (approximately summer 2027)
> - Jurisdiction level: city
> - Warning: Cambridge STV elections produce 19–37 candidates per cycle; discovery_agent must handle large candidate lists

## Discovery Jurisdictions Insert

```sql
INSERT INTO essentials.discovery_jurisdictions (
  id,
  government_id,
  election_id,
  domain_whitelist,
  is_active,           -- FALSE for far-future elections; activate when filing opens
  jurisdiction_level,
  notes
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM essentials.governments WHERE geo_id = '[geo_id]'),
  '[election_uuid]',
  ARRAY['[domain1.gov]', '[domain2.gov]'],
  false,               -- inactive until filing period
  '[city|county|state]',
  '[notes on election cycle]'
) ON CONFLICT DO NOTHING;
```

## When to Activate Discovery

- Activate when: candidate filing period officially opens (check election commission website)
- Do NOT activate: more than 2–3 months before filing opens (zero candidates will be found; regression alerts may fire)
- After activating: run a single manual test run and verify the output before the weekly cron takes over

## Verification

```sql
-- Confirm discovery jurisdiction row
SELECT dj.id, g.name, dj.domain_whitelist, dj.is_active, e.election_date
FROM essentials.discovery_jurisdictions dj
JOIN essentials.governments g ON dj.government_id = g.id
JOIN essentials.elections e ON dj.election_id = e.id
WHERE g.geo_id = '[geo_id]';
```

## Common Mistakes

- Activating discovery before filing opens → weekly cron returns 0 candidates every run; regression alerts fire
- Using wrong election date (e.g., 2026 for a 2027 city election) → discovery fires for a non-existent election
- Not whitelisting the official election domain → agent finds no candidates from valid sources
- Parallel jurisdiction processing → exhausts Claude API rate limit quota; always process jurisdictions sequentially
- Forgetting to mark jurisdiction inactive for far-future elections → immediate false regression alerts

## Post-Activation Protocol (when filing opens)

1. Update is_active = true on the discovery_jurisdictions row
2. Run a single manual test run via admin API (`POST /admin/discover/jurisdiction/:id`)
3. Review staged candidates in staging queue for accuracy
4. Confirm domain whitelist is returning candidates from valid sources
5. Let weekly cron (Sunday 02:00 UTC) handle ongoing sweeps
