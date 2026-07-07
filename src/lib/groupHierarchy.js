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
  if (dt === 'SCHOOL') return 'School';
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

  // SCHEMA-02 (Phase 133 D-09): route STATE_BOARD to dedicated accordion BEFORE
  // legislature/dept/etc. keyword checks. getTier() already routes STATE_BOARD to
  // 'State' via the dt.startsWith('STATE') clause — do NOT touch getTier (Pitfall 6).
  if (
    pol.district_type === 'STATE_BOARD' ||
    ch.includes('board of education') ||
    title.includes('state board of education')
  ) {
    return `${stateName} State Board of Education`;
  }

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

/**
 * Derive a city/jurisdiction accordion key for LOCAL/LOCAL_EXEC (and COUNTY)
 * officials whose government_name is empty — e.g. a council/mayor office whose
 * chamber→government link is missing upstream in the data. Without this they all
 * collapse into a single catch-all "Unknown" accordion (the reported Utah bug).
 *
 * Prefer the office's representing_city; otherwise recover the place name from
 * the district label by stripping the trailing body suffix ("City Council",
 * "Mayor", "Council, District N", etc.). The key intentionally reduces to the
 * same string as stripSuffix(government_name) (e.g. "City of Orem") so a
 * chamber-linked record and a chamber-less duplicate of the same person collapse
 * together during de-duplication. Returns '' when nothing usable can be derived.
 */
