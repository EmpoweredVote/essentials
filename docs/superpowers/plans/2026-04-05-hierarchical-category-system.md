# Hierarchical Category System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat pill-based category layout with a two-level accordion hierarchy (Government Body → Sub-group) that derives grouping from data instead of keyword matching.

**Architecture:** Three repos change: ev-accounts gets a DB migration and API field additions, ev-ui gets two new components (`GovernmentBodySection` and `SubGroupSection`), and essentials gets new grouping/ordering logic plus an updated `Results.jsx` rendering loop. The existing `classify.js` stays for other consumers but `Results.jsx` stops using it.

**Tech Stack:** PostgreSQL (Supabase), Node.js/Express (ev-accounts), React 19 (essentials, ev-ui), inline styles via design tokens (ev-ui)

**Spec:** `docs/superpowers/specs/2026-04-05-hierarchical-category-system-design.md`

---

### Task 1: Database Migration — Add `website_url` to chambers

**Repo:** ev-accounts
**Files:**
- Create: `backend/migrations/051_chamber_website_url.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 051_chamber_website_url.sql
-- Add website_url column to chambers for sub-group level links

ALTER TABLE essentials.chambers ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN essentials.chambers.website_url IS 'Optional URL for this chamber/body (e.g., bloomington.in.gov/council)';
```

- [ ] **Step 2: Run the migration against dev database**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-accounts/backend && npx tsx -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(require('fs').readFileSync('migrations/051_chamber_website_url.sql', 'utf8')).then(() => { console.log('Migration complete'); pool.end(); }).catch(e => { console.error(e); pool.end(); })"`

Expected: "Migration complete"

- [ ] **Step 3: Verify the column exists**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-accounts/backend && npx tsx -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_schema = 'essentials' AND table_name = 'chambers' AND column_name = 'website_url'\").then(r => { console.log(r.rows.length === 1 ? 'PASS: website_url column exists' : 'FAIL'); pool.end(); })"`

Expected: "PASS: website_url column exists"

- [ ] **Step 4: Commit**

```bash
cd /Users/chrisandrews/Documents/GitHub/ev-accounts
git add backend/migrations/051_chamber_website_url.sql
git commit -m "feat(db): add website_url column to essentials.chambers

Supports sub-group level links in the hierarchical category UI.
Each chamber can now store an optional URL (e.g., bloomington.in.gov/council)."
```

---

### Task 2: Populate `website_url` for Bloomington/Monroe County chambers

**Repo:** ev-accounts
**Files:**
- Create: `backend/migrations/052_populate_chamber_urls.sql`

- [ ] **Step 1: Query existing chamber IDs to build the UPDATE statements**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-accounts/backend && npx tsx -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT ch.id, ch.name, ch.name_formal, g.name as gov_name FROM essentials.chambers ch JOIN essentials.governments g ON g.id = ch.government_id WHERE g.name ILIKE '%Bloomington%' OR g.name ILIKE '%Monroe County%' ORDER BY g.name, ch.name_formal\").then(r => { r.rows.forEach(row => console.log(JSON.stringify(row))); pool.end(); })"`

Use the output to verify chamber formal names match the UPDATE statements below.

- [ ] **Step 2: Write the migration SQL**

```sql
-- 052_populate_chamber_urls.sql
-- Populate website_url for Bloomington and Monroe County chambers

-- City of Bloomington
UPDATE essentials.chambers SET website_url = 'https://bloomington.in.gov/council'
WHERE name_formal = 'Bloomington Common Council';

UPDATE essentials.chambers SET website_url = 'https://bloomington.in.gov/mayor'
WHERE name_formal = 'City of Bloomington'
  AND government_id = (SELECT id FROM essentials.governments WHERE name = 'City of Bloomington, Indiana, US')
  AND EXISTS (
    SELECT 1 FROM essentials.offices o
    JOIN essentials.districts d ON d.id = o.district_id
    WHERE o.chamber_id = essentials.chambers.id AND d.district_type = 'LOCAL_EXEC'
  );

UPDATE essentials.chambers SET website_url = 'https://bloomington.in.gov/clerk'
WHERE name_formal = 'City of Bloomington'
  AND government_id = (SELECT id FROM essentials.governments WHERE name = 'City of Bloomington, Indiana, US')
  AND EXISTS (
    SELECT 1 FROM essentials.offices o
    JOIN essentials.districts d ON d.id = o.district_id
    WHERE o.chamber_id = essentials.chambers.id AND d.district_type = 'LOCAL'
  );

-- Monroe County
UPDATE essentials.chambers SET website_url = 'https://www.in.gov/counties/monroe/government/council/'
WHERE name_formal = 'Monroe County Council';

UPDATE essentials.chambers SET website_url = 'https://www.in.gov/counties/monroe/government/commissioners/'
WHERE name_formal = 'Monroe County Board of Commissioners';

UPDATE essentials.chambers SET website_url = 'https://www.in.gov/counties/monroe/'
WHERE name_formal = 'Monroe County Government';

-- Monroe County Circuit Court
UPDATE essentials.chambers SET website_url = 'https://www.in.gov/courts/circuit/monroe/'
WHERE name_formal = 'Monroe County Circuit Court';

-- MCCSC
UPDATE essentials.chambers SET website_url = 'https://www.mccsc.edu/'
WHERE name_formal = 'Monroe County Community School Corporation';
```

