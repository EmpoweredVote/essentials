# Phase 30: Legal Candidate Stance Research — Research

**Researched:** 2026-05-09
**Domain:** Compass stance ingestion for LA City Attorney candidates into inform.politician_answers + inform.politician_context
**Confidence:** HIGH (DB schema, IDs, stance descriptions), MEDIUM (web source coverage)

---

## Summary

Phase 30 inserts judicial compass stances for Aida Ashouri, John McKinney, and Marissa Roy across 6 applicable topics (4 universal judicial + 2 city_attorney_da-specific). All three politician IDs are confirmed in production. All 6 topic IDs and their 1–5 stance descriptions are pulled directly from the DB. Zero existing stance rows exist for these three candidates — the slate is clean.

The ingestion pattern is two-table: `inform.politician_answers` holds `(politician_id, topic_id, value NUMERIC)` and `inform.politician_context` holds `(politician_id, topic_id, reasoning TEXT, sources TEXT[])`. Citations live in `politician_context`, not in `politician_answers`. The CONTEXT.md mentions inserting a row with "null value" for missing data, but the DB schema enforces `value IS NOT NULL` — the correct "not found" handling is a `politician_context`-only row (no `politician_answers` row), with `reasoning` set to the "researched, not found" note and `sources` as `'{}'`.

Web research found strong source coverage for Ashouri and Roy. McKinney has good coverage for prosecution priorities and criminal justice approach, less on transparency specifically. All three candidates have LAist voter guide coverage as a primary source.

**Primary recommendation:** Each plan (30-01, 30-02, 30-03) runs as a two-phase agent: (1) web research to determine values per topic, (2) SQL ingestion of both `politician_answers` and `politician_context` rows. Run agents strictly one at a time.

---

## Database Facts (HIGH confidence — verified against production)

### Politician IDs

| Candidate | politician_id | Role |
|-----------|--------------|------|
| Aida Ashouri | `0f6484bd-2fc1-4071-9648-d7b8a950d29c` | City Attorney candidate |
| John McKinney | `6cd2e87b-7366-429a-a049-990751bd647f` | City Attorney candidate |
| Marissa Roy | `7157dd95-0f1b-4e05-bd4f-39317345b47c` | City Attorney candidate |

Note: Marissa Roy's cmt_id=1479257 is a campaign finance cross-reference only; not relevant to compass ingestion.

### 6 Applicable Topic IDs (4 universal + 2 city_attorney_da)

**Universal (judicial_role IS NULL) — applicable to all judicial roles:**

| topic_key | topic_id | title |
|-----------|----------|-------|
| `judicial-transparency` | `6674d87e-999d-433a-aab7-3f626f59fd5f` | Transparency in Legal Proceedings |
| `judicial-access-to-justice` | `9d45acaf-1ba4-4cb8-95e1-5ed985223b91` | Access to Justice |
| `judicial-criminal-justice` | `9db07b16-1076-4b7d-ad89-ebe7b51f4336` | Criminal Justice Approach |
| `judicial-government-deference` | `e5e48f0e-8f3a-40e1-8080-889fea389603` | Judicial & Prosecutorial Discretion |

**City Attorney/DA-specific (judicial_role = 'city_attorney_da'):**

| topic_key | topic_id | title |
|-----------|----------|-------|
| `judicial-police-accountability` | `7bad33eb-e93e-4d94-8822-97212d49bde5` | Police Accountability |
| `judicial-prosecution-priorities` | `abb99d95-cbb1-4617-8f8b-f220ef6028ca` | Prosecution Priorities |

**OUT OF SCOPE (judge-only, judicial_role = 'judge'):**
- `judicial-bail-pretrial` (`1fab5edf-...`) — excluded
- `judicial-interpretation` (`448b1c9a-...`) — excluded

### Stance Descriptions (1–5 for each applicable topic)

