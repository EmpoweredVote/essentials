# Phase 16: Discovery Jurisdiction Setup - Research

**Researched:** 2026-05-01
**Domain:** discovery_jurisdictions table seeding, collincountytx.gov URL structure, Collin County municipal elections
**Confidence:** HIGH (schema, code, migrations), MEDIUM (source URLs, domain corrections), LOW (off-cycle election dates for smaller cities)

---

## Summary

This phase seeds 23 rows into `essentials.discovery_jurisdictions` — one per Collin County city — so the weekly cron discovers candidates from the official Collin County elections site. Research confirmed the table schema, existing INSERT patterns from prior migrations, all 23 city GEOIDs and official domains, the next available migration number (099), and the manual trigger endpoint. Two major findings required deviation from assumptions in CONTEXT.md.

**Finding 1 — Domain name correction:** `collincountyvotes.gov` does not exist as an indexed, accessible web property. The official Collin County Elections website is `collincountytx.gov`. There is a voter-education site at `collincountyvotes.com` (no `.gov`) run by the Collin County Business Alliance, not the county government. The correct domain for `source_url` and `allowed_domains` is `collincountytx.gov`.

**Finding 2 — Not all 23 cities have May 2, 2026 races.** Three cities have confirmed off-cycle situations: McKinney (next council election May 2027), Richardson (only bond + charter amendments on May 2, 2026 ballot — no council races), and Plano (holds elections in odd years; 2026 activity was a January 2026 special election only, next general is May 2027). Source rows for these cities should be seeded with election_date='2026-05-03' per CONTEXT.md guidance (cron will find zero candidates until a filing period opens), but the planner should note these explicitly.

**Finding 3 — Two domain discrepancies.** Migration 090 recorded `lavontexas.org` for Lavon and `vanalstyne.org` for Van Alstyne. Both are incorrect — the actual official sites are `lavontx.gov` and `cityofvanalstyne.us`. The `allowed_domains` values for these two cities must use the correct domains, not the migration's website_url.

**Primary recommendation:** Use `https://www.collincountytx.gov/Elections` as `source_url` for all 23 cities. The county site has no per-city filtering, so city-specific election pages (where they exist) should be set as `source_url` for cities that have their own elections pages. The discovery agent does web search augmented by the pre-fetched source URL content.

---

## Standard Stack

This phase is pure SQL — no new libraries or TypeScript code.

### Core
| Component | Version/Location | Purpose |
|-----------|-----------------|---------|
| SQL migration | 099 | Single INSERT statement seeding 23 rows |
| `essentials.discovery_jurisdictions` | Defined in migration 070 | Target table |
| `essentials.governments` | Pre-populated in migrations 088-090 | Source of `jurisdiction_geoid` values |

### Installation
No npm installs required. One SQL migration file only.

---

## Architecture Patterns

### Table Schema (from migration 070)

```sql
CREATE TABLE IF NOT EXISTS essentials.discovery_jurisdictions (
  id                  uuid          NOT NULL DEFAULT uuid_generate_v4(),
  jurisdiction_geoid  text          NOT NULL,
  jurisdiction_name   text          NOT NULL,
  state               character(2)  NOT NULL,
  election_date       date          NOT NULL,
  source_url          text,
  allowed_domains     text[],
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT discovery_jurisdictions_pkey PRIMARY KEY (id)
);
-- Unique constraint: (jurisdiction_geoid, election_date)
```

### INSERT Pattern (from migration 073 — Long Beach)

```sql
INSERT INTO essentials.discovery_jurisdictions (
  jurisdiction_geoid,
  jurisdiction_name,
  state,
  election_date,
  source_url,
  allowed_domains
) VALUES (
  '0643000',
  'Long Beach',
  'CA',
  '2026-06-02',
  'https://www.longbeach.gov/cityclerk/elections/candidates-home/',
  ARRAY['longbeach.gov', 'ballotpedia.org']
);
```

Key notes from the pattern:
- `jurisdiction_geoid` must be the FIPS place code from `essentials.governments.geo_id` — NOT wrapped in state prefix
- `allowed_domains` is a Postgres text array using `ARRAY[...]` syntax
- Domain strings in `allowed_domains` do NOT include `www.` or `https://` prefix (e.g. `'collincountytx.gov'` not `'www.collincountytx.gov'`)
- `election_date` is ISO date string

