/**
 * Tests for groupHierarchy.js — sub-group splitting for admin officers
 * (clerk, treasurer, auditor, recorder, assessor)
 */

import { describe, it, expect } from 'vitest';
import { groupIntoHierarchy, tierOrderFor } from './groupHierarchy.js';

// Helper to build a minimal politician record
function makePol(overrides) {
  return {
    district_type: 'LOCAL',
    government_name: 'City of Bloomington, Indiana, US',
    government_body_name: 'Bloomington Common Council',
    chamber_name_formal: 'Common City Council',
    chamber_name: 'Common Council',
    office_title: 'Council Member',
    district_id: '1',
    last_name: 'Smith',
    ...overrides,
  };
}

describe('Admin officer sub-group splitting', () => {

  // Test A: Bolden + 9 council members in one government_body
  // -> result has TWO sub-groups; Bolden's sub-group label contains "Clerk"
  it('Test A: Bolden + council members -> two sub-groups, Bolden in Clerk sub-group', () => {
    const pols = [
      makePol({ office_title: 'City Clerk', last_name: 'Bolden', district_id: '0' }),
      ...Array.from({ length: 9 }, (_, i) =>
        makePol({ office_title: 'Council Member', last_name: `Councilor${i}`, district_id: String(i + 1) })
      ),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    expect(localTier).toBeDefined();

    // Find the City of Bloomington body
    const bodies = localTier.bodies;
    expect(bodies.length).toBeGreaterThan(0);
    const body = bodies[0]; // Should be the only body (all share same government_name)
    const subgroups = body.subgroups;

    // Must have exactly 2 sub-groups
    expect(subgroups.length).toBe(2);

    // One sub-group label contains "Clerk"
    const clerkGroup = subgroups.find(sg => sg.label.toLowerCase().includes('clerk'));
    expect(clerkGroup).toBeDefined();

    // Clerk group contains only Bolden
    expect(clerkGroup.pols.length).toBe(1);
    expect(clerkGroup.pols[0].last_name).toBe('Bolden');

    // Council group contains 9 members
    const councilGroup = subgroups.find(sg => !sg.label.toLowerCase().includes('clerk'));
    expect(councilGroup).toBeDefined();
    expect(councilGroup.pols.length).toBe(9);
  });

  // Test B: Council members alone -> single sub-group, label unchanged
  it('Test B: Council members alone -> single sub-group', () => {
    const pols = Array.from({ length: 5 }, (_, i) =>
      makePol({ office_title: 'Council Member', last_name: `Councilor${i}`, district_id: String(i + 1) })
    );

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    const body = localTier.bodies[0];

    expect(body.subgroups.length).toBe(1);
    // Label should still relate to council / body name
    const label = body.subgroups[0].label;
    expect(label).toBeTruthy();
    // Should NOT contain "Clerk"
    expect(label.toLowerCase()).not.toContain('clerk');
  });

  // Test C: LOCAL treasurer + LOCAL council members in same body -> two sub-groups
  it('Test C: LOCAL treasurer + council members -> two sub-groups, treasurer separated', () => {
    const pols = [
      makePol({ office_title: 'City Treasurer', last_name: 'Treasury', district_id: '0' }),
      makePol({ office_title: 'Council Member', last_name: 'Smith', district_id: '1' }),
      makePol({ office_title: 'Council Member', last_name: 'Jones', district_id: '2' }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    const body = localTier.bodies[0];

    expect(body.subgroups.length).toBe(2);

    const treasurerGroup = body.subgroups.find(sg => sg.label.toLowerCase().includes('treasurer'));
    expect(treasurerGroup).toBeDefined();
    expect(treasurerGroup.pols.length).toBe(1);
    expect(treasurerGroup.pols[0].last_name).toBe('Treasury');
  });

  // Test D: COUNTY clerk (district_type="COUNTY") -> NOT split into ADMIN sub-group
  it('Test D: COUNTY clerk -> NOT split into ADMIN sub-group', () => {
    const pols = [
      makePol({
        district_type: 'COUNTY',
        office_title: 'County Clerk',
        last_name: 'CountyClerk',
        government_body_name: 'Monroe County Government',
        government_name: 'Monroe County, Indiana, US',
        district_id: '0',
      }),
      makePol({
        district_type: 'COUNTY',
        office_title: 'County Commissioner',
        last_name: 'Commissioner1',
        government_body_name: 'Monroe County Government',
        government_name: 'Monroe County, Indiana, US',
        district_id: '1',
      }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');

    // Find the county body
    const countyBody = localTier.bodies.find(b => b.title.includes('Monroe County'));
    expect(countyBody).toBeDefined();

    // COUNTY district_type clerks should NOT be split out — they share the same sub-group key
    // (since isAdminOfficer only applies to LOCAL* district_types)
    expect(countyBody.subgroups.length).toBe(1);
  });

  // Test E: LOCAL_EXEC mayor + LOCAL council in same government_name -> still two sub-groups
  it('Test E: LOCAL_EXEC mayor + LOCAL council -> two sub-groups (existing behavior preserved)', () => {
    const pols = [
      makePol({
        district_type: 'LOCAL_EXEC',
        office_title: 'Mayor',
        last_name: 'Mayor',
        government_body_name: 'City of Bloomington',
        district_id: '0',
      }),
      makePol({
        district_type: 'LOCAL',
        office_title: 'Council Member',
        last_name: 'Smith',
        government_body_name: 'Bloomington Common Council',
        district_id: '1',
      }),
      makePol({
        district_type: 'LOCAL',
        office_title: 'Council Member',
        last_name: 'Jones',
        government_body_name: 'Bloomington Common Council',
        district_id: '2',
      }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    const body = localTier.bodies[0]; // City of Bloomington accordion

    // Mayor (LOCAL_EXEC) and council (LOCAL) have different district_types -> distinct sub-groups
    expect(body.subgroups.length).toBe(2);

    const mayorGroup = body.subgroups.find(sg => sg.pols.some(p => p.office_title === 'Mayor'));
    expect(mayorGroup).toBeDefined();
    expect(mayorGroup.pols.length).toBe(1);

    const councilGroup = body.subgroups.find(sg => sg.pols.some(p => p.office_title === 'Council Member'));
    expect(councilGroup).toBeDefined();
    expect(councilGroup.pols.length).toBe(2);
  });

});

// ─── Judicial sub-group splitting ────────────────────────────────────────────

function makeJudicialPol(overrides) {
  return {
    district_type: 'JUDICIAL',
    government_name: 'Monroe County, Indiana, US',
    government_body_name: 'Monroe Circuit Court',
    chamber_name_formal: 'Monroe Circuit Court',
    chamber_name: 'Monroe Circuit Court',
    office_title: 'Indiana Circuit Court Judge - 10th Circuit, Division 1',
    district_id: '1',
    last_name: 'Judge',
    ...overrides,
  };
}

describe('Judicial sub-group splitting (judges vs. court officials)', () => {

  // Live by-government-list rows carry an empty government_body_name, so the
  // court name must come from chamber_name_formal, not the county name
  // (measured 2026-09-24: the Monroe clerk read "Monroe County Officials").
  it('clerk with no government_body_name -> label from chamber_name_formal ("Circuit Court Officials")', () => {
    const clerk = makeJudicialPol({
      government_body_name: '',
      chamber_name_formal: 'Monroe County Circuit Court',
      chamber_name: 'Circuit Court Clerk',
      office_title: 'Circuit Court Clerk',
      last_name: 'Clerk',
    });
    const [tier] = groupIntoHierarchy([clerk]);
    expect(tier.bodies[0].subgroups.map(sg => sg.label)).toEqual(['Circuit Court Officials']);
  });

  // Test F: 3 judges + 1 clerk -> two sub-groups (judges, officials)
  it('Test F: 3 judges + clerk -> two sub-groups; clerk in "Circuit Court Officials"', () => {
    const pols = [
      makeJudicialPol({ office_title: 'Indiana Circuit Court Judge - 10th Circuit, Division 1', last_name: 'JudgeA', district_id: '1' }),
      makeJudicialPol({ office_title: 'Indiana Circuit Court Judge - 10th Circuit, Division 2', last_name: 'JudgeB', district_id: '2' }),
      makeJudicialPol({ office_title: 'Indiana Circuit Court Judge - 10th Circuit, Division 3', last_name: 'JudgeC', district_id: '3' }),
      makeJudicialPol({ office_title: 'Clerk of the Monroe Circuit Court', last_name: 'Brown', district_id: '0' }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    expect(localTier).toBeDefined();

    const courtBody = localTier.bodies.find(b => b.title === 'Monroe Circuit Court');
    expect(courtBody).toBeDefined();

    // Must have exactly 2 sub-groups
    expect(courtBody.subgroups.length).toBe(2);

    // Officials sub-group exists and contains only Brown
    const officialsGroup = courtBody.subgroups.find(sg => sg.label === 'Circuit Court Officials');
    expect(officialsGroup).toBeDefined();
    expect(officialsGroup.pols.length).toBe(1);
    expect(officialsGroup.pols[0].last_name).toBe('Brown');

    // Judges sub-group contains all 3 judges
    const judgesGroup = courtBody.subgroups.find(sg => /Circuit Judges$/.test(sg.label));
    expect(judgesGroup).toBeDefined();
    expect(judgesGroup.pols.length).toBe(3);

    // Judges sub-group sorts BEFORE officials sub-group
    const judgesIdx = courtBody.subgroups.indexOf(judgesGroup);
    const officialsIdx = courtBody.subgroups.indexOf(officialsGroup);
    expect(judgesIdx).toBeLessThan(officialsIdx);
  });

  // Test G: Judges only (no clerk) -> exactly 1 sub-group
  it('Test G: judges only (no clerk) -> exactly 1 sub-group, no "Officials" group', () => {
    const pols = [
      makeJudicialPol({ office_title: 'Indiana Circuit Court Judge - 10th Circuit, Division 1', last_name: 'JudgeX', district_id: '1' }),
      makeJudicialPol({ office_title: 'Indiana Circuit Court Judge - 10th Circuit, Division 2', last_name: 'JudgeY', district_id: '2' }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    const courtBody = localTier.bodies.find(b => b.title === 'Monroe Circuit Court');
    expect(courtBody).toBeDefined();

    expect(courtBody.subgroups.length).toBe(1);
    expect(courtBody.subgroups[0].label).not.toContain('Officials');
  });

});

describe('Rotational Mayor / Mayor Pro Tem ordering and labeling', () => {

  // Bellflower-class: by-district council, rotational Mayor (D3) + Mayor Pro Tem (D4).
  // Raw input deliberately lists Mayor Pro Tem (Sanchez) FIRST and alphabetically before
  // the Mayor (Santa Ines) — the upstream query order that produced the original defect.
  // The exec sub-group must label "Mayor" (not "Mayor Pro Tem") and list the Mayor first.
  it('Mayor leads the exec sub-group and sets its label, even when Mayor Pro Tem is returned first', () => {
    const bf = {
      government_name: 'City of Bellflower, California, US',
      government_body_name: 'Bellflower City Council',
      chamber_name_formal: 'Bellflower City Council',
      chamber_name: 'City Council',
      district_id: '0',
    };
    const pols = [
      makePol({ ...bf, office_title: 'Mayor Pro Tem', last_name: 'Sanchez', district_label: 'District 4' }),
      makePol({ ...bf, office_title: 'Mayor', last_name: 'Santa Ines', district_label: 'District 3' }),
      makePol({ ...bf, office_title: 'Councilmember', last_name: 'Morse', district_label: 'District 1' }),
      makePol({ ...bf, office_title: 'Councilmember', last_name: 'Koops', district_label: 'District 2' }),
      makePol({ ...bf, office_title: 'Councilmember', last_name: 'Dunton', district_label: 'District 5' }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    const body = localTier.bodies[0];

    // The exec sub-group holds both Mayor and Mayor Pro Tem
    const execGroup = body.subgroups.find(sg => sg.pols.some(p => p.office_title === 'Mayor'));
    expect(execGroup).toBeDefined();
    expect(execGroup.pols.some(p => p.office_title === 'Mayor Pro Tem')).toBe(true);

    // Label is "Mayor", NOT "Mayor Pro Tem"
    expect(execGroup.label).toBe('Mayor');

    // Mayor sorts before Mayor Pro Tem within the group
    const mayorIdx = execGroup.pols.findIndex(p => p.office_title === 'Mayor');
    const proTemIdx = execGroup.pols.findIndex(p => p.office_title === 'Mayor Pro Tem');
    expect(mayorIdx).toBeGreaterThanOrEqual(0);
    expect(mayorIdx).toBeLessThan(proTemIdx);
  });

});

describe('At-large Mayor + parenthetical Vice-Mayor annotation (Tucson-class)', () => {

  // Tucson: at-large Mayor is its own LOCAL_EXEC seat; the Ward 1 council member carries
  // a parenthetical "(Vice Mayor)" annotation. The word "Mayor" in the Ward 1 title must
  // NOT pull that council member into the Mayor's exec sub-group ahead of the real Mayor.
  it('Mayor (LOCAL_EXEC) leads; the Ward-1 "(Vice Mayor)" member stays with the council and sorts after the Mayor', () => {
    const gov = {
      government_name: 'City of Tucson, Arizona, US',
      government_body_name: 'Tucson City Council',
      chamber_name_formal: 'Tucson City Council',
      chamber_name: 'City Council',
    };
    // Upstream deliberately returns the Vice Mayor (Ward 1) FIRST — the original defect order.
    const pols = [
      makePol({ ...gov, district_type: 'LOCAL', office_title: 'Council Member, Ward 1 (Vice Mayor)', last_name: 'Santa Cruz', district_id: 'w1', district_label: 'Ward 1' }),
      makePol({ ...gov, district_type: 'LOCAL_EXEC', office_title: 'Mayor', last_name: 'Romero', district_id: '0', district_label: 'City of Tucson (Mayor)' }),
      makePol({ ...gov, district_type: 'LOCAL', office_title: 'Council Member, Ward 2', last_name: 'Cunningham', district_id: 'w2', district_label: 'Ward 2' }),
      makePol({ ...gov, district_type: 'LOCAL', office_title: 'Council Member, Ward 6', last_name: 'Schubert', district_id: 'w6', district_label: 'Ward 6' }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    const allSubgroups = localTier.bodies.flatMap(b => b.subgroups);

    // The Mayor's exec sub-group must NOT contain the "(Vice Mayor)" council member.
    const mayorGroup = allSubgroups.find(sg => sg.pols.some(p => p.office_title === 'Mayor'));
    expect(mayorGroup).toBeDefined();
    expect(mayorGroup.pols.some(p => /vice mayor/i.test(p.office_title || ''))).toBe(false);

    // Flattened render order: the Mayor comes before the Ward-1 Vice Mayor.
    const flat = allSubgroups.flatMap(sg => sg.pols);
    const mayorIdx = flat.findIndex(p => p.office_title === 'Mayor');
    const viceIdx = flat.findIndex(p => /vice mayor/i.test(p.office_title || ''));
    expect(mayorIdx).toBeGreaterThanOrEqual(0);
    expect(viceIdx).toBeGreaterThan(mayorIdx);
  });

});

describe('Letter-district ordering (Clark County Commission A–G)', () => {

  // Clark County Board of Commissioners: 7 members on ONE shared COUNTY district
  // (same district_id, district_label "Clark County"); the seat letter lives only
  // in office_title "Commissioner (District A..G)". They must sort A,B,C,…,G — NOT
  // alphabetically by last name. Raw input is deliberately in name-alphabetical order.
  it('sorts commissioners by district letter A–G, not alphabetically by name', () => {
    const cc = {
      district_type: 'COUNTY',
      government_name: 'Clark County, Nevada, US',
      government_body_name: 'Board of County Commissioners',
      chamber_name_formal: 'Board of County Commissioners',
      chamber_name: 'Board of County Commissioners',
      district_label: 'Clark County',
      district_id: 'shared-county-uuid',
    };
    const pols = [
      makePol({ ...cc, office_title: 'Commissioner (District C)', last_name: 'Becker' }),
      makePol({ ...cc, office_title: 'Commissioner (District G)', last_name: 'Gibson' }),
      makePol({ ...cc, office_title: 'Commissioner (District F)', last_name: 'Jones' }),
      makePol({ ...cc, office_title: 'Commissioner (District B)', last_name: 'Kirkpatrick' }),
      makePol({ ...cc, office_title: 'Commissioner (District D)', last_name: 'McCurdy II' }),
      makePol({ ...cc, office_title: 'Commissioner (District A)', last_name: 'Naft' }),
      makePol({ ...cc, office_title: 'Commissioner (District E)', last_name: 'Segerblom' }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    const body = localTier.bodies[0];
    const group = body.subgroups[0];

    expect(group.pols.map(p => p.last_name)).toEqual([
      'Naft',        // A
      'Kirkpatrick', // B
      'Becker',      // C
      'McCurdy II',  // D
      'Segerblom',   // E
      'Jones',       // F
      'Gibson',      // G
    ]);
  });

  // Numbered districts must still sort numerically (no regression).
  it('still sorts numbered districts numerically', () => {
    const base = {
      district_type: 'LOCAL',
      government_name: 'City of Example, Nevada, US',
      government_body_name: 'Example City Council',
      district_id: '0',
    };
    const pols = [
      makePol({ ...base, office_title: 'Council Member', last_name: 'Zane', district_label: 'District 2' }),
      makePol({ ...base, office_title: 'Council Member', last_name: 'Adams', district_label: 'District 10' }),
      makePol({ ...base, office_title: 'Council Member', last_name: 'Brown', district_label: 'District 1' }),
    ];
    const hierarchy = groupIntoHierarchy(pols);
    const group = hierarchy.find(t => t.tier === 'Local').bodies[0].subgroups[0];
    // 1, 2, 10 (numeric — NOT lexical "1, 10, 2")
    expect(group.pols.map(p => p.last_name)).toEqual(['Brown', 'Zane', 'Adams']);
  });

});

describe('tierOrderFor — leading with the browsed tier', () => {
  it('defaults to ascending scope when no lead tier is given', () => {
    expect(tierOrderFor()).toEqual(['Local', 'School', 'State', 'Federal']);
    expect(tierOrderFor(null)).toEqual(['Local', 'School', 'State', 'Federal']);
  });

  it('hoists the lead tier and preserves the relative order of the rest', () => {
    expect(tierOrderFor('State')).toEqual(['State', 'Local', 'School', 'Federal']);
    expect(tierOrderFor('Federal')).toEqual(['Federal', 'Local', 'School', 'State']);
  });

  it('ignores an unknown lead tier rather than dropping tiers', () => {
    // A typo or a future tier name must never silently omit a section.
    expect(tierOrderFor('Statewide')).toEqual(['Local', 'School', 'State', 'Federal']);
    expect(tierOrderFor('')).toEqual(['Local', 'School', 'State', 'Federal']);
  });

  it('always returns every tier exactly once', () => {
    for (const lead of [null, 'Local', 'School', 'State', 'Federal', 'nope']) {
      const order = tierOrderFor(lead);
      expect(order).toHaveLength(4);
      expect(new Set(order).size).toBe(4);
    }
  });
});

describe('groupIntoHierarchy — leadTier option', () => {
  const pols = [
    { full_name: 'City Person', office_title: 'Mayor', district_type: 'LOCAL', representing_city: 'Burlington', representing_state: 'WI' },
    { full_name: 'State Person', office_title: 'State Senator', district_type: 'STATE_UPPER', representing_state: 'WI' },
    { full_name: 'Fed Person', office_title: 'U.S. Senator', district_type: 'NATIONAL_UPPER', representing_state: 'WI' },
  ];

  it('puts State first when leadTier is State, without losing Local or Federal', () => {
    const tiers = groupIntoHierarchy(pols, { leadTier: 'State' }).map((h) => h.tier);
    expect(tiers[0]).toBe('State');
    expect(tiers).toContain('Local');
    expect(tiers).toContain('Federal');
  });

  it('keeps Local first by default (address-lookup behaviour unchanged)', () => {
    const tiers = groupIntoHierarchy(pols).map((h) => h.tier);
    expect(tiers[0]).toBe('Local');
  });
});

describe('Special-purpose overlay districts sort after general-purpose local governments', () => {
  it('Bend Metro Park & Recreation District sorts below City of Bend (and school district), above courts', () => {
    const pols = [
      makePol({
        government_name: 'Bend Metro Park & Recreation District, Oregon, US',
        government_body_name: 'Board of Directors',
        chamber_name_formal: 'Board of Directors',
        chamber_name: 'Board of Directors',
        office_title: 'Director',
        last_name: 'Parks',
      }),
      makePol({
        government_name: 'City of Bend, Oregon, US',
        government_body_name: 'Bend City Council',
        chamber_name_formal: 'City Council',
        chamber_name: 'City Council',
        office_title: 'Council Member',
        last_name: 'Civic',
      }),
    ];

    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local');
    expect(localTier).toBeDefined();

    const titles = localTier.bodies.map(b => b.title);
    const cityIdx = titles.findIndex(t => t.includes('City of Bend'));
    const parkIdx = titles.findIndex(t => t.includes('Park & Recreation District'));
    expect(cityIdx).toBeGreaterThanOrEqual(0);
    expect(parkIdx).toBeGreaterThanOrEqual(0);
    expect(parkIdx).toBeGreaterThan(cityIdx);
  });

  it('does NOT reclassify school districts (Administrative School District keeps its slot)', () => {
    const pols = [
      makePol({
        district_type: 'SCHOOL',
        government_name: 'Bend-La Pine Administrative School District 1, Oregon, US',
        government_body_name: 'Bend-La Pine School Board',
        office_title: 'Board Member',
        last_name: 'Scholastic',
      }),
    ];
    const hierarchy = groupIntoHierarchy(pols);
    const localTier = hierarchy.find(t => t.tier === 'Local' || t.tier === 'School');
    expect(localTier).toBeDefined();
  });
});

describe('Council-appointed Mayor with no separate exec seat (Sahuarita-class)', () => {

  // Sahuarita AZ / South Tucson AZ / Monterey Park CA: the body elects seven council members
  // at large and DESIGNATES one as Mayor and one as Vice Mayor. There is no mayoral contest on
  // any ballot, so there is no standalone `Mayor` seat — the designation lives in a parenthetical
  // on a council seat: "Council Member (Mayor)".
  //
  // This is the mirror image of the Tucson case above. There, the parenthetical must NOT promote
  // the Ward 1 member, because an at-large Mayor already exists as its own seat. Here there is no
  // such seat, so the parenthetical IS the executive and must head its own sub-group.
  const gov = {
    government_name: 'Town of Sahuarita, Arizona, US',
    government_body_name: 'Sahuarita Town Council',
    chamber_name_formal: 'Sahuarita Town Council',
    district_type: 'LOCAL',
  };

  // Upstream order deliberately puts a plain council member first and the Mayor last.
  const makeCouncil = () => [
    makePol({ ...gov, office_title: 'Council Member', last_name: 'Gillespie', district_id: '1' }),
    makePol({ ...gov, office_title: 'Council Member', last_name: 'Lisk', district_id: '2' }),
    makePol({ ...gov, office_title: 'Council Member', last_name: 'Lytle', district_id: '3' }),
    makePol({ ...gov, office_title: 'Council Member', last_name: 'Priolo', district_id: '4' }),
    makePol({ ...gov, office_title: 'Council Member', last_name: 'Morales', district_id: '5' }),
    makePol({ ...gov, office_title: 'Council Member (Vice Mayor)', last_name: 'Egbert', district_id: '6' }),
    makePol({ ...gov, office_title: 'Council Member (Mayor)', last_name: 'Murphy', district_id: '7' }),
  ];

  it('puts the designated Mayor in an exec sub-group separate from the plain council members', () => {
    const hierarchy = groupIntoHierarchy(makeCouncil());
    const body = hierarchy.find(t => t.tier === 'Local').bodies[0];

    const execGroup = body.subgroups.find(sg =>
      sg.pols.some(p => p.office_title === 'Council Member (Mayor)')
    );
    expect(execGroup).toBeDefined();

    // the five plain council members must NOT be in it
    expect(execGroup.pols.every(p => p.office_title !== 'Council Member')).toBe(true);
    // the Vice Mayor belongs with the Mayor, as Mayor Pro Tem does in Bellflower
    expect(execGroup.pols.some(p => p.office_title === 'Council Member (Vice Mayor)')).toBe(true);
    // Mayor sorts ahead of Vice Mayor
    const mayorIdx = execGroup.pols.findIndex(p => p.office_title === 'Council Member (Mayor)');
    const viceIdx = execGroup.pols.findIndex(p => p.office_title === 'Council Member (Vice Mayor)');
    expect(mayorIdx).toBeLessThan(viceIdx);
  });

  it('labels that sub-group "Mayor", not "Council Member (Mayor)"', () => {
    const hierarchy = groupIntoHierarchy(makeCouncil());
    const body = hierarchy.find(t => t.tier === 'Local').bodies[0];
    const execGroup = body.subgroups.find(sg =>
      sg.pols.some(p => p.office_title === 'Council Member (Mayor)')
    );
    expect(execGroup.label).toBe('Mayor');
  });

  it('sorts the exec sub-group ahead of the council sub-group', () => {
    const hierarchy = groupIntoHierarchy(makeCouncil());
    const body = hierarchy.find(t => t.tier === 'Local').bodies[0];
    const execIdx = body.subgroups.findIndex(sg =>
      sg.pols.some(p => p.office_title === 'Council Member (Mayor)')
    );
    const councilIdx = body.subgroups.findIndex(sg =>
      sg.pols.every(p => p.office_title === 'Council Member')
    );
    expect(execIdx).toBeLessThan(councilIdx);
  });
});

describe('COUNTY sub-groups split by chamber when government_body_name is empty', () => {

  // The government-list browse (and several ZIP lookups) return county rows with an EMPTY
  // government_body_name; the only thing that tells the bodies apart is the chamber. Every
  // COUNTY row got roleSegment 'MEMBER', so all of them shared the key '||COUNTY||MEMBER' and
  // collapsed into one sub-group labelled with whichever office_title sorted first — e.g. Dane
  // County WI showed 44 supervisors and row officers together under "County Executive".
  // Fixtures mirror live API rows (browse/by-government-list, 2026-09-23).
  const county = (government_name, chamber_name_formal, chamber_name) => ({
    district_type: 'COUNTY',
    government_name,
    government_body_name: '',
    chamber_name_formal,
    chamber_name,
    district_id: 'shared-county-uuid',
  });

  const dane = () => {
    const board = county('Dane County, Wisconsin, US', 'Dane County Board of Supervisors', 'County Board');
    const officers = county('Dane County, Wisconsin, US', 'Dane County Countywide Elected Officials', 'Countywide Elected Officials');
    // Upstream order deliberately leads with a row officer.
    return [
      makePol({ ...officers, office_title: 'Sheriff', last_name: 'Barrett' }),
      makePol({ ...officers, office_title: 'County Executive', last_name: 'Parisi' }),
      makePol({ ...officers, office_title: 'County Clerk', last_name: 'McDonell' }),
      makePol({ ...board, office_title: 'County Board Supervisor', last_name: 'Alpha', district_label: 'District 1' }),
      makePol({ ...board, office_title: 'County Board Supervisor', last_name: 'Bravo', district_label: 'District 2' }),
      makePol({ ...board, office_title: 'County Board Supervisor', last_name: 'Charlie', district_label: 'District 3' }),
    ];
  };

  const countyBody = (pols, title) =>
    groupIntoHierarchy(pols).find(t => t.tier === 'Local').bodies.find(b => b.title === title);

  it('Dane County: supervisors and countywide officers land in separate sub-groups', () => {
    const body = countyBody(dane(), 'Dane County');
    expect(body.subgroups.map(sg => sg.pols.length).sort()).toEqual([3, 3]);
    const board = body.subgroups.find(sg => sg.pols.some(p => p.office_title === 'County Board Supervisor'));
    expect(board.pols.every(p => p.office_title === 'County Board Supervisor')).toBe(true);
  });

  it('Dane County: sub-groups are labelled from the chamber, not the first office_title', () => {
    const body = countyBody(dane(), 'Dane County');
    expect(body.subgroups.map(sg => sg.label)).toEqual([
      'Dane County Board of Supervisors',
      'Dane County Countywide Elected Officials',
    ]);
  });

  it('Allen County: council, commissioners and elected officials are three sub-groups, bodies first', () => {
    const council = county('Allen County, Indiana, US', 'Allen County Council', 'Allen County Council');
    const commissioners = county('Allen County, Indiana, US', 'Board of County Commissioners', 'Board of County Commissioners');
    const officers = county('Allen County, Indiana, US', 'Elected Officials', 'Elected Officials');
    const pols = [
      makePol({ ...officers, office_title: 'Treasurer', last_name: 'Adams' }),
      makePol({ ...council, office_title: 'Council Member, At Large', last_name: 'Baker' }),
      makePol({ ...commissioners, office_title: 'Commissioner, District 1', last_name: 'Cole' }),
      makePol({ ...officers, office_title: 'Coroner', last_name: 'Dunn' }),
      makePol({ ...council, office_title: 'Council Member, District 1', last_name: 'Ellis' }),
      makePol({ ...commissioners, office_title: 'Commissioner, District 2', last_name: 'Ford' }),
    ];
    const body = countyBody(pols, 'Allen County');
    expect(body.subgroups.map(sg => [sg.label, sg.pols.length])).toEqual([
      ['Allen County Council', 2],
      ['Board of County Commissioners', 2],
      ['Elected Officials', 2],
    ]);
  });

  it('a county commission sorts ahead of row officers even when an officer chamber sorts first alphabetically', () => {
    // Greene County MO names its legislative body "Greene County Commission" — no LEGISLATIVE_KW
    // match — while its row officers each have a chamber of their own. "Assessor" < "Commission".
    const gov = 'Greene County, Missouri, US';
    const pols = [
      makePol({ ...county(gov, 'Greene County Assessor', 'Assessor'), office_title: 'Assessor', last_name: 'Ames' }),
      makePol({ ...county(gov, 'Greene County Sheriff', 'Office of the Sheriff'), office_title: 'Sheriff', last_name: 'Arnott' }),
      makePol({ ...county(gov, 'Greene County Commission', 'County Commission'), office_title: 'Presiding Commissioner', last_name: 'Dixon' }),
      makePol({ ...county(gov, 'Greene County Commission', 'County Commission'), office_title: 'Commissioner, 1st District', last_name: 'Bilyeu' }),
    ];
    const body = countyBody(pols, 'Greene County');
    expect(body.subgroups[0].label).toBe('Greene County Commission');
    expect(body.subgroups[0].pols).toHaveLength(2);
    expect(body.subgroups.slice(1).map(sg => sg.label).sort()).toEqual([
      'Greene County Assessor',
      'Greene County Sheriff',
    ]);
  });

  it('Macon-Bibb (consolidated): county row officers sort after the Mayor and the LOCAL commission', () => {
    // One accordion holds LOCAL (Mayor, commission) and COUNTY (row officers) rows. Labelling
    // the county group from its chamber ("Bibb County Elected Officials") must not let it jump
    // ahead of the commission alphabetically.
    const gov = { government_name: 'Macon-Bibb County Government, Georgia, US', government_body_name: '' };
    const pols = [
      makePol({ ...county(gov.government_name, 'Bibb County Elected Officials', 'Bibb County Elected Officials'), office_title: 'Sheriff', last_name: 'Davis' }),
      makePol({ ...county(gov.government_name, 'Bibb County Elected Officials', 'Bibb County Elected Officials'), office_title: 'Coroner', last_name: 'Jones' }),
      makePol({ ...gov, district_type: 'LOCAL', chamber_name_formal: 'Macon-Bibb County Commission', chamber_name: 'County Commission', office_title: 'Commissioner, District 1', last_name: 'Tillman', district_id: '1' }),
      makePol({ ...gov, district_type: 'LOCAL', chamber_name_formal: 'Macon-Bibb County Commission', chamber_name: 'County Commission', office_title: 'Commissioner, District 2', last_name: 'Wilson', district_id: '2' }),
      makePol({ ...gov, district_type: 'LOCAL', chamber_name_formal: 'Macon-Bibb County', chamber_name: 'Mayor', office_title: 'Mayor', last_name: 'Miller', district_id: '0' }),
    ];
    const body = countyBody(pols, 'Macon-Bibb County Government');
    expect(body.subgroups.map(sg => sg.label)).toEqual([
      'Mayor',
      'Macon-Bibb County Commission',
      'Bibb County Elected Officials',
    ]);
  });

  it('COUNTY rows WITH a government_body_name keep grouping by body (Monroe County address-lookup shape)', () => {
    // Here chamber_name is the seat title ("Council - District 1"); splitting by it would put
    // every council seat in a sub-group of its own.
    const gov = 'Monroe County, Indiana, US';
    const row = (body, chamber, title, last_name) => makePol({
      district_type: 'COUNTY', government_name: gov, government_body_name: body,
      chamber_name_formal: body, chamber_name: chamber, office_title: title, last_name,
    });
    const pols = [
      row('Monroe County Government', 'Sheriff', 'Sheriff', 'Marshall'),
      row('Monroe County Government', 'Auditor', 'Auditor', 'Hutchens'),
      row('Monroe County Council', 'Council - District 1', 'Council - District 1', 'Crossin'),
      row('Monroe County Council', 'Council - District 2', 'Council - District 2', 'Munson'),
      row('Monroe County Board of Commissioners', 'Commission - District 1', 'Commission - District 1', 'Thomas'),
    ];
    const body = countyBody(pols, 'Monroe County');
    expect(body.subgroups.map(sg => [sg.label, sg.pols.length])).toEqual([
      ['Monroe County Board of Commissioners', 1],
      ['Monroe County Council', 2],
      ['Monroe County Officials', 2],
    ]);
  });
});
