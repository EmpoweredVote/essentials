const word = (s) => (s || "").toLowerCase();

const hasAny = (s, list) => {
  const t = word(s);
  return list.some((k) => t.includes(k));
};

export const FEDERAL_ORDER = [
  "U.S. Senate",
  "U.S. House",
  "President / VP",
  "Cabinet",
  "Independent Agencies & Commissions",
  "Executive (Other)",
  "Federal Judiciary",
];

export const STATE_ORDER = [
  "Governor & Lt. Governor",
  "Statewide Constitutional Officers",
  "State Senate",
  "State House/Assembly",
  "State Board of Education",
  "State Supreme Court",
  "State Court of Appeals",
  "State Tax Court",
  "Departments, Boards & Commissions",
  "Executive (Other)",
];

export const LOCAL_ORDER = [
  "Municipal Executives",
  "City Council",
  "Municipal Officials",
  "Township Officials",
  "County Executives",
  "County Legislators",
  "County Officials",
  "School Board",
  "Local Judiciary",
  "Local Departments & Special Districts",
  "Local (Other)",
];

export const STATE_JUDICIARY_ORDER = ["State Supreme Court", "State Court of Appeals", "State Tax Court"];

// Phase 215 (HDR-01/HDR-02, decision D-05): single source of truth for the
// per-tab type-filter default. Judges defaults to 'Appointed' — the exact
// value that keeps the Judges tab populated (most judges are appointed, not
// elected), while representatives/educators default to 'Elected'.
export const TAB_TYPE_DEFAULTS = {
  representatives: "Elected",
  educators: "Elected",
  judges: "Appointed",
};

// Resolution logic per CONTEXT D-05: politician.is_appointed overrides office-level
export function resolveIsAppointed(pol) {
  // politician.is_appointed=true is an individual override (e.g. interim appointment)
  if (pol.is_appointed === true) return true;
  // Otherwise fall back to office-level: is_elected derives from !is_appointed_position
  return !pol.is_elected;
}

// Filter logic per CONTEXT D-06
export function matchesAppointedFilter(pol, filter) {
  if (filter === 'All') return true;
  const resolved = resolveIsAppointed(pol);
  if (filter === 'Elected') {
    return !resolved || pol.faces_retention_vote === true;
  }
  if (filter === 'Appointed') {
    return resolved === true;
  }
  return true;
}

const BODY_LEGIS_UPPER = ["senate"];
const BODY_LEGIS_LOWER = ["house", "assembly"];
const BODY_AGENCY = [
  "commission",
  "department",
  "board",
  "authority",
  "agency",
  "office of",
  "division",
  "bureau",
  "council of state",
  "corporation",
];
const LOCAL_SPECIAL = [
  "school board",
  "school district",
  "sheriff",
  "assessor",
  "clerk",
  "park district",
  "water district",
  "library board",
  "fire district",
];

// Role keywords
const ROLE_EXEC_STATEWIDE = [
  "secretary of state",
  "attorney general",
  "treasurer",
  "comptroller",
  "superintendent",
];
const ROLE_EXEC_TOP = [
  "governor",
  "lieutenant governor",
  "lt. governor",
  "lt governor",
];
const ROLE_LOCAL_EXEC = [
  "mayor",
  "county executive",
  "county board president",
  "borough president",
  "city manager",
  "village president",
  "town supervisor",
];
const ROLE_LOCAL_LEGIS = [
  "commissioner",
  "councilmember",
  "councilor",
  "alder",
  "alderman",
  "alderperson",
];

