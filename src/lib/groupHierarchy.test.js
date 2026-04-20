/**
 * Tests for groupHierarchy.js — sub-group splitting for admin officers
 * (clerk, treasurer, auditor, recorder, assessor)
 */

import { describe, it, expect } from 'vitest';
import { groupIntoHierarchy } from './groupHierarchy.js';

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
