# Phase 29: Bar Evaluation Data - Research

**Researched:** 2026-05-09
**Domain:** Data ingestion (LACBA ratings, CA State Bar discipline, CJP censures) + DB migration + Express backend endpoint + React frontend section
**Confidence:** HIGH — all critical findings from direct source inspection and live DB queries

---

## Summary

Phase 29 stores bar evaluation data (LACBA ratings, CA State Bar discipline, CJP censures) for LA legal candidates and surfaces that data on legal candidate profile pages. The core finding is that the DB already has the right tables (`essentials.judicial_evaluations`, `essentials.judicial_disciplinary_records`) and the `@empoweredvote/ev-ui` `JudicialScorecard` component already renders those tables — so most data is already plumbed. The main work is: (1) insert the 2026 data into those tables via migrations, (2) create politician records for the challenger candidates who don't have them yet, and (3) build a new `BarEvaluationSection.jsx` frontend component for legal candidates where the JudicialScorecard in ev-ui doesn't provide enough control.

**Critical scope clarification:** LACBA's JEEC (Judicial Elections Evaluation Committee) evaluates ONLY contested Superior Court judicial races — it does NOT evaluate City Attorney candidates. The City Attorney candidates (Ashouri, McKinney, Roy, Feldstein Soto) will have "Not evaluated by LACBA" status, with CA State Bar license status and CJP-not-applicable notes instead.

**Primary recommendation:** Reuse `essentials.judicial_evaluations` for LACBA ratings and `essentials.judicial_disciplinary_records` for CJP and State Bar discipline. Insert 2026 data via numbered SQL migrations (next is 117). Build `BarEvaluationSection.jsx` as a sibling to `JudicialCompassSection.jsx` that reads from `judicialRecord` data already fetched by `Profile.jsx`.

---

## Standard Stack

No new libraries needed. All work uses the existing stack.

### Core (already in use)
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| PostgreSQL (Supabase) | current | essentials.judicial_evaluations + judicial_disciplinary_records | Tables already exist and are public-read |
| Express TypeScript | current | essentialsProfileService.ts → GET /judicial-record | Endpoint already exists |
| React 19 + JSX | current | BarEvaluationSection.jsx (new component) | Sibling to JudicialCompassSection.jsx |
| @empoweredvote/ev-ui | current | JudicialScorecard renders evaluations + disciplinary_records | Already wired in PoliticianProfile; see note below |
| Supabase psql | current | Migration execution | pool.query() pattern in service; psql for migrations |

### No new npm packages required.

---

## Data Sources — Confirmed Accessible

### LACBA (lacba.org)
- **What it rates:** Contested Superior Court races only. Does NOT rate City Attorney, City Controller, or executive races.
- **Rating scale (confirmed):** Exceptionally Well Qualified / Well Qualified / Qualified / Not Qualified
- **2026 report:** Published at https://lacba.org/?pg=2026-report (403 behind login) and mirrored at https://www.einpresswire.com/article/907838894/lacba-judicial-elections-evaluation-committee-announces-2026-ratings (accessible)
- **PDF:** https://0e190a550a8c4c8c4b93-fcd009c875a5577fd4fe2f5b7e3bf4eb.ssl.cf2.rackcdn.com/EINPresswire-907838894-lacba-judicial-elections-evaluation-committee-announces-2026-ratings-2.pdf (accessible)
- **Source URL for each rating:** Use the EIN Presswire article URL as source_url since lacba.org is 403

### CA State Bar (search.calbar.ca.gov / apps.calbar.ca.gov)
- **What it shows:** Attorney license status, admission date, public discipline actions
- **Search URL pattern:** `https://apps.calbar.ca.gov/attorney/Licensee/Detail/{bar_number}`
- **Note:** These pages are JavaScript-rendered and don't WebFetch well. Must be researched manually by visiting the URL in a browser or via a sub-agent with browser access.
- **City Attorney candidate bar numbers (confirmed via WebSearch):**
  - Aida Ashouri: #300502 — https://apps.calbar.ca.gov/attorney/Licensee/Detail/300502
  - John McKinney (John Edward): #194455 — https://apps.calbar.ca.gov/attorney/Licensee/Detail/194455
  - Marissa Roy: #318773 — https://apps.calbar.ca.gov/attorney/Licensee/Detail/318773
  - Hydee Feldstein Soto: #106866 — https://apps.calbar.ca.gov/attorney/Licensee/Detail/106866
