# Phase 31: Donor-Court Conflict Map - Research

**Researched:** 2026-05-09
**Domain:** Campaign finance data analysis, court record research, frontend data display
**Confidence:** MEDIUM (lacourt.org access model verified via official docs; contributions schema verified via codebase; fuzzy matching via npm docs)

## Summary

Phase 31 cross-references legal-professional donors in `transparent_motivations.contributions` against LA Superior Court appearance records, computes conflicts, and displays them on legal candidate profile pages. The phase spans three work streams: (1) a data extraction script identifying top-15% legal-professional donors, (2) court record research for each donor firm via lacourt.org, and (3) a new frontend section between `BarEvaluationSection` and `CampaignFinanceSection`.

The critical finding about lacourt.org: the public PAOS name-search system searches by **party name (litigant)**, not by attorney of record. This means the search strategy must use the employer firm name (`con_empr` / `raw_record->>'contributor_employer'`) as a party name search, not as an attorney search. Each party-name search costs $1.00–$4.75 depending on registration and volume. For the expected ~20–40 unique firms across all LA legal candidates, the total cost is low (under $100 if registered). The search is manual-friendly for a small dataset. An important second path exists through the case summary URL once a case number is found: `lacourt.ca.gov/casesummary/v2web3/` shows attorneys of record for a specific case.

The `fastest-levenshtein` package is already installed in the backend and can serve firm name normalization without adding a new dependency. The next migration number is 122.

**Primary recommendation:** Build a three-step offline research pipeline: (1) SQL script to identify top-15% legal professional donors, (2) manual lacourt.org party-name search using firm names as party names (the employer field), and (3) a new `essentials.donor_court_conflicts` table to store results, exposed via a new `/api/essentials/politicians/:id/donor-court-conflicts` route following the existing `judicial-record` pattern.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `fastest-levenshtein` | ^1.0.16 | Firm name normalization/fuzzy matching | Already in backend `package.json`; fastest Levenshtein impl for Node |
| `pg` (pool.query) | existing | All DB reads for essentials/transparent_motivations schemas | Not in PostgREST; must use direct pool |
| `playwright` | existing | Could automate lacourt.org if needed | Already in backend; use only if manual search is impractical |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fuzzball | 2.2.x | Token-sort-ratio for firm name matching | If token reordering needed (e.g. "Morrison Foerster" vs "Foerster Morrison"); NOT currently installed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fastest-levenshtein` | `fuzzball` | fuzzball has token_sort_ratio which handles word-order variants; fastest-levenshtein is simpler but sufficient for exact+near-exact matching |
| Manual lacourt.org search | Playwright automation | Playwright automation risks ToS violation + pays per search; manual is safer for small dataset |
| New `essentials` table | Extending contributions table | New table is cleaner; contributions table is append-only source data |

**Installation (no new packages needed):**
```bash
# fastest-levenshtein already installed
# All other dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
backend/
├── migrations/
│   └── 122_donor_court_conflicts.sql    # New table schema
├── scripts/
│   ├── identify-legal-donors.ts         # Step 1: Extract top-15% legal donors
│   └── apply-court-research.ts          # Step 3: Load court research results into DB
├── src/lib/
│   ├── essentialsProfileService.ts      # Add getDonorCourtConflicts() here
│   └── (firmNormalizer.ts optional)     # Firm name normalization util
└── src/routes/
    └── essentialsPoliticians.ts         # Add /:id/donor-court-conflicts route

essentials (frontend)/
└── src/
    ├── components/
    │   └── DonorCourtConflictSection.jsx  # New section component
    ├── lib/
    │   └── api.jsx                         # Add fetchDonorCourtConflicts()
    └── pages/
        └── CandidateProfile.jsx            # Insert section between Bar + Finance