- [ ] **Step 3: Run the migration**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-accounts/backend && npx tsx -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(require('fs').readFileSync('migrations/052_populate_chamber_urls.sql', 'utf8')).then(() => { console.log('Migration complete'); pool.end(); }).catch(e => { console.error(e); pool.end(); })"`

Expected: "Migration complete"

- [ ] **Step 4: Verify populated URLs**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-accounts/backend && npx tsx -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT ch.name_formal, ch.website_url FROM essentials.chambers ch WHERE ch.website_url IS NOT NULL ORDER BY ch.name_formal\").then(r => { r.rows.forEach(row => console.log(row.name_formal, '->', row.website_url)); console.log('Total:', r.rows.length); pool.end(); })"`

Expected: 8 rows with correct URLs.

- [ ] **Step 5: Commit**

```bash
cd /Users/chrisandrews/Documents/GitHub/ev-accounts
git add backend/migrations/052_populate_chamber_urls.sql
git commit -m "feat(db): populate chamber website_url for Bloomington/Monroe County

Initial data for sub-group links: city council, mayor, clerk,
county council, commissioners, circuit court, MCCSC."
```

---

### Task 3: Add `chamber_url` and `government_type` to API response

**Repo:** ev-accounts
**Files:**
- Modify: `backend/src/lib/essentialsService.ts`

The `PoliticianFlatRecord` type and all query locations that select `g.name AS government_name` need two new fields. There are 6 query locations (lines 420, 547, 604, 885, 1406, 1568) and 2 type definitions.

- [ ] **Step 1: Add fields to the `PoliticianFlatRecord` type**

In `backend/src/lib/essentialsService.ts`, find the type definition around line 85-115 containing `government_body_url: string;` and add after it:

```typescript
  chamber_url: string;
  government_type: string;
```

There is a second type definition (around line 794) — add the same two fields there after `government_name`.

- [ ] **Step 2: Update all SQL queries to select new fields**

Find every occurrence of `g.name AS government_name` in the file. After each one, on the next available line, add:

```sql
           g.type AS government_type,
```

Find every occurrence of `COALESCE(gvb.website_url, '') AS government_body_url,` and add after it:

```sql
           COALESCE(ch.website_url, '') AS chamber_url,
```

There are 6 query locations. Update all of them.

- [ ] **Step 3: Update all row mapping locations**

Find every occurrence of `government_body_url: row.government_body_url ?? '',` in the row-mapping code. After each, add:

```typescript
    chamber_url: row.chamber_url ?? '',
    government_type: row.government_type ?? '',
```

There are at least 2 mapping locations (around lines 476-477 and 661-662). Update all of them.

- [ ] **Step 4: Run typecheck to verify**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-accounts/backend && npm run typecheck`

Expected: No errors related to `chamber_url` or `government_type`.

- [ ] **Step 5: Test the API returns new fields**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-accounts/backend && npx tsx -e "require('dotenv').config(); const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT ch.website_url AS chamber_url, g.type AS government_type, p.first_name, p.last_name FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id = p.id JOIN essentials.chambers ch ON ch.id = o.chamber_id JOIN essentials.governments g ON g.id = ch.government_id WHERE g.name ILIKE '%Bloomington%' LIMIT 3\").then(r => { r.rows.forEach(row => console.log(JSON.stringify(row))); pool.end(); })"`

Expected: Rows with `chamber_url` populated for Bloomington politicians and `government_type` = "City".

- [ ] **Step 6: Commit**

```bash
cd /Users/chrisandrews/Documents/GitHub/ev-accounts
git add backend/src/lib/essentialsService.ts
git commit -m "feat(api): add chamber_url and government_type to politician response