- **For judicial challengers:** Bar numbers must be looked up during research. Search by name at https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch

### CJP (cjp.ca.gov)
- **What it shows:** Public censures and admonishments for California judges
- **Key pages:**
  - Public decisions: https://cjp.ca.gov/decisions_by_judges/ (alphabetical, accessible)
  - Pending cases: https://cjp.ca.gov/pending_cases/ (recent actions, accessible)
  - Annual report: https://cjp.ca.gov/wp-content/uploads/sites/40/2026/03/2025-Annual-Report_ADA.pdf
- **Applicability:** CJP covers sitting judges only. For challenger candidates (attorneys who are not yet judges), CJP has no record — this is documented "N/A" status, not missing data.
- **For City Attorney candidates:** CJP does not cover non-judicial offices. Document as "Not applicable."

---

## Complete 2026 LA Legal Candidates (Confirmed)

### City Attorney Race (4 candidates, all in DB)

| Candidate | Politician ID | LACBA | CJP | State Bar# |
|-----------|--------------|-------|-----|------------|
| Hydee Feldstein Soto (incumbent) | 3f90952e-7d1b-413d-a0e1-e319fb23fa05 | Not evaluated (City Attorney) | N/A | #106866 |
| Aida Ashouri | 0f6484bd-2fc1-4071-9648-d7b8a950d29c | Not evaluated (City Attorney) | N/A | #300502 |
| John McKinney | 6cd2e87b-7366-429a-a049-990751bd647f | Not evaluated (City Attorney) | N/A | #194455 |
| Marissa Roy | 7157dd95-0f1b-4e05-bd4f-39317345b47c | Not evaluated (City Attorney) | N/A | #318773 |

### Contested Superior Court Races (June 2, 2026) — LACBA Ratings Confirmed

**Office 2:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Hon. Robert S. Draper | Incumbent, IN DB | fa932212-a2cf-4fa1-97ab-c6619e3db610 | Not Qualified |
| Tal K. Valbuena | Challenger, NOT in DB | — | Qualified |

**Office 14:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Angie Christides | Challenger, NOT in DB | — | Qualified |
| Irene Lee | Challenger, NOT in DB | — | Well Qualified |

**Office 64:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Francisco Amador | Challenger, NOT in DB | — | Not Qualified |
| Maria Ghobadi | Challenger, NOT in DB | — | Well Qualified |
| Rhonda A. Haymon | Challenger, NOT in DB | — | Qualified |

**Office 65:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Justin Allen Clayton | Challenger, NOT in DB | — | Qualified |
| Chellei G. Jimenez | Challenger, NOT in DB | — | Qualified |
| Samuel Wolloch Krause | Challenger, NOT in DB | — | Qualified |
| Anna Slotky Reitano | Challenger, NOT in DB | — | Qualified |

**Office 66:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Ben Forer | Challenger, NOT in DB | — | Well Qualified |
| Cheryl C. Turner | Challenger, NOT in DB | — | Qualified |

**Office 81:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Dan Kapelovitz | Challenger, NOT in DB | — | Qualified |
| Hon. David B. Walgren | Incumbent, IN DB | 1ce3f260-d267-4569-993b-47f8dd8b0842 | Exceptionally Well Qualified |

**Office 87:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Anthony (A.J.) Bayne | Challenger, NOT in DB | — | Well Qualified |
| David DeJute | Challenger, NOT in DB | — | Qualified |
| Sharee Sanders Gordon | Challenger, NOT in DB | — | Qualified |

**Office 116:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Hon. Patrick Connolly | Incumbent, IN DB | 53fd1ed7-b8f2-4c0b-a973-3592e4457472 | Well Qualified |
| Paul A. Thompson | Challenger, NOT in DB | — | Qualified |

**Office 131:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Carlos Dammeier | Challenger, NOT in DB | — | Qualified |
| David Ross | Challenger, NOT in DB | — | Qualified |
| Troy W. Slaten | Challenger, NOT in DB | — | Qualified |
| Donna Tryfman | Challenger, NOT in DB | — | Qualified |

**Office 176:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Gloria Marin | Challenger, NOT in DB | — | Well Qualified |
| Zachary Smith | Challenger, NOT in DB | — | Qualified |