export function classifyCategory(pol) {
  const dt = pol?.district_type || "";
  const chamber = pol?.chamber_name_formal || pol?.chamber_name || "";
  const title = pol?.office_title || "";

  if (dt === "NATIONAL_UPPER") return { tier: "Federal", group: "U.S. Senate" };
  if (dt === "NATIONAL_LOWER") return { tier: "Federal", group: "U.S. House" };
  if (dt === "STATE_UPPER") return { tier: "State", group: "State Senate" };
  if (dt === "STATE_LOWER")
    return { tier: "State", group: "State House/Assembly" };
  // SCHEMA-02 (Phase 133 D-09): dedicated State Board of Education group
  if (dt === "STATE_BOARD")
    return { tier: "State", group: "State Board of Education" };

  if (dt === "NATIONAL_JUDICIAL") {
    return { tier: "Federal", group: "Federal Judiciary" };
  }

  if (dt === "NATIONAL_EXEC") {
    // Elected federal executives: President and VP
    if (hasAny(title, ["president", "vice president"])) {
      return { tier: "Federal", group: "President / VP" };
    }
    // Cabinet secretaries (appointed but high-level)
    if (hasAny(title, ["secretary of"])) {
      return { tier: "Federal", group: "Cabinet" };
    }
    // Independent agencies and commissions
    if (
      hasAny(chamber, BODY_AGENCY) ||
      hasAny(title, ["commissioner", "director", "administrator", "chair"])
    ) {
      return { tier: "Federal", group: "Independent Agencies & Commissions" };
    }
    // Other executive positions (ambassadors, chiefs of staff, etc.)
    return { tier: "Federal", group: "Executive (Other)" };
  }

  if (dt === "STATE_EXEC") {
    if (hasAny(title, ROLE_EXEC_TOP))
      return { tier: "State", group: "Governor & Lt. Governor" };
    if (hasAny(title, ROLE_EXEC_STATEWIDE))
      return { tier: "State", group: "Statewide Constitutional Officers" };
    if (
      hasAny(chamber, BODY_AGENCY) ||
      hasAny(title, ["commissioner", "director", "chair"])
    ) {
      return { tier: "State", group: "Departments, Boards & Commissions" };
    }
    return { tier: "State", group: "Executive (Other)" };
  }

  if (dt === "LOCAL_EXEC") {
    if (hasAny(title, ["township"]))
      return { tier: "Local", group: "Township Officials" };
    if (
      hasAny(chamber, BODY_AGENCY) ||
      hasAny(title, ["commissioner", "director", "chief"])
    ) {
      return { tier: "Local", group: "Local Departments & Special Districts" };
    }
    return { tier: "Local", group: "Municipal Executives" };
  }

  if (dt === "LOCAL") {
    // Township officials
    if (hasAny(title, ["township"]) || hasAny(chamber, ["township"]))
      return { tier: "Local", group: "Township Officials" };
    // County legislative bodies (BallotReady sometimes uses LOCAL for these)
    if (hasAny(chamber, ["board of supervisors", "county council", "county commission"]))
      return { tier: "Local", group: "County Legislators" };
    // Municipal administrative officials (clerk, treasurer, auditor, etc.) —
    // check BEFORE chamber-council match because clerks are sometimes
    // attached to the council chamber administratively (e.g., Nicole Bolden,
    // Bloomington City Clerk, chamber="Common City Council").
    if (hasAny(title, ["clerk", "treasurer", "auditor", "recorder", "assessor"])) {
      return { tier: "Local", group: "Municipal Officials" };
    }
    // City council and similar legislative bodies
    if (
      hasAny(chamber, [
        "council",
        "board of aldermen",
      ]) ||
      hasAny(title, ROLE_LOCAL_LEGIS)
    ) {
      return { tier: "Local", group: "City Council" };
    }
    if (
      hasAny(chamber, BODY_AGENCY) ||
      hasAny(chamber, LOCAL_SPECIAL) ||
      hasAny(title, LOCAL_SPECIAL)
    ) {
      return { tier: "Local", group: "Local Departments & Special Districts" };
    }
    if (
      hasAny(chamber, ["board of commissioners"]) ||
      hasAny(title, ["commissioner"])
    ) {
      return { tier: "Local", group: "City Council" };
    }
    return { tier: "Local", group: "Local (Other)" };
  }

  // County officials - treat as Local
  if (dt === "COUNTY") {
    if (hasAny(title, ["commissioner", "commission", "supervisor", "council"])) {
      return { tier: "Local", group: "County Legislators" };
    }
    if (hasAny(title, ROLE_LOCAL_EXEC)) {
      return { tier: "Local", group: "County Executives" };
    }
    if (hasAny(title, ["sheriff", "clerk", "treasurer", "assessor", "auditor", "recorder", "coroner", "surveyor"])) {
      return { tier: "Local", group: "County Officials" };
    }
    return { tier: "Local", group: "County Officials" };
  }

  // School district officials - treat as Local
  if (dt === "SCHOOL") {
    return { tier: "Local", group: "School Board" };
  }

  // Judicial officials - separate state courts by type, local courts grouped
  if (dt === "JUDICIAL") {
    if (hasAny(chamber, ["supreme"])) {
      return { tier: "State", group: "State Supreme Court" };
    }
    if (hasAny(chamber, ["appellate", "appeals"])) {
      return { tier: "State", group: "State Court of Appeals" };
    }
    if (hasAny(chamber, ["tax"])) {
      return { tier: "State", group: "State Tax Court" };
    }
    return { tier: "Local", group: "Local Judiciary" };
  }

  if (hasAny(chamber, BODY_LEGIS_UPPER))
    return { tier: "Unknown", group: "Legislature (Upper)" };
  if (hasAny(chamber, BODY_LEGIS_LOWER))
    return { tier: "Unknown", group: "Legislature (Lower)" };

  return { tier: "Unknown", group: "Uncategorized" };
}