### Source URL Decision

The county site (`collincountytx.gov/Elections`) has no per-city filter. The discovery agent:
1. Pre-fetches `source_url` content into text
2. Uses that + web search (limited to `allowed_domains`) to find candidates

**Recommended strategy:** Use each city's own elections page as `source_url` where one exists. This gives the agent the most specific pre-fetched content. For cities with no dedicated elections page, fall back to the county elections home page. The county page is acceptable because the agent also has web search against allowed_domains.

### Allowed Domains Pattern

Per CONTEXT.md decision (locked):
```
{collincountytx.gov, co.collin.tx.us, <city-official-domain>}
```

Note: `co.collin.tx.us` appears to be a legacy subdomain/alias — attempts to access it returned connection refused. This may be an old address or internal network alias. Include it as specified (it won't hurt if unreachable; the agent simply won't fetch from it).

The county elections sub-pages are under `collincountytx.gov`, so that domain covers all of `www.collincountytx.gov/Elections/*`.

---

## Migration Number

**Next migration: 099**

Confirmed by `ls /c/EV-Accounts/backend/migrations/ | sort | tail -5`:
```
095_richardson_politicians.sql
096_murphy_celina_prosper_politicians.sql
097_tier_3_politicians.sql
098_tier_4_politicians.sql
```
Next is `099_collin_county_discovery_jurisdictions.sql`.

---

## City Reference Table

All 23 cities with GEOID, official domain, correct `allowed_domains` entry, and election status. GEOIDs sourced from migrations 088-090 (HIGH confidence). Domains verified via web search (MEDIUM confidence). Election participation sourced via web search + city sites (MEDIUM confidence for large cities, LOW for small cities).

| # | City | GEOID | Official Domain | allowed_domains entry | May 2026 Election? |
|---|------|-------|-----------------|----------------------|-------------------|
| 1 | Plano | 4863000 | plano.gov | `plano.gov` | No — odd years only; next general May 2027 |
| 2 | McKinney | 4845744 | mckinneytexas.org | `mckinneytexas.org` | No — next council election May 2027 |
| 3 | Allen | 4801924 | cityofallen.org | `cityofallen.org` | Yes — Mayor + Place 2 |
| 4 | Frisco | 4827684 | friscotexas.gov | `friscotexas.gov` | Yes — Mayor + Places 5-6 |
| 5 | Murphy | 4850100 | murphytx.org | `murphytx.org` | Yes — Places 3 + 5 |
| 6 | Celina | 4813684 | celinatx.gov | `celinatx.gov` | Yes — Mayor + Places 4+5 |
| 7 | Prosper | 4863276 | prospertx.gov | `prospertx.gov` | Yes — Places 3+5 (uncontested, declared elected) |
| 8 | Richardson | 4863500 | cor.net | `cor.net` | Partial — bond + charter only; NO council races in May 2026 |
| 9 | Anna | 4803300 | annatexas.gov | `annatexas.gov` | Yes — Places 3 + 5 |
| 10 | Melissa | 4847496 | cityofmelissa.com | `cityofmelissa.com` | Yes (confirmed by NBC5 ballot list) |
| 11 | Princeton | 4863432 | princetontx.gov | `princetontx.gov` | Yes — Place 4 |
| 12 | Lucas | 4845012 | lucastexas.us | `lucastexas.us` | Yes — Seats 1 + 2 |
| 13 | Lavon | 4841800 | lavontx.gov | `lavontx.gov` | LOW confidence — likely yes |
| 14 | Fairview | 4825224 | fairviewtexas.org | `fairviewtexas.org` | Yes — Seats 2, 4, 6 |
| 15 | Van Alstyne | 4875960 | cityofvanalstyne.us | `cityofvanalstyne.us` | LOW confidence — likely yes |
| 16 | Farmersville | 4825488 | farmersvilletx.com | `farmersvilletx.com` | LOW confidence — likely yes |
| 17 | Parker | 4855152 | parkertexas.us | `parkertexas.us` | Yes — Mayor + Councilmember-at-large |
| 18 | Saint Paul | 4864220 | stpaultexas.us | `stpaultexas.us` | LOW confidence |
| 19 | Nevada | 4850760 | cityofnevadatx.org | `cityofnevadatx.org` | LOW confidence |
| 20 | Weston | 4877740 | westontexas.com | `westontexas.com` | LOW confidence |
| 21 | Lowry Crossing | 4844308 | lowrycrossingtexas.org | `lowrycrossingtexas.org` | Yes — Ward 4 + Prop A |
| 22 | Josephine | 4838068 | cityofjosephinetx.com | `cityofjosephinetx.com` | Yes — Prop 1 (alcohol sales, no council race) |
| 23 | Blue Ridge | 4808872 | blueridgecity.com | `blueridgecity.com` | LOW confidence |