**judicial-transparency** (Transparency in Legal Proceedings):
- 1: "Everything possible should be public — hearings, evidence, rulings, and the reasoning behind them. Secrecy breeds injustice."
- 2: "Default to open proceedings. Sealing records or closing hearings requires a compelling, documented reason."
- 3: "Balance openness with legitimate needs for privacy — protect victims, seal juvenile records, but keep the courtroom open as a rule."
- 4: "Courts should protect sensitive information broadly — personal details, ongoing investigations, and anything that could prejudice a fair trial."
- 5: "The law is complicated. Public access to proceedings can distort outcomes. Broad judicial discretion to limit access protects the integrity of the process."

**judicial-access-to-justice** (Access to Justice):
- 1: "Easy. Courts exist for everyone — not just people with expensive lawyers. Low barriers mean more access to justice."
- 2: "Accessible. Some basic requirements are fine, but courts shouldn't be a maze that only the wealthy can navigate."
- 3: "Reasonable standards that keep out frivolous cases without blocking legitimate ones."
- 4: "Higher bars are fine. Too much litigation clogs the system and costs everyone money."
- 5: "Hard. Most disputes should be settled privately. Courts should be a last resort, not a first option."

**judicial-criminal-justice** (Criminal Justice Approach):
- 1: "Helping the person change their life and stay out of trouble in the future."
- 2: "Giving the person a fair chance to make things right — through treatment, community service, or restitution."
- 3: "A mix: some accountability, some support, depending on what happened."
- 4: "Making sure others think twice before doing the same thing."
- 5: "Punishing the behavior. Society needs to know that breaking the law has real consequences."

**judicial-government-deference** (Judicial & Prosecutorial Discretion):
- 1: "The citizen, almost always. Government has lawyers, money, and power. Regular people need courts to level the playing field."
- 2: "The citizen usually — unless the government has clear legal authority on its side."
- 3: "Neither side automatically. Look at the facts and apply the law evenly."
- 4: "The government usually — it represents everyone, and its decisions deserve respect unless clearly wrong."
- 5: "The government, unless it has obviously overreached. Officials make decisions for good reasons — courts shouldn't second-guess them constantly."

**judicial-police-accountability** (Police Accountability):
- 1: "Investigate independently. The office works for the public — not the officials it's supposed to keep accountable."
- 2: "Settle valid claims quickly and pursue real accountability. Defending misconduct wastes money and public trust."
- 3: "Represent the city fairly while acknowledging when claims have merit."
- 4: "Defend city employees vigorously. That's the job. Settlements invite more lawsuits."
- 5: "The client is the city government. Defending its employees and decisions — aggressively when needed — is the core function."

**judicial-prosecution-priorities** (Prosecution Priorities):
- 1: "Prosecution should be a last resort. Connecting people to treatment, housing, or job programs does more good than a criminal record."
- 2: "Use diversion when it's available and makes sense. Reserve prosecution for when community safety actually requires it."
- 3: "Strong cases get prosecuted. Diversion is used when there's a clear benefit — it's a judgment call every time."
- 4: "Prosecute all solid cases. Declination is the exception and needs a strong reason."
- 5: "The office enforces the law — not social policy. If a case is prosecutable, prosecute it. Courts figure out the rest."

### Existing Stance Rows for These Three Candidates

**Zero existing rows** in both `inform.politician_answers` and `inform.politician_context` for Ashouri, McKinney, and Roy on any judicial topic. Confirmed with production query.

---

## Schema: Ingestion Pattern (HIGH confidence — verified against production)

### inform.politician_answers
```
politician_id  UUID  NOT NULL  FK → essentials.politicians.id
topic_id       UUID  NOT NULL  FK → inform.compass_topics.id
value          NUMERIC NOT NULL  CHECK (value >= 1 AND value <= 5)
write_in_text  TEXT  NULLABLE
```

PK: `(politician_id, topic_id)`

**Value constraint:** Two CHECK constraints exist:
- `value >= 1 AND value <= 5` (integer range)
- `value >= 0.5 AND value <= 5.5 AND (value * 2 = round(value * 2))` (half-steps)

In practice, all existing rows use whole integer values 1.0–5.0. Use whole integers only.

**value IS NOT NULL** — NULL is not permitted. The CONTEXT.md's "null value" for missing data cannot be stored here.

