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
  return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
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
  "Local Executives": [
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
  "Local Legislators": [
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
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
  "State Judiciary": [
    {
      id: "court",
      label: "Court",
      cmp: (dir) => makeComparator(agencyKey, dir),
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
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ],
};
