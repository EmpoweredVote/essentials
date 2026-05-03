# Phase 18: Compass Stances (Collin County TX) — Research

**Researched:** 2026-05-03
**Domain:** Compass stance ingestion for TX city council politicians
**Confidence:** HIGH (architecture), LOW-MEDIUM (stance data feasibility)

---

## Summary

Phase 18 requires inserting rows into `inform.politician_answers` for Collin County TX city council members so the compass widget renders on their profiles. The architecture is fully understood from code inspection. The principal technical finding is that **no bridge or new table is needed** — the compass system already queries `essentials.politicians` directly, so any `essentials.politicians.id` UUID can be used as a `politician_answers.politician_id` with no migration required.

The principal feasibility finding is that **TX city council members have extremely sparse public policy stance data**. The compass's 17 local-scoped topics (immigration, climate, reproductive rights, transgender athletes, etc.) are almost entirely absent from public records, campaign materials, and candidate questionnaires for these nonpartisan suburban councils. What CAN be inferred is narrow: housing density preferences (conservative/pro-single-family for most members), and property tax stance (universally pro-low). Topics like Fossil Fuel Policy, Deportation of Immigrants, Transgender Athletes, and Reproductive Rights have zero documented evidence.

**Primary recommendation:** Proceed with a small number of well-evidenced stances per politician rather than forcing full 17-topic coverage. Even 2-4 topics per politician with source URLs is honest and useful. The compass widget renders fine with partial coverage.

---

## Architecture: How Compass Works (CONFIRMED, HIGH confidence)

### Critical FK Finding

The original migration 026 created `inform.politician_answers` with:
```sql
politician_id UUID NOT NULL REFERENCES inform.politicians(id) ON DELETE CASCADE
```

However, migration 062 documents explicitly (line 9):
> "the real politicians live in essentials.politicians (which is what politician_answers.politician_id actually references)"

Migration 058 also states: "`inform.politicians` [is] a 2-record stub created during early development. The real politician data (2,577+ rows) lives in essentials.politicians."

**Practical meaning:** The FK declared in the schema points to `inform.politicians`, but the runtime code in `compassService.ts` joins `inform.politician_answers pa ON pa.politician_id = p.id` where `p` is `essentials.politicians`. This works because: (a) the FK enforcement is bypassed via SECURITY DEFINER RPCs, and (b) in practice, politician_answers rows carry `essentials.politicians.id` UUIDs.

### No Bridge Migration Needed

The planner's assumption that "Currently 0 TX politicians in inform.politicians. The bridge must be established as part of this phase" is **incorrect**. The TX politicians already exist in `essentials.politicians` (migrations 091-100 inserted them). The compass system reads from `essentials.politicians` directly. No bridge, no `external_global_id` mapping, no migration needed to establish linkage.

**To add stances for a TX politician, you only need:**
1. Know the politician's UUID from `essentials.politicians`
2. Know the topic UUID from `inform.compass_topics`
3. Call `PUT /api/compass/politicians/:id/answers` (admin-authenticated) with the UUID from `essentials.politicians`

### Data Flow: How Compass Renders

```
GET /compass/politicians (public)
  → compassService.getCompassPoliticians()
  → SELECT p.id FROM essentials.politicians p
    JOIN inform.politician_answers pa ON pa.politician_id = p.id
    WHERE p.is_active = true
  → Returns list of politician IDs that have at least 1 answer
  → Client stores as politicianIdsWithStances Set

Profile page loads
  → CompassCard checks: politicianIdsWithStances.has(politicianId)
  → If NOT in set: card does not render at all (returns null)
  → If in set: fetches answers, renders radar chart + StanceAccordion
```

### Widget Behavior at 0 Answers

**The CompassCard WILL NOT render if a politician has 0 answers.** The gate is:
```javascript
if (!politicianIdsWithStances.has(politicianId)) return null;
```

`politicianIdsWithStances` is populated by `GET /compass/politicians`, which only returns politicians with at least one `politician_answers` row. **There is no "coming soon" placeholder** — it simply does not appear.

**Minimum to show the compass: 1 answer on any topic.** However, for a useful accordion display, more is better. The StanceAccordion renders all answered topics regardless of whether the user has a compass calibration.