**Office 181:**
| Candidate | Status | DB politician_id | LACBA 2026 Rating |
|-----------|--------|-----------------|-------------------|
| Ryan Dibble | Challenger, NOT in DB | — | Well Qualified |
| Thanayi Lindsey | Challenger, NOT in DB | — | Not Qualified |

### Uncontested Races (LACBA does not evaluate)
Offices 39, 60, 141, 196 have single unopposed candidates. LACBA did not publish ratings for these.

---

## Database Schema — Existing Tables (No New Tables Needed)

### essentials.judicial_evaluations (existing, confirmed)
```sql
id            UUID PRIMARY KEY
politician_id UUID NOT NULL  -- FK to essentials.politicians
source        TEXT           -- e.g. "LACBA Judicial Elections Evaluation Committee"
rating        TEXT           -- e.g. "Well Qualified", "Active", "Not evaluated"
rating_date   TEXT           -- date string, e.g. "2026-06-02"
source_url    TEXT           -- URL to source document
details       TEXT           -- optional notes
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
-- UNIQUE(politician_id, source, rating_date)
```

**LACBA 2026 insert pattern (for each rated candidate):**
```sql
INSERT INTO essentials.judicial_evaluations
  (politician_id, source, rating, rating_date, source_url, details)
VALUES
  ('<uuid>', 'LACBA Judicial Elections Evaluation Committee', 'Well Qualified', '2026-06-02',
   'https://www.einpresswire.com/article/907838894/lacba-judicial-elections-evaluation-committee-announces-2026-ratings',
   'Office No. 116 — contested race, June 2 primary')
ON CONFLICT (politician_id, source, rating_date) DO NOTHING;
```

**CA State Bar insert pattern:**
```sql
INSERT INTO essentials.judicial_evaluations
  (politician_id, source, rating, rating_date, source_url, details)
VALUES
  ('<uuid>', 'California State Bar', 'Active', '2026-05-09',
   'https://apps.calbar.ca.gov/attorney/Licensee/Detail/<bar_number>',
   'No public discipline on record as of 2026-05-09')
ON CONFLICT (politician_id, source, rating_date) DO NOTHING;
```

### essentials.judicial_disciplinary_records (existing, confirmed)
```sql
id            UUID PRIMARY KEY
politician_id UUID NOT NULL
record_type   TEXT  -- e.g. "Public Admonishment", "Public Censure", "State Bar Discipline"
record_date   TEXT  -- date string
description   TEXT  -- brief description of the discipline
source_url    TEXT  -- URL to official document
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
-- UNIQUE(politician_id, record_type, record_date)
```

**CJP discipline insert pattern:**
```sql
INSERT INTO essentials.judicial_disciplinary_records
  (politician_id, record_type, record_date, description, source_url)
VALUES
  ('53fd1ed7-b8f2-4c0b-a973-3592e4457472',
   'Public Admonishment', '2021-04-02',
   'CJP public admonishment for course of conduct reflecting embroilment with defense attorney and abuse of authority.',
   'https://cjp.ca.gov/wp-content/uploads/sites/40/2021/04/Connolly_DO_Pub_Adm_4-2-2021.pdf')
ON CONFLICT (politician_id, record_type, record_date) DO NOTHING;
```

---

## Known CJP Discipline for 2026 Candidates (Confirmed)

Judge Patrick Connolly (politician_id: `53fd1ed7-b8f2-4c0b-a973-3592e4457472`) has **three CJP disciplinary actions** (confirmed via cjp.ca.gov/decisions_by_judges/ and WebSearch):

| Date | Type | Source URL |
|------|------|-----------|
| ~2016-03-24 | Public Admonishment | https://cjp.ca.gov/wp-content/uploads/sites/40/2016/08/Connolly-03-24-2016.pdf (approx URL — verify) |
| 2021-04-02 | Public Admonishment | https://cjp.ca.gov/wp-content/uploads/sites/40/2021/04/Connolly_DO_Pub_Adm_4-2-2021.pdf |
| Date unknown | Third action (type TBD) | https://cjp.ca.gov/public-decisions/connolly/ |

The news from 2021 references "third time disciplined." The CJP decisions page at https://cjp.ca.gov/public-decisions/connolly/ lists all actions and should be fetched during execution of Plan 29-02.