// classifyBucket(pol) — CLASS-01 single source of truth: buckets every
// office-holder into exactly one of 'representative' | 'educator' | 'judge'.
// Both today's Results grouping and Phase 208's Educators & Judges tabs call
// this same function so classification can never drift (D-06). Precedence is
// district_type base + additive-only overrides (D-07/D-08) — a clean
// JUDICIAL/SCHOOL/STATE_BOARD/SCHOOL_BOARD row is decided before any override
// regex runs and can never be pulled back out. See 207-RESEARCH.md.

// D-01: whole JUDICIAL/NATIONAL_JUDICIAL district_type -> judge (no
// judge-vs-court-staff special-casing).
const JUDGE_DISTRICT_TYPES = new Set(["JUDICIAL", "NATIONAL_JUDICIAL"]);

// D-04: SCHOOL/STATE_BOARD -> educator, plus SCHOOL_BOARD (live-DB
// correction: DC's 9 elected State Board of Education members use this
// literal, not STATE_BOARD).
const EDUCATOR_DISTRICT_TYPES = new Set(["SCHOOL", "STATE_BOARD", "SCHOOL_BOARD"]);

// 208-02 operator punch-list: prosecutors and public defenders (DA / county
// attorney / state's attorney / public defender) are lawyers in the justice
// system, NOT adjudicators, so they no longer route to the judge bucket
// (reverses 207-D-02). They fall through to the 'representative' catch-all and
// group under County/Local Officials. The former PROSECUTOR_DEFENDER_TITLE_RE
// whitelist was removed with the override it fed.

// D-03: title-detected judge/justice fallback for missing/mistyped
// district_type.
const JUDGE_TITLE_RE = /\b(judge|justice)\b/i;

// D-05 / Pitfall 5: school-superintendent override, guarded so it does not
// catch non-education superintendent titles (police, public works, streets).
const SCHOOL_SUPERINTENDENT_TITLE_RE = /superintendent\s+of\s+(public instruction|schools)\b/i;

// D-04: chamber/title "school board" / "board of education" catches
// mistyped school boards regardless of base district_type — this mirrors
// D-02's DA/prosecutor override precedent (also dt-independent). Confirmed
// live case: Portland, ME uses district_type LOCAL, but the check is
// intentionally NOT scoped to dt === 'LOCAL' — any row still in the base
// 'representative' bucket (STATE_EXEC, LOCAL_EXEC, COUNTY, NATIONAL_EXEC,
// etc.) is eligible, so a data source that mistypes a school-board seat
// under a different district_type is still rescued into 'educator'.
const SCHOOL_BOARD_TEXT_RE = /school board|board of education/i;

/**
 * classifyBucket(pol) -> 'representative' | 'educator' | 'judge'
 *
 * CLASS-01: every office-holder returned for a location resolves to exactly
 * one of the three buckets. Null-safe (D-09/T-207-01): a null/missing row
 * falls through to 'representative' without throwing.
 */
