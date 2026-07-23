# Phase 207: Officials Classification - Research

**Researched:** 2026-07-17
**Domain:** Frontend classification logic (pure JS, no backend) over an existing `district_type` + title/chamber substrate; verified live against the production `essentials` schema (read-only queries).
**Confidence:** HIGH

## Summary

This phase adds one pure function, `classifyBucket(pol) -> 'representative' | 'educator' | 'judge'`,
to `src/lib/classify.js`. The substrate it must reuse already exists and is well-tested:
`district_type` is the authoritative signal project-wide, and three existing modules
(`classify.js`, `groupHierarchy.js`, `branchType.js`) already contain partial, overlapping
routing logic for judicial/school/admin detection. **Do not fork this logic — read it, then add
the coarse 3-bucket wrapper on top.**

Live-DB verification (via direct `psql` against the production `essentials` schema) surfaced two
findings that change what the plan must cover, beyond what CONTEXT.md's decisions anticipated:

1. **Two additional real `district_type` literals exist in production that no existing frontend
   code recognizes:** `CITY_COUNCIL` (15 rows, all DC) and `SCHOOL_BOARD` (9 rows, all DC's State
   Board of Education). `SCHOOL_BOARD` is DC's actual State-Board-of-Education equivalent and is
   **not** covered by CONTEXT.md D-04's literal spec ("`district_type` `SCHOOL` plus
   `STATE_BOARD`") — nor would its title (`"SBOE Member (Ward N)"`) match the D-04 keyword
   override (`/school board|board of education/`). Left as-is, DC's 9 elected School Board
   members would silently fall into the Representatives catch-all, **directly violating SC-02**.
   `CITY_COUNCIL` is fine to catch-all into Representatives (it is DC's city council) but the
   planner should know this literal exists so the plan's `district_type` enumeration is complete.
2. **DA/prosecutor/public-defender titles appear under both `COUNTY` *and* `LOCAL_EXEC`**, not
   only `COUNTY` as CONTEXT.md D-02 states. San Francisco's District Attorney, Public Defender,
   and City Prosecutor are all `LOCAL_EXEC`. The exact live title set requiring the override is:
   `District Attorney`, `County Attorney`, `Prosecuting Attorney`, `City Prosecutor`,
   `Public Defender` — and the override regex **must explicitly exclude** `City Attorney` and
   `Attorney General` (both present in the data, both civil/non-prosecutorial roles that must
   stay in Representatives). Neither `officeDescriptions.js`'s `/district attorney|prosecutor/`
   nor `branchType.js`'s COUNTY heuristic (`/sheriff|clerk|auditor|assessor|recorder|coroner|
   treasurer|prosecutor|surveyor/i`) actually catches `County Attorney` or `Prosecuting Attorney`
   — a new, more precise keyword list is required (given below), it cannot be borrowed verbatim.
3. **A real live data defect confirms D-04's chamber/title override is not just defensive:**
   Portland, Maine's "Board of Public Education" (9 seats) is seeded as `district_type = 'LOCAL'`,
   not `SCHOOL`. Its office titles literally contain the string "School Board Member", so the D-04
   title-keyword override is what rescues these 9 real office-holders into Educators.
4. **`district_type = 'JUDICIAL'` currently exists ONLY for Indiana** (69 rows, all `state='IN'`)
   in the production data. No other state has elected trial/appellate judges seeded as `JUDICIAL`
   yet (confirmed 0 rows for CA and AZ). Every US address still receives the 9 `NATIONAL_JUDICIAL`
   (SCOTUS) rows nationwide, so the Judges bucket is never truly empty for D-11 verification
   purposes — but a "judicial officials" test location that actually exercises `district_type =
   'JUDICIAL'` routing must be an Indiana address (e.g. Bloomington / Monroe County), not LA. LA's
   only "judicial" bucket contribution is the LA County District Attorney (via the D-02 title
   override) plus the 9 nationwide SCOTUS justices — it does **not** exercise `district_type ===
   'JUDICIAL'` at all. See `## Verification Approach` below for the corrected two-location (or
   three-location) recommendation.