### inform.politician_context
```
politician_id  UUID  NOT NULL  FK → essentials.politicians.id
topic_id       UUID  NOT NULL  FK → inform.compass_topics.id
reasoning      TEXT  NOT NULL
sources        TEXT[]  NOT NULL  DEFAULT '{}'
```

PK: `(politician_id, topic_id)`

This table holds the citation. `reasoning` contains the narrative explanation. `sources` is an array of URL strings.

### Ingestion SQL Pattern (modeled on Hydee Feldstein Soto production rows)

```sql
-- For a placed stance (value found):
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES (
  '0f6484bd-2fc1-4071-9648-d7b8a950d29c',  -- Ashouri
  '9db07b16-1076-4b7d-ad89-ebe7b51f4336',  -- judicial-criminal-justice
  2
)
ON CONFLICT (politician_id, topic_id) DO UPDATE
  SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES (
  '0f6484bd-2fc1-4071-9648-d7b8a950d29c',
  '9db07b16-1076-4b7d-ad89-ebe7b51f4336',
  'Ashouri advocates for "a more humane approach to prosecution" — addressing root causes, training attorneys to recognize constitutional violations and not file those cases. Opposes overpolicing as leading to racial profiling and criminalization of poverty. Explicitly supports diversion and restorative justice. Aligns with stance 2: fair chance to make things right through treatment/community service.',
  ARRAY[
    'https://laist.com/news/politics/voter-guides/2026-election-california-primary-la-city-attorney',
    'https://patch.com/california/los-angeles/meet-aida-ashouri-candidate-los-angeles-city-attorney'
  ]
)
ON CONFLICT (politician_id, topic_id) DO UPDATE
  SET reasoning = EXCLUDED.reasoning,
      sources = EXCLUDED.sources;

-- For a "not found" result (no politician_answers row; only politician_context):
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES (
  '6cd2e87b-7366-429a-a049-990751bd647f',  -- McKinney
  '6674d87e-999d-433a-aab7-3f626f59fd5f',  -- judicial-transparency
  'Researched 2026-05-09 — no public record found. Checked: LAist voter guide, Patch candidate profile, mckinney4la.com, Daily Journal endorsement article.',
  '{}'
)
ON CONFLICT (politician_id, topic_id) DO UPDATE
  SET reasoning = EXCLUDED.reasoning,
      sources = EXCLUDED.sources;
-- NOTE: No politician_answers row for this case.
```

**CRITICAL — Missing data implementation:** The CONTEXT.md describes "insert a row with null value." The DB schema does NOT permit null values in `politician_answers.value`. The correct implementation for "not found" is:
- Do NOT insert a `politician_answers` row
- DO insert a `politician_context` row with reasoning = "researched YYYY-MM-DD — no public record found" and sources = `'{}'`
- This matches the intent (distinguishing "unchecked" from "checked, nothing found") while respecting the schema constraint

---

## Candidate Research Findings (MEDIUM confidence — multiple web sources, not formal questionnaires)

### Important Correction: Ashouri's Background

Aida Ashouri is NOT a current LA City Council member. She was elected to the Los Feliz Neighborhood Council (2021–2025) and served on the Griffith Park Advisory Board (2022–2024). She is a lawyer (former deputy city attorney in LA and San Diego, staff attorney at Public Counsel and Legal Aid Foundation). There is NO legislative voting record to mine for her. The CONTEXT.md's framing of "voting record is a first-class source" for Ashouri was based on a misidentification — she has no council votes.

Source hierarchy for all three candidates: fixed four-category checklist for attorney candidates without a voting record.

### Primary Sources Confirmed Available

**LAist voter guide (best single source — covers all three):**
- URL: https://laist.com/news/politics/voter-guides/2026-election-california-primary-la-city-attorney
- Contains: policy positions, direct quotes, background on all candidates

