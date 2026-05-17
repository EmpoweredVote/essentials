# Phase Template: Compass Stances

Use this template when planning a phase that researches and ingests compass stance values for politicians.

**Applies to:** Step 6 (Migration step 8) of LOCATION-ONBOARDING.md

---

## Valid election_method Values

`election_method` is a TEXT column on `essentials.chambers`. Valid values (as of v5.0):

| Value | Description |
|-------|-------------|
| `plurality` | Single vote; most votes wins; standard US municipal election |
| `stv_proportional` | Single Transferable Vote; ranked multi-seat election |
| `ranked_choice` | IRV (Instant Runoff Voting); single-seat ranked-choice |
| `runoff` | Top-two runoff if no majority in first round |

Compass stance research is independent of `election_method` — but when creating the election infrastructure for a new city, verify against this list before any chambers INSERT. Do not use the `pg_constraint` query to verify this field.

---

## Pre-Research Checklist

- [ ] All politician rows exist and are stable (officials-seed phase complete)
- [ ] Compass topic IDs confirmed for relevant topics (check project_compass_live_topic_ids.md in Claude memory)
- [ ] Confirmed which topics apply to this government level (local, state, federal — check compass_topic_roles)
- [ ] Source checklist prepared per politician (voting record access, local news search, candidate websites)
- [ ] Confirmed rate limit rule: ONE research agent at a time, never parallel

## Rate Limit Rule (Critical)

**Always run stance research ONE politician at a time. Never run parallel research agents.**

Running multiple stance research agents simultaneously exhausts the Claude API rate limit quota with no usable output. The cost is ~$0.004/run (Haiku). Burning the quota produces nothing and wastes credits.

## Source Priority for Local Politicians

1. City council meeting voting records (official minutes — most reliable primary source)
2. Candidate websites (platform/issues pages)
3. Local newspaper voter guides and Q&A interviews
4. LWV (League of Women Voters) voter guides if available for this city
5. Endorsing organization questionnaires (e.g., local civic groups)
6. Public statements in city meetings (video/transcript if available)

**Do NOT use:**
- General endorsement pages (endorsements ≠ policy positions)
- Partisan organization characterizations of a candidate's views
- Social media posts without a direct quote and context
- LA-specific sources (LACBA ratings, CJP database, LA Ethics Commission) — these are California-specific

> **Cambridge example:**
> - Primary local topics: residential-zoning, growth-and-development, transportation-priorities (Cambridge has strong transit + cycling policy debate)
> - Voting records: Cambridge city council meeting minutes (cambridgema.gov meeting archive)
> - Candidate platforms: individual candidate websites (searched at candidate filing time)
> - Local press: Cambridge Chronicle, Harvard Crimson for charter/housing debates
> - No LACBA equivalent in MA; no CJP equivalent for local officials; no MA campaign finance API comparable to LA Ethics Commission
> - For Cambridge councillors: housing/zoning and transit policy will have the richest evidence; economic development and environment secondary

## Citation Requirement

Every stance value ingested MUST have a citation. No citation = do not stage the entry. This is a hallucination prevention rule.

Acceptable citation format: `{source name} — {URL or document title} — {date accessed or publication date}`

Example: `Cambridge Chronicle Q&A, 2025-10-15 — https://cambridgechronicle.com/2025/10/mcgovern-housing-interview`

## Apply Script Pattern

```typescript
// apply-[city]-[topic]-stances.ts
// Path: C:\EV-Accounts\backend\scripts\apply-[city]-[topic]-stances.ts

import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const stances = [
  { politician_id: '[uuid]', topic_id: '[topic uuid]', value: 3, source: '[citation]' },
  // one entry per politician per topic
];

async function main() {
  for (const stance of stances) {
    await pool.query(`
      INSERT INTO inform.politician_answers (politician_id, topic_id, value, source)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = $3, source = $4
    `, [stance.politician_id, stance.topic_id, stance.value, stance.source]);
  }
  console.log(`Applied ${stances.length} stances`);
  await pool.end();
}

main().catch(console.error);
```

**Value scale:** 1 = progressive, 5 = conservative. Use `parseInt(r.value)` directly — do NOT invert (old scripts used `3 - parseInt(r.value)`; do not replicate that).

## Verification Queries

```sql
-- Count stances ingested for this government
SELECT p.full_name, ct.topic_key, pa.value, pa.source
FROM inform.politician_answers pa
JOIN essentials.politicians p ON pa.politician_id = p.id
JOIN inform.compass_topics ct ON pa.topic_id = ct.id
JOIN essentials.governments g ON p.government_id = g.id
WHERE g.geo_id = '[geo_id]'
ORDER BY p.full_name, ct.topic_key;

-- Check for missing citations
SELECT p.full_name, ct.topic_key FROM inform.politician_answers pa
JOIN essentials.politicians p ON pa.politician_id = p.id
JOIN inform.compass_topics ct ON pa.topic_id = ct.id
JOIN essentials.governments g ON p.government_id = g.id
WHERE g.geo_id = '[geo_id]' AND (pa.source IS NULL OR pa.source = '');
```

## Common Mistakes

- Running multiple research agents in parallel → rate limit exhaustion, no usable output
- Ingesting a stance without a citation → violates citation-required rule; hallucination risk
- Using `3 - parseInt(r.value)` value inversion → produces wrong scale direction (1=progressive, 5=conservative is the live scale)
- Applying stances before politician rows are stable → risk of orphaned entries if politician UUIDs change
- Inferring stance from endorsement without a direct quote → inference must be flagged as inference, not treated as primary evidence