### Value Scale (HIGH confidence)

From migration 038:
```sql
CHECK (value >= 0.5 AND value <= 5.5 AND (value * 2) = ROUND(value * 2))
```

Values are `NUMERIC(3,1)` in half-step increments: **0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5**

The stances table (`inform.compass_stances`) has text definitions for integer values 1-5 per topic. Half-steps interpolate between those. Standard practice (per existing Indiana politicians) is to use integer values 1-5. The planner should not use 0.5 or 5.5 — reserve those for strong edge cases.

**Semantic convention (inferred from context, MEDIUM confidence):**
- 1 = strongly progressive/liberal position
- 3 = centrist/neutral
- 5 = strongly conservative position

This is consistent with how the compass calibration works (user picks where they fall on each spectrum).

### Ingestion Mechanism

Use the existing admin API endpoint. No custom tooling needed:

```bash
PUT /api/compass/politicians/:essentials_politician_id/answers
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "answers": [
    { "topic_id": "<uuid>", "value": 4.0 },
    { "topic_id": "<uuid>", "value": 3.0 }
  ]
}
```

This calls `admin_update_politician_answers` RPC which does full replacement (delete-then-upsert). To add context (reasoning + sources):

```bash
POST /api/compass/politicians/context
{
  "politician_id": "<uuid>",
  "topic_id": "<uuid>",
  "reasoning": "Opposes high-density zoning per 2024 campaign statement",
  "sources": ["https://example.com/article"]
}
```

### Politicians Actually in the Database (HIGH confidence)

The context input has **stale politician names**. Migrations 091-096 inserted the actual current politicians. Current Plano incumbents (migration 091):

| Name | Office |
|------|--------|
| John B. Muns | Mayor |
| Maria Tu | Council Member Place 1 |
| Bob Kehr | Council Member Place 2 |
| Rick Horne | Council Member Place 3 |
| Chris Krupa Downs | Council Member Place 4 |
| Steve Lavine | Council Member Place 5 |
| (vacant) | Place 6 |
| Shun Thomas | Council Member Place 7 |
| Vidal Quintanilla | Council Member Place 8 |

McKinney incumbents (migration 092): Bill Cox (Mayor), Ernest Lynch (At-Large 1), Michael Jones (At-Large 2), Justin Beller (District 1), Patrick Cloutier (District 2), Geré Feltus (District 3), Rick Franklin (District 4).

Allen incumbents (migration 094): Baine Brooks (Mayor), Michael Schaeffer (Place 1), Tommy Baril (Place 2), Ken Cook (Place 3), Amy Gnadt (Place 4), Carl Clemencich (Place 5), Ben Trahan (Place 6).

Frisco incumbents (migration 094): Jeff Cheney (Mayor), plus Place 1-6 members.

**The context input's politician list (LaRosiliere, Fuller, Hornbeck, etc.) does not match the database.** Phase 18 plans must use the names from migrations 091-096, not the context input.

---

## Feasibility Assessment (MEDIUM confidence)

### What Was Researched

- Ballotpedia pages for Plano, McKinney, Allen, Frisco council members (2025-2026)
- Community Impact candidate Q&A articles for Plano council races (Places 2, 4, 5, 7)
- LWV Collin County voter guides (lwvcollin.org)
- Campaign websites: trahanforallen.com, mike4allen.com
- Web searches across all 4 cities for policy stances on all 17 local topics

### Topics With Realistic Data