Judges Draper and Walgren: No CJP discipline found.

**Recent LA County CJP actions (confirmed from cjp.ca.gov/pending_cases/ as of 2026-05-09):**
- Judge Debra R. Archuleta — Public Admonishment (12/18/25) — NOT running in 2026
- Judge James A. Kaddo, Ret. — Public Admonishment (7/15/25) — NOT running in 2026
- Judge Enrique Monguia — Public Admonishment (8/28/25) — NOT running in 2026
- None of these are 2026 candidates.

---

## Challenger Candidates — Politician Records Need Creation

29 of the 32 judicial challengers do NOT have politician records in `essentials.politicians`. Plan 29-01 must create politician records for each one before LACBA data can be linked via `politician_id`.

**Pattern for creating challenger politician records (from prior phases):**

```sql
-- Insert minimal challenger politician record
INSERT INTO essentials.politicians
  (full_name, first_name, last_name, is_incumbent, is_active, data_source)
VALUES
  ('Tal K. Valbuena', 'Tal', 'Valbuena', false, true, 'manual_phase29')
RETURNING id;
-- Then: link to race_candidates and insert judicial_evaluations row
```

The race_candidates table already has `full_name` for each challenger but `politician_id` is NULL. After creating politician records, update race_candidates to set politician_id.

---

## Architecture Patterns

### Plan 29-01: LACBA Ratings Migration
1. For incumbents in DB (Draper, Walgren, Connolly): INSERT evaluation rows directly using existing politician_id.
2. For challengers NOT in DB (29 candidates): INSERT politician rows first, then INSERT evaluation rows, then UPDATE race_candidates.politician_id.
3. For uncontested race candidates (Offices 39, 60, 141, 196): Insert as "Not evaluated by LACBA" into judicial_evaluations with source_url pointing to LACBA JEEC page.
4. For City Attorney candidates: Insert as "Not evaluated by LACBA — office not covered by JEEC" into judicial_evaluations.

**Important:** The `judicial_evaluations` UNIQUE constraint is `(politician_id, source, rating_date)`. Use `ON CONFLICT ... DO NOTHING`.

### Plan 29-02: State Bar + CJP Research Migration
1. For each candidate: look up calbar.ca.gov profile (bar number needed), record clean/disciplined status.
2. For sitting judges (Draper, Walgren, Connolly): check CJP at cjp.ca.gov/decisions_by_judges/. Connolly has 3 known actions — all 3 should be inserted.
3. For challengers who are not sitting judges: CJP does not apply, document as "N/A."
4. Store results in `judicial_evaluations` (CA State Bar license status) and `judicial_disciplinary_records` (any discipline).

### Plan 29-03: Backend + Frontend

**Backend:** The `/api/essentials/politicians/:id/judicial-record` endpoint already exists and returns `evaluations` and `disciplinary_records`. No new endpoint needed.

**Challenge — challengers without politician records in DB flow:**
`CandidateProfile.jsx` uses `fetchRaceCandidate(id)` and then `fetchPolitician(candidate.politician_id)`. If `politician_id` is populated (which it will be after Plan 29-01), the existing flow works.

**Frontend component placement:**
- In `Profile.jsx`: Add `<BarEvaluationSection judicialRecord={judicialRecord} officeTitle={pol.office_title} />` after `<JudicialCompassSection>`.
- In `CandidateProfile.jsx`: Same placement after the JudicialCompassSection branch.
- The `judicialRecord` state is already fetched by both Profile.jsx and CandidateProfile.jsx.

**Component behavior:**
- Render when `judicialRecord.evaluations.length > 0` OR `judicialRecord.disciplinary_records.length > 0`.
- Filter evaluations to show LACBA and CA State Bar rows.
- Filter disciplinary records to show CJP and State Bar discipline rows.
- Each row shows: source + rating + source link (for evaluations), or record_type + date + description + source link (for discipline).
- No authentication required — all data is public.