```

### Pattern 1: Top-15% Donor Identification (SQL)
**What:** Query contributions for a candidate, filter by legal occupation, sort by total amount, compute cumulative sum until 15% of total is reached.
**When to use:** Step 1 of the pipeline — run once per candidate.
**Example:**
```sql
-- Source: Derived from existing campaignFinanceService.ts patterns
WITH legal_donors AS (
  SELECT
    COALESCE(c.raw_record->>'contributor_name', c.raw_record->>'con_name', c.donor_name_normalized) AS donor_name,
    COALESCE(c.raw_record->>'contributor_employer', c.raw_record->>'con_empr', '') AS employer,
    COALESCE(c.raw_record->>'contributor_occupation', c.raw_record->>'con_occp', '') AS occupation,
    SUM(c.amount) AS total_donated
  FROM transparent_motivations.contributions c
  JOIN transparent_motivations.politician_sources ps ON c.politician_source_id = ps.id
  WHERE ps.essentials_politician_id = $1
    AND ps.research_status = 'confirmed'
    AND (
      lower(c.raw_record->>'contributor_occupation') LIKE '%attorney%'
      OR lower(c.raw_record->>'contributor_occupation') LIKE '%lawyer%'
      OR lower(c.raw_record->>'contributor_occupation') LIKE '%counsel%'
      OR lower(c.raw_record->>'contributor_occupation') LIKE '%partner%'
      OR lower(c.raw_record->>'contributor_occupation') LIKE '%esquire%'
      OR lower(c.raw_record->>'con_occp') LIKE '%attorney%'
      OR lower(c.raw_record->>'con_occp') LIKE '%lawyer%'
      OR lower(c.raw_record->>'con_occp') LIKE '%counsel%'
      OR lower(c.raw_record->>'con_occp') LIKE '%partner%'
      OR lower(c.raw_record->>'con_occp') LIKE '%esquire%'
    )
  GROUP BY donor_name, employer, occupation
  ORDER BY total_donated DESC
),
totals AS (
  SELECT SUM(amount) AS grand_total
  FROM transparent_motivations.contributions c
  JOIN transparent_motivations.politician_sources ps ON c.politician_source_id = ps.id
  WHERE ps.essentials_politician_id = $1 AND ps.research_status = 'confirmed'
),
cumulative AS (
  SELECT
    ld.*,
    SUM(ld.total_donated) OVER (ORDER BY ld.total_donated DESC) AS running_total,
    t.grand_total
  FROM legal_donors ld CROSS JOIN totals t
)
SELECT * FROM cumulative
WHERE (running_total - total_donated) < (grand_total * 0.15);
-- Include row if adding it crosses or stays within the 15% threshold
```

### Pattern 2: New DB Table Schema
**What:** Store pre-researched conflict records per (politician, firm) pair.
**When to use:** Step 3 — after manual court research produces results.
**Example:**
```sql
-- Source: Follows essentials.judicial_evaluations table pattern from migration 117
CREATE TABLE IF NOT EXISTS essentials.donor_court_conflicts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid NOT NULL REFERENCES essentials.politicians(id) ON DELETE CASCADE,
  firm_name     text NOT NULL,                    -- Normalized firm/attorney name
  raw_firm_name text,                             -- Original from con_empr
  total_donated numeric(12,2) NOT NULL,
  is_top_15pct  boolean NOT NULL DEFAULT true,
  -- Court research fields
  court_appearances_found integer NOT NULL DEFAULT 0,
  court_appearances_capped boolean NOT NULL DEFAULT false,  -- true if >10 found
  case_types    text[],                           -- e.g. {'Civil','Criminal'}
  first_appearance_date date,
  last_appearance_date  date,
  source_urls   text[],                           -- Up to 10 lacourt.org case links
  -- Conflict determination
  has_conflict  boolean NOT NULL DEFAULT false,   -- true = donated + appeared, no recusal
  recusal_found boolean NOT NULL DEFAULT false,   -- true = recusal record found
  conflict_note text,                             -- "Donor appeared, recusal filed" etc
  -- For City Attorney candidates: no conflict flag, just "active in courts"
  is_city_attorney_candidate boolean NOT NULL DEFAULT false,
  -- Research metadata
  research_date date NOT NULL DEFAULT CURRENT_DATE,
  researcher_notes text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (politician_id, firm_name)
);
CREATE INDEX ON essentials.donor_court_conflicts (politician_id);
```

### Pattern 3: New Backend Route
**What:** `GET /api/essentials/politicians/:id/donor-court-conflicts` following the exact pattern of `/:id/judicial-record`.
**When to use:** Frontend calls this for any legal candidate profile page.
**Example:**
```typescript
// Source: Follows essentialsPoliticians.ts /:id/judicial-record pattern
router.get('/:id/donor-court-conflicts', optionalAuth, async (req, res) => {
  const id = req.params.id as string;
  if (!UUID_REGEX.test(id)) {
    res.status(422).json({ code: 'VALIDATION_ERROR', message: 'Invalid politician ID format' });
    return;
  }
  const data = await getDonorCourtConflicts(id);
  res.status(200).json(data);
});
```

### Pattern 4: Firm Name Normalization
**What:** Normalize firm names before fuzzy comparison using `fastest-levenshtein`.
**When to use:** During Step 1 (dedup donors) and Step 3 (load research results).
**Example:**
```typescript
// Source: Extends existing normalizeDonorName.ts pattern
import { distance } from 'fastest-levenshtein';

