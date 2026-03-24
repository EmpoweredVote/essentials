const lower = (s) => (s || "").toString().toLowerCase().trim();

export const lastNameKey = (pol) => {
  const name = `${pol.preferred_name || pol.first_name || ""} ${
    pol.last_name || ""
  }`.trim();
  const parts = name.split(/\s+/);
  return lower(parts.length ? parts[parts.length - 1] : name);
};

export const agencyKey = (pol) =>
  lower(
    pol.chamber_name_formal ||
      pol.chamber_name ||
      pol.government_name ||
      pol.office_title
  );

export const roleKey = (pol) => lower(pol.office_title);

export const stateKey = (pol) => lower(pol.representing_state);

export const partyKey = (pol) => {
  const p = lower(pol.party);
  // group parties predictably: dem < rep < ind/other
  if (p.startsWith("dem")) return "1_democrat";
  if (p.startsWith("rep")) return "2_republican";
  if (p.startsWith("ind")) return "3_independent";
  return `9_${p}`;
};

export const districtNumberKey = (pol) => {
  // try to extract a number from “District 7”, “IL-07”, “ward 3”, etc.
  const label = `${pol.district_label || ""} ${pol.chamber_name || ""} ${
    pol.office_title || ""
  }`;
  const m = label.match(/(\d{1,3})/);
  return m ? parseInt(m[1], 10) : -1;
};

// Custom role ranks for special groups
const CABINET_RANK = [
  "president",
  "vice president",
  "secretary of state",
  "secretary of the treasury",
  "secretary of defense",
  "attorney general",
  "secretary of the interior",
  "secretary of agriculture",
  "secretary of commerce",
  "secretary of labor",
  "secretary of health",
  "secretary of housing",
  "secretary of transportation",
  "secretary of energy",
  "secretary of education",
  "secretary of veterans",
  "secretary of homeland",
];
const rankFromList = (list, title) => {
  const t = lower(title);
  const idx = list.findIndex((k) => t.includes(k));
  return idx === -1 ? 999 : idx;
};
export const cabinetRankKey = (pol) =>
  rankFromList(CABINET_RANK, pol.office_title);

// Governor rank — Governor before Lt. Governor
const GOVERNOR_RANK = [
  "governor",
  "lieutenant governor",
  "lt. governor",
  "lt governor",
];
export const governorRankKey = (pol) =>
  rankFromList(GOVERNOR_RANK, pol.office_title);

// Local exec rank
const LOCAL_EXEC_RANK = [
  "mayor",
  "county executive",
  "county board president",
  "city manager",
  "village president",
  "town supervisor",
];
export const localExecRankKey = (pol) =>
  rankFromList(LOCAL_EXEC_RANK, pol.office_title);

// Township rank: trustee (executive) before board members
const TOWNSHIP_RANK = ["trustee"];
export const townshipRankKey = (pol) =>
  rankFromList(TOWNSHIP_RANK, pol.office_title);

// At-large seats sort before numbered districts
export const atLargeFirstKey = (pol) => (pol.district_id === '0' ? 0 : 1);

// Alphabetical sort by district label (for non-numbered districts like townships)
export const districtLabelKey = (pol) => lower(pol.district_label || '');

// Chief Justice/Chief Judge sorts before other justices/judges
export const chiefJusticeFirstKey = (pol) => {
  const title = lower(pol.office_title || '');
  return title.includes('chief') ? 0 : 1;
};

