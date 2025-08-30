const word = (s) => (s || "").toLowerCase();

const hasAny = (s, list) => {
  const t = word(s);
  return list.some((k) => t.includes(k));
};

export const FEDERAL_ORDER = [
  "President / VP / Cabinet",
  "U.S. Senate",
  "U.S. House",
  "Independent Agencies & Commissions",
  "Executive (Other)",
];

export const STATE_ORDER = [
  "Governor & Lt. Governor",
  "Statewide Constitutional Officers",
  "State Senate",
  "State House/Assembly",
  "Departments, Boards & Commissions",
  "Executive (Other)",
];

export const LOCAL_ORDER = [
  "Local Executives",
  "Local Legislators",
  "Local Departments & Special Districts",
  "Local (Other)",
];

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
    if (
      hasAny(chamber, BODY_AGENCY) ||
      hasAny(title, ["commissioner", "director", "administrator", "chair"])
    ) {
      return { tier: "Federal", group: "Independent Agencies & Commissions" };
    }
    return { tier: "Federal", group: "President / VP / Cabinet" };
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
    if (hasAny(title, ROLE_LOCAL_EXEC))
      return { tier: "Local", group: "Local Executives" };
    if (
      hasAny(chamber, BODY_AGENCY) ||
      hasAny(title, ["commissioner", "director", "chief"])
    ) {
      return { tier: "Local", group: "Local Departments & Special Districts" };
    }
    return { tier: "Local", group: "Local Executives" };
  }

  if (dt === "LOCAL") {
    if (
      hasAny(chamber, [
        "council",
        "board of supervisors",
        "board of aldermen",
      ]) ||
      hasAny(title, ROLE_LOCAL_LEGIS)
    ) {
      return { tier: "Local", group: "Local Legislators" };
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
      return { tier: "Local", group: "Local Legislators" };
    }
    return { tier: "Local", group: "Local (Other)" };
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
