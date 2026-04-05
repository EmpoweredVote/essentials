# Hierarchical Category System Design

**Date:** 2026-04-05
**Status:** Approved
**Repos:** essentials, ev-ui, ev-accounts

## Problem

The current category system uses flat pills with keyword-based classification (`classify.js`) and ad-hoc body-name splitting (`splitByBodyName`). This produces inconsistent results: the mayor and clerk both show "City of Bloomington" as separate sections, judiciary shows a generic "Local Courts" label, and every new municipality requires custom display-name mappings. The system needs to work across all Indiana cities (Tier 2/3) and LA County without per-city exceptions.

## Solution

Replace the flat pill-based layout with a two-level accordion hierarchy:

- **Level 1 (Government Body):** Collapsible accordion section with a bold header, left border accent, and optional website link. E.g., "City of Bloomington", "Monroe County", "Indiana General Assembly".
- **Level 2 (Sub-group):** Uppercase label with optional website link, followed by a politician card grid. E.g., "City Council", "Mayor", "Clerk".

Grouping is derived from existing data (`government_name`, `government_body_name`) rather than keyword matching, with a lightweight convention-based ordering config.

## Data Model Changes

### Migration 1: Add `website_url` to `essentials.chambers`

```sql
ALTER TABLE essentials.chambers ADD COLUMN website_url TEXT;
```

Stores sub-group-level links (e.g., `bloomington.in.gov/council` on the "Bloomington Common Council" chamber). Optional — UI omits the link when null.

### Migration 2: Populate initial data

Populate `website_url` for Bloomington and Monroe County chambers as proof of concept. Other municipalities populated over time.

### API Change

Add two fields to the politician response object in `essentialsService.ts`:
- `chamber_url` — sourced from `ch.website_url` (sub-group link)
- `government_type` — sourced from `g.type` (e.g., "City", "County", "Township", "School District")

No new endpoints.

## Grouping Logic

### Tier Assignment

Unchanged — derived from `district_type`:

| district_type | Tier |
|--------------|------|
| `NATIONAL_*` | Federal |
| `STATE_*` | State |
| `LOCAL_EXEC`, `LOCAL`, `COUNTY`, `SCHOOL` | Local |
| `JUDICIAL` | State or Local depending on court level (from `chamber_name`) |

### Government Body (Accordion Header)

Derived from `government_name`. Politicians sharing the same `government_name` are grouped into the same accordion, with these exceptions:

- **Judiciary:** Politicians with `district_type: JUDICIAL` get their own accordion regardless of `government_name`. The accordion header uses `government_body_name` (e.g., "Monroe County Circuit Court").
- **State level:** All state politicians share `government_name: "State of Indiana"` but split into multiple accordions based on `chamber_name_formal` patterns:
  - Senate + House chambers → "Indiana General Assembly"
  - Governor/Lt. Governor chambers → "Indiana Executive"
  - Constitutional officer chambers → "Indiana Executive"
  - Department/Board/Commission chambers → "Indiana Departments & Commissions"
  - Court chambers → "Indiana State Courts"

The state-level split uses universal keywords ("senate", "house", "governor", "supreme court") that work across states.

### Sub-group (Label within Accordion)

Derived from `government_body_name`. Politicians sharing the same `government_body_name` within an accordion form one sub-group, with one exception:

- **Same body, different roles:** When multiple politicians share the same `government_body_name` but have different `district_type` values (e.g., mayor is `LOCAL_EXEC`, clerk is `LOCAL`), they are split into separate sub-groups. The sub-group label is derived from the `office_title` (e.g., "Mayor", "Clerk") rather than the body name.

The display label uses the full `government_body_name` as-is, except when it's generic or redundant:

| government_body_name | district_type | Under Accordion | Display Label |
|---------------------|---------------|-----------------|---------------|
| Bloomington Common Council | LOCAL | City of Bloomington | Bloomington Common Council |
| City of Bloomington | LOCAL_EXEC | City of Bloomington | Mayor |
| City of Bloomington | LOCAL | City of Bloomington | Clerk |
| Monroe County Council | COUNTY | Monroe County | Monroe County Council |
| Monroe County Board of Commissioners | COUNTY | Monroe County | Monroe County Board of Commissioners |
| Monroe County Government | COUNTY | Monroe County | Monroe County Officials |
| Monroe County Circuit Court | JUDICIAL | Monroe County Circuit Court | 10th Circuit Judges |

**Display label derivation rules (in order):**
1. If the sub-group was split by role (same body, different `district_type`): use a cleaned version of `office_title` (e.g., "City Mayor" → "Mayor", "City Clerk" → "Clerk")
2. Use `government_body_name` as-is — keep the full name including locality (e.g., "Monroe County Council", "Bloomington Common Council")
3. If the name is generic/meaningless (e.g., "Monroe County Government"), replace the generic word with a role-based label: "Monroe County Officials". Never display bare words like "Government", "State Government", "County Government".
4. For courts, derive from the shared `office_title` prefix (e.g., "Indiana Circuit Court Judge - 10th Circuit, Division X" → "10th Circuit Judges")

### Accordion Header Display Names

Derived by stripping the state/country suffix from `government_name`:

- "City of Bloomington, Indiana, US" → "City of Bloomington"
- "Monroe County, Indiana, US" → "Monroe County"
- "Los Angeles, California, US" → "Los Angeles"

Rule: split on `, ` and take the first segment.

## Ordering System

Three levels of ordering, all convention-based (frontend config, no DB columns).

### Tier Order

Local → State → Federal (closest first, matches current behavior).

### Body Order Within Tier

