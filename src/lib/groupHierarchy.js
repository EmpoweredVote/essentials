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