chamber_url provides sub-group level website links.
government_type (City, County, Township, etc.) enables
convention-based ordering in the frontend hierarchy."
```

---

### Task 4: Create `SubGroupSection` component in ev-ui

**Repo:** ev-ui
**Files:**
- Create: `src/SubGroupSection.jsx`
- Modify: `src/index.js`

- [ ] **Step 1: Create the SubGroupSection component**

Create `src/SubGroupSection.jsx`:

```jsx
import React from 'react';
import { colors, fonts, fontWeights, fontSizes, spacing } from './tokens';

/**
 * SubGroupSection — a sub-group label + card grid inside a GovernmentBodySection.
 *
 * @param {Object} props
 * @param {string} props.title - Sub-group label (e.g., "Bloomington Common Council")
 * @param {string} [props.websiteUrl] - Optional inline link after label
 * @param {React.ReactNode} props.children - PoliticianCard components
 */
export default function SubGroupSection({ title, websiteUrl, children }) {
  const styles = {
    section: {
      marginBottom: spacing[4],
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[2],
      marginBottom: spacing[2],
    },
    label: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.semibold,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      color: colors.textMuted,
      fontFamily: fonts.primary,
    },
    link: {
      color: '#59b0c4',
      textDecoration: 'none',
      fontSize: '10px',
      fontWeight: fontWeights.medium,
      fontFamily: fonts.primary,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))',
      gap: spacing[2],
    },
  };

  return (
    <div style={styles.section}>
      <div style={styles.header}>
        <span style={styles.label}>{title}</span>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            {websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
          </a>
        )}
      </div>
      <div style={styles.grid} className="ev-subgroup-grid">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export from index.js**

In `src/index.js`, add after the `CategorySection` export line:

```javascript
export { default as SubGroupSection } from "./SubGroupSection.jsx";
```

- [ ] **Step 3: Verify build succeeds**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-ui && npm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/chrisandrews/Documents/GitHub/ev-ui
git add src/SubGroupSection.jsx src/index.js
git commit -m "feat: add SubGroupSection component

Sub-group label + card grid for use inside GovernmentBodySection.
Displays uppercase label with optional website link."
```

---

### Task 5: Create `GovernmentBodySection` component in ev-ui

**Repo:** ev-ui
**Files:**
- Create: `src/GovernmentBodySection.jsx`
- Modify: `src/index.js`

- [ ] **Step 1: Create the GovernmentBodySection component**

Create `src/GovernmentBodySection.jsx`:

```jsx
import React, { useState } from 'react';
import { colors, fonts, fontWeights, fontSizes, spacing, tierColors } from './tokens';

/**
 * GovernmentBodySection — collapsible accordion for a government body.
 *
 * @param {Object} props
 * @param {string} props.title - Accordion header (e.g., "City of Bloomington")
 * @param {string} [props.websiteUrl] - Top-level website link at far right
 * @param {string} [props.tier] - "local" | "state" | "federal"
 * @param {boolean} [props.defaultExpanded=true] - Initial expand state
 * @param {React.ReactNode} props.children - SubGroupSection components
 */