**Primary recommendation:** Add `classifyBucket(pol)` to `src/lib/classify.js` as a small,
additive wrapper: base bucket from a `district_type` lookup table (add `SCHOOL_BOARD` to the
Educator set alongside `SCHOOL`/`STATE_BOARD`), then two independent, non-subtractive regex
overrides (DA/PD → judge; school-superintendent → educator) applied only when the base bucket is
still `representative`. Do not call `classifyCategory`/`getBranch`/`getTier` internally — reading
`district_type` directly is simpler, avoids importing display-oriented modules with unrelated
side-effects, and keeps `classifyBucket` a single small source of truth (see `## Reuse
Recommendation` below for the tradeoff analysis Claude's Discretion asked for).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Office-holder bucket classification (`classifyBucket`) | Browser / Client | — | Pure function over already-fetched API response fields (`district_type`, `office_title`, `chamber_name`); no new network call, no backend change. |
| Tab filtering (consumer, Phase 208) | Browser / Client | — | Filters the flat politician list (or grouped hierarchy) client-side using `classifyBucket`; out of scope for 207 but the function's signature must support this consumer. |
| `district_type` data (source of truth) | Database / Storage | API / Backend | Already seeded; Phase 207 makes zero DB/API changes (per phase boundary) — it only reads fields the API already returns. |

## User Constraints

<user_constraints>
### Locked Decisions (from CONTEXT.md, verbatim)

- **D-01:** Judges = all rows with `district_type` `JUDICIAL` or `NATIONAL_JUDICIAL`, with no
  judge-vs-court-staff special-casing — judges, justices, and court clerks/administrators
  (`isJudicialOfficial` in `groupHierarchy.js`) all route to Judges. The whole judicial
  district_type goes to the Judges bucket; their cards already render as administrative plates
  where appropriate (honest, no fabricated compass). Rationale (user): don't over-engineer the
  clerk edge — routing the entire district_type is simpler and keeps the Judges tab = "everything
  about your courts."
- **D-02:** DAs / prosecutors and public defenders → Judges bucket via a title-based override
  (they are seeded as COUNTY-exec, *not* `JUDICIAL`). Matches the Judicial *lens* scope — "8
  topics for judges, DAs, and public defenders" (`compass.js:403`) — so the Phase-210 Judicial
  default lens actually fits everyone in the tab. **[Research correction: also seeded as
  `LOCAL_EXEC` in production — see Common Pitfalls #1.]**
- **D-03:** Title-detected judges/justices (e.g. `/judge|justice/` where district_type is missing
  or mistyped) also route to Judges (see precedence D-08).
- **D-04:** Educators = `district_type` `SCHOOL` (local K-12 school boards) plus `STATE_BOARD`
  (State Board of Education). All education-governance bodies live together under Educators,
  consistent with the Education lens. Also covered: chamber/title matches "school board" / "board
  of education". **[Research correction: production also has a real `SCHOOL_BOARD` district_type
  literal (DC's SBOE) not covered by this list — see Common Pitfalls #2.]**
- **D-05:** School superintendents / education executives → Educators bucket via a title-based
  override (a statewide Superintendent of Public Instruction is currently `STATE_EXEC`). Guard
  the override so it does not catch non-school "superintendent" titles (e.g. superintendent of
  police, of public works, of streets). Sweep education officials — boards and education
  executives — into Educators.
- **D-06:** One source-of-truth function — a single new exported `classifyBucket(pol) ->
  'representative' | 'educator' | 'judge'` in `src/lib/classify.js`, reusing `district_type` +
  the targeted overrides. Both today's Results grouping and Phase 208's tabs call the *same*
  function so classification can never drift between the list and the tabs.
- **D-07:** Precedence = `district_type` base + *additive* overrides. `district_type` sets the
  bucket for the ~90% clean case; the targeted title/chamber overrides (DA/PD → Judge; school
  superintendent → Educator) only pull specific mistyped rows *into* Judge/Educator.
- **D-08:** A clear `JUDICIAL` / `SCHOOL` / `STATE_BOARD` row is never pulled *out* of its bucket
  by a keyword. Overrides are add-only, never subtractive — stray keywords can't misfile a
  cleanly-typed row.
- **D-09:** Representatives is the catch-all. Anything not positively classified as Educator or
  Judge — including empty/unrecognized `district_type` and today's "Unknown/Uncategorized" rows
  — defaults to Representatives. No office-holder ever disappears from the UI. Educator/Judge
  require a positive signal. No 4th "Unknown/Other" bucket (rejected — scope creep beyond the 3
  named buckets).
- **D-10:** Per-office-holder classification. Each returned row is classified independently, so a
  person holding two offices of different types (e.g. county supervisor and a school-board seat)
  legitimately appears in both tabs. Matches the SC-01 "every office-holder resolves to exactly
  one bucket" wording read per office. No person-level cross-government merge (that's how the
  data is modeled today — `deduplicateLocalMultiOffice` only merges same-city LOCAL/LOCAL_EXEC).
- **D-11:** Verify classification across ≥2 contrasting real locations: one with school-board +
  judicial officials (LA) and one representatives-only location. Confirm ordinary reps (mayor,
  council, legislators, federal delegation) never land in Educators/Judges, and that school-board
  + judicial officials never remain in Representatives. **[Research correction: LA does not
  currently have any `district_type = 'JUDICIAL'` rows (CA has 0 — see Common Pitfalls #4);
  recommend Bloomington/Monroe County, Indiana as an additional or alternate judicial test
  location. See `## Verification Approach`.]**

### Claude's Discretion (from CONTEXT.md, verbatim)

- Exact function name / export shape (`classifyBucket` vs `classifyOfficialGroup`) and whether it
  returns a string enum or a small object.
- The precise override keyword lists and the guard patterns that exclude non-school
  "superintendent" and other false positives — tune against real data at plan/execute time.
- Whether/how to add unit tests to the existing `classify.test.js` (recommended, given the edge
  cases).
- Whether `classifyBucket` internally reuses `classifyCategory`/`getBranch` helpers or reads
  `district_type` directly — as long as it is the single source of truth.

### Deferred Ideas (OUT OF SCOPE, verbatim)

- Person-level (one-bucket-per-human) classification — considered and rejected for now (D-10);
  would need cross-government person merge. Revisit only if two-tab appearances confuse users.
- A 4th "Unknown/Other" bucket — rejected (D-09) as scope creep beyond the 3 named buckets.
- Authoring the Education-lens topics (Phase 209 / future), the tabs UI (Phase 208), and per-tab
  lens defaults (Phase 210) are downstream phases, not this one.
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLASS-01 | Every office-holder returned for a location is reliably classified as Representative, Educator (school board), or Judge from existing data (chamber/office/geo type), driving which tab it appears in — ordinary representatives are never misfiled into the Educators or Judges buckets, and school-board/judicial officials are never left in Representatives. | Full `district_type` enumeration (below) with live-DB verified counts; exact override keyword lists for DA/PD and superintendent guards; identified live data gap (`SCHOOL_BOARD` literal, LOCAL-mistyped Portland-ME school board) that the classifier must handle to satisfy SC-02/SC-03; two-location verification plan for SC-05. |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Determining whether a `JUDICIAL` row is a judge vs. court clerk | A new judge/clerk regex | Nothing — D-01 explicitly routes the *whole* `JUDICIAL`/`NATIONAL_JUDICIAL` district_type to Judges, no clerk special-casing. `isJudicialOfficial()` in `groupHierarchy.js` already exists for this distinction but D-01 says not to use it for bucketing. | Avoids duplicating/diverging from `groupHierarchy.js`'s existing judge-vs-staff logic; simpler rule set per the user's explicit "don't over-engineer" instinct. |
| District_type → tier/category mapping | A parallel classification table | `classify.js`'s existing `classifyCategory()` district_type branches (as a *reference* for which literals exist) — but `classifyBucket` should read `district_type` directly per its own small lookup, not call `classifyCategory()` (see Reuse Recommendation). | `district_type` is already the authoritative signal project-wide (11+ modules key off it); don't invent new field semantics. |
| Detecting admin/judicial office titles for display purposes | New regexes for "no compass" plates | `computeVariant()` in `classify.js` (already handles admin/judicial/no-stances plates) — unrelated to `classifyBucket` but must not be touched/broken by this phase. | `computeVariant` already has 12 passing tests (`classify.test.js`); Phase 207 is additive, not a rewrite. |

**Key insight:** every piece of "is this a judge / is this a school board / is this an admin
officer" logic the phase might reach for already exists somewhere in `classify.js`,
`groupHierarchy.js`, `branchType.js`, or `officeDescriptions.js` — for a *different* purpose
(display variant, branch label, tooltip text). `classifyBucket` needs its own small, purpose-built
rule set (3-bucket, not 10+ display categories) rather than calling into those modules, but it
must be informed by the same keyword findings so it never contradicts them.

## District Type Enumeration (verified)

Full grep across `src/` for every `district_type` literal comparison, cross-checked against a
live production query (`essentials.districts.district_type` joined through
`essentials.offices` where `politician_id IS NOT NULL`):

| `district_type` | Live office-holder count | Existing frontend handling | Phase 207 bucket (per D-01/D-04/D-09) |
|---|---|---|---|
| `LOCAL` | 1235 | `classifyCategory`, `groupHierarchy`, `branchType` (Legislative) | Representative (catch-all) — **except** rows whose title/chamber matches the school-board keyword override (D-04) — confirmed live case: Portland, ME |
| `STATE_LOWER` | 1028 | all of the above | Representative |
| `SCHOOL` | 771 | `classifyCategory` ("School Board"), `groupHierarchy` (dedicated `School` tier) | **Educator** (D-04) |
| `NATIONAL_LOWER` | 434 | all of the above | Representative |
| `STATE_UPPER` | 349 | all of the above | Representative |
| `COUNTY` | 310 | `classifyCategory`, `branchType` (heuristic) | Representative — **except** DA/prosecutor/PD title override (D-02) |
| `STATE_EXEC` | 253 | `classifyCategory`, `groupHierarchy` | Representative — **except** superintendent-of-schools title override (D-05) |
| `LOCAL_EXEC` | 231 | all of the above | Representative — **except** DA/PD/City-Prosecutor title override (D-02; confirmed live: SF) |
| `NATIONAL_UPPER` | 152 | all of the above | Representative |
| `JUDICIAL` | 69 (100% `state='IN'` currently) | `classifyCategory`, `groupHierarchy`, `branchType` | **Judge** (D-01) |
| `NATIONAL_EXEC` | 28 | all of the above | Representative |
| `CITY_COUNCIL` | 15 (100% DC) | **none** — not referenced anywhere in `src/` | Representative (falls through D-09 catch-all; correct outcome for DC's council, but the literal is otherwise unrecognized project-wide) |
| `STATE_BOARD` | 15 (100% `state='ut'`, all "State Board of Education District N") | `classifyCategory`, `groupHierarchy` (SCHEMA-02) | **Educator** (D-04) |
| `SCHOOL_BOARD` | 9 (100% DC, "SBOE Member (Ward/At-Large N)") | **none** — not referenced anywhere in `src/`, not in `classifyCategory`, not caught by D-04's keyword regex | **Must be added to Educator base set** — currently would fall into Representatives catch-all, violating SC-02. **[ASSUMED→now VERIFIED via live DB query]** |
| `NATIONAL_JUDICIAL` | 9 (SCOTUS; present for every US address nationwide) | `classifyCategory`, `groupHierarchy`, `branchType`(n/a — not in switch, falls to null) | **Judge** (D-01) |

**Verification method:** `psql` against the production `essentials` schema (via
`C:/EV-Accounts/backend/.env.bak`'s `DATABASE_URL`), read-only `SELECT` queries joining
`essentials.offices` (`politician_id IS NOT NULL`) → `essentials.districts` (`district_type`) →
`essentials.politicians`/`essentials.chambers`/`essentials.governments` for names. All counts
above are `[VERIFIED: essentials schema, production, 2026-07-17]`. This is a read-only audit; no
writes were made.

**Planner action required:** the base `district_type → bucket` lookup table inside
`classifyBucket` must include `SCHOOL_BOARD` in the same bucket as `SCHOOL`/`STATE_BOARD`
(Educator). This is a correction to CONTEXT.md D-04's literal spec, not a contradiction of its
intent ("all education-governance bodies live together under Educators") — D-04's *intent*
already covers this, its *literal list* just needs one more entry.

## Architecture Patterns

### `src/lib/classify.js` — existing exports (read in full)

```javascript
// classifyCategory(pol) — fine-grained tier+group classifier (NOT the bucket function)
export function classifyCategory(pol) {
  const dt = pol?.district_type || "";
  const chamber = pol?.chamber_name_formal || pol?.chamber_name || "";
  const title = pol?.office_title || "";
  // ... ~35 district_type branches returning { tier: 'Federal'|'State'|'Local'|'Unknown', group: '<display group name>' }
  // Handles: NATIONAL_UPPER/LOWER/EXEC/JUDICIAL, STATE_UPPER/LOWER/EXEC/BOARD, LOCAL/LOCAL_EXEC,
  // COUNTY, SCHOOL, JUDICIAL. Falls to { tier: 'Unknown', group: 'Uncategorized' } for anything else
  // (including CITY_COUNCIL and SCHOOL_BOARD — confirmed by reading the function; no branch matches them).
}

// computeVariant(pol, userAnswers, hasStances) — card-rendering variant, UNRELATED to bucketing
export function computeVariant(pol, userAnswers, hasStances = true) {
  const title = (pol?.office_title || '').toLowerCase();
  const dt = pol?.district_type || '';
  if (/clerk|treasurer|auditor|recorder|assessor/.test(title)) return 'administrative';
  if (dt === 'JUDICIAL' || /judge|justice|court/.test(title)) return 'judicial';
  if (!hasStances) return 'no-stances';
  if ((userAnswers || []).length < 3) return 'empty';
  return 'compass';
}
```

`classifyCategory`'s signature reads `pol.district_type`, `pol.chamber_name_formal` /
`pol.chamber_name`, and `pol.office_title` — the exact same three fields `classifyBucket` will
need. `computeVariant` is a sibling function in the same file for a different purpose (card
rendering) and must not be touched.

### `src/lib/groupHierarchy.js` — reusable detectors (module-private, not exported)

```javascript
function getTier(pol) { /* dt.startsWith('NATIONAL')→Federal, dt.startsWith('STATE')→State,
  dt==='JUDICIAL'→State (if court name matches supreme/appeals/appellate/tax) else Local,
  dt==='SCHOOL'→'School' (dedicated tier), else 'Local' */ }

const ADMIN_OFFICER_TITLE_RE = /\b(clerk|treasurer|auditor|recorder|assessor)\b/i;
function isAdminOfficer(pol) {
  const dt = pol.district_type || '';
  if (!dt.startsWith('LOCAL')) return false;
  return ADMIN_OFFICER_TITLE_RE.test(pol.office_title || '');
}

const JUDICIAL_OFFICIAL_TITLE_RE = /\bclerk\b|\badministrator\b|\bcourt officer\b/i;
function isJudicialOfficial(pol) {
  return pol.district_type === 'JUDICIAL' && JUDICIAL_OFFICIAL_TITLE_RE.test(pol.office_title || '');
}
```

**Important:** `getTier`, `isJudicialOfficial`, and `isAdminOfficer` are **not exported** from
`groupHierarchy.js` (no `export` keyword on any of the three — confirmed by reading the file
top to bottom). `classifyBucket` cannot import them without first adding `export` to
`groupHierarchy.js`, which is a change to a file outside `classify.js`. Given D-01 explicitly
says "no judge-vs-court-staff special-casing" (i.e. `classifyBucket` must NOT use
`isJudicialOfficial` to split judges from clerks), and `getTier`'s School/Local/State split
doesn't map 1:1 onto the 3-bucket scheme anyway (a `getTier() === 'Local'` result could be
Representative, Educator via override, or Judge via override), **there is no case where
`classifyBucket` needs anything from `groupHierarchy.js`.** Read `district_type` directly.

### `src/utils/branchType.js` — `getBranch(districtType, officeTitle)`

```javascript
export function getBranch(districtType, officeTitle) {
  if (!districtType) return null;
  switch (districtType) {
    case 'NATIONAL_EXEC': case 'STATE_EXEC': case 'LOCAL_EXEC': return 'Executive';
    case 'NATIONAL_UPPER': case 'NATIONAL_LOWER': case 'STATE_UPPER': case 'STATE_LOWER':
    case 'LOCAL': case 'SCHOOL': return 'Legislative';
    case 'JUDICIAL': return 'Judicial';
    case 'COUNTY': {
      const title = officeTitle || '';
      if (/council/i.test(title)) return 'Legislative';
      if (/commission/i.test(title)) return 'Executive';
      if (/sheriff|clerk|auditor|assessor|recorder|coroner|treasurer|prosecutor|surveyor/i.test(title))
        return 'Executive';
      return null;
    }
    default: return null;
  }
}
```

**Verified gap:** this COUNTY heuristic's regex does **not** contain the word "attorney" —
`/prosecutor/i` alone does NOT match `District Attorney`, `County Attorney`, or `Prosecuting
Attorney` (none of those titles contain the literal substring "prosecutor"). Live-DB check
confirms `getBranch('COUNTY', 'District Attorney')` currently returns `null` (falls through every
branch), not `'Executive'`/`'Judicial'`. **Do not mirror this regex for the D-02 override — it
would miss most of the real DA titles.** Also, `getBranch` has no `CITY_COUNCIL` or `SCHOOL_BOARD`
case (returns `null` for both) — irrelevant to `classifyBucket` but confirms these two literals
are unhandled everywhere in the existing codebase, not just in `classify.js`.

### `src/utils/officeDescriptions.js` §L84 — existing DA/prosecutor detection (for reference only)

```javascript
if (/district attorney|prosecutor/.test(t))
  return 'The District Attorney is the county\'s chief prosecutor — ...';
```

Also **does not** match `County Attorney` or `Prosecuting Attorney` (verified: "prosecuting"
does not contain the substring "prosecutor"). Confirms neither existing helper's keyword list is
sufficient for D-02 — a new list is required (given below).

### Recommended `classifyBucket` implementation shape

```javascript
// src/lib/classify.js — add alongside classifyCategory/computeVariant

const JUDGE_DISTRICT_TYPES = new Set(['JUDICIAL', 'NATIONAL_JUDICIAL']);
const EDUCATOR_DISTRICT_TYPES = new Set(['SCHOOL', 'STATE_BOARD', 'SCHOOL_BOARD']); // SCHOOL_BOARD: DC SBOE (verified live)

// D-02: DA / prosecutor / public defender → Judge. Whitelist, not a broad /attorney/ match —
// must NOT catch "City Attorney" (civil counsel, LOCAL_EXEC) or "Attorney General" (STATE_EXEC/
// NATIONAL_EXEC/CITY_COUNCIL-mistyped-DC). Verified against every live attorney/prosecutor/
// defender title in production (see Sources).
const PROSECUTOR_DEFENDER_TITLE_RE =
  /\b(district attorney|county attorney|prosecuting attorney|state'?s attorney|city prosecutor|public defender)\b/i;

// D-05: school superintendent / education executive → Educator. Guards against
// "superintendent of police/public works/streets" by requiring "school(s)" or "public
// instruction" in the same title — those non-education superintendents never contain either.
const SCHOOL_SUPERINTENDENT_TITLE_RE = /superintendent\s+of\s+(public instruction|schools)\b/i;

// D-03: title-detected judge/justice fallback for missing/mistyped district_type.
const JUDGE_TITLE_RE = /\b(judge|justice)\b/i;

// D-04 (additive): chamber/title "school board" / "board of education" catches LOCAL-mistyped
// school boards. Verified live case: Portland, ME "Board of Public Education" is district_type
// LOCAL with office_title containing "School Board Member".
const SCHOOL_BOARD_TEXT_RE = /school board|board of education/i;

export function classifyBucket(pol) {
  const dt = pol?.district_type || '';
  const title = pol?.office_title || '';
  const chamber = pol?.chamber_name_formal || pol?.chamber_name || '';

  // Base: district_type (D-07). Clean SCHOOL/STATE_BOARD/SCHOOL_BOARD/JUDICIAL/NATIONAL_JUDICIAL
  // rows are decided here and NEVER pulled out by a keyword below (D-08).
  if (JUDGE_DISTRICT_TYPES.has(dt)) return 'judge';
  if (EDUCATOR_DISTRICT_TYPES.has(dt)) return 'educator';

  // Additive overrides (D-07/D-08) — only reachable when base bucket is still 'representative'.
  if (PROSECUTOR_DEFENDER_TITLE_RE.test(title)) return 'judge';                 // D-02
  if (JUDGE_TITLE_RE.test(title)) return 'judge';                              // D-03
  if (SCHOOL_SUPERINTENDENT_TITLE_RE.test(title)) return 'educator';           // D-05
  if (SCHOOL_BOARD_TEXT_RE.test(title) || SCHOOL_BOARD_TEXT_RE.test(chamber)) return 'educator'; // D-04

  return 'representative'; // D-09 catch-all
}
```

This is a starting draft for the planner/executor to refine — the exact regex boundaries (e.g.
whether `state's attorney` needs the apostrophe-optional form, whether to add `solicitor` for
South-Carolina-style DA titles not currently in the data) are Claude's Discretion per CONTEXT.md,
to be tuned against real data at plan/execute time.

## Common Pitfalls

### Pitfall 1: Assuming DA/PD titles are always `COUNTY`
**What goes wrong:** Writing the D-02 override only for `district_type === 'COUNTY'` rows (as
CONTEXT.md's rationale text implies) misses San Francisco's District Attorney, Public Defender,
and City Prosecutor, which are seeded as `LOCAL_EXEC`.
**Why it happens:** CA's SF is a consolidated city-county; some jurisdictions attach the DA/PD
office to the mayor's chamber (`LOCAL_EXEC`) rather than a county chamber.
**How to avoid:** Apply the title override regardless of base `district_type` (i.e., check the
title override on every row where the base bucket isn't already `judge`/`educator`), not scoped
to `COUNTY` only.
**Warning signs:** A plan/test fixture that only exercises `{ district_type: 'COUNTY', office_title:
'District Attorney' }` and never tests a `LOCAL_EXEC` DA — verified live: `Brooke Jenkins`,
`Manohar Raju`, `Doug Haubert` are all `LOCAL_EXEC`.

### Pitfall 2: Missing the `SCHOOL_BOARD` district_type literal
**What goes wrong:** Only handling `SCHOOL` and `STATE_BOARD` (per CONTEXT.md D-04's literal
list) silently drops DC's 9 elected State Board of Education members into Representatives,
violating SC-02.
**Why it happens:** `SCHOOL_BOARD` is a third, distinct literal string used only for DC's SBOE
seed; it does not appear anywhere in existing `src/` code, so there is no existing precedent to
grep for — it's easy to assume `SCHOOL` + `STATE_BOARD` is the complete education set.
**How to avoid:** Include `SCHOOL_BOARD` in the base Educator `district_type` set from the start.
**Warning signs:** A DC address (or `browse_geo_id` for a DC ward) shows SBOE members under
Representatives after the classifier ships.

### Pitfall 3: Over-broad attorney regex catching Attorney General / City Attorney
**What goes wrong:** A naive `/attorney/i` override (to "be safe" and catch every attorney-ish
title) also matches `Attorney General` (STATE_EXEC, NATIONAL_EXEC, and — via a DC data quirk —
`CITY_COUNCIL`) and `City Attorney` (LOCAL_EXEC, civil counsel, not a prosecutor), wrongly
sweeping them into Judges. This would violate SC-04 ("ordinary representatives... never
misfiled").
**Why it happens:** "Attorney" is a substring of both the titles you want (District/County/
Prosecuting Attorney) and the titles you don't (Attorney General, City Attorney).
**How to avoid:** Use the whitelist regex given above (`district attorney|county attorney|
prosecuting attorney|state's attorney|city prosecutor|public defender`) — it matches every DA/PD
title found live in production and none of the AG/City-Attorney titles.
**Warning signs:** A test asserting `classifyBucket({ office_title: 'Attorney General',
district_type: 'STATE_EXEC' })` returns `'judge'` — that assertion should fail; correct behavior
is `'representative'`.

### Pitfall 4: Choosing LA as the sole "judicial officials" verification location
**What goes wrong:** LA has zero `district_type = 'JUDICIAL'` rows (CA is not seeded with elected
judges at all as of this research). Verifying "judicial officials never remain in Representatives"
using only LA exercises the D-02 DA override and the nationwide 9 SCOTUS justices, but never
exercises the D-01 `JUDICIAL` base-bucket path — a real gap in that base-case logic could ship
unnoticed.
**Why it happens:** CONTEXT.md's D-11 rationale names LA as the example without having queried the
live judicial data footprint.
**How to avoid:** Use Bloomington / Monroe County, Indiana (or any IN address) as the location
that exercises `district_type === 'JUDICIAL'` directly (69 real rows: Monroe/Greene County
Superior/Circuit Court judges, Indiana Court of Appeals judges, Indiana Supreme Court justices),
in addition to or instead of LA. See `## Verification Approach`.
**Warning signs:** SC-05 verification checklist only lists LA and a "representatives-only" city —
no explicit Indiana/JUDICIAL-district_type check.

### Pitfall 5: Guarding the superintendent override too narrowly or too loosely
**What goes wrong:** A guard like `/superintendent/i` alone (no education qualifier) would catch
a hypothetical future "Superintendent of Police" or "Superintendent of Public Works" if such a
title is ever seeded as `LOCAL_EXEC`/`LOCAL` — pulling a non-education executive into Educators.
Conversely, a guard requiring the *exact* string `"superintendent of public instruction"` would
miss states that instead say `"State Superintendent of Schools"`.
**Why it happens:** "Superintendent" alone is a generic executive-officer word used across many
unrelated government functions (police, public works, streets, parks).
**How to avoid:** Require `superintendent\s+of\s+(public instruction|schools)` — this is broad
enough to catch both known real-world phrasings and narrow enough to exclude every non-education
superintendent title. Currently only 2 superintendent titles exist in production data — both
"Superintendent of Public Instruction" (CA's Tony Thurmond, AZ's Tom Horne, both `STATE_EXEC`) —
so the guard is currently defensive/forward-looking rather than fixing a live bug, unlike
Pitfalls 1–2 which fix real live misclassifications.
**Warning signs:** A test fixture only covers the two known-good superintendent titles and never
asserts a negative case (`"Superintendent of Police"` → `'representative'`).

## Verification Approach (SC-05 / D-11)

**Recommended locations (3, not 2 — the third closes the D-11 gap found above):**

1. **LA (Los Angeles, CA)** — exercises: `SCHOOL` base bucket (LAUSD, "Los Angeles Unified,
   California, US", 7 board-member rows — `[VERIFIED: essentials schema]`), the D-02 DA override
   (LA County District Attorney Nathan Hochman, `district_type = 'COUNTY'`), and confirms ordinary
   reps (Mayor, City Council, County Supervisors, CA state legislators, CA congressional
   delegation) stay in Representatives. Does **not** exercise `district_type === 'JUDICIAL'`
   directly (CA has none seeded).
   - Live check: `GET` via the app's address search or `browse_geo_id` flow for an LA address/geo_id.
2. **Bloomington / Monroe County, Indiana** — exercises `district_type === 'JUDICIAL'` directly
   (Monroe/Greene County Superior & Circuit Court judges, Indiana Court of Appeals, Indiana
   Supreme Court — 69 real rows, `[VERIFIED: essentials schema]`) and `SCHOOL` (Monroe County
   school corporation, 14 IN rows). This is the location referenced throughout the existing
   `classify.test.js`/`groupHierarchy.test.js` fixtures as the canonical judicial+admin-officer
   test city — reuse it here for consistency with existing test conventions.
3. **A representatives-only AZ city** (e.g. Marana, Oro Valley, or Sahuarita — all already
   deep-seeded per project history) — `[VERIFIED: essentials schema]` AZ has **zero** rows of
   `SCHOOL`, `JUDICIAL`, `SCHOOL_BOARD`, or `STATE_BOARD` statewide. Any AZ address will surface
   only Representative-bucket officials at the state/local level, **plus** the 9 nationwide
   `NATIONAL_JUDICIAL` SCOTUS justices (unavoidable — every US address gets these). The
   verification assertion for this location should be: "no STATE/LOCAL judicial or school-board
   rows leak into Judges/Educators incorrectly" and "the 9 SCOTUS justices correctly land in
   Judges, not Representatives" (a true-positive check, not a true-negative one).

**How to observe results:** the app's `/results` page (`essentials.empowered.vote`) via address
search or the `browse_geo_id` query-param flow (`?browse_geo_id=<geo_id>&browse_mtfcc=<mtfcc>`)
already used throughout this project's location verification workflow (per project memory:
"give live browse link at completion"). Since Phase 207 does not build the tabs UI, verification
in this phase means calling `classifyBucket()` against the real API response rows for each
location (e.g. in a scratch script, a temporary console log, or a unit test seeded with real
fixture data copied from the three locations above) — not visually inspecting tabs (those don't
exist until Phase 208).

## Existing Tests

- **Test framework:** Vitest 4.1.4 (`"test": "vitest run"` in `package.json`).
- **Run command (whole suite):** `npm test` (repo root). **Targeted:** `npx vitest run
  src/lib/classify.test.js`.
- **Existing file:** `src/lib/classify.test.js` — 113 lines, `describe`/`it`/`test` blocks,
  currently covers `computeVariant` (STATE-01/02/03 empty/administrative/judicial variants) and
  one `classifyCategory` STATE_BOARD case. Uses a `makePol(overrides)` helper defaulting to
  `{ district_type: 'LOCAL', office_title: 'Council Member' }`.
- **Sibling test files for pattern reference:** `groupHierarchy.test.js` and
  `groupHierarchy.utah.test.js` use the same `makePol`-helper + `describe/it` convention with
  richer fixture objects (`government_name: 'City of Bloomington, Indiana, US'`,
  `government_body_name`, `chamber_name_formal`, etc.) — mirror this style for `classifyBucket`
  tests rather than inventing a new fixture shape.
- **Recommendation (Claude's Discretion, CONTEXT.md):** add a new `describe('classifyBucket', ...)`
  block to the existing `classify.test.js` (don't create a separate file) — at minimum: one test
  per `district_type` base case (all 15 literals from the enumeration table), one test per
  override (DA-as-COUNTY, DA-as-LOCAL_EXEC per Pitfall 1, superintendent-positive and
  superintendent-negative per Pitfall 5, Portland-ME-style LOCAL-mistyped school board per
  Pitfall 3's sibling issue), and one negative test for Attorney-General/City-Attorney per
  Pitfall 3.

## Consumers (no regression risk identified for this phase)

- **`src/pages/Results.jsx`** — imports `computeVariant` from `classify.js` (line 5) and
  `groupIntoHierarchy` from `groupHierarchy.js` (line 15); renders via `groupIntoHierarchy(deduped)`
  → `filteredHierarchy` (tier/body/subgroup rendering, unrelated to the 3-bucket scheme).
  `classifyBucket` is a **new, additional** export — adding it does not touch any existing
  `Results.jsx` import or behavior. Phase 208 will be the first to import `classifyBucket` here.
- **`src/components/ElectionsView.jsx`** — imports `getBranch` from `branchType.js` (line 10) for
  its own `deriveScopedTopics`/tooltip logic; does not import anything from `classify.js`. No
  regression risk: this phase does not touch `branchType.js`.
- **Both files' existing `district_type` handling can stay exactly as-is** — Phase 207 is
  additive-only per its stated boundary ("does not build the tabs, the grey-out affordance, or the
  per-tab lens shift").

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | none — see `package.json` `"test": "vitest run"` script (no separate `vitest.config.*` found in repo root) |
| Quick run command | `npx vitest run src/lib/classify.test.js` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLASS-01 | Every `district_type` base case maps to exactly one of the 3 buckets | unit | `npx vitest run src/lib/classify.test.js -t classifyBucket` | ❌ Wave 0 (new `describe` block to add) |
| CLASS-01 | DA/prosecutor/PD title override fires for COUNTY and LOCAL_EXEC, not for Attorney General/City Attorney | unit | same as above | ❌ Wave 0 |
| CLASS-01 | School-superintendent override fires for "Superintendent of Public Instruction/Schools", not for non-education superintendents | unit | same as above | ❌ Wave 0 |
| CLASS-01 | LOCAL-mistyped school board (title/chamber keyword) routes to Educator | unit | same as above | ❌ Wave 0 |
| CLASS-01 (SC-05) | Cross-location spot check (LA / Bloomington IN / AZ city) | manual (data-fixture-driven unit test using real field values copied from live API responses) | `npx vitest run src/lib/classify.test.js -t "live fixtures"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/classify.test.js`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New `describe('classifyBucket', ...)` block in `src/lib/classify.test.js` — covers CLASS-01
      base cases, overrides, and negative guards enumerated above.
- No new framework/config install needed — Vitest is already configured and running.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact override regex boundaries given in `## Architecture Patterns` (e.g. `state'?s attorney`, `superintendent\s+of\s+(public instruction\|schools)`) are a *draft* tuned against currently-live titles only; future seeding could introduce a title (e.g. a "Solicitor" DA-equivalent, or "State Superintendent of Schools" phrasing) not in today's snapshot. | Architecture Patterns, Common Pitfalls #5 | Low — D-07/D-08 (additive-only overrides) mean a missed keyword just leaves that row in Representatives (safe default per D-09), never misfiles it into the wrong bucket. Low blast radius; easy to extend the regex later. |
| A2 | `SCHOOL_BOARD` should be bucketed identically to `SCHOOL`/`STATE_BOARD` (Educator) rather than treated as a 4th special case. | District Type Enumeration | Low — this follows D-04's stated intent ("all education-governance bodies live together") directly; the only question is whether the planner explicitly adds the literal, which this research flags clearly. |
| A3 | `classifyBucket` should read `district_type`/`office_title`/`chamber_name` directly rather than calling `classifyCategory`/`getBranch`/`getTier`, per the Reuse Recommendation analysis. | Architecture Patterns | Low — this is explicitly Claude's Discretion per CONTEXT.md; if the planner disagrees, calling `classifyCategory().tier/group` as an intermediate signal is a viable alternative, just adds an indirection layer that isn't needed for a 3-bucket outcome. |

**If this table is empty:** N/A — see above. All three assumptions are low-risk-if-wrong per
D-09's safe-default catch-all design, and are flagged for planner awareness rather than blocking.

## Open Questions (RESOLVED)

1. **Should the Judicial compass lens's `autoDistrictTypes` (`compass.js` line 493, currently
   `['JUDICIAL', 'NATIONAL_JUDICIAL']` only) be extended to include `COUNTY`/`LOCAL_EXEC` so DA/PD
   cards auto-select the Judicial lens outside the tabs context too?**
   - What we know: `JUDICIAL_LENS`'s own description text says "8 questions for judicial and DA
     candidates" (`compass.js` line 490) and D-02's rationale explicitly cites this lens scope as
     the reason DAs/PDs belong in the Judges tab — but the lens's `autoDistrictTypes` array itself
     doesn't yet reflect DA/PD district types.
   - What's unclear: whether this is in scope for Phase 207 (classification only) or Phase 210
     (per-tab lens defaults) — CONTEXT.md's deferred list assigns "per-tab default compass-lens
     shift" to Phase 210, suggesting this is 210's concern, not 207's.
   - RESOLVED: leave `compass.js` untouched in Phase 207 (no compass/lens file changes are
     in this phase's boundary); flag for Phase 210's research so the per-tab Judicial-lens default
     doesn't silently exclude DA/PD cards that Phase 207's Judges tab now includes.
2. **Does the `CITY_COUNCIL` district_type (DC's council, 15 rows) need any handling at all in
   this phase?**
   - What we know: it falls through D-09's catch-all correctly (DC councilmembers/Mayor/AG-mistake
     all belong in Representatives).
   - What's unclear: whether any consumer downstream of `classifyBucket` (Phase 208's tabs) will
     assume every `district_type` seen in production is in `classifyCategory`'s switch — it isn't
     (confirmed: falls to `{tier:'Unknown', group:'Uncategorized'}`), which could affect DC's
     current *display* grouping (a pre-existing, out-of-scope issue) but not the 3-bucket outcome.
   - RESOLVED: no action needed for CLASS-01 itself; worth a one-line note in the plan so a
     future DC-display-grouping bug isn't mistaken for a Phase 207 regression.

## Sources

### Primary (HIGH confidence — direct code reads)
- `src/lib/classify.js` (full read) — `classifyCategory`, `computeVariant`, no existing `classifyBucket`.
- `src/lib/groupHierarchy.js` (full read) — `getTier`, `isAdminOfficer`, `isJudicialOfficial` (none exported).
- `src/utils/branchType.js` (full read) — `getBranch`.
- `src/utils/officeDescriptions.js` (full read) — `getOfficeDescription`, DA/prosecutor regex at L84.
- `src/lib/compass.js` lines 380-510 — `JUDICIAL_LENS_TOPICS`, `LENS_FALLBACKS` (`autoDistrictTypes: ['JUDICIAL','NATIONAL_JUDICIAL']`), lens description text.
- `src/lib/classify.test.js` (full read) — existing test conventions.
- `src/pages/Results.jsx` (targeted reads: imports, grouping call, `district_type` usages at lines 141/264/289/338/875/1141/1148/1330/1379-1491/2062).
- `src/components/ElectionsView.jsx` (targeted reads: `getTier`, `deriveScopedTopics`, `district_type` usages).
- `src/pages/CandidateProfile.jsx`, `src/pages/Profile.jsx`, `src/components/PoliticianGrid.jsx` — `district_type` grep + targeted reads.
- `.planning/phases/207-officials-classification/207-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md` (partial), `.planning/config.json`.

### Primary (HIGH confidence — live production DB, read-only)
- `essentials.offices` / `essentials.districts` / `essentials.politicians` / `essentials.chambers`
  / `essentials.governments` via `psql` against the production Supabase Postgres instance
  (connection string sourced from `C:/EV-Accounts/backend/.env.bak`). All queries were
  read-only `SELECT`s; no writes were made. Verified: full `district_type` distinct-value
  enumeration with counts; DC's `CITY_COUNCIL`/`SCHOOL_BOARD` rows and their real politician names;
  every live DA/prosecutor/public-defender/attorney-general/city-attorney title and its
  `district_type`; the one live superintendent title; Portland ME's LOCAL-mistyped school board;
  per-state `JUDICIAL` footprint (IN only); AZ's zero school/judicial footprint; LAUSD's presence
  under `essentials.governments`.
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` lines ~469-490, 661-732 — confirms the
  API's field aliasing (`o.title AS office_title`, `d.district_type`, `ch.name AS chamber_name`)
  matches what the frontend consumes, and the MTFCC→district_type geofence mapping (lines
  679-691) — confirms `CITY_COUNCIL`/`SCHOOL_BOARD` (DC's custom, non-TIGER district types) are
  not part of the standard MTFCC mapping, consistent with DC's special-cased geo_id scheme
  (`dc-council-at-large`, `dc-sboe-ward-N`) rather than TIGER geofences.

### Secondary (MEDIUM confidence)
- None — all claims in this document were either verified by direct code read or by direct
  live-DB query.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: N/A — this phase adds no new library/dependency (pure JS function).
- Architecture: HIGH — every existing helper function was read in full; the recommended
  `classifyBucket` implementation was cross-checked against live production data, not just
  training-data assumptions about typical district_type schemes.
- Pitfalls: HIGH — all 5 pitfalls are backed by a live-DB query proving the specific title/
  district_type combination exists in production today (not hypothetical edge cases).

**Research date:** 2026-07-17
**Valid until:** 30 days (stable, pure-frontend logic; production `district_type` seeding could
add new literals in that window — re-verify the enumeration table if new locations are seeded
before this phase executes).
