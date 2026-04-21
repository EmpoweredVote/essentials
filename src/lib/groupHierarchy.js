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

// Cabinet = heads of executive departments (Secretary of X, Attorney General)
const FEDERAL_CABINET_TITLES = [
  'secretary of state', 'secretary of the treasury', 'secretary of defense',
  'attorney general',
  'secretary of the interior', 'secretary of agriculture', 'secretary of commerce',
  'secretary of labor', 'secretary of health', 'secretary of housing',
  'secretary of transportation', 'secretary of energy', 'secretary of education',
  'secretary of veterans', 'secretary of homeland',
];

function getFederalAccordionKey(pol) {
  const dt = pol.district_type || '';
  const title = (pol.office_title || '').toLowerCase();

  if (dt === 'NATIONAL_UPPER' || dt === 'NATIONAL_LOWER')
    return 'U.S. Congress';
  if (dt === 'NATIONAL_JUDICIAL')
    return 'U.S. Supreme Court';
  if (title.includes('president') || title.includes('vice president'))
    return 'U.S. Executive';
  if (FEDERAL_CABINET_TITLES.some(kw => title.includes(kw)))
    return 'U.S. Cabinet';
  return 'U.S. Cabinet-Level Officials';
}

// ── Admin officer detection ──────────────────────────────────────

const ADMIN_OFFICER_TITLE_RE = /\b(clerk|treasurer|auditor|recorder|assessor)\b/i;

/**
 * Returns true when a politician holds an administrative officer role
 * (clerk, treasurer, auditor, recorder, assessor) at the LOCAL district level.
 * Guards against reclassifying COUNTY clerks or state-level treasurers.
 */
function isAdminOfficer(pol) {
  const dt = pol.district_type || '';
  // Only applies to LOCAL* (LOCAL, LOCAL_EXEC treated separately by district_type segment)
  if (!dt.startsWith('LOCAL')) return false;
  const title = pol.office_title || '';
  return ADMIN_OFFICER_TITLE_RE.test(title);
}

// ── Sub-group key ────────────────────────────────────────────────

function getSubGroupKey(pol) {
  // Use government_body_name + district_type + role segment as compound key.
  // This separates:
  //   - Mayor (LOCAL_EXEC) from council (LOCAL) via district_type
  //   - Admin officers (clerk/treasurer/etc., LOCAL) from council members (LOCAL)
  //     via a third "ADMIN" vs "MEMBER" segment
  const body = pol.government_body_name || '';
  const dt = pol.district_type || '';
  const roleSegment = (dt === 'LOCAL' && isAdminOfficer(pol)) ? 'ADMIN' : 'MEMBER';
  return `${body}||${dt}||${roleSegment}`;
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
 * 0. Admin officers (clerk/treasurer/etc. at LOCAL level): derive clean role label
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

  // Rule 0: Admin officer sub-groups — all pols in this group are admin officers
  // Derive a clean label from office_title
  if (pols.every(p => isAdminOfficer(p))) {
    const title = first.office_title || '';
    // Strip leading jurisdiction prefix ("City ", "Town ", "Village ", "County ")
    const cleaned = title
      .replace(/^(City|Town|Village|County)\s+/i, '')
      .replace(/\s+-\s+.*$/, ''); // strip " - District N" suffix
    // If cleaned is a bare role word (e.g., "Clerk"), re-add a jurisdiction qualifier
    // by deriving it from the government_name (e.g., "City Clerk")
    if (cleaned && /^(clerk|treasurer|auditor|recorder|assessor)$/i.test(cleaned)) {
      const govName = stripSuffix(first.government_name);
      // Derive jurisdiction word: "City of Bloomington" -> "City"
      const jurisdictionWord = govName.match(/^(City|Town|Village|County)/i)?.[1] || '';
      return jurisdictionWord ? `${jurisdictionWord} ${cleaned}` : cleaned;
    }
    return cleaned || title;
  }

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
function getAccordionUrl(pols, accordionKey) {
  // Federal groupings with known URLs
  const FEDERAL_URLS = {
    'U.S. Congress': 'https://www.congress.gov/',
    'U.S. Executive': 'https://www.whitehouse.gov/',
    'U.S. Cabinet': 'https://www.whitehouse.gov/administration/cabinet/',
    'U.S. Cabinet-Level Officials': 'https://www.whitehouse.gov/administration/cabinet/',
  };
  if (FEDERAL_URLS[accordionKey]) return FEDERAL_URLS[accordionKey];

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

const FEDERAL_BODY_ORDER = {
  'U.S. Congress': 0,
  'U.S. Executive': 1,
  'U.S. Cabinet': 2,
  'U.S. Cabinet-Level Officials': 3,
  'U.S. Supreme Court': 4,
};

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
    const score = FEDERAL_BODY_ORDER[accordionKey];
    return score !== undefined ? score : 50;
  }

  return 50;
}

