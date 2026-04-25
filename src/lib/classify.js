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
 * Used by page-level components (Prototype.jsx, future Results.jsx).
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
export function computeVariant(pol, userAnswers) {
  if ((userAnswers || []).length < 3) return 'empty';

  const title = (pol?.office_title || '').toLowerCase();
  const dt = pol?.district_type || '';

  // Administrative detection — mirrors classify.js lines 172-176, 213
  if (/clerk|treasurer|auditor|recorder|assessor/.test(title)) return 'administrative';

  // Judicial detection — mirrors officeDescriptions.js:89 + JUDICIAL district_type
  if (dt === 'JUDICIAL' || /judge|justice|court/.test(title)) return 'judicial';

  return 'compass';
}