export function classifyBucket(pol) {
  const dt = pol?.district_type || "";
  const title = pol?.office_title || "";
  const chamber = pol?.chamber_name_formal || pol?.chamber_name || "";

  // Base: district_type (D-07). Clean JUDICIAL/NATIONAL_JUDICIAL/SCHOOL/
  // STATE_BOARD/SCHOOL_BOARD rows are decided here and never pulled back out
  // by a keyword below (D-08).
  if (JUDGE_DISTRICT_TYPES.has(dt)) return "judge";
  if (EDUCATOR_DISTRICT_TYPES.has(dt)) return "educator";

  // Additive overrides (D-07/D-08) — only reachable when the base bucket is
  // still 'representative'.
  // 208-02: prosecutors/public defenders are NOT adjudicators — no longer
  // routed to judge (reverses 207-D-02, see note above). Only genuine
  // judge/justice titles fall through to the judge bucket here.
  if (JUDGE_TITLE_RE.test(title)) return "judge"; // D-03
  if (SCHOOL_SUPERINTENDENT_TITLE_RE.test(title)) return "educator"; // D-05
  if (SCHOOL_BOARD_TEXT_RE.test(title) || SCHOOL_BOARD_TEXT_RE.test(chamber))
    return "educator"; // D-04

  return "representative"; // D-09 catch-all
}

export function orderedEntries(obj, order) {
  const keys = Object.keys(obj);
  const ranked = keys.sort(
    (a, b) =>
      (order.indexOf(a) === -1 ? 999 : order.indexOf(a)) -
      (order.indexOf(b) === -1 ? 999 : order.indexOf(b))
  );
  return ranked.map((k) => [k, obj[k]]);
}

// Display name mappings for Figma design
export const CATEGORY_DISPLAY_NAMES = {
  // Federal
  "President / VP": "President & VP",
  "U.S. Senate": "Senate",
  "U.S. House": "House",
  "Cabinet": "Cabinet",
  "Independent Agencies & Commissions": "Agencies",
  "Executive (Other)": "Other Executive",
  "Federal Judiciary": "U.S. Supreme Court",

  // State
  "Governor & Lt. Governor": "Governor",
  "Statewide Constitutional Officers": "Constitutional Officers",
  "State Senate": "State Senate",
  "State House/Assembly": "State House",
  "State Board of Education": "State Board of Education",
  "State Supreme Court": "Supreme Court",
  "State Court of Appeals": "Court of Appeals",
  "State Tax Court": "Tax Court",
  "Departments, Boards & Commissions": "Boards & Commissions",

  // Local
  "Municipal Executives": "Mayor",
  "City Council": "City Council",
  "Municipal Officials": "City Officials",
  "Township Officials": "Township",
  "County Executives": "County Executive",
  "County Legislators": "County Board",
  "County Officials": "County Officials",
  "School Board": "School Board",
  "Local Judiciary": "Local Courts",
  "Local Departments & Special Districts": "Special Districts",
  "Local (Other)": "Other",
};

/**
 * Get display-friendly category name
 */
export function getDisplayName(categoryName) {
  return CATEGORY_DISPLAY_NAMES[categoryName] || categoryName;
}

/**
 * Compute the CompassCardHorizontal variant for a politician.
 * Used by page-level components (Results.jsx, ElectionsView.jsx).
 *
 * STATE-01: < 3 answers => 'empty'
 * STATE-02: admin title  => 'administrative'
 * STATE-03: judicial     => 'judicial'
 * else                   => 'compass'
 *
 * @param {object} pol         politician record with office_title, district_type
 * @param {Array}  userAnswers user's compass answers array (or null/[])
 * @returns {'compass' | 'empty' | 'administrative' | 'judicial'}
 */
export function computeVariant(pol, userAnswers, hasStances = true) {
  const title = (pol?.office_title || '').toLowerCase();
  const dt = pol?.district_type || '';

  // Admin and judicial never have compass data — always show unavailable plate
  if (/clerk|treasurer|auditor|recorder|assessor/.test(title)) return 'administrative';
  if (dt === 'JUDICIAL' || /judge|justice|court/.test(title)) return 'judicial';

  // No stances on file — show "no stances" plate regardless of user calibration,
  // so we don't bait the user into calibrating only to find no comparison data.
  if (!hasStances) return 'no-stances';

  // For compass-eligible roles with stances: show CTA until user has enough answers
  if ((userAnswers || []).length < 3) return 'empty';

  return 'compass';
}