// Division/Seat number for judges: "Division 1", "Seat 2", etc.
export const seatNumberKey = (pol) => {
  const label = `${pol.office_title || ""} ${pol.district_label || ""}`;
  const m = label.match(/(?:seat|division)\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
};

// Court rank: Supreme Court first, then Appellate/Appeals, then others
const COURT_RANK = ["supreme", "appellate", "appeals"];
export const courtRankKey = (pol) => {
  const chamber = lower(pol.chamber_name_formal || pol.chamber_name || "");
  const title = lower(pol.office_title || "");
  const text = `${chamber} ${title}`;
  for (let i = 0; i < COURT_RANK.length; i++) {
    if (text.includes(COURT_RANK[i])) return i;
  }
  return 999;
};

// Appointment date for seniority ordering (Supreme Court justices)
export const appointmentDateKey = (pol) => pol.appointment_date || "9999-12-31";

export const makeComparator =
  (keyFn, dir = "asc") =>
  (a, b) => {
    const av = keyFn(a),
      bv = keyFn(b);
    const aa = av ?? "";
    const bb = bv ?? "";
    const res = aa < bb ? -1 : aa > bb ? 1 : 0;
    return dir === "desc" ? -res : res;
  };

// Multi-key comparator if you want stable tie-breakers:
export const chainComparators =
  (...comparators) =>
  (a, b) => {
    for (const cmp of comparators) {
      const r = cmp(a, b);
      if (r !== 0) return r;
    }
    return 0;
  };

// Elected-first key: elected positions (is_elected=true) come before appointed
export const electedFirstKey = (pol) => (pol.is_elected ? 0 : 1);

// utils/sorters.js (continued)
export const GROUP_SORT_OPTIONS = {
  "Governor & Lt. Governor": [
    {
      id: "role_rank",
      label: "Role",
      cmp: (dir) => makeComparator(governorRankKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "President / VP": [
    {
      id: "role_rank",
      label: "Role",
      cmp: (dir) => makeComparator(cabinetRankKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  Cabinet: [
    {
      id: "role_rank",
      label: "Role",
      cmp: (dir) => makeComparator(cabinetRankKey, dir),
    },
    {
      id: "agency",
      label: "Department/Agency",
      cmp: (dir) => makeComparator(agencyKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "U.S. Senate": [
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
    {
      id: "state",
      label: "State",
      cmp: (dir) => makeComparator(stateKey, dir),
    },
  ],
  "U.S. House": [
    {
      id: "district",
      label: "District",
      cmp: (dir) => makeComparator(districtNumberKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "State Senate": [
    {
      id: "district",
      label: "District",
      cmp: (dir) => makeComparator(districtNumberKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "State House/Assembly": [
    {
      id: "district",
      label: "District",
      cmp: (dir) => makeComparator(districtNumberKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Departments, Boards & Commissions": [
    {
      id: "agency",
      label: "Agency/Body",
      cmp: (dir) => makeComparator(agencyKey, dir),
    },
    {
      id: "role",
      label: "Role/Title",
      cmp: (dir) => makeComparator(roleKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Municipal Executives": [
    {
      id: "role_rank",
      label: "Role",
      cmp: (dir) => makeComparator(localExecRankKey, dir),
    },
    {
      id: "jurisdiction",
      label: "Jurisdiction",
      cmp: (dir) => makeComparator((p) => lower(p.government_name), dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "City Council": [
    { id: "body", label: "Body", cmp: (dir) => makeComparator(agencyKey, dir) },
    {
      id: "district",
      label: "District/Ward",
      cmp: (dir) => makeComparator(districtNumberKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Municipal Officials": [
    {
      id: "role",
      label: "Role/Title",
      cmp: (dir) => makeComparator(roleKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Township Officials": [
    {
      id: "role_rank",
      label: "Role",
      cmp: (dir) => makeComparator(townshipRankKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  // sensible defaults for other groups:
  "Executive (Other)": [
    {
      id: "role",
      label: "Role/Title",
      cmp: (dir) => makeComparator(roleKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Local Departments & Special Districts": [
    {
      id: "agency",
      label: "Department/District",
      cmp: (dir) => makeComparator(agencyKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Local (Other)": [
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Independent Agencies & Commissions": [
    {
      id: "agency",
      label: "Agency",
      cmp: (dir) => makeComparator(agencyKey, dir),
    },
    {
      id: "role",
      label: "Role/Title",
      cmp: (dir) => makeComparator(roleKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "County Executives": [
    {
      id: "jurisdiction",
      label: "County",
      cmp: (dir) => makeComparator((p) => lower(p.government_name), dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "County Legislators": [
    {
      id: "jurisdiction",
      label: "County",
      cmp: (dir) => makeComparator((p) => lower(p.government_name), dir),
    },
    {
      id: "district",
      label: "District",
      cmp: (dir) => makeComparator(districtNumberKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "County Officials": [
    {
      id: "role",
      label: "Office",
      cmp: (dir) => makeComparator(roleKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "School Board": [
    {
      id: "jurisdiction",
      label: "School District",
      cmp: (dir) => makeComparator((p) => lower(p.government_name), dir),
    },
    {
      id: "at_large",
      label: "At-Large First",
      cmp: (dir) => makeComparator(atLargeFirstKey, dir),
    },
    {
      id: "district",
      label: "District Number",
      cmp: (dir) => makeComparator(districtNumberKey, dir),
    },
    {
      id: "district_label",
      label: "District/Township",
      cmp: (dir) => makeComparator(districtLabelKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "State Judiciary": [
    {
      id: "court_rank",
      label: "Court",
      cmp: (dir) => makeComparator(courtRankKey, dir),
    },
    {
      id: "chief",
      label: "Chief",
      cmp: (dir) => makeComparator(chiefJusticeFirstKey, dir),
    },
    {
      id: "seniority",
      label: "Seniority",
      cmp: (dir) => makeComparator(appointmentDateKey, dir),
    },
    {
      id: "district",
      label: "District",
      cmp: (dir) => makeComparator(districtNumberKey, dir),
    },
    {
      id: "seat",
      label: "Seat",
      cmp: (dir) => makeComparator(seatNumberKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Local Judiciary": [
    {
      id: "court",
      label: "Court",
      cmp: (dir) => makeComparator(agencyKey, dir),
    },
    {
      id: "seat",
      label: "Seat",
      cmp: (dir) => makeComparator(seatNumberKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "Federal Judiciary": [
    {
      id: "court_role",
      label: "Role",
      cmp: (dir) => makeComparator(chiefJusticeFirstKey, dir),
    },
    {
      id: "seniority",
      label: "Seniority",
      cmp: (dir) => makeComparator(appointmentDateKey, dir),
    },
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
};
