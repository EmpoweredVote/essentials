const word = (s) => (s || "").toLowerCase();

const hasAny = (s, list) => {
  const t = word(s);
  return list.some((k) => t.includes(k));
};

export const FEDERAL_ORDER = [
  "President / VP",
  "U.S. Senate",
  "U.S. House",
  "Cabinet",
  "Independent Agencies & Commissions",
  "Executive (Other)",
];

export const STATE_ORDER = [
  "Governor & Lt. Governor",
  "Statewide Constitutional Officers",
  "State Senate",
  "State House/Assembly",
  "State Judiciary",
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

export const STATE_JUDICIARY_ORDER = ["State Judiciary"];

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

  if (pol?.first_name === "VACANT") return { tier: "Hidden", group: "Vacant" };

  if (dt === "NATIONAL_UPPER") return { tier: "Federal", group: "U.S. Senate" };
  if (dt === "NATIONAL_LOWER") return { tier: "Federal", group: "U.S. House" };
  if (dt === "STATE_UPPER") return { tier: "State", group: "State Senate" };
  if (dt === "STATE_LOWER")
    return { tier: "State", group: "State House/Assembly" };

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
    // City council and similar legislative bodies
    if (
      hasAny(chamber, [
        "council",
        "board of supervisors",
        "board of aldermen",
      ]) ||
      hasAny(title, ROLE_LOCAL_LEGIS)
    ) {
      return { tier: "Local", group: "City Council" };
    }
    // Municipal officials (clerk, etc.)
    if (hasAny(title, ["clerk", "city"])) {
      return { tier: "Local", group: "Municipal Officials" };
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
    if (hasAny(title, ["commissioner", "supervisor", "council"])) {
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

  // Judicial officials - treat as Local/State depending on context
  if (dt === "JUDICIAL") {
    if (hasAny(chamber, ["supreme", "appellate", "appeals"])) {
      return { tier: "State", group: "State Judiciary" };
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

  // State
  "Governor & Lt. Governor": "Governor",
  "Statewide Constitutional Officers": "Constitutional Officers",
  "State Senate": "State Senate",
  "State House/Assembly": "State House",
  "State Judiciary": "State Courts",
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