export default function GovernmentBodySection({
  title,
  websiteUrl,
  tier,
  defaultExpanded = true,
  children,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const tierStyle = tier ? tierColors[tier] : null;
  const accentColor = tierStyle?.accent ?? colors.borderMedium;

  const styles = {
    section: {
      marginBottom: spacing[5],
      borderLeft: `3px solid ${accentColor}`,
      paddingLeft: spacing[4],
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[2],
      marginBottom: expanded ? spacing[3] : 0,
      cursor: 'pointer',
      userSelect: 'none',
    },
    title: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.bold,
      color: colors.textPrimary,
      fontFamily: fonts.primary,
    },
    toggle: {
      fontSize: fontSizes.xs,
      color: colors.textMuted,
      transition: 'transform 0.2s',
      transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
    },
    link: {
      fontSize: fontSizes.xs,
      color: '#59b0c4',
      textDecoration: 'none',
      marginLeft: 'auto',
      fontFamily: fonts.primary,
    },
    content: {
      display: expanded ? 'block' : 'none',
    },
  };

  return (
    <section style={styles.section} className="ev-gov-body-section">
      <div
        style={styles.header}
        onClick={() => setExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
      >
        <span style={styles.title}>{title}</span>
        <span style={styles.toggle} aria-hidden="true">▼</span>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Visit ${title} website`}
          >
            {websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
          </a>
        )}
      </div>
      <div style={styles.content}>
        {children}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Export from index.js**

In `src/index.js`, add after the `SubGroupSection` export:

```javascript
export { default as GovernmentBodySection } from "./GovernmentBodySection.jsx";
```

- [ ] **Step 3: Verify build succeeds**

Run: `cd /Users/chrisandrews/Documents/GitHub/ev-ui && npm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/chrisandrews/Documents/GitHub/ev-ui
git add src/GovernmentBodySection.jsx src/index.js
git commit -m "feat: add GovernmentBodySection accordion component

Collapsible section with bold header, tier-colored left border,
optional website link, and collapse/expand toggle. Contains
SubGroupSection children."
```

---

### Task 6: Publish ev-ui and update essentials dependency

**Repo:** ev-ui, then essentials

- [ ] **Step 1: Bump ev-ui version**

Read `ev-ui/package.json` to get the current version, then bump the patch version.

- [ ] **Step 2: Build and publish**

Run:
```bash
cd /Users/chrisandrews/Documents/GitHub/ev-ui
npm run build
npm publish
```

Expected: Package published successfully.

- [ ] **Step 3: Update essentials dependency**

Run:
```bash
cd /Users/chrisandrews/Documents/GitHub/essentials
npm update @chrisandrewsedu/ev-ui
```

Expected: `package.json` and `package-lock.json` updated.

- [ ] **Step 4: Verify new components are importable**

Run:
```bash
cd /Users/chrisandrews/Documents/GitHub/essentials
node -e "const { GovernmentBodySection, SubGroupSection } = require('@chrisandrewsedu/ev-ui'); console.log('GovernmentBodySection:', typeof GovernmentBodySection); console.log('SubGroupSection:', typeof SubGroupSection);"
```

Expected: Both log `function`.

- [ ] **Step 5: Commit essentials dependency update**

```bash
cd /Users/chrisandrews/Documents/GitHub/essentials
git add package.json package-lock.json
git commit -m "chore: update ev-ui with GovernmentBodySection and SubGroupSection"
```

---

### Task 7: Create grouping logic module in essentials

**Repo:** essentials
**Files:**
- Create: `src/lib/groupHierarchy.js`

This module replaces the `classifyCategory()` + `splitByBodyName()` approach. It takes a flat list of politicians and returns a nested structure: `{ tier → [ { body, subgroups: [ { label, url, pols } ] } ] }`.

- [ ] **Step 1: Create the grouping module**

Create `src/lib/groupHierarchy.js`:

```javascript
/**
 * Groups a flat list of politicians into a three-level hierarchy:
 *   Tier → Government Body (accordion) → Sub-group (label + cards)
 *
 * Grouping is data-driven using government_name, government_body_name,
 * and district_type — not keyword-based classification.
 */

// ── Tier assignment ──────────────────────────────────────────────

function getTier(pol) {
  const dt = pol.district_type || '';
  if (dt.startsWith('NATIONAL')) return 'Federal';
  if (dt.startsWith('STATE')) return 'State';
  if (dt === 'JUDICIAL') {
    const ch = (pol.chamber_name || '').toLowerCase();
    if (ch.includes('supreme') || ch.includes('appeals') || ch.includes('appellate') || ch.includes('tax'))
      return 'State';
    return 'Local';
  }
  return 'Local';
}

// ── Accordion key (government body) ──────────────────────────────

const STATE_LEGISLATURE_KW = ['senate', 'house', 'assembly', 'general assembly', 'legislature'];
const STATE_EXEC_TOP_KW = ['governor', 'lt. governor', 'lieutenant governor'];
const STATE_EXEC_CONSTITUTIONAL_KW = ['secretary of state', 'attorney general', 'treasurer', 'comptroller', 'superintendent', 'auditor of state'];
const STATE_DEPT_KW = ['commission', 'department', 'board', 'authority', 'agency', 'office of', 'division', 'bureau'];
const STATE_COURT_KW = ['supreme', 'appeals', 'appellate', 'tax court'];

function getStateAccordionKey(pol, stateName) {
  const ch = (pol.chamber_name_formal || pol.chamber_name || '').toLowerCase();
  const title = (pol.office_title || '').toLowerCase();

  if (STATE_LEGISLATURE_KW.some(kw => ch.includes(kw)))
    return `${stateName} General Assembly`;
  if (STATE_EXEC_TOP_KW.some(kw => title.includes(kw)))
    return `${stateName} Executive`;
  if (STATE_EXEC_CONSTITUTIONAL_KW.some(kw => title.includes(kw)))
    return `${stateName} Executive`;
  if (STATE_COURT_KW.some(kw => ch.includes(kw)))
    return `${stateName} State Courts`;
  if (STATE_DEPT_KW.some(kw => ch.includes(kw)))
    return `${stateName} Departments & Commissions`;
  return `${stateName} Executive`;
}

function getAccordionKey(pol) {
  const dt = pol.district_type || '';

  // Judiciary always gets its own accordion keyed by government_body_name
  if (dt === 'JUDICIAL') {
    return pol.government_body_name || pol.chamber_name_formal || 'Courts';
  }

  // State-level: split by keyword patterns since all share the same government_name
  if (dt.startsWith('STATE')) {
    const stateName = stripSuffix(pol.government_name);
    return getStateAccordionKey(pol, stateName);
  }

  // Federal: split similarly
  if (dt.startsWith('NATIONAL')) {
    return getFederalAccordionKey(pol);
  }

  // Local/County/School: group by government_name
  return pol.government_name || 'Unknown';
}

const FEDERAL_LEGISLATURE_KW = ['senate', 'house', 'congress'];
const FEDERAL_CABINET_KW = ['secretary of'];
const FEDERAL_AGENCY_KW = ['commission', 'department', 'board', 'authority', 'agency', 'office of', 'bureau'];

function getFederalAccordionKey(pol) {
  const dt = pol.district_type || '';
  const ch = (pol.chamber_name_formal || pol.chamber_name || '').toLowerCase();
  const title = (pol.office_title || '').toLowerCase();

  if (dt === 'NATIONAL_UPPER' || dt === 'NATIONAL_LOWER')
    return 'U.S. Congress';
  if (dt === 'NATIONAL_JUDICIAL')
    return 'U.S. Supreme Court';
  if (title.includes('president') || title.includes('vice president'))
    return 'U.S. Executive';
  if (FEDERAL_CABINET_KW.some(kw => title.includes(kw)))
    return 'U.S. Executive';
  if (FEDERAL_AGENCY_KW.some(kw => ch.includes(kw) || title.includes(kw)))
    return 'U.S. Agencies & Commissions';
  return 'U.S. Executive';
}

// ── Sub-group key ────────────────────────────────────────────────

function getSubGroupKey(pol) {
  // Use government_body_name + district_type as compound key
  // This separates mayor (LOCAL_EXEC) from clerk (LOCAL) even when
  // they share government_body_name "City of Bloomington"
  const body = pol.government_body_name || '';
  const dt = pol.district_type || '';
  return `${body}||${dt}`;
}

// ── Display name helpers ─────────────────────────────────────────

/** Strip ", State, US" suffix from government_name */
function stripSuffix(name) {
  if (!name) return '';
  return name.split(',')[0].trim();
}

/**
 * Derive display label for a sub-group.
 * Rules (in order):
 * 1. Role-split groups (same body, different district_type): use cleaned office_title
 * 2. Use government_body_name as-is
 * 3. Replace generic words ("Government") with "Officials"
 * 4. Courts: derive from shared office_title prefix
 */
function getSubGroupLabel(pols, accordionTitle) {
  if (pols.length === 0) return '';

  const first = pols[0];
  const body = first.government_body_name || '';
  const dt = first.district_type || '';

  // Rule 1: Role-split — when body name matches the accordion's government_name
  // (e.g., body="City of Bloomington", accordion="City of Bloomington")
  // the body name is just the parent, so use office_title
  const accordionGovName = stripSuffix(first.government_name);
  if (body && body === accordionGovName) {
    // Derive from office_title: "City Mayor" → "Mayor", "City Clerk" → "Clerk"
    const title = first.office_title || '';
    const cleaned = title
      .replace(/^(City|Town|Village|County)\s+/i, '')
      .replace(/\s+-\s+.*$/, ''); // strip " - At Large" etc.
    return cleaned || body;
  }

  // Rule 4: Courts — derive from shared office_title prefix
  if (dt === 'JUDICIAL') {
    const titles = pols.map(p => p.office_title || '');
    // Find common prefix like "Indiana Circuit Court Judge - 10th Circuit"
    const circuitMatch = titles[0]?.match(/^(.+?Circuit)(?:,|\s+-)/);
    if (circuitMatch) {
      return circuitMatch[1].replace(/Judge\s*-\s*/, '') + ' Judges';
    }
    // Fallback: use body name
    return body || 'Judges';
  }

  // Rule 2: Use government_body_name as-is
  // Rule 3: Replace generic words
  if (/\bGovernment\b/i.test(body)) {
    return body.replace(/\bGovernment\b/i, 'Officials');
  }

  return body || accordionTitle;
}

/** Get the website URL for a sub-group (from chamber_url, falling back to government_body_url) */
function getSubGroupUrl(pols) {
  // Prefer chamber_url (sub-group specific), fall back to government_body_url
  const first = pols[0];
  return first?.chamber_url || '';
}

/** Get the website URL for an accordion (from government_body_url of first pol) */
function getAccordionUrl(pols) {
  // For judiciary, use government_body_url directly
  if (pols[0]?.district_type === 'JUDICIAL') {
    return pols[0]?.government_body_url || '';
  }
  // For others, prefer the government_body_url of the first sub-group
  // that has a URL matching the parent government
  const parentBody = stripSuffix(pols[0]?.government_name);
  const parentMatch = pols.find(p => p.government_body_name === parentBody && p.government_body_url);
  if (parentMatch) return parentMatch.government_body_url;
  // Fallback: any government_body_url
  return pols[0]?.government_body_url || '';
}

// ── Ordering ─────────────────────────────────────────────────────

const TIER_ORDER = ['Local', 'State', 'Federal'];

const LOCAL_BODY_TYPE_ORDER = ['City', 'Town', 'Township', 'School District', 'County'];
// Judiciary bodies sorted last within local
const isJudiciary = (pols) => pols.some(p => p.district_type === 'JUDICIAL');

const STATE_BODY_ORDER_KW = [
  'General Assembly', 'Legislature',
  'Executive',
  'Departments', 'Commissions',
  'Court of Appeals', 'Appeals',
  'Tax Court',
  'Supreme Court',
];

const FEDERAL_BODY_ORDER_KW = [
  'Congress',
  'Executive',
  'Agencies',
  'Supreme Court',
];

function bodyOrderScore(accordionKey, pols) {
  const tier = getTier(pols[0]);

  if (tier === 'Local') {
    if (isJudiciary(pols)) return 100; // Courts last in local
    const govType = pols[0]?.government_type || '';
    const idx = LOCAL_BODY_TYPE_ORDER.indexOf(govType);
    return idx >= 0 ? idx : 50;
  }

  if (tier === 'State') {
    const key = accordionKey.toLowerCase();
    const idx = STATE_BODY_ORDER_KW.findIndex(kw => key.includes(kw.toLowerCase()));
    return idx >= 0 ? idx : 50;
  }

  if (tier === 'Federal') {
    const key = accordionKey.toLowerCase();
    const idx = FEDERAL_BODY_ORDER_KW.findIndex(kw => key.includes(kw.toLowerCase()));
    return idx >= 0 ? idx : 50;
  }

  return 50;
}

// Sub-group ordering: Legislative → Executive → Other
const LEGISLATIVE_KW = ['council', 'board of supervisors', 'senate', 'house', 'assembly', 'board of commissioners', 'board of education', 'school board'];
const EXECUTIVE_KW = ['mayor', 'governor', 'president', 'trustee', 'executive'];

function subGroupOrderScore(label, pols) {
  const lower = label.toLowerCase();
  const titleLower = (pols[0]?.office_title || '').toLowerCase();

  // House before Senate (smaller representation first)
  if (lower.includes('house') || lower.includes('assembly')) return 0;
  if (lower.includes('senate')) return 1;

  if (LEGISLATIVE_KW.some(kw => lower.includes(kw))) return 10;
  if (EXECUTIVE_KW.some(kw => lower.includes(kw) || titleLower.includes(kw))) return 20;
  return 30; // Other (clerk, officials, etc.)
}

// ── Main grouping function ───────────────────────────────────────

/**
 * Groups politicians into a hierarchy for rendering.
 *
 * @param {Array} politicians - Flat array of politician objects from the API
 * @returns {Array<{ tier: string, bodies: Array<{ key: string, title: string, url: string, subgroups: Array<{ key: string, label: string, url: string, pols: Array }> }> }>}
 */
export function groupIntoHierarchy(politicians) {
  // Step 1: Assign tier and accordion key to each politician
  const tierMap = {}; // tier → { accordionKey → [ pol ] }

  for (const pol of politicians) {
    const tier = getTier(pol);
    const accordionKey = getAccordionKey(pol);

    if (!tierMap[tier]) tierMap[tier] = {};
    if (!tierMap[tier][accordionKey]) tierMap[tier][accordionKey] = [];
    tierMap[tier][accordionKey].push(pol);
  }

  // Step 2: Build the hierarchy
  const result = [];

  for (const tier of TIER_ORDER) {
    const accordions = tierMap[tier];
    if (!accordions) continue;

    const bodies = Object.entries(accordions)
      .map(([key, pols]) => {
        // Build sub-groups within this accordion
        const sgMap = {};
        for (const pol of pols) {
          const sgKey = getSubGroupKey(pol);
          if (!sgMap[sgKey]) sgMap[sgKey] = [];
          sgMap[sgKey].push(pol);
        }

        const subgroups = Object.entries(sgMap)
          .map(([sgKey, sgPols]) => ({
            key: sgKey,
            label: getSubGroupLabel(sgPols, stripSuffix(pols[0]?.government_name)),
            url: getSubGroupUrl(sgPols),
            pols: sgPols,
          }))
          .sort((a, b) => {
            const sa = subGroupOrderScore(a.label, a.pols);
            const sb = subGroupOrderScore(b.label, b.pols);
            if (sa !== sb) return sa - sb;
            return a.label.localeCompare(b.label);
          });

        return {
          key,
          title: key.includes(',') ? stripSuffix(key) : key, // Strip suffix for government_name keys
          url: getAccordionUrl(pols),
          subgroups,
          _pols: pols, // for ordering
        };
      })
      .sort((a, b) => {
        const sa = bodyOrderScore(a.key, a._pols);
        const sb = bodyOrderScore(b.key, b._pols);
        if (sa !== sb) return sa - sb;
        return a.title.localeCompare(b.title);
      })
      .map(({ _pols, ...rest }) => rest); // remove _pols from output

    if (bodies.length > 0) {
      result.push({ tier, bodies });
    }
  }

  return result;
}
```

- [ ] **Step 2: Verify the module has no syntax errors**

Run: `cd /Users/chrisandrews/Documents/GitHub/essentials && node -e "require('./src/lib/groupHierarchy.js')"`

Expected: No errors (empty output).

- [ ] **Step 3: Commit**

```bash
cd /Users/chrisandrews/Documents/GitHub/essentials
git add src/lib/groupHierarchy.js
git commit -m "feat: add data-driven grouping hierarchy module

Replaces classifyCategory() + splitByBodyName() approach.
Groups politicians by government_name → government_body_name
with convention-based ordering (legislative → executive → other)."
```

---

### Task 8: Update Results.jsx to use hierarchical rendering

**Repo:** essentials
**Files:**
- Modify: `src/pages/Results.jsx`

This is the largest task. We replace the flat `orderedEntries(groups, ORDER).map(...)` rendering with the new hierarchy.

- [ ] **Step 1: Update imports**

In `src/pages/Results.jsx`, replace the ev-ui import line:

```javascript
import { CategorySection, PoliticianCard, useMediaQuery, tierColors } from '@chrisandrewsedu/ev-ui';
```

with:

```javascript
import { GovernmentBodySection, SubGroupSection, PoliticianCard, useMediaQuery, tierColors } from '@chrisandrewsedu/ev-ui';
```

Replace the classify import:

```javascript
import {
  classifyCategory,
  STATE_ORDER,
  FEDERAL_ORDER,
  LOCAL_ORDER,
  orderedEntries,
  getDisplayName,
} from '../lib/classify';
```

with:

```javascript
import { groupIntoHierarchy } from '../lib/groupHierarchy';
```

- [ ] **Step 2: Remove `splitByBodyName` function**

Delete the `splitByBodyName` function (around lines 200-237). It's no longer needed.

- [ ] **Step 3: Replace the grouping and rendering logic**

Find the section in the render code where politicians are grouped and rendered (around lines 940-1070). This is the block that does:
1. Groups politicians by tier using `classifyCategory()`
2. Renders each tier with `orderedEntries()` and `CategorySection`

Replace the grouping computation. Find the `useMemo` or inline code that builds `grouped` (the tier→group→polList structure). Replace it with a call to `groupIntoHierarchy`.

Find the existing grouping code — look for `classifyCategory` usage in the rendering section. It will be inside a `useMemo` or computed inline. The pattern is:

```javascript
const grouped = {};
for (const pol of ...) {
  const { tier, group } = classifyCategory(pol);
  ...
}
```

Replace that entire grouping block with:

```javascript
const hierarchy = groupIntoHierarchy(allPoliticians);
```

Where `allPoliticians` is the same array that was being iterated over before.

- [ ] **Step 4: Replace the tier rendering blocks**

Replace the three separate tier rendering blocks (Local, State, Federal — each with their own `orderedEntries` + `CategorySection` loops) with a single unified loop:

```jsx
{hierarchy.map(({ tier, bodies }) => {
  const tierKey = tier.toLowerCase();
  const tierStyle = tierColors[tierKey];
  if (!tierStyle) return null;

  return (
    <div key={tier} data-tier={tier} className="-mx-4 md:-mx-8 px-4 md:px-8 py-3" style={{ backgroundColor: tierStyle.bg }}>
      {selectedFilter === 'All' && (
        <div className="mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tierStyle.text }}>{tier}</span>
        </div>
      )}
      {bodies.map((body) => (
        <GovernmentBodySection
          key={body.key}
          title={body.title}
          websiteUrl={body.url || undefined}
          tier={tierKey}
        >
          {body.subgroups.map((sg) => (
            <SubGroupSection
              key={sg.key}
              title={sg.label}
              websiteUrl={sg.url || undefined}
            >
              {defaultSort(sg.label, sg.pols).map((pol) =>
                renderSeatGroup(pol)
              )}
            </SubGroupSection>
          ))}
        </GovernmentBodySection>
      ))}
    </div>
  );
})}
```

Note: `defaultSort` currently takes a category name from `classify.js`. It may need adjustment since the sort key is now the sub-group label. Check that `GROUP_SORT_OPTIONS` in `sorters.js` has entries that match the new labels, or fall back to a default sort. If the old category names don't match, just pass the pols through — the existing sort within sub-groups (by district number, then name) will still work via the default case.

- [ ] **Step 5: Clean up unused imports and functions**

Remove these if they're no longer referenced anywhere in Results.jsx:
- `qualifyLocalTitle` function (if only used by the old rendering path — check first)
- `simplifyForBody` function (if only used by the old rendering path — check first)
- `getBranch` import (if only used for the old branch-icon display)
- Any other dead code from the old approach

**Important:** Keep `renderPoliticianCard`, `renderSeatGroup`, `defaultSort`, and all the card-level logic unchanged. Only the grouping and section-rendering code changes.

- [ ] **Step 6: Verify the app builds**

Run: `cd /Users/chrisandrews/Documents/GitHub/essentials && npm run build`

Expected: Build succeeds (may have warnings, no errors).

- [ ] **Step 7: Test visually with dev server**

Run: `cd /Users/chrisandrews/Documents/GitHub/essentials && npm run dev`

Open in browser, search for a Bloomington address. Verify:
- Local tier shows accordion sections for City of Bloomington, Bloomington Township, MCCSC, Monroe County, Monroe County Circuit Court
- Each accordion has sub-groups with uppercase labels
- Cards render correctly inside sub-groups
- Accordions collapse/expand on click
- Website links appear where populated

- [ ] **Step 8: Commit**

```bash
cd /Users/chrisandrews/Documents/GitHub/essentials
git add src/pages/Results.jsx
git commit -m "feat: replace flat category pills with hierarchical accordion layout

Uses GovernmentBodySection → SubGroupSection from ev-ui.
Grouping is now data-driven via groupIntoHierarchy() instead
of keyword-based classifyCategory() + splitByBodyName().

Ordering follows convention: legislative → executive → other,
smaller/closer representation first."
```

---

### Task 9: Manual visual testing and edge case fixes

**Repo:** essentials

- [ ] **Step 1: Test Bloomington address**

Run dev server, search "401 N Morton St, Bloomington, IN 47404". Verify the full hierarchy matches the spec validation section:
1. City of Bloomington → Bloomington Common Council (9), Mayor (1), Clerk (1)
2. Bloomington Township → Board (3), Trustee (1)
3. MCCSC → School Board (7)
4. Monroe County → Monroe County Council (7), Monroe County Board of Commissioners (3), Monroe County Officials (8)
5. Monroe County Circuit Court → 10th Circuit Judges (9)

Plus State and Federal tiers above.

- [ ] **Step 2: Test LA address**

Search an LA address like "200 N Spring St, Los Angeles, CA 90012". Verify:
1. Los Angeles → City Council (15), Mayor (1)
2. Los Angeles Unified → Board of Education (7)
3. Los Angeles County → Board of Supervisors (5), County Officers (3)

- [ ] **Step 3: Fix any visual issues found**

Address any display name, ordering, or layout issues discovered during testing. Common things to check:
- Sub-group labels are not generic ("Government", "State Government")
- Accordion titles don't have ", Indiana, US" suffixes
- Links display and work correctly
- Card titles within sub-groups are not redundant with the sub-group label
- Mobile responsive layout works

- [ ] **Step 4: Final commit with any fixes**

```bash
cd /Users/chrisandrews/Documents/GitHub/essentials
git add -A
git commit -m "fix: address visual issues found during hierarchical layout testing"
```