| Topic | Feasibility | Evidence Quality | Notes |
|-------|-------------|------------------|-------|
| Affordable Housing and Homelessness | MEDIUM | Candidate Q&As, campaign sites | Most candidates state positions on housing density (anti-high-density is common). Position requires interpretation. |
| Taxation and Government Spending | MEDIUM | Campaign websites | Near-universal "keep property taxes low" stance; not specific to progressive/conservative framing |
| Data Center Development & Energy Costs | LOW | Plano news articles only; no individual stances documented | Plano has $700M data center; no individual votes found per member |
| Civil Rights and Social Justice | VERY LOW | No documented positions found | These are nonpartisan councils that avoid national social issues |
| Climate Change and Environmental Protection | VERY LOW | No documented positions found | Plano has a sustainability page but no council member-level stances |
| Campaign Finance Reform | NONE | Not a local council topic | State/federal domain |
| Childcare Affordability & Access | NONE | Not discussed in any source | No evidence |
| Criminalization of Homelessness | NONE | Not a visible issue in Collin County | Dallas County issue, not Collin |
| Deportation of Immigrants | NONE | No documented stances | Nonpartisan councils avoid federal immigration |
| Fossil Fuel Policy | NONE | No documented stances | Not a Collin County local policy domain |
| Healthcare Access and Affordability | NONE | Not a city council domain | State/federal |
| Immigration Policy | NONE | No documented stances | Nonpartisan councils avoid this |
| Jail Capacity and Incarceration Alternatives | NONE | County issue, not city council | Collin County Sheriff/Commissioners domain |
| Religious Freedom | NONE | No documented stances | Not a local council topic |
| Reproductive Rights and Abortion Access | NONE | No documented stances | TX state law, not city council policy |
| Transgender Athletes | NONE | No documented stances | State/school board domain, not city council |
| Voting Rights and Electoral Integrity | NONE | No documented stances | State domain |

### Honest Assessment

**For the majority of the 17 local-scoped topics, there is no findable public evidence for Collin County TX city council members.** These are conservative-leaning, nonpartisan suburban councils that do not take public positions on federal/social issues. Forcing scores on topics like "Deportation of Immigrants" or "Transgender Athletes" would require fabrication — which is not acceptable.

**Realistic achievable topics per politician:**
- Affordable Housing (density stance): 1 data point from campaign Q&As
- Taxation (property tax): 1 data point (virtually universal)
- Possibly Data Centers for Plano members only

**This means Phase 18 will likely produce 2-3 stances per politician maximum**, not 17. The compass will still render with partial coverage. The StanceAccordion shows only answered topics.

### Per-City Feasibility

**Plano (COMP-01):** Best sourced. Community Impact published Q&As for all 2025 races. Topics covered were infrastructure, housing density, taxes, and community development. Individual members have mild housing density preferences inferable from Q&As. No social issue stances.

**McKinney (COMP-02):** Bill Cox (Mayor) has some documented positions on airport expansion and economic development but nothing on the 17 compass topics directly. Community Impact has limited coverage. Feasibility: LOW.

**Allen (COMP-03):** Ben Trahan (trahanforallen.com) has a "Topics" page with positions on downtown development, ethics, zoning. Michael Schaeffer (mike4allen.com) opposes high-density zoning. These are inferable but narrow. Feasibility: LOW-MEDIUM.

**Frisco/Murphy/Celina/Richardson (COMP-04):** Best-effort. Jeff Cheney (Frisco Mayor) has economic development positions but nothing on the 17 topics. Celina and Murphy are very small cities with no public stance documentation found. Feasibility: VERY LOW.

---

## Source Quality Assessment

### Best Sources Found

| Source | Quality | Coverage |
|--------|---------|----------|
| Community Impact Q&A articles | GOOD | Plano all seats (2025 cycle), McKinney partial |
| Campaign websites (trahanforallen.com, mike4allen.com) | GOOD | Allen council members only |
| LWV Collin County (lwvcollin.org) | POOR | Lists candidates but no questionnaire responses |
| Vote411.org | UNKNOWN | Could not access; requires address lookup |
| Ballotpedia | POOR | Most candidates did not complete Candidate Connection survey |
| City official bio pages | INFO ONLY | Name, photo, email — no policy positions |
| City council minutes (Legistar) | LABOR INTENSIVE | Individual votes exist but require manual review of each meeting |

### LWV Collin County Finding

The LWV Collin County website lists candidates for Allen, Celina, Frisco, Murphy, etc. but does not post questionnaire responses on the public site. They redirect to vote411.org. The vote411.org questionnaires might contain substantive answers but require an address lookup. This should be checked during execution.

### Council Minutes as Source