**Alternative:** The ev-ui `JudicialScorecard` component already renders this exact data inside `PoliticianProfile`. Before building `BarEvaluationSection.jsx`, verify whether `JudicialScorecard` already displays it sufficiently. If JudicialScorecard already renders evaluations + disciplinary records in PoliticianProfile, no new component may be needed — Plan 29-03 reduces to "populate data, verify rendering."

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Evaluation storage | New `bar_evaluations` table | Existing `judicial_evaluations` table | Already has right schema, RLS, UNIQUE constraint, public read policy |
| Discipline storage | New `bar_discipline` table | Existing `judicial_disciplinary_records` table | Already in API response shape from essentialsProfileService.ts |
| Evaluation rendering | New custom UI from scratch | Check ev-ui JudicialScorecard first | PoliticianProfile already renders evaluations+disciplinary_records via JudicialScorecard |
| State Bar API | Web scraper | Manual research + one-time SQL insert | State Bar pages are JS-rendered; batch research is the established pattern for this project |
| LACBA API | Web scraper | One-time SQL migration | LACBA data changes only at election time; batch insert is correct |

---

## Common Pitfalls

### Pitfall 1: LACBA Does Not Rate City Attorney Candidates
**What goes wrong:** Plan inserts "Not rated" for City Attorney candidates as if LACBA covered that race.
**Why it happens:** The requirement says "LACBA ratings for all current LA legal candidates" — but LACBA JEEC only covers Superior Court.
**How to avoid:** Use `source = 'LACBA Judicial Elections Evaluation Committee'` with `rating = 'Not evaluated — office not covered by JEEC'` and `source_url` pointing to the JEEC page.
**Verified:** Multiple sources confirm JEEC is Superior Court only.

### Pitfall 2: Challenger Candidates Have No Politician Records
**What goes wrong:** INSERT into `judicial_evaluations` fails because `politician_id` FK doesn't exist for challengers.
**Why it happens:** Only incumbents have politician records. 29 of 32 judicial challengers are not in `essentials.politicians`.
**How to avoid:** Plan 29-01 must CREATE politician records for all challengers before inserting evaluation data. Then UPDATE race_candidates.politician_id to link them.
**Confirmed:** Only Draper, Walgren, Connolly exist in DB.

### Pitfall 3: Race Records for Superior Court Races Don't Exist Yet
**What goes wrong:** There are no `races` rows for Superior Court Office 2, 14, 64, etc. in the June 2026 LA election.
**Why it happens:** The DB has the City Attorney race but not the judicial races — they weren't created in prior phases.
**Implication:** Plan 29-01 must also create race + races rows for each judicial race before linking race_candidates.
**Confirmed:** DB query showed zero Superior Court races in the June 2026 election (election_id: 1ebca37f-cf96-47f4-bc2b-47ef266721fe).