function normalizeFirmName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\b(llp|lp|llc|inc|corp|pc|apc|pllc|ltd)\b\.?/gi, '')
    .replace(/[&,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firmNamesMatch(a: string, b: string, threshold = 3): boolean {
  const normA = normalizeFirmName(a);
  const normB = normalizeFirmName(b);
  if (normA === normB) return true;
  return distance(normA, normB) <= threshold;
}
```

### Pattern 5: Frontend Section Placement
**What:** New `DonorCourtConflictSection` component inserted between `BarEvaluationSection` and `CampaignFinanceSection`.
**When to use:** Only rendered for legal candidates (`isLegalCandidate` = true).
**Example:**
```jsx
// Source: Follows BarEvaluationSection.jsx pattern
// In CandidateProfile.jsx — insert between BarEvaluationSection and CampaignFinanceSection:
{polId && isLegalCandidate && (
  <DonorCourtConflictSection
    politicianId={polId}
    officeTitle={pol.office_title || ''}
  />
)}
```

### Anti-Patterns to Avoid
- **Searching lacourt.org by attorney name:** The PAOS public search is by **party/litigant name** only. Use the employer firm name (`con_empr`) as the party being searched, not the attorney's individual name as attorney-of-record.
- **Automating lacourt.org at scale:** Each search costs $1–$4.75; ToS likely prohibits automated scraping. For ~20–40 firms, manual research is the right approach.
- **Reusing the contributions table for conflicts:** Conflict data is derived/computed, not raw source data. It belongs in a new `essentials` table.
- **Using `con_emp` as the field name:** The raw_record key is `con_empr` (not `con_emp`). The CONTEXT.md says `con_emp` but the actual Socrata adapter and service use `con_empr`. Verify via `socrataAdapter.ts` line 251.
- **Showing "conflict" language for City Attorney candidates:** Per decisions, use "donor law firms active in LA courts" framing only.
- **Parallelizing stance research agents:** Project memory says to always run one at a time.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Levenshtein distance | Custom string diff | `fastest-levenshtein` (already installed) | Battle-tested, fastest Node impl |
| Firm suffix stripping | Custom regex | Standard regex + `fastest-levenshtein` | LLP/LLC/PC stripping is well-understood |
| Court record HTML parsing | Custom parser | Manual research + structured data entry | Dataset is small (~20-40 firms); automation risk outweighs benefit |
| PAOS authentication | Custom session mgmt | Register manually as user; use browser UI | $1/search for registered users at scale; ToS |

**Key insight:** The dataset is tiny (3 City Attorney candidates + ~11 judge candidates = ~14 candidates, ~20–40 unique legal-professional firms total). The "don't hand-roll" principle applies: don't build an automated scraper for a dataset that can be manually researched in under 2 hours.

## Common Pitfalls

### Pitfall 1: PAOS Search Searches Parties, Not Attorneys
**What goes wrong:** Script attempts to find attorney appearances by searching attorney name in PAOS — gets party litigation results instead. A firm like "Morrison & Foerster LLP" appearing as a party (being sued or suing) is NOT the same as that firm's attorneys appearing before a judge.
**Why it happens:** lacourt.org's public PAOS is a party-name index, not an attorney-of-record index. The case summary (accessed by case number) shows attorneys of record, but you need a case number first.
**How to avoid:** Use firm party-name search to find cases where the firm is a litigant party AND to find cases where the firm appears as a party representative. If the firm is a party to the case (i.e., the law firm itself is being sued or is the plaintiff), that is NOT an "appearance before the judge." Appearances = the firm/attorney representing a client in cases before that judge. Manual research using the case summary view (once a case number is found) can confirm attorneys of record.
**Warning signs:** All search results showing the firm as plaintiff or defendant with no attorney context.

### Pitfall 2: Top-15% Calculation Edge Cases
**What goes wrong:** The 15% threshold produces zero donors (all legal donors collectively are under 15%) or too many (one attorney gave 100% of all contributions).
**Why it happens:** "Top 15% by dollar amount" means donors whose contributions make up the top 15% of total raised — a cumulative threshold, not a percentile of donors.
**How to avoid:** Use cumulative SUM() window function. The threshold is: include donors in descending order until the running total crosses 15% of grand_total. A single mega-donor who contributed 20% of total is included (one person exceeds 15%). Edge case: if no legal professional donors exist, return empty list with honest zero-state.

### Pitfall 3: con_empr vs. con_emp Naming
**What goes wrong:** Script queries `raw_record->>'con_emp'` and gets NULL for all LA Socrata records.
**Why it happens:** The actual LA Socrata field key stored in `raw_record` is `con_empr` (from Socrata's API field name), not `con_emp`. The CONTEXT.md uses shorthand `con_emp` but the code uses `con_empr`.
**How to avoid:** Use the COALESCE pattern from existing service code: `COALESCE(c.raw_record->>'contributor_employer', c.raw_record->>'con_empr', '')`.
**Warning signs:** Zero employers returned for known LA candidates.

### Pitfall 4: "esquire" and "partner" Not in Existing Sector Map
**What goes wrong:** The existing `occupationSectorMap` in `campaignFinanceService.ts` classifies by 'attorney', 'lawyer', 'counsel', 'paralegal' — but `partner`, `esquire`, `esq`, `solicitor` are not listed. Legal professionals with these titles are missed.
**Why it happens:** The existing sector map was built for general sector classification, not legal-professional identification.
**How to avoid:** In the donor identification script, use a broader occupation filter that includes: attorney, lawyer, counsel, partner, esquire, esq, solicitor, litigator. Test against actual con_occp values in the DB before finalizing.

### Pitfall 5: Firm Name Variants Produce Duplicate Rows
**What goes wrong:** "Morrison & Foerster LLP", "Morrison Foerster", "MoFo" appear as three separate firms in the top-15% list.
**Why it happens:** con_empr values are free-text from the Socrata donor filing. No normalization occurs at ingest time.
**How to avoid:** In the identify-legal-donors script, group by normalized firm name (strip legal suffixes, lowercase, strip punctuation) and apply fuzzy deduplication with threshold before storing. Flag uncertain matches for human review (the CONTEXT.md requires this).

### Pitfall 6: City Attorney vs. Judge Display Language
**What goes wrong:** Component renders "Conflict of Interest" heading for Ashouri/McKinney/Roy.
**Why it happens:** Forgetting to branch on candidate type.
**How to avoid:** Pass `officeTitle` prop to the section component; branch on whether it contains "city attorney" or "district attorney". Use "Donor Law Firm Court Activity" heading for City Attorney; "Donor-Court Conflicts" for judges.

### Pitfall 7: Migration 122 Assumption
**What goes wrong:** A migration numbered 122 already exists or the numbering is wrong.
**Why it happens:** Migration 121 is the last one verified (121_roy_judicial_compass_stances.sql). If any untracked migration was applied, 122 is taken.
**How to avoid:** Confirm by listing migrations directory at plan time. As of 2026-05-09, 121 is confirmed last.

## Code Examples

### Key Columns in `transparent_motivations.contributions.raw_record` (LA Socrata)
```typescript
// Source: backend/src/lib/adapters/socrataAdapter.ts lines 250-267
// All stored as JSONB in raw_record column
{
  con_name: "JOHN SMITH",              // contributor name
  con_occp: "ATTORNEY",               // occupation
  con_empr: "MORRISON FOERSTER LLP",  // employer (firm name)
  con_amount: "500.00",               // amount as string
  con_date: "2024-01-15T00:00:00.000",// contribution date
  con_city_nm: "LOS ANGELES",
  con_state_nm: "CA",
  // Enriched aliases also stored:
  contributor_name: "JOHN SMITH",
  contributor_occupation: "ATTORNEY",
  contributor_employer: "MORRISON FOERSTER LLP"
}
```

### Legal Professional Detection Pattern
```typescript
// Source: Extends campaignFinanceService.ts occupationSectorMap pattern (lines 232-236)
// Extended keywords beyond existing 'attorney','lawyer','counsel','paralegal':
const LEGAL_OCCUPATION_KEYWORDS = [
  'attorney', 'lawyer', 'counsel', 'paralegal',
  'partner', 'esquire', 'esq', 'solicitor', 'litigator',
  'public defender', 'district attorney', 'prosecutor',
  'associate', // risky — 'associate' appears in non-legal contexts too
];
// NOTE: 'associate' and 'partner' need careful evaluation against actual data

function isLegalProfessional(occupation: string): boolean {
  const lower = occupation.toLowerCase();
  return LEGAL_OCCUPATION_KEYWORDS.some(kw => lower.includes(kw));
}
```

### lacourt.org PAOS Search URL Pattern
```
// Source: Official lacourt.org (MEDIUM confidence — verified via WebFetch)
// Party name search (civil):
https://www.lacourt.org/paos/v2public/CivilIndex/
// — POST form with party name; returns litigant list with case numbers

// Case summary (once case number known):
https://www.lacourt.ca.gov/casesummary/v2web3/
// — Enter case number; shows parties + attorneys of record

// Criminal defendant search:
https://www.lacourt.org/paos/v2public/CriminalIndex/
```

### Backend Route Pattern (follows existing judicial-record route)
```typescript
// Source: backend/src/routes/essentialsPoliticians.ts lines 303-322
router.get('/:id/donor-court-conflicts', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    if (!UUID_REGEX.test(id)) {
      res.status(422).json({ code: 'VALIDATION_ERROR', message: 'Invalid politician ID format' });
      return;
    }
    const data = await getDonorCourtConflicts(id);
    res.status(200).json(data);
  } catch (err) {
    console.error('[GET /essentials/politicians/:id/donor-court-conflicts] error:', err);
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
  }
});
// IMPORTANT: Must be placed BEFORE the /:id catch-all route
```

### Frontend isLegalCandidate Detection (existing pattern)
```jsx
// Source: CandidateProfile.jsx lines 57-65
const isLegalCandidate = (
  polResult?.district_type === 'JUDICIAL' ||
  polResult?.district_type === 'NATIONAL_JUDICIAL' ||
  (polResult?.office_title || '').toLowerCase().includes('city attorney') ||
  (polResult?.office_title || '').toLowerCase().includes('district attorney')
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All donor data shown undifferentiated | Intersection section (top-15% legal donors who appeared in court) | Phase 31 | Highlights meaningful conflicts, not just raw donation data |
| No conflict storage | New `essentials.donor_court_conflicts` table | Phase 31 | Enables frontend display without per-request court research |

**Deprecated/outdated:**
- N/A — this is new functionality.

## Key Findings on lacourt.org Access

**CRITICAL (HIGH confidence — verified via official lacourt.org FAQ and fee page):**

1. The PAOS public search at `lacourt.org/paos/v2public/CivilIndex/` searches by **litigant/party name**, not attorney of record.
2. Search costs: $1.00/search for registered users (searches 1–10 per month), $4.75 flat for guests.
3. Results show: litigant name, case type, filing date, filing location, number of documents.
4. No API or programmatic access documented. No rate limit documentation found.
5. The civil party-name search covers: General Jurisdiction Civil (>$25k), Limited Civil, Probate, Family Law, Small Claims — from 1983–present.
6. Criminal defendant search is separate: `lacourt.org/paos/v2public/CriminalIndex/`.
7. Case summary view (`lacourt.ca.gov/casesummary/v2web3/`) requires a case number; it shows attorneys of record for a known case.
8. Search is pre-payment confirmed (you see a confirmation before being charged).

**Strategic implication:** The plan should treat court research as a **manual/semi-manual research task** with structured data entry, not a fully automated scrape. The researcher:
- Takes each firm's name from the top-15% list
- Searches the firm name as a party in PAOS civil search
- Reviews case summaries to find cases where the firm appeared before this specific judge
- Records findings in a structured spreadsheet/JSON
- A script loads the findings into the DB

Alternative path: If firm names also appear as parties (e.g., "Morrison Foerster LLP" sued or suing), those ARE party appearances. Law firms do appear as parties in some cases.

## Open Questions

1. **Do any LA legal candidate contributions exist in the DB?**
   - What we know: Ashouri (0f6484bd), McKinney (6cd2e87b), Roy (7157dd95) are City Attorney candidates with politician_source records confirmed for la_socrata data. Judge candidates (Draper, Walgren, Connolly, +25 challengers) — campaign finance ingestion status unknown.
   - What's unclear: Whether judge challenger contributions are in transparent_motivations.contributions. Challengers were just added to the DB in migration 117; their Netfile/Socrata sources may not yet be confirmed.
   - Recommendation: Run a quick DB check at plan time: `SELECT ps.essentials_politician_id, COUNT(*) FROM transparent_motivations.contributions c JOIN transparent_motivations.politician_sources ps ON c.politician_source_id = ps.id WHERE ps.research_status = 'confirmed' GROUP BY 1;` cross-referenced against the judge politician IDs.

2. **What occupation values actually appear in LA legal candidate data?**
   - What we know: The Socrata `con_occp` field stores free-text occupation. Common values in LA city data include "ATTORNEY", "LAWYER", "PARTNER", "ESQ".
   - What's unclear: Whether "PARTNER" without "LAW" context is reliably legal-professional in this dataset (partners also exist in non-legal firms).
   - Recommendation: Run `SELECT DISTINCT raw_record->>'con_occp', COUNT(*) FROM transparent_motivations.contributions c JOIN transparent_motivations.politician_sources ps ON c.politician_source_id = ps.id WHERE ps.essentials_politician_id IN (...legal candidate IDs...) GROUP BY 1 ORDER BY 2 DESC LIMIT 50;` to see actual values before building the filter.

3. **How many unique legal-professional firms are expected?**
   - What we know: LA legal candidate campaigns typically have hundreds of attorney donors, but top-15% narrows this considerably.
   - What's unclear: Exact count without querying the actual data.
   - Recommendation: Run the donor identification query as Step 0 in the plan to get a count before designing the court research workflow.

4. **Will lacourt.org block automated access (Playwright)?**
   - What we know: Playwright is installed. The site charges per-search and likely has ToS against automated scraping.
   - What's unclear: Whether the site has bot detection.
   - Recommendation: Do NOT automate lacourt.org. Manual research is the right call for this phase given the small dataset size.

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/src/lib/adapters/socrataAdapter.ts` — LA Socrata field names (`con_empr`, `con_occp`, `con_name`), raw_record structure
- `C:/EV-Accounts/backend/src/lib/campaignFinanceService.ts` — contributions table query patterns, occupation extraction, sector classification
- `C:/EV-Accounts/backend/src/routes/essentialsPoliticians.ts` — route pattern for new endpoint
- `C:/EV-Accounts/backend/src/lib/essentialsProfileService.ts` — service function pattern for judicial-record
- `C:/EV-Accounts/backend/migrations/117_la_superior_court_june2026_races.sql` — LA legal candidate politician IDs
- `C:/EV-Accounts/backend/migrations/121_roy_judicial_compass_stances.sql` — confirms last migration = 121
- `C:/EV-Accounts/backend/package.json` — confirms `fastest-levenshtein` and `playwright` already installed
- `C:/Transparent Motivations/essentials/src/pages/CandidateProfile.jsx` — frontend page structure, `isLegalCandidate` logic
- `C:/Transparent Motivations/essentials/src/components/BarEvaluationSection.jsx` — component before which new section is placed

### Secondary (MEDIUM confidence)
- [lacourt.org PAOS FAQ](https://www.lacourt.org/paos/v2public/faq) — confirms party-name search only, covers Civil/Family Law/Probate/Small Claims/Criminal
- [lacourt.org Fee Information](https://www.lacourt.org/paos/v2public/FeeInformation) — confirms $1.00–$4.75 per search pricing tiers
- [lacourt.org CivilIndex](https://www.lacourt.org/paos/v2public/CivilIndex/) — confirmed as PAOS party-name search interface (not attorney search)
- [fuzzball npm](https://github.com/nol13/fuzzball.js) — token_sort_ratio for firm name matching with preprocessing options

### Tertiary (LOW confidence)
- UniCourt pricing ($59/month personal plan, no free tier) — WebSearch only, not verified via direct API docs
- lacourt.org case summary URL pattern — inferred from redirect behavior; not fully confirmed as working case lookup endpoint

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from codebase inspection
- Architecture: HIGH — follows existing proven patterns
- lacourt.org access model: HIGH — verified via official FAQ and fee pages
- Pitfalls: MEDIUM — most from codebase inspection; occupation keyword gap is inference
- Fuzzy matching: MEDIUM — fuzzball verified via npm; threshold recommendation is from general practice

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (lacourt.org pricing structure stable; backend patterns stable)