**Local tier:**
1. City/Town (`government_type: City, Town`)
2. Township (`government_type: Township`)
3. School District (`government_type: School District`)
4. County (`government_type: County`) — excluding courts
5. County Courts (`JUDICIAL` with county-level chamber)

**State tier:**
1. Legislature (General Assembly / Legislature accordion)
2. Executive (Governor / Executive accordion)
3. Departments/Boards/Commissions
4. Court of Appeals
5. Tax Court
6. Supreme Court

**Federal tier:**
1. Legislature (U.S. Congress)
2. Executive (President, Cabinet)
3. Agencies & Commissions
4. U.S. Supreme Court

Bodies that don't exist for a given address are simply absent.

### Sub-group Order Within Body

Legislative → Executive → Other, determined by keyword matching on `government_body_name` or `office_title`:

- **Legislative:** council, board of supervisors, senate, house, assembly, commission (county), board (township)
- **Executive:** mayor, governor, president, trustee, commissioner (county)
- **Other:** clerk, officers, officials, everything else

Within the same role tier, sort alphabetically. Individual politicians within a sub-group use existing sort logic from `sorters.js`.

### Ordering Principle

Smaller/closer representation ranks higher. House before Senate at both state and federal levels. City before County at local level.

## UI Components

### New: `GovernmentBodySection` (ev-ui)

The accordion container component.

**Props:**
- `title` (string) — accordion header text (e.g., "City of Bloomington")
- `websiteUrl` (string, optional) — top-level website link at far right
- `tier` (string) — "local" | "state" | "federal" — controls left border accent color
- `defaultExpanded` (boolean, default: true) — initial expand state
- `children` (ReactNode) — `SubGroupSection` components

**Visual:**
- Bold 16px header text (Manrope)
- Collapse/expand toggle (arrow icon)
- 3px left border in tier accent color
- Website link at far right of header
- Padding-left for content indentation

### New: `SubGroupSection` (ev-ui)

The sub-group label + card grid.

**Props:**
- `title` (string) — sub-group label (e.g., "City Council")
- `websiteUrl` (string, optional) — inline link after label
- `children` (ReactNode) — `PoliticianCard` components

**Visual:**
- 12px uppercase label, 600 weight, muted color
- Optional link in smaller text inline after label
- Card grid below (same `repeat(auto-fill, minmax(250px, 1fr))` as current)

### Unchanged

- `CategorySection` — remains in ev-ui, still used by `ElectionsView.jsx` and `Prototype.jsx`
- `PoliticianCard` — unchanged
- `IconOverlay` — unchanged
- Tier background colors and tier header labels — unchanged

## Changes by Repo

### ev-accounts (backend)

1. **Migration:** Add `website_url` column to `essentials.chambers`
2. **Migration:** Populate `website_url` for Bloomington/Monroe County chambers
3. **API:** Add `chamber_url` (from `ch.website_url`) and `government_type` (from `g.type`) to politician response in `essentialsService.ts` queries

### ev-ui (component library)

1. **New component:** `GovernmentBodySection`
2. **New component:** `SubGroupSection`
3. **Export** both from `index.js`
4. **Publish** new version

### essentials (frontend)

1. **New module:** Grouping logic that replaces `classifyCategory()` usage — groups politicians by `government_name` → `government_body_name` hierarchy
2. **New module:** Ordering config — body order per tier, sub-group order within body
3. **New module:** Display name derivation — strips suffixes/prefixes from raw data names
4. **Update `Results.jsx`:** Replace flat group rendering with nested `GovernmentBodySection` → `SubGroupSection` rendering
5. **Remove from `Results.jsx`:** `splitByBodyName()` function
6. **Keep `classify.js`:** Still used by other components, but `Results.jsx` no longer imports from it

## Out of Scope

- Federal cabinet data updates (Pam Bondi replacement, new DHS Secretary)
- Anthony Swinger portrait cropping fix
- Tier 1 city special handling (LA works with current data, no LA-specific logic)
- Data-driven ordering (sort_order DB columns) — convention-based for now
- Collapse state persistence
- Populating `chambers.website_url` beyond Bloomington/Monroe County
- Changes to `ElectionsView.jsx` or `Prototype.jsx`

## Validation

For a Bloomington, IN address, the local tier should render:

1. **City of Bloomington** (bloomington.in.gov)
   - BLOOMINGTON COMMON COUNCIL (bloomington.in.gov/council) — 9 cards
   - MAYOR (bloomington.in.gov/mayor) — 1 card
   - CLERK (bloomington.in.gov/clerk) — 1 card
2. **Bloomington Township**
   - BOARD — 3 cards
   - TRUSTEE — 1 card
3. **Monroe County Community School Corporation** (mccsc.edu)
   - SCHOOL BOARD — 7 cards
4. **Monroe County** (in.gov/counties/monroe)
   - MONROE COUNTY COUNCIL (council page link) — 7 cards
   - MONROE COUNTY BOARD OF COMMISSIONERS (commissioners page link) — 3 cards
   - MONROE COUNTY OFFICIALS — 8 cards (sheriff, clerk, auditor, etc.)
5. **Monroe County Circuit Court** (in.gov/courts/circuit/monroe)
   - 10TH CIRCUIT JUDGES — 9 cards

For a Los Angeles, CA address, the local tier should render:

1. **Los Angeles** (or City of Los Angeles)
   - CITY COUNCIL — 15 cards
   - MAYOR — 1 card
2. **Los Angeles Unified**
   - BOARD OF EDUCATION — 7 cards
3. **Los Angeles County**
   - BOARD OF SUPERVISORS — 5 cards
   - COUNTY OFFICERS — 3 cards (sheriff, DA, assessor)