**CRITICAL domain corrections (migrations used wrong URLs):**
- Lavon: migration 090 has `lavontexas.org` — actual site is `lavontx.gov`
- Van Alstyne: migration 090 has `vanalstyne.org` — actual site is `cityofvanalstyne.us`

These discrepancies mean `allowed_domains` must use the CORRECT domain, not the migration's `website_url` value. The migration's `website_url` column may need a follow-up correction but is out of scope for Phase 16.

**Cities with no website in migration 090 (NULL website_url):** Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge. Domains found via web search; confidence MEDIUM.

---

## Source URL Recommendations

The county elections page (`https://www.collincountytx.gov/Elections`) is the appropriate fallback, but city-specific pages are better for the agent's pre-fetch.

| City | Recommended source_url | Rationale |
|------|------------------------|-----------|
| Plano | `https://www.plano.gov/1402/Elections` | City has a dedicated elections page |
| McKinney | `https://www.mckinneytexas.org/139/Elections` | City has elections page |
| Allen | `https://www.cityofallen.org` | No specific elections subpage confirmed |
| Frisco | `https://www.friscotexas.gov` | No specific elections subpage confirmed |
| Murphy | `https://www.murphytx.org` | No specific elections subpage confirmed |
| Celina | `https://www.celinatx.gov/government/city-council` | City council page |
| Prosper | `https://www.prospertx.gov/479/May-2026-General-Election` | Dedicated May 2026 page confirmed |
| Richardson | `https://www.cor.net/government/city-secretary/elections` | City elections page confirmed |
| Anna | `https://www.annatexas.gov/1015/Elections` | Dedicated elections page confirmed |
| Melissa | `https://www.cityofmelissa.com/287/Elections` | Dedicated elections page confirmed |
| Princeton | `https://www.princetontx.gov/294/Elections` | Dedicated elections page confirmed |
| Lucas | `https://www.lucastexas.us` | No specific elections subpage confirmed |
| Lavon | `https://lavontx.gov/election-information/` | Dedicated elections page confirmed |
| Fairview | `https://www.fairviewtexas.org` | No specific elections subpage confirmed |
| Van Alstyne | `https://cityofvanalstyne.us` | No specific elections subpage confirmed |
| Farmersville | `https://www.farmersvilletx.com` | No specific elections subpage confirmed |
| Parker | `https://www.parkertexas.us/87/Elections-Elecciones` | Dedicated elections page confirmed |
| Saint Paul | `https://www.stpaultexas.us` | City homepage |
| Nevada | `https://cityofnevadatx.org` | City homepage |
| Weston | `https://www.westontexas.com` | City homepage |
| Lowry Crossing | `https://www.lowrycrossingtexas.org` | City homepage |
| Josephine | `https://cityofjosephinetx.com` | City homepage |
| Blue Ridge | `https://blueridgecity.com` | City homepage |

**Alternative county-level source URL:** For all 23 cities the planner may choose to standardize on `https://www.collincountytx.gov/Elections` rather than per-city URLs. This is simpler to maintain and the agent supplements with web search. Trade-off: the pre-fetched county page has no city filter, so the agent leans more on web search.

---

## Manual Test Trigger

**Endpoint:** `POST /discover/jurisdiction/:id`
**Auth:** `X-Admin-Token` header (requireAdminToken middleware)
**Response:** 202 Accepted immediately; run continues in background

```bash
# Get Plano's discovery_jurisdictions.id after seeding:
# SELECT id FROM essentials.discovery_jurisdictions WHERE jurisdiction_name = 'Plano';

curl -X POST https://accounts-api.onrender.com/discover/jurisdiction/<uuid> \
  -H "X-Admin-Token: $ADMIN_TOKEN"
```