function deriveLocalGroupKey(pol) {
  const dt = pol.district_type || '';
  if (!dt.startsWith('LOCAL') && dt !== 'COUNTY') return '';
  let place = (pol.representing_city || '').trim();
  if (!place) {
    place = (pol.district_label || '')
      .replace(/\s*,?\s*(City Council|Town Council|City Commission|Council|Mayor|Board)\b.*$/i, '')
      .trim();
  }
  if (!place) return '';
  return dt === 'COUNTY' ? place : `City of ${place}`;
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

  // School bodies get their own accordion keyed by body name, not parent government
  if (dt === 'SCHOOL') {
    return pol.government_body_name || pol.government_name || deriveLocalGroupKey(pol) || 'Unknown';
  }

  // Local/County: group by government_name. When government_name is absent
  // (chamber→government link missing in the data), fall back to a city group
  // derived from the district label/city instead of a catch-all "Unknown".
  return pol.government_name || deriveLocalGroupKey(pol) || 'Unknown';
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
  return 'U.S. Senior Executive Officials';
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

// ── Judicial official detection ──────────────────────────────────

const JUDICIAL_OFFICIAL_TITLE_RE = /\bclerk\b|\badministrator\b|\bcourt officer\b/i;

/**
 * Returns true when a JUDICIAL-district politician holds a clerk/administrator role
 * rather than being a judge. Separate from isAdminOfficer to keep LOCAL and JUDICIAL
 * logic distinct and avoid cross-contamination.
 */
function isJudicialOfficial(pol) {
  return pol.district_type === 'JUDICIAL' && JUDICIAL_OFFICIAL_TITLE_RE.test(pol.office_title || '');
}

// ── Sub-group key ────────────────────────────────────────────────

const LOCAL_EXEC_TITLE_RE = /\b(mayor|governor)\b/i;

function getSubGroupKey(pol) {
  // Use government_body_name + district_type + role segment as compound key.
  // This separates:
  //   - Mayor (LOCAL_EXEC) from council (LOCAL) via district_type
  //   - Appointed mayors (LOCAL) from council via EXEC segment — so they sort first
  //   - Admin officers (clerk/treasurer/etc., LOCAL) from council members (LOCAL)
  //     via a third "ADMIN" vs "MEMBER" segment
  //   - JUDICIAL clerks/officials from judges via "OFFICIAL" vs "JUDGE" segment
  const body = pol.government_body_name || '';
  const dt = pol.district_type || '';

  if (dt === 'JUDICIAL') {
    const judicialSeg = isJudicialOfficial(pol) ? 'OFFICIAL' : 'JUDGE';
    return `${body}||${dt}||${judicialSeg}`;
  }

  let roleSegment;
  if ((dt === 'LOCAL' || dt === 'LOCAL_EXEC') && LOCAL_EXEC_TITLE_RE.test(pol.office_title || '')) {
    roleSegment = 'EXEC'; // Mayor / Governor — own sub-group, sorts first
  } else if (dt === 'LOCAL_EXEC') {
    // City Manager, City Administrator, etc. — unique key per title so each gets own label
    roleSegment = `TITLE_${(pol.office_title || 'official').replace(/\W+/g, '_').toUpperCase()}`;
  } else if (dt === 'LOCAL' && isAdminOfficer(pol)) {
    roleSegment = 'ADMIN';
  } else {
    roleSegment = 'MEMBER';
  }
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
    // Rule 4a: Judicial officials (clerk, administrator) sub-group
    if (pols.every(p => isJudicialOfficial(p))) {
      // Derive court type from accordion/body name: "Monroe Circuit Court" -> "Circuit Court"
      const courtName = (body || accordionTitle || '').replace(/^.*?\b(Circuit Court|Superior Court|District Court|Court)\b.*$/i, '$1');
      return courtName ? `${courtName} Officials` : 'Court Officials';
    }
    // Rule 4b: Judges sub-group — derive from shared office_title prefix
    const titles = pols.map(p => p.office_title || '');
    // Find common prefix like "Indiana Circuit Court Judge - 10th Circuit"
    const circuitMatch = titles[0]?.match(/^(.+?Circuit)(?:,|\s+-)/);
    if (circuitMatch) {
      return circuitMatch[1].replace(/Judge\s*-\s*/, '') + ' Judges';
    }
    // Fallback: use body name
    return body || 'Judges';
  }

  // Rule 1.5: Exec-titled officials (Mayor/Governor) whose chamber is a legislative body
  // (e.g., Cambridge MA — Mayor is elected from City Council, chamber='Cambridge City Council').
  // Use the office_title directly rather than the chamber name as the sub-group label.
  if (
    (dt === 'LOCAL' || dt === 'LOCAL_EXEC') &&
    pols.every(p => LOCAL_EXEC_TITLE_RE.test(p.office_title || ''))
  ) {
    const title = first.office_title || '';
    return title.replace(/^(City|Town|Village|County)\s+/i, '').replace(/\s+-\s+.*$/, '') || title;
  }

  // Rule 2/3: Use government_body_name, replacing generic words
  if (body) {
    return /\bGovernment\b/i.test(body)
      ? body.replace(/\bGovernment\b/i, 'Officials')
      : body;
  }

  // Rule 3.5 (no body, LOCAL district): use chamber_name_formal or chamber_name as the label.
  // This covers TX cities whose government_bodies rows don't exist yet but whose chamber
  // has a clean name like "Plano City Council" stored in ch.name_formal / ch.name.
  if ((dt === 'LOCAL' || dt === 'LOCAL_EXEC') && (first.chamber_name_formal || first.chamber_name)) {
    return first.chamber_name_formal || first.chamber_name;
  }

  // Rule 4 (no body): derive from office_title — cleaner than falling back to accordion title
  const rawTitle = first.office_title || '';
  // Normalize council member variants → "City Council", "Town Council", etc.
  const cleaned = rawTitle.replace(/\bCouncill?or\b|\bCouncilm(?:an|woman)\b|\bCouncil\s+Member\b/gi, 'Council');
  return cleaned || accordionTitle;
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
    'U.S. Senior Executive Officials': 'https://www.whitehouse.gov/administration/cabinet/',
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

const TIER_ORDER = ['Local', 'School', 'State', 'Federal'];

const LOCAL_BODY_TYPE_ORDER = ['LOCAL', 'City', 'Town', 'Township', 'School District', 'County'];
// Judiciary bodies sorted last within local
const isJudiciary = (pols) => pols.some(p => p.district_type === 'JUDICIAL');

const STATE_BODY_ORDER_KW = [
  'Executive',
  'General Assembly', 'Legislature',
  'Departments', 'Commissions',
  // SCHEMA-02 (Phase 133 D-09): State Board of Education sits between
  // state legislators and judiciary
  'State Board of Education',
  'Court of Appeals', 'Appeals',
  'Tax Court',
  'Supreme Court',
];

const FEDERAL_BODY_ORDER = {
  'U.S. Executive': 0,
  'U.S. Congress': 1,
  'U.S. Cabinet': 2,
  'U.S. Senior Executive Officials': 3,
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

  // Judicial officials (clerks) sort AFTER judges within the same court body.
  if (pols.length > 0 && pols.every(p => isJudicialOfficial(p))) return 30;
  // Judges sort FIRST within a court body (before officials).
  if (pols.length > 0 && pols[0]?.district_type === 'JUDICIAL' && !pols.every(p => isJudicialOfficial(p))) return 15;

  // Admin officers score 25 — after executives (20) but before generic "other" (30).
  // Check this BEFORE the legislative keyword check to prevent admin officers whose
  // label or accordion key contains "council" from being misclassified as legislative.
  if (pols.length > 0 && pols.every(p => isAdminOfficer(p))) return 25;

  // House before Senate (smaller representation first)
  if (lower.includes('house') || lower.includes('assembly')) return 0;
  if (lower.includes('senate')) return 1;

  // Chief executive (Mayor / Governor) sorts FIRST within the tier — but ONLY the
  // mayor/governor, not every LOCAL_EXEC officer. City Attorney, City Controller,
  // City Clerk, City Manager, etc. are LOCAL_EXEC too; they must sort AFTER the
  // legislative body (council), so they fall through to the "other" score below.
  if (
    pols.length > 0 &&
    pols.every(p => p.district_type === 'LOCAL' || p.district_type === 'LOCAL_EXEC') &&
    pols.every(p => LOCAL_EXEC_TITLE_RE.test(p.office_title || ''))
  ) return 10;
  if (EXECUTIVE_KW.some(kw => lower.includes(kw) || titleLower.includes(kw))) return 20;
  if (LEGISLATIVE_KW.some(kw => lower.includes(kw))) return 20;
  return 30; // Other (officials, etc.)
}

// ── Politician sorting within sub-groups ─────────────────────────

// Mayor before council members; Governor before Lt. Gov; President before VP; others below.
function execTitlePriority(pol) {
  const t = (pol.office_title || '').toLowerCase();
  if (/\bmayor\b/.test(t) && !/vice|deputy|pro\s*tem/.test(t)) return 0;
  if (/\b(vice\s*mayor|deputy\s*mayor)\b/.test(t) || /\bmayor\s+pro\s*tem(?:pore)?\b/.test(t)) return 1;
  if (/\bgovernor\b/.test(t) && !/lt\.?|lieutenant/.test(t)) return 0;
  if (/\b(lt\.?\s*governor|lieutenant\s+governor)\b/.test(t)) return 1;
  if (/\bpresident\b/.test(t) && !/vice/.test(t)) return 0;
  if (/\bvice\s*president\b/.test(t)) return 1;
  if (/\bchair\b/.test(t) && !/vice|deputy/.test(t)) return 0;
  return 10;
}

/**
 * Sort politicians within a sub-group:
 *   - Judicial: Chief Justice first, then by appointment_date (seniority),
 *     then by division number, then alphabetical
 *   - Others: Executive title priority first (Gov > Lt. Gov, President > VP),
 *     then district seats before At-Large, district numbers ascending,
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
    // Governor/Lt. Gov and President/VP sort before other members
    const aPriority = execTitlePriority(a);
    const bPriority = execTitlePriority(b);
    if (aPriority !== bPriority) return aPriority - bPriority;

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

    // Extract a district designator from office_title (or district_label) when
    // district_id is non-numeric/shared. Handles BOTH numeric ("District 3",
    // "Ward 1", "Place 2") AND alphabetic ("District A", "Seat B") designators.
    // Clark County's Board of Commissioners uses letter districts A–G that share
    // one COUNTY district row, so the letter lives only in office_title — without
    // this they fall through to alphabetical-by-last-name (the reported bug).
    const DESIG_RE = /(?:district|place|seat|ward|division|precinct|sub-?district)\s+([0-9]+|[A-Za-z])\b/i;
    const aDesig = ((a.office_title || '').match(DESIG_RE) || (a.district_label || '').match(DESIG_RE) || [])[1];
    const bDesig = ((b.office_title || '').match(DESIG_RE) || (b.district_label || '').match(DESIG_RE) || [])[1];
    if (aDesig && bDesig) {
      const aDesigNum = /^[0-9]+$/.test(aDesig);
      const bDesigNum = /^[0-9]+$/.test(bDesig);
      if (aDesigNum && bDesigNum) {
        const d = parseInt(aDesig, 10) - parseInt(bDesig, 10);
        if (d !== 0) return d;
      } else if (!aDesigNum && !bDesigNum) {
        const d = aDesig.toUpperCase().localeCompare(bDesig.toUpperCase());
        if (d !== 0) return d;
      } else {
        return aDesigNum ? -1 : 1; // numbered districts sort before lettered ones
      }
    }

    // Alphabetical fallback
    return (a.last_name || '').localeCompare(b.last_name || '');
  });
}

// ── Multi-office deduplication ───────────────────────────────────

/**
 * When the same politician holds multiple LOCAL/LOCAL_EXEC offices in the
 * same government (e.g., Mayor + City Councillor), keep the highest-priority
 * row and combine the office titles so one card reads "Mayor & City Council".
 */
function deduplicateLocalMultiOffice(politicians) {
  const LOCAL_TYPES = new Set(['LOCAL', 'LOCAL_EXEC']);

  const grouped = new Map();
  const nonLocal = [];
  let uniqueSeq = 0;

  for (const pol of politicians) {
    const dt = pol.district_type || '';
    if (!LOCAL_TYPES.has(dt)) {
      nonLocal.push(pol);
      continue;
    }
    // Key on a normalized city + person NAME. The same person can be present as
    // two distinct politician rows — a chamber-linked record and a chamber-less
    // duplicate — with DIFFERENT ids; keying on id would fail to collapse them.
    // stripSuffix(government_name) and deriveLocalGroupKey both reduce to the
    // same city string ("City of Orem"), so the rows merge here. Merge ONLY when
    // a real full_name is present; without one, keep the record unique so we
    // never collapse genuinely different people (e.g. a clerk vs. councillors).
    const cityKey = stripSuffix(pol.government_name) || deriveLocalGroupKey(pol) || '';
    const name = (pol.full_name || '').trim().toLowerCase();
    const personKey = name || `__unique:${uniqueSeq++}`;
    const key = `${cityKey}||${personKey}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(pol);
  }

  const deduped = [];
  for (const [, pols] of grouped) {
    if (pols.length === 1) {
      deduped.push(pols[0]);
      continue;
    }
    // Keep highest-priority office. Prefer the record carrying a real
    // government_name FIRST: that is the chamber-linked row and — critically —
    // the one issue stances are attached to, so de-dup must never drop it in
    // favour of a chamber-less duplicate. Then LOCAL_EXEC > LOCAL, then title.
    pols.sort((a, b) => {
      const ag = a.government_name ? 0 : 1;
      const bg = b.government_name ? 0 : 1;
      if (ag !== bg) return ag - bg;
      if (a.district_type !== b.district_type) {
        if (a.district_type === 'LOCAL_EXEC') return -1;
        if (b.district_type === 'LOCAL_EXEC') return 1;
      }
      return execTitlePriority(a) - execTitlePriority(b);
    });
    // Combine titles: "City Councillor" → "City Council" for cleaner label
    const titles = pols.map(p =>
      (p.office_title || '').replace(/\bCouncill?or\b|\bCouncilm(?:an|woman)\b|\bCouncil\s+Member\b/gi, 'Council')
    );
    const combined = [...new Set(titles)].join(' & ');
    deduped.push({ ...pols[0], office_title: combined });
  }

  return [...deduped, ...nonLocal];
}

// ── Main grouping function ───────────────────────────────────────

/**
 * Groups politicians into a hierarchy for rendering.
 *
 * @param {Array} politicians - Flat array of politician objects from the API
 * @returns {Array<{ tier: string, bodies: Array<{ key: string, title: string, url: string, subgroups: Array<{ key: string, label: string, url: string, pols: Array }> }> }>}
 */
export function groupIntoHierarchy(politicians) {
  politicians = deduplicateLocalMultiOffice(politicians);

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
          .map(([sgKey, sgPols]) => {
            // Sort first, then derive the label from the sorted order so the sub-group
            // label reflects the lead official (e.g. "Mayor" over "Mayor Pro Tem"),
            // not whichever record the upstream query happened to return first.
            const sortedPols = sortPoliticians(sgPols);
            return {
              key: sgKey,
              label: getSubGroupLabel(sortedPols, stripSuffix(pols[0]?.government_name)),
              url: getSubGroupUrl(sortedPols),
              pols: sortedPols,
            };
          })
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