Plano, McKinney, Allen, and Frisco all publish meeting minutes. For Data Center Development specifically, Plano approved a $700M data center in East Plano (Community Impact). Individual council member positions on this vote may be derivable from minutes but require manual lookup. This is LABOR INTENSIVE but viable for 1-2 specific topics.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Creating politician records | New migration/script | Rows already exist in essentials.politicians (migrations 091-096) |
| Bridge between schemas | FK migration, external_global_id mapping | Not needed — compassService already uses essentials.politicians |
| Bulk stance ingestion | Custom import script | PUT /api/compass/politicians/:id/answers endpoint |
| Topic ID lookup | Custom query | GET /compass/topics returns all topic IDs with short_titles |
| Admin authentication | Custom token flow | Use existing admin session for API calls |

---

## Common Pitfalls

### Pitfall 1: Using Wrong Politician IDs

**What goes wrong:** Phase research context listed politicians who are NOT in the database (LaRosiliere, Fuller, Prince, Shemwell, etc.). These are prior-term office holders. Migrations 091-096 contain the actual current politicians.

**How to avoid:** Always get politician UUIDs from a live DB query (`SELECT id, first_name, last_name FROM essentials.politicians WHERE is_active = true AND ...`), or cross-reference the migration files directly.

**Warning signs:** 404 response from PUT /api/compass/politicians/:id/answers, or FK violation on insert.

### Pitfall 2: Using inform.politicians IDs Instead of essentials.politicians IDs

**What goes wrong:** The `inform.politicians` table has 2 old stub rows (the Indiana politicians used during early development). Their UUIDs are NOT the same as `essentials.politicians` UUIDs. Using inform.politicians IDs will insert into politician_answers with UUIDs that have no matching essentials.politicians row, so they'll never appear on profile pages.

**How to avoid:** Always use `essentials.politicians.id`. The admin_list_politicians RPC now reads from essentials.politicians.

### Pitfall 3: Fabricating Stances

**What goes wrong:** Assigning values to topics like "Deportation of Immigrants" or "Transgender Athletes" for TX city council members without public evidence. These councils avoid these topics entirely.