**Patch candidate profiles (per-candidate):**
- Ashouri: https://patch.com/california/los-angeles/meet-aida-ashouri-candidate-los-angeles-city-attorney
- McKinney: https://patch.com/california/los-angeles/meet-john-mckinney-candidate-los-angeles-city-attorney
- Roy: (check https://patch.com/california/los-angeles for Roy profile)

**Campaign websites:**
- Ashouri: https://aida4la.com/ (limited policy detail — mainly bio/issue framing)
- McKinney: https://mckinney4la.com/ (platform with priority list)
- Roy: https://www.marissaroy.com/ (general platform, limited detail)

**LA Forward voter guide (progressive focus — strongest for Roy):**
- URL: https://www.laforward.org/voterguide
- Contains Roy endorsement rationale with policy detail; characterizes McKinney as "tough on crime/carceral"

**SPNA DTLA article:**
- URL: https://www.spna-dtla.org/blog/la-city-attorney-race-4-candidates-their-views
- Covers all four candidates with policy summaries

**AOL/LA Times syndicated piece:**
- URL: https://www.aol.com/news/guide-l-city-attorneys-race-100000010.html
- Useful for direct candidate quotes on prosecution and vehicular crime

**JEEC/LACBA:** The LACBA JEEC only evaluates Superior Court judicial candidates, NOT City Attorney candidates. All four City Attorney candidates have "Not evaluated — office not covered by LACBA JEEC" entries already in `essentials.judicial_evaluations` (confirmed from Phase 29). No bar association questionnaire will be found for this race.

**Vote411:** No Vote411 results found for this race — not indexed. Category 3 of the fixed checklist likely yields "not found" for all three candidates.

**DSA-LA voter guide:** PDF at https://dsa-la.org/wp-content/uploads/2026/05/2026_primary_voter_guide-1.pdf — check for Roy and Ashouri positions.

**Knock LA / Abundant Housing LA:** Not yet checked — these are part of category 4 (local endorsing org questionnaires). Should be checked during actual research plans.

### Preliminary Evidence by Candidate and Topic

#### Aida Ashouri

**judicial-criminal-justice** → Likely value 2
- "More humane approach to prosecution." Diversion, restorative justice, mediation. Dismissed cases as San Diego deputy where constitutional rights violated or evidence insufficient. Opposes "criminalization of poverty."
- Sources: LAist voter guide, Patch profile, SPNA article, aola.com piece

**judicial-access-to-justice** → Likely value 1-2
- Wants to reopen Code Enforcement Unit, champion renters' rights, eliminate expensive outsourcing to big law firms. Frames access to the legal system as a core justice issue. "Beacon of championing renters' rights."
- Sources: LAist voter guide, aida4la.com

**judicial-prosecution-priorities** → Likely value 1-2
- Prosecution as last resort framing; mediation/diversion as preferred tool. Focus on vehicular crimes and constitutional violations, but explicitly opposes overpolicing/overcriminalization.
- Sources: LAist, SPNA, Patch

**judicial-police-accountability** → Likely value 1-2
- "Protect the right to protest and freedom from unreasonable search and seizure." Train attorneys to decline cases where constitutional rights were violated (disincentivizing LAPD improper arrests). Reform the criminal division.
- Sources: LAist, SPNA, aida4la.com

**judicial-transparency** → Likely value 1-2
- Wants office "accountable to the people of Los Angeles." Eliminate outsourcing, create focused units. General transparency framing, but limited specific statements on court record transparency.
- Sources: aida4la.com, LAist

**judicial-government-deference** → Uncertain — needs deeper research
- Background in tenant/immigration/civil rights work suggests citizen-favoring approach, but as City Attorney she represents the city. Less direct evidence found.

#### John McKinney

**judicial-criminal-justice** → Likely value 4
- "Enforce the law fairly and without fear or favor." Focus on repeat offenders, quality-of-life crimes. "Compassionate accountability" as secondary framing (diversion described as a tool alongside enforcement). Primary posture is deterrence.
- Endorsed by DA Nathan Hochman and LAPD Police Protection League — strong signal.
- Sources: Patch, LAist, Daily Journal (endorsement article), mckinney4la.com

**judicial-prosecution-priorities** → Likely value 4
- "Prosecute repeat offenders, retail theft, organized shoplifting, illegal firearms, street racing, open-air drug markets." Diversion is a secondary "tool" alongside prosecution, not the primary posture. "Declination is the exception."
- Sources: Patch (mckinney profile), mckinney4la.com, LAist

**judicial-police-accountability** → Likely value 3-4
- Backs police (endorsed by police union). Criticizes incumbent for mismanagement allowing LAPD data breach. Commits to "transparency, integrity, and accountability" but from a defender posture.
- Sources: Daily Journal, Patch, LAist

**judicial-access-to-justice** → Likely value 3
- "Common sense, pragmatic, moderate, proportional approach." Not the plaintiff-access framing; more traditional bar-of-justice framing. No explicit pro-access-to-courts positions found.
- Sources: LAist, Patch

**judicial-transparency** → Uncertain — limited evidence
- Criticizes incumbent for LAPD data breach cover-up and conflicts of interest. General "transparency and accountability" commitment. Needs more specific evidence.
- Sources: Patch

**judicial-government-deference** → Likely value 3-4
- As a career prosecutor working within the system, institutional deference is implied. No strong citizen-rights-over-government statements found.
- Sources: LAist, Patch

#### Marissa Roy

**judicial-criminal-justice** → Likely value 2
- "Restore and scale up diversion programs." Diversion as primary response to nonviolent crime. "Breaking cycles of criminalization." Evidence-based public safety with community input. But not abolition of prosecution — "right-sizing and tailoring."
- Sources: Patch (Roy profile), LA Forward voter guide, LAist, marissaroy.com

**judicial-prosecution-priorities** → Likely value 2
- "Diversion is a tailored, court-supervised program." Prosecution reserved for when "community safety actually requires it." Proposes Tenants' Rights Team, wage theft enforcement — civil/regulatory emphasis over misdemeanor prosecution.
- Sources: Patch, LAist, LA Forward

**judicial-police-accountability** → Likely value 1-2
- Criticizes incumbent for "overly aggressive suing of journalists and protesters." Proposes LAPD follow-through on recommendations from costly litigation. "Smart public safety" framing.
- Sources: SPNA, LAist, LA Forward

**judicial-access-to-justice** → Likely value 1-2
- "Largest public interest law firm in Los Angeles." Renter/worker/consumer protection as core mandate. Proposes Tenants' Rights Team. Liability reduction through case valuation panels and Controller audits (efficiency, not restriction).
- Sources: LA Forward, Patch, marissaroy.com

**judicial-transparency** → Likely value 1-2
- "Restore integrity to the Office." "Uphold the highest standards of accountability, transparency and integrity." General commitment but limited specific court-transparency statements.
- Sources: marissaroy.com, Patch

**judicial-government-deference** → Likely value 1-2
- Explicitly frames the office as serving workers, renters, and consumers against powerful interests. Anti-establishment posture. "Restore integrity" over defending city decisions reflexively.
- Sources: marissaroy.com, LA Forward, LAist

---

## Architecture Patterns

### Two-Table Write Pattern (confirmed from Hydee Feldstein Soto production rows)

Every stance ingestion requires two writes:
1. `inform.politician_answers` — the numeric value (1–5)
2. `inform.politician_context` — reasoning narrative + sources array

Both use `ON CONFLICT ... DO UPDATE` for idempotency.

For "not found" topics: write only `politician_context` (reasoning = "researched YYYY-MM-DD — no public record found", sources = `'{}'`).

### Compass Rendering Threshold

From CONTEXT.md (confirmed from Phase 18 research): The compass section hides entirely if fewer than 3 placed stances exist. "Placed stances" means rows in `politician_answers` — `politician_context`-only "not found" rows do NOT count toward the threshold. Given 6 topics and expected strong coverage for Ashouri and Roy, threshold should be met. McKinney's coverage may be thinner (4–5 topics likely covered).

### Migration vs. Direct SQL

Based on Phase 29 pattern, ingestion goes through SQL scripts applied via psql. No API call needed — direct SQL with ON CONFLICT guards. No new migration file is strictly required (no schema changes); this is data ingestion. Whether to use a numbered migration file or ad-hoc SQL is a planner decision.

---

## Source Category Checklist Status (per CONTEXT.md decisions)

For McKinney and Roy (no voting record — fixed four-category checklist):

| Category | LA-specific equivalent | Status |
|----------|------------------------|--------|
| 1. Bar association questionnaire | LACBA / JEEC | **NOT APPLICABLE** — JEEC only covers Superior Court judges, not City Attorney |
| 2. Major regional newspaper voter guide | LA Times voter guide | Not yet fetched directly — LAist voter guide confirmed available (similar coverage) |
| 3. LWV / Vote411 | Vote411 | **Not found** — no Vote411 results for this race |
| 4. Local endorsing org questionnaires | Knock LA, Abundant Housing LA, LA Times editorial board | Not yet checked — research plans should fetch these |

For Ashouri: same checklist (no legislative voting record — the council misidentification has been corrected).

**Key gap:** Knock LA and Abundant Housing LA questionnaires not yet fetched. These could yield the most detailed policy Q&A responses. The LA Times editorial board endorsement process often includes published questionnaire responses. These should be priority fetches in the actual research plan tasks.

---

## Common Pitfalls

### Pitfall 1: Ashouri Has No City Council Voting Record
**What goes wrong:** The CONTEXT.md mentions "candidates with a legislative voting record (e.g., Ashouri — current LA City Council member)" — but this is factually incorrect. Ashouri has never been a City Council member; she served on the neighborhood council (advisory only, no legislative votes). Treating her as having a voting record wastes research time and finds nothing.
**How to avoid:** Treat Ashouri identically to McKinney and Roy — use the fixed four-category checklist. Her background is legal services, not elected office.

### Pitfall 2: NULL Value Cannot Be Inserted in politician_answers
**What goes wrong:** CONTEXT.md says "insert a row with null value" for missing data. The DB enforces `value IS NOT NULL` — this will fail.
**How to avoid:** For "not found" topics, insert only a `politician_context` row with the "researched" note. Do NOT insert a `politician_answers` row. The topic will be hidden from the voter-facing profile (no `politician_answers` row = not counted toward the 3-stance threshold = if < 3 stances total, compass section hidden).

### Pitfall 3: Value Is a Description Match, Not a Liberal-Conservative Dial
**What goes wrong:** Assigning values 1-2 as "progressive/liberal" and 4-5 as "conservative." For example, judicial-government-deference value 1 favors citizens over government — a McKinney-style prosecutor who sides with law enforcement would score higher (government-favoring) on this topic.
**How to avoid:** Read each specific stance description and match candidate statements to the nearest description. Never assign based on political label.

### Pitfall 4: Citing Prohibited Sources
**What goes wrong:** Using advocacy scorecard ratings (e.g., ACLU rating, endorsement scorecards) as the basis for a value placement.
**How to avoid:** Explicitly prohibited by CONTEXT.md. Endorsements (LA Forward endorsing Roy) can point to where to look, but the endorsement itself is not a citation — the underlying policy positions they describe are.

### Pitfall 5: Paywalled LA Times Content
**What goes wrong:** LA Times voter guide may be paywalled, preventing direct access to questionnaire responses.
**How to avoid:** Treat as inaccessible (equivalent to not found for that source). LAist voter guide is free access and covers similar ground. Use LAist as the primary newspaper category source.

### Pitfall 6: judicial-government-deference Topic Framing for City Attorney
**What goes wrong:** This topic is labeled "Judicial & Prosecutorial Discretion" but the stance descriptions are phrased around "who should win — citizen or government?" For a City Attorney who represents the city, this topic captures whether they reflexively defend city decisions or exercise independent judgment.
**How to avoid:** For City Attorney candidates, the framing is: does the candidate see their role as defending the city government by default (values 4-5), maintaining balance (3), or viewing their duty as primarily protecting individual rights against city overreach (1-2)?

---

## SQL Verification Queries

After ingestion for each candidate, verify:

```sql
-- Count placed stances (politician_answers rows) per candidate
SELECT 
  p.first_name || ' ' || p.last_name AS candidate,
  COUNT(pa.topic_id) AS placed_stances
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
WHERE p.id IN (
  '0f6484bd-2fc1-4071-9648-d7b8a950d29c',  -- Ashouri
  '6cd2e87b-7366-429a-a049-990751bd647f',  -- McKinney
  '7157dd95-0f1b-4e05-bd4f-39317345b47c'   -- Roy
)
GROUP BY p.first_name, p.last_name;

-- Verify context rows (citations) written
SELECT 
  p.first_name || ' ' || p.last_name AS candidate,
  ct.topic_key,
  pa.value,
  pc.reasoning,
  pc.sources
FROM essentials.politicians p
LEFT JOIN inform.politician_answers pa ON pa.politician_id = p.id
LEFT JOIN inform.compass_topics ct ON ct.id = pa.topic_id
LEFT JOIN inform.politician_context pc ON pc.politician_id = pa.politician_id AND pc.topic_id = pa.topic_id
WHERE p.id IN (
  '0f6484bd-2fc1-4071-9648-d7b8a950d29c',
  '6cd2e87b-7366-429a-a049-990751bd647f',
  '7157dd95-0f1b-4e05-bd4f-39317345b47c'
)
ORDER BY candidate, ct.topic_key;
```

---

## Open Questions

1. **Knock LA and Abundant Housing LA questionnaires**
   - What we know: These are listed in the fixed source checklist (category 4). Not fetched during research.
   - What's unclear: Whether they published full Q&A responses for City Attorney candidates.
   - Recommendation: Each plan's research agent should fetch these as first priority — they may yield the most detailed policy positions.

2. **LA Times editorial board questionnaire responses**
   - What we know: LA Times publishes editorial board endorsements with detailed candidate questionnaire responses. LA Times endorsed Roy (inferred from coverage patterns).
   - What's unclear: Whether the full questionnaire Q&A is publicly accessible or paywalled.
   - Recommendation: Attempt fetch; treat as inaccessible if paywalled.

3. **judicial-government-deference for Ashouri and McKinney**
   - What we know: Limited direct evidence found. Ashouri's civil rights background suggests citizen-favoring; McKinney's prosecutor background suggests government-favoring.
   - Recommendation: Research agent should check for direct statements on prosecutorial discretion (when to exercise independent judgment vs. reflexively pursuing cases).

4. **Voting record misidentification in CONTEXT.md**
   - Clarification needed: CONTEXT.md says Ashouri is "current LA City Council member" — she is not. She was elected to the Los Feliz Neighborhood Council (advisory only). The planner should use the fixed four-category checklist for Ashouri, not a voting record search.

---

## Sources

### Primary (HIGH confidence — directly queried)
- Production DB (`inform.compass_topics`, `inform.compass_stances`, `inform.compass_topic_roles`) — topic IDs, stance descriptions
- Production DB (`essentials.politicians`) — politician IDs confirmed
- Production DB (`inform.politician_answers`, `inform.politician_context`) — zero existing rows; schema and constraint details
- Phase 18 RESEARCH.md — two-table ingestion pattern and FK architecture

### Secondary (MEDIUM confidence — multiple sources, not formal questionnaires)
- LAist voter guide: https://laist.com/news/politics/voter-guides/2026-election-california-primary-la-city-attorney
- Patch candidate profiles: Ashouri, McKinney
- SPNA DTLA article: https://www.spna-dtla.org/blog/la-city-attorney-race-4-candidates-their-views
- LA Forward voter guide: https://www.laforward.org/voterguide
- AOL/LA Times syndicated piece: https://www.aol.com/news/guide-l-city-attorneys-race-100000010.html
- marissaroy.com: https://www.marissaroy.com/
- mckinney4la.com: https://mckinney4la.com/
- aida4la.com: https://aida4la.com/

### Tertiary (LOW confidence — not yet checked)
- Knock LA questionnaire — should be checked by research agents
- Abundant Housing LA questionnaire — should be checked by research agents
- LA Times editorial board responses — may be paywalled

---

## Metadata

**Confidence breakdown:**
- DB schema and IDs: HIGH — directly queried from production
- Stance descriptions: HIGH — directly queried from production
- Source availability: MEDIUM — web sources confirmed, formal questionnaires not found
- Preliminary value estimates: LOW-MEDIUM — based on news coverage, not formal questionnaires; research agents must validate

**Research date:** 2026-05-09
**Valid until:** 2026-06-02 (primary election date — content may change)