// Sub-group ordering: Legislative → Executive → Other
const LEGISLATIVE_KW = ['council', 'board of supervisors', 'senate', 'house', 'assembly', 'board of commissioners', 'board of education', 'school board'];
const EXECUTIVE_KW = ['mayor', 'governor', 'president', 'trustee', 'executive'];

function subGroupOrderScore(label, pols) {
  const lower = label.toLowerCase();
  const titleLower = (pols[0]?.office_title || '').toLowerCase();

  // Admin officers score 25 — after executives (10) and legislative (20) but before generic "other" (30).
  // Check this BEFORE the legislative keyword check to prevent admin officers whose
  // label or accordion key contains "council" from being misclassified as legislative.
  if (pols.length > 0 && pols.every(p => isAdminOfficer(p))) return 25;

  // House before Senate (smaller representation first)
  if (lower.includes('house') || lower.includes('assembly')) return 0;
  if (lower.includes('senate')) return 1;

  if (EXECUTIVE_KW.some(kw => lower.includes(kw) || titleLower.includes(kw))) return 10;
  if (LEGISLATIVE_KW.some(kw => lower.includes(kw))) return 20;
  return 30; // Other (officials, etc.)
}

// ── Politician sorting within sub-groups ─────────────────────────

/**
 * Sort politicians within a sub-group:
 *   - Judicial: Chief Justice first, then by appointment_date (seniority),
 *     then by division number, then alphabetical
 *   - Others: District seats before At-Large, district numbers ascending,
 *     alphabetical by last name as tie-breaker
 */
function sortPoliticians(pols) {
  if (pols.length === 0) return pols;

  const isJudicialGroup = pols[0]?.district_type === 'JUDICIAL' || pols[0]?.district_type === 'NATIONAL_JUDICIAL';

  if (isJudicialGroup) {
    return [...pols].sort((a, b) => {
      const aTitle = (a.office_title || '').toLowerCase();
      const bTitle = (b.office_title || '').toLowerCase();

      // Chief Justice/Chief Judge always first
      const aIsChief = aTitle.includes('chief');
      const bIsChief = bTitle.includes('chief');
      if (aIsChief !== bIsChief) return aIsChief ? -1 : 1;

      // By appointment_date (seniority — earliest first)
      if (a.appointment_date && b.appointment_date) {
        const diff = new Date(a.appointment_date) - new Date(b.appointment_date);
        if (diff !== 0) return diff;
      }
      if (a.appointment_date && !b.appointment_date) return -1;
      if (!a.appointment_date && b.appointment_date) return 1;

      // By district_id (numeric) — works for appeals court districts
      const aDistNum = parseInt(a.district_id, 10);
      const bDistNum = parseInt(b.district_id, 10);
      if (!isNaN(aDistNum) && !isNaN(bDistNum) && aDistNum !== bDistNum) return aDistNum - bDistNum;

      // By division/seat number extracted from title
      const aDivMatch = aTitle.match(/division\s+(\d+)/i) || aTitle.match(/seat\s+(\d+)/i) || aTitle.match(/district\s+(\d+)/i);
      const bDivMatch = bTitle.match(/division\s+(\d+)/i) || bTitle.match(/seat\s+(\d+)/i) || bTitle.match(/district\s+(\d+)/i);
      if (aDivMatch && bDivMatch) {
        const diff = parseInt(aDivMatch[1], 10) - parseInt(bDivMatch[1], 10);
        if (diff !== 0) return diff;
      }

      // Alphabetical fallback
      return (a.last_name || '').localeCompare(b.last_name || '');
    });
  }

  return [...pols].sort((a, b) => {
    const aId = a.district_id ?? '';
    const bId = b.district_id ?? '';

    // At-large (district_id "0") sorts after numbered districts
    const aIsAtLarge = aId === '0' || (a.district_label || '').toLowerCase().includes('at-large');
    const bIsAtLarge = bId === '0' || (b.district_label || '').toLowerCase().includes('at-large');
    if (aIsAtLarge !== bIsAtLarge) return aIsAtLarge ? 1 : -1;

    // Numeric district sort
    const aNum = parseInt(aId, 10);
    const bNum = parseInt(bId, 10);
    if (!isNaN(aNum) && !isNaN(bNum) && aNum !== bNum) return aNum - bNum;

    // Alphabetical fallback
    return (a.last_name || '').localeCompare(b.last_name || '');
  });
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
            pols: sortPoliticians(sgPols),
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
          url: getAccordionUrl(pols, key),
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