The run status and candidates are tracked in `essentials.discovery_runs` and `essentials.candidate_staging`. Check staging queue at `https://essentials.empowered.vote/admin/staging`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Domain extraction from citation URLs | Custom regex | `hostFromUrl()` in discoveryService.ts already handles this |
| Subdomain matching for allowed_domains | Custom logic | `isDomainAllowlisted()` already handles `host.endsWith('.' + domain)` |
| Unique constraint on geoid+date | Application-level dedup | `idx_discovery_jurisdictions_geoid_date` already enforces this |

---

## Common Pitfalls

### Pitfall 1: Wrong domain name for source_url
**What goes wrong:** Using `collincountyvotes.gov` (doesn't exist) instead of `collincountytx.gov`
**Why it happens:** CONTEXT.md mentioned `collincountyvotes.gov`; this domain is not a live government site
**How to avoid:** All source_url and allowed_domains values must use `collincountytx.gov`

### Pitfall 2: Domain mismatch between migration website_url and allowed_domains
**What goes wrong:** Using `lavontexas.org` (from migration) in allowed_domains instead of actual `lavontx.gov`
**Why it happens:** Migration 090 had incorrect website_url for Lavon and Van Alstyne
**How to avoid:** Use verified domains from research, not migration's website_url column

### Pitfall 3: Seeding election_date as May 3 vs May 2
**What goes wrong:** Texas uniform election is May 3, 2026 (CONTEXT.md says May 3) but county site and news sources consistently say May 2, 2026
**Warning signs:** Conflicting dates between CONTEXT.md and live sources
**Note:** CONTEXT.md says "May 3, 2026 TX uniform election" but all official Collin County sources confirm the date is May 2, 2026. Verify with `collincountytx.gov/Elections/election-information` before committing migration. The unique index on (jurisdiction_geoid, election_date) means using the wrong date creates a gap in detection — if races were seeded with election_date=2026-05-03, the discovery jurisdictions must also use 2026-05-03.

### Pitfall 4: NULL allowed_domains = no restriction (dangerous)
**What goes wrong:** Omitting `allowed_domains` means `allowed_domains IS NULL` which bypasses domain safety checks — all citation URLs get confidence='official' regardless of source
**How to avoid:** Always provide the ARRAY[...] with at minimum `collincountytx.gov`

### Pitfall 5: Cities with no current races still need rows
**What goes wrong:** Skipping McKinney/Plano/Richardson because they have no May 2026 council races
**Why it's wrong:** CONTEXT.md is explicit — rows are seeded now; cron finds zero candidates until a filing period opens. The pipeline must be registered before the next election cycle.

### Pitfall 6: jurisdiction_geoid is the FIPS place code only
**What goes wrong:** Including state prefix (e.g. `484863000` instead of `4863000`)
**How to avoid:** Match the `geo_id` column in `essentials.governments` exactly — all Collin County GEOIDs are 7-digit FIPS place codes

---

## Code Example: Standard INSERT for one Collin County city

```sql
-- Source: migration 073 pattern + table DDL from migration 070
INSERT INTO essentials.discovery_jurisdictions (
  jurisdiction_geoid,
  jurisdiction_name,
  state,
  election_date,
  source_url,
  allowed_domains
) VALUES (
  '4863000',            -- Plano FIPS place code from governments.geo_id
  'Plano',
  'TX',
  '2026-05-02',         -- Verify: county site says May 2; CONTEXT.md says May 3
  'https://www.plano.gov/1402/Elections',
  ARRAY['collincountytx.gov', 'co.collin.tx.us', 'plano.gov']
);
```

---

## State of the Art

| Old Pattern | Current Pattern | Impact |
|-------------|-----------------|--------|
| Single source_url for all cities | Per-city source_url | Better pre-fetch quality for agent |
| No pre-fetch | fetchPageContent() pre-fetches source_url before agent call | Agent gets rendered text directly, reduces web_search use |
| Ballotpedia in allowed_domains (Long Beach) | Strict county+city only (Collin County decision) | Tighter citation validation |

---

## Open Questions

1. **May 2 vs May 3 election date**
   - What we know: All Collin County official sources and news reports say May 2, 2026. CONTEXT.md says May 3, 2026.
   - What's unclear: Whether elections already seeded in `essentials.elections` used May 2 or May 3 as `election_date`
   - Recommendation: Before writing migration 099, run `SELECT election_date FROM essentials.elections WHERE state = 'TX' AND election_date BETWEEN '2026-04-01' AND '2026-06-01'` to confirm which date is already in the DB. Use that same date for discovery_jurisdictions.

2. **co.collin.tx.us domain reachability**
   - What we know: CONTEXT.md specifies this in allowed_domains; connection refused during research
   - What's unclear: Whether this is a valid subdomain that resolves in production
   - Recommendation: Include it as specified (harmless if unreachable); do not remove from allowed_domains

3. **Lavon and Van Alstyne domain discrepancy in migration**
   - What we know: migration 090 used wrong domains for these two cities
   - What's unclear: Whether migration's website_url column needs correcting
   - Recommendation: Use correct domains in Phase 16 `allowed_domains`. Flag for a follow-up migration to fix `chambers.website_url` for these two cities (out of scope for Phase 16).

4. **Small city election dates (Saint Paul, Nevada, Weston, Lowry Crossing, Blue Ridge)**
   - What we know: These are very small cities (populations 500-2000) with minimal online presence
   - What's unclear: Whether they have May 2, 2026 elections or different cycles
   - Recommendation: Seed with election_date matching the TX elections table entry (query first). The discovery run will find zero candidates if no races are active — that is acceptable per CONTEXT.md.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/migrations/070_discovery_tables.sql` — complete table DDL for discovery_jurisdictions, discovery_runs, candidate_staging
- `C:/EV-Accounts/backend/migrations/073_long_beach_discovery.sql` — canonical INSERT pattern
- `C:/EV-Accounts/backend/migrations/088_tx_tier1_cities.sql` — GEOIDs + domains for Plano, McKinney, Allen, Frisco
- `C:/EV-Accounts/backend/migrations/089_tx_tier2_cities.sql` — GEOIDs + domains for Murphy, Celina, Prosper, Richardson
- `C:/EV-Accounts/backend/migrations/090_tx_tier34_cities.sql` — GEOIDs + domains for 15 Tier 3-4 cities
- `C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts` — POST /discover/jurisdiction/:id endpoint

### Secondary (MEDIUM confidence)
- `https://www.collincountytx.gov/Elections` — confirmed official Collin County elections domain
- `https://www.collincountytx.gov/Elections/sample-ballots` — confirmed two elections: Uniform + Richardson
- `https://www.nbcdfw.com/news/politics/lone-star-politics/collin-county-election-all-races-may-2-2026/4012500/` — city-by-city May 2, 2026 candidate list
- `https://www.mckinneytexas.org/139/Elections` — McKinney next election is May 2027
- `https://www.prospertx.gov/479/May-2026-General-Election` — Prosper May 2026 races confirmed uncontested
- `https://richardsontoday.com/bond-and-charter-elections-called-by-richardson-city-council-for-may-2/` — Richardson has no council races May 2026
- `lavontx.gov` — confirmed official Lavon domain (corrects migration 090)
- `cityofvanalstyne.us` — confirmed official Van Alstyne domain (corrects migration 090)

### Tertiary (LOW confidence)
- WebSearch results for Saint Paul (stpaultexas.us), Nevada (cityofnevadatx.org), Weston (westontexas.com), Lowry Crossing (lowrycrossingtexas.org), Josephine (cityofjosephinetx.com), Blue Ridge (blueridgecity.com) — single WebSearch source each, not verified with official sources
- Election participation for Lavon, Van Alstyne, Farmersville, Saint Paul, Nevada, Weston, Blue Ridge — not individually confirmed

---

## Metadata

**Confidence breakdown:**
- Table schema: HIGH — verified from migration DDL
- INSERT pattern: HIGH — verified from migration 073
- GEOIDs: HIGH — from applied migrations 088-090
- City official domains (Tier 1+2): HIGH — from migrations + web search confirmation
- City official domains (Tier 3+4, seeded): MEDIUM — migrations + web search
- City official domains (Tier 4, NULL website): MEDIUM — web search only
- Lavon + Van Alstyne domain correction: MEDIUM — web search confirmed correct domain
- Source URLs: MEDIUM — web search confirmed city elections pages where found
- May 2026 election participation (large cities): MEDIUM — multiple news sources confirm
- May 2026 election participation (small cities): LOW — not individually verified

**Research date:** 2026-05-01
**Valid until:** 2026-05-31 (election content; structural findings are stable)