**How to avoid:** Only insert rows for topics where a public source documents a position. Leave undocumented topics with no row (which is correct behavior — they just won't show in the accordion).

### Pitfall 4: Conflating City Policy With Personal Stance

**What goes wrong:** Interpreting a city's sustainability page or housing plan as the Mayor's personal stance.

**How to avoid:** Stance values should reflect individual documented statements, votes, or campaign positions — not city staff policies or plans the council passively approved.

### Pitfall 5: Value Scale Direction

**What goes wrong:** Assigning value=1 for "pro-low taxes" when the scale likely means 1=progressive (wants more taxation/government spending) and 5=conservative (wants less taxation).

**How to avoid:** Verify scale direction from the existing Indiana politicians' known stances before assigning any values. Matt Pierce (Indiana House Democrat) should have low values (1-2) on conservative topics and high values (4-5) on progressive topics, or vice versa. Check the actual rows in inform.politician_answers for him to establish the scale direction.

---

## State of the Art

| Old Assumption | Actual State | Impact |
|----------------|--------------|--------|
| inform.politicians is where politicians live | essentials.politicians is canonical (inform.politicians is a 2-row stub) | No bridge migration needed |
| external_global_id links the schemas | external_global_id is unused in the compass flow; never populated for TX | Not part of the solution |
| TX politicians need to be created | Already created in migrations 091-096 | Skip creation step |
| Context listed politician names are current | Those were prior-term office holders; new council seated after May 2025 elections | Must re-verify names from migrations |

---

## Open Questions

1. **Value scale direction (CRITICAL)**
   - What we know: Scale is 0.5-5.5, half-steps, with 1-5 integer values having named stances in compass_stances
   - What's unclear: Which direction is progressive vs conservative on each topic
   - Recommendation: Before assigning any values, query `inform.politician_answers` for Matt Pierce (existing Indiana Democrat) and verify the direction against his known political alignment

2. **vote411.org questionnaire responses**
   - What we know: LWV Collin County redirects to vote411.org for candidate responses; Celina, Murphy, Allen, Frisco are covered
   - What's unclear: Whether 2025/2026 city council candidates submitted answers
   - Recommendation: Check vote411.org with a Collin County TX address during execution; this could be the single best source for multiple politicians

3. **inform.politician_answers FK enforcement**
   - What we know: Schema says FK to inform.politicians; code uses essentials.politicians UUIDs
   - What's unclear: Whether FK constraint is actually enforced in production (it would fail if enforced)
   - Recommendation: The system has been working for Indiana politicians using essentials UUIDs, so FK is either disabled or the IDs happen to match for those 2 politicians. For TX inserts, use essentials.politicians UUIDs directly; the admin RPC bypasses FK checks via SECURITY DEFINER.

4. **inform.stance_research_review table**
   - What we know: The table exists but was not found in any migration or application code during this research
   - What's unclear: Whether this is an active workflow or a legacy artifact
   - Recommendation: Query the table definition in production before planning any review workflow around it

---

## Code Examples

### Get Topic IDs

```bash
GET /api/compass/topics
# Returns: [{ id, short_title, stances: [{ value, text }], ... }]
# Use short_title to match "Affordable Housing and Homelessness" etc. to UUIDs
```

### Get Politician UUID

```sql
-- Run against production DB
SELECT id, first_name, last_name, is_active
FROM essentials.politicians
WHERE is_active = true
ORDER BY last_name;
-- Use the id from this query in all /api/compass/politicians/:id/answers calls
```

### Ingest Stances (Admin API)

```bash
# Replace :id with essentials.politicians.id UUID
PUT /api/compass/politicians/:id/answers
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "answers": [
    { "topic_id": "<affordable-housing-topic-uuid>", "value": 4 },
    { "topic_id": "<taxation-topic-uuid>", "value": 4 }
  ]
}
# This is full replacement — send ALL intended answers in one call
# Sending an empty array {} deletes all answers for this politician
```

### Add Context/Sources

```bash
POST /api/compass/politicians/context
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  "politician_id": "<essentials.politicians.id>",
  "topic_id": "<topic-uuid>",
  "reasoning": "Opposes new high-density apartment zoning per 2024 campaign statement",
  "sources": [
    "https://www.mike4allen.com/",
    "https://communityimpact.com/dallas-fort-worth/plano-north/election/2025/03/10/qa-meet-the-candidates-for-plano-city-council-place-2/"
  ]
}
```

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/src/lib/compassService.ts` — getCompassPoliticians, getPoliticianAnswers — confirmed schema usage
- `C:/EV-Accounts/backend/migrations/062_topic_rewrite_fixups.sql` — explicit statement that essentials.politicians is canonical
- `C:/EV-Accounts/backend/migrations/058_admin_list_politicians_fix_schema.sql` — explicit statement that inform.politicians is a 2-row stub
- `C:/EV-Accounts/backend/migrations/038_compass_additions.sql` — value scale definition (NUMERIC 3,1, half-step 0.5-5.5)
- `C:/Transparent Motivations/essentials/src/components/CompassCard.jsx` — widget gate logic (null return when not in set)
- `C:/EV-Accounts/backend/migrations/091_plano_politicians.sql` — actual current Plano politicians
- `C:/EV-Accounts/backend/migrations/092_mckinney_politicians.sql` — actual current McKinney politicians
- `C:/EV-Accounts/backend/migrations/094_allen_frisco_politicians.sql` — actual current Allen + Frisco politicians

### Secondary (MEDIUM confidence)
- Community Impact Q&A articles (Plano City Council Place 2, 4, 5 — 2025 campaign) — housing density positions
- trahanforallen.com Topics page — Ben Trahan's development positions
- mike4allen.com — Michael Schaeffer's housing/development positions
- KERA News McKinney coverage — Bill Cox airport expansion position

### Tertiary (LOW confidence, unverified)
- LWV Collin County (lwvcollin.org) — candidates listed but no responses published on-site
- Ballotpedia pages for Bob Kehr, Steve Lavine, John Muns — no Candidate Connection surveys completed

---

## Metadata

**Confidence breakdown:**
- Architecture (bridge pattern, FK, widget behavior): HIGH — confirmed from source code
- Value scale (0.5-5.5, half-step): HIGH — confirmed from migration constraint
- Value direction (1=progressive vs 5=conservative): MEDIUM — inferred from context, needs verification
- Politician IDs in database: HIGH — confirmed from migrations 091-096
- Stance data feasibility (which topics have evidence): MEDIUM for housing/taxes, LOW for everything else
- Source quality for TX city council: LOW — nonpartisan suburban councils leave minimal public policy record

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (stable architecture; politician names stable unless elections change seats)