### Pitfall 4: `judicial_disciplinary_records` UNIQUE constraint is (politician_id, record_type, record_date)
**What goes wrong:** Connolly has two admonishments on different dates. The unique key includes `record_date`, so two rows with different dates are fine. But if record_date is NULL for both, the constraint is not enforced (NULLs don't match in UNIQUE). Use real dates.
**How to avoid:** Always provide record_date from the CJP document.

### Pitfall 5: JudicialScorecard Already Renders This Data — Check Before Building New Component
**What goes wrong:** Plan 29-03 builds a new BarEvaluationSection component that duplicates what JudicialScorecard in ev-ui already renders.
**Why it happens:** JudicialScorecard is inside PoliticianProfile, rendering automatically when judicialRecord has data. A separate BarEvaluationSection below it would duplicate the same data.
**How to avoid:** Before building BarEvaluationSection, test with a seeded evaluation row to see if JudicialScorecard renders it visibly. If yes — no new component needed. If JudicialScorecard is too minimal or lacks the "Bar Evaluation" section label — build the separate component.

### Pitfall 6: State Bar Pages Are JavaScript-Rendered
**What goes wrong:** WebFetch on calbar.ca.gov returns navigation markup without attorney data. The bar number lookup returns no useful content.
**Why it happens:** State Bar uses a SPA-like rendering model.
**How to avoid:** Research must use a browser agent or direct manual lookup. Plan 29-02 should specify that a human visits each URL and documents the clean/discipline status with screenshot or quote. Alternatively, use WebSearch with the attorney name + "State Bar" to find public discipline news.

### Pitfall 7: uncontested_race Candidates Not in DB Yet
**What goes wrong:** Offices 39, 60, 141, 196 have single candidates running unopposed — they may or may not have politician records.
**Why it happens:** Prior phases focused on contested races.
**How to avoid:** Verify each uncontested candidate's status in DB before deciding to include or skip. Phase 29 success criteria focuses on "current LA legal candidates" — uncontested candidates are covered by BAR-01 (CA State Bar check required for all).

---

## Code Examples

### Migration Structure for 29-01 (LACBA Ratings)

```sql
-- Migration 117: Phase 29-01 — LACBA 2026 ratings for LA Superior Court candidates

BEGIN;

-- Step 1: Create LA Superior Court Office 2 race (if not exists)
INSERT INTO essentials.races (election_id, office_id, position_name)
SELECT '1ebca37f-cf96-47f4-bc2b-47ef266721fe', o.id, 'Los Angeles Superior Court Office 2'
FROM essentials.offices o
-- (need office record — see note on incumbents vs challengers)
ON CONFLICT DO NOTHING;

-- Step 2: Create politician record for challenger
INSERT INTO essentials.politicians (full_name, first_name, last_name, is_incumbent, is_active, data_source)
VALUES ('Tal K. Valbuena', 'Tal', 'Valbuena', false, true, 'manual_phase29')
RETURNING id;  -- capture UUID for next steps

-- Step 3: Insert LACBA rating
INSERT INTO essentials.judicial_evaluations
  (politician_id, source, rating, rating_date, source_url, details)
VALUES
  ('<uuid>', 'LACBA Judicial Elections Evaluation Committee', 'Qualified', '2026-06-02',
   'https://www.einpresswire.com/article/907838894/lacba-judicial-elections-evaluation-committee-announces-2026-ratings',
   'Superior Court Office No. 2 — 2026 primary')
ON CONFLICT (politician_id, source, rating_date) DO NOTHING;

COMMIT;
```

### Migration Structure for 29-02 (CJP + State Bar)

```sql
-- Connolly CJP admonishment 2021
INSERT INTO essentials.judicial_disciplinary_records
  (politician_id, record_type, record_date, description, source_url)
VALUES
  ('53fd1ed7-b8f2-4c0b-a973-3592e4457472',
   'Public Admonishment',
   '2021-04-02',
   'CJP imposed public admonishment for course of conduct reflecting embroilment with defense attorney and abuse of judicial authority.',
   'https://cjp.ca.gov/wp-content/uploads/sites/40/2021/04/Connolly_DO_Pub_Adm_4-2-2021.pdf')
ON CONFLICT (politician_id, record_type, record_date) DO NOTHING;

-- CA State Bar clean record (for a candidate with no discipline)
INSERT INTO essentials.judicial_evaluations
  (politician_id, source, rating, rating_date, source_url, details)
VALUES
  ('<uuid>',
   'California State Bar',
   'Active — No public discipline',
   '2026-05-09',
   'https://apps.calbar.ca.gov/attorney/Licensee/Detail/<bar_number>',
   'Confirmed clean record as of 2026-05-09')
ON CONFLICT (politician_id, source, rating_date) DO NOTHING;
```

### BarEvaluationSection.jsx (if ev-ui JudicialScorecard insufficient)

```jsx
// Source: Pattern from JudicialCompassSection.jsx + essentialsProfileService.ts API shape
// Only build this if JudicialScorecard in PoliticianProfile doesn't render bar data visibly enough

const BAR_ACCENT = '#1a365d';  // Dark navy — distinct from judicial burnt orange

export default function BarEvaluationSection({ judicialRecord }) {
  if (!judicialRecord) return null;
  const { evaluations = [], disciplinary_records = [] } = judicialRecord;
  
  const barEvals = evaluations.filter(e =>
    e.source?.includes('LACBA') || e.source?.includes('State Bar')
  );
  const barDisc = disciplinary_records.filter(d =>
    d.record_type?.includes('Admonishment') ||
    d.record_type?.includes('Censure') ||
    d.record_type?.includes('State Bar')
  );
  
  if (barEvals.length === 0 && barDisc.length === 0) return null;
  
  return (
    <section className="mt-8" aria-label="Bar Evaluation">
      <h2 className="text-2xl font-bold mb-4" style={{ color: BAR_ACCENT }}>
        Bar Evaluation
      </h2>
      {barEvals.map((ev, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 mb-3"
          style={{ borderLeft: `4px solid ${BAR_ACCENT}` }}>
          <p className="font-semibold">{ev.source}</p>
          <p>{ev.rating}</p>
          {ev.source_url && (
            <a href={ev.source_url} target="_blank" rel="noopener noreferrer"
              style={{ color: '#319795', fontSize: '13px' }}>Source</a>
          )}
        </div>
      ))}
      {barDisc.map((d, i) => (
        <div key={i} className="rounded-xl p-4 mb-3"
          style={{ borderLeft: '4px solid #fc8181', backgroundColor: '#fff5f5' }}>
          <p className="font-semibold">{d.record_type} — {d.record_date}</p>
          <p style={{ fontSize: '13px' }}>{d.description}</p>
          {d.source_url && (
            <a href={d.source_url} target="_blank" rel="noopener noreferrer"
              style={{ color: '#319795', fontSize: '13px' }}>Source document</a>
          )}
        </div>
      ))}
    </section>
  );
}
```

### Profile.jsx Placement for BarEvaluationSection

```jsx
// In Profile.jsx, after the JudicialCompassSection/CompassCard IIFE and before CampaignFinanceSection
// Condition: show for both judicial and city_attorney_da scope (all legal candidates)
{(districtScope === 'judicial' || pol.office_title?.toLowerCase().includes('city attorney')) && (
  <BarEvaluationSection judicialRecord={judicialRecord} />
)}
<div className="mt-6">
  <CampaignFinanceSection politicianId={id} />
</div>
```

---

## Migration Numbering

The current last migration is `116_la_county_durazo_stances.sql`. Next migrations:
- **117**: Plan 29-01 (LACBA ratings + challenger politician records + judicial races)
- **118**: Plan 29-02 (State Bar + CJP discipline data)

No timestamped format needed — use sequential numbering (continuing from 116).

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|-----------------|-------|
| No bar evaluation data | judicial_evaluations already has 13 prior LACBA rows (2022, 2024 elections) | Schema proven for this use case |
| Profile.jsx fetches judicialRecord | Already fetched for is_judicial politicians | City Attorney profiles may NOT fetch judicialRecord currently — check |
| JudicialScorecard in ev-ui renders data | Already renders evaluations + disciplinary_records | May be sufficient without new component |

**Important check for Plan 29-03:** Profile.jsx (line 60-62) only calls `fetchJudicialRecord` and populates `judicialRecord` when `result.is_judicial` is true. City Attorney candidates have `district_type = LOCAL_EXEC` (not JUDICIAL), so `is_judicial` is likely false, meaning `judicialRecord` stays null for City Attorney profiles. Plan 29-03 must either:
- Option A: Also fetch judicialRecord for city_attorney offices (check `pol.office_title` or `district_type`)
- Option B: Use a separate `fetchBarEvaluation(id)` endpoint or query

Recommendation: Option A — extend the existing `judicialRecord` fetch trigger to also fire for `office_title.includes('City Attorney')`.

---

## Open Questions

1. **Is JudicialScorecard in ev-ui sufficient or does Phase 29 need a new BarEvaluationSection?**
   - What we know: JudicialScorecard renders evaluations + disciplinary_records from judicialRecord prop
   - What's unclear: Visual quality — does it label sources clearly? Does it have a "Bar Evaluation" section header?
   - Recommendation: Plan 29-03 task 1 = seed one evaluation row for Walgren, test render in dev. If output is sufficient, skip building BarEvaluationSection. If not, build it.

2. **State Bar lookup for 29 judicial challengers**
   - What we know: Bar number must be found via calbar.ca.gov QuickSearch. Pages don't WebFetch.
   - What's unclear: How long this takes for 29 people
   - Recommendation: Each research agent visits calbar.ca.gov manually. Focus on finding "Any public discipline? Y/N" + license status. Only document discipline if found — clean records need a single row ("Active — No public discipline").

3. **Do uncontested judicial races (Offices 39, 60, 141, 196) need politician records created?**
   - What we know: LACBA doesn't rate them; they still need State Bar check
   - What's unclear: Are those candidates already in the DB as incumbent politicians?
   - Recommendation: Query DB for each uncontested candidate by name before Plan 29-01. Include them in State Bar research but skip LACBA insertion.

4. **is_judicial flag on Draper, Walgren, Connolly politicians**
   - What we know: Profile.jsx gates judicialRecord fetch on `result.is_judicial`. These 3 are incumbents with politician records.
   - What's unclear: Whether their records have `is_judicial = true` or some equivalent flag
   - Recommendation: Query `SELECT is_judicial FROM essentials.politicians WHERE id IN (...)` to confirm. If missing, the judicial record endpoint won't be called by Profile.jsx.

5. **Race records for Superior Court offices**
   - What we know: No Superior Court races exist in the DB for June 2026
   - What's unclear: Do we need fully linked race/races/race_candidates rows, or can we just create politician records and evaluation rows?
   - Recommendation: Phase 29 success criteria requires "legal candidate profile page displays bar data." If challengers need a profile page, they need politician records + a way to navigate to them. Minimal approach: create politician records only. CandidateProfile.jsx works via race_candidates.id — so race + race_candidates rows ARE needed.

---

## Sources

### Primary (HIGH confidence)
- `C:\EV-Accounts\backend\src\lib\essentialsProfileService.ts` — getJudicialRecord() exact API shape, judicial_evaluations and judicial_disciplinary_records queries
- `C:\EV-Accounts\backend\src\routes\essentialsPoliticians.ts` — GET /:id/judicial-record route confirmed
- `C:\Transparent Motivations\essentials\src\pages\Profile.jsx` — judicialRecord fetch trigger (is_judicial gate), JudicialCompassSection placement
- `C:\Transparent Motivations\essentials\src\pages\CandidateProfile.jsx` — same judicialRecord fetch, JudicialCompassSection placement
- `C:\Transparent Motivations\essentials\src\lib\api.jsx` — fetchJudicialRecord() function
- `C:\Transparent Motivations\essentials\node_modules\@empoweredvote\ev-ui\dist\index.js` — JudicialScorecard renders evaluations + disciplinary_records
- Supabase DB live query — `\d essentials.judicial_evaluations` and `\d essentials.judicial_disciplinary_records` confirmed schema
- Supabase DB live query — 3 incumbent judges in DB confirmed (Draper, Walgren, Connolly); 0 evaluation/discipline rows for them
- Supabase DB live query — 4 City Attorney candidates confirmed in DB with politician_ids
- Supabase DB live query — 0 Superior Court races in June 2026 election confirmed

### Secondary (MEDIUM confidence)
- https://www.einpresswire.com/article/907838894/lacba-judicial-elections-evaluation-committee-announces-2026-ratings — complete 2026 LACBA ratings PDF (fetched and verified)
- https://laist.com/news/politics/voter-guides/2026-election-california-primary-la-county-judges — all 11 contested races + candidates listed
- https://cjp.ca.gov/pending_cases/ — current public admonishments/censures listed (fetched directly)
- https://cjp.ca.gov/decisions_by_judges/ — Patrick Connolly has 2 admonishments listed (fetched); Draper and Walgren not found
- WebSearch confirmed bar numbers: Ashouri #300502, McKinney #194455, Roy #318773, Feldstein Soto #106866

### Tertiary (LOW confidence)
- WebSearch: Patrick Connolly "third time disciplined" 2021 — indicates a pre-2016 action also exists; exact date/type unverified
- WebSearch: LACBA JEEC does not rate City Attorney candidates — confirmed by multiple sources but LACBA website is 403

---

## Metadata

**Confidence breakdown:**
- Candidate list (City Attorney): HIGH — DB query + race_candidates confirmed
- Candidate list (Superior Court): HIGH — LAist article + LACBA PDF both fetched and cross-matched
- LACBA ratings (all 32 rated candidates): HIGH — PDF fetched from EIN Presswire mirror
- DB schema for judicial_evaluations + disciplinary_records: HIGH — psql \d confirmed
- CJP discipline for Connolly: HIGH — cjp.ca.gov/decisions_by_judges/ fetched directly
- CJP discipline for Draper/Walgren: HIGH (clean) — not in CJP decisions list
- State Bar lookup process: MEDIUM — pages confirmed to exist but JS-rendered; actual clean/discipline status requires manual verification
- ev-ui JudicialScorecard rendering sufficiency: LOW — code confirmed fields are rendered, but visual quality for Phase 29 needs manual test
- Connolly third (pre-2016) disciplinary action: LOW — WebSearch only, exact date/type needs CJP page verification

**Research date:** 2026-05-09
**Valid until:** 2026-06-15 (election is June 2; data valid through end of election cycle)
