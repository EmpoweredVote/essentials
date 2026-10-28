import { describe, it, expect } from 'vitest';
import { qualifyTitle } from './PoliticianGrid.jsx';

/**
 * `qualifyTitle` prefixes a generic local title with its jurisdiction, and must NOT prefix one
 * that already names the jurisdiction. The duplicate check compares the chamber against the
 * government's CORE name, so every incorporated form has to be stripped before comparing.
 *
 * Every case below was read off production on 2026-10-28, not invented.
 */
const local = (government_name) => ({ government_name, district_type: 'LOCAL' });
const county = (government_name) => ({ government_name, district_type: 'COUNTY' });

describe('qualifyTitle — already-qualified titles are left alone', () => {
  it.each([
    // [government_name, chamber, expected]
    ['City of Atlanta, Georgia, US', 'Atlanta City Council', 'Atlanta City Council'],
    ['Borough of State College, Pennsylvania, US', 'State College Borough Council', 'State College Borough Council'],
    ['Municipality of Anchorage, Alaska, US', 'Anchorage Assembly', 'Anchorage Assembly'],
    ['Municipality of Anchorage, Alaska, US', 'Anchorage School Board', 'Anchorage School Board'],
    ['Town of Ellettsville, Indiana, US', 'Ellettsville Town Council - Ward 1', 'Ellettsville Town Council - Ward 1'],
  ])('%s + %s', (gov, chamber, expected) => {
    expect(qualifyTitle(chamber, local(gov))).toBe(expected);
  });
});

describe('qualifyTitle — generic titles get the jurisdiction, without its legal form', () => {
  it.each([
    ['Municipality of Anchorage, Alaska, US', 'Office of the Mayor', 'Anchorage Office of the Mayor'],
    ['City of Atlanta, Georgia, US', 'Office of the Mayor', 'Atlanta Office of the Mayor'],
    ['Town of Burlington, Wisconsin, US', 'Town Board', 'Burlington Town Board'],
    ['Village of Caledonia, Wisconsin, US', 'Village Board', 'Caledonia Village Board'],
  ])('%s + %s', (gov, chamber, expected) => {
    expect(qualifyTitle(chamber, local(gov))).toBe(expected);
  });
});

describe('qualifyTitle — regressions this fix must not cause', () => {
  it('county officials keep the full government name', () => {
    expect(qualifyTitle('Sheriff', county('Los Angeles County, California, US')))
      .toBe('Los Angeles County Sheriff');
  });

  it('does not produce "County County"', () => {
    // The prefix drops its trailing " County" when the title already opens with "County",
    // so this reads once, not twice.
    expect(qualifyTitle('County Board of Supervisors', county('Los Angeles County, California, US')))
      .toBe('Los Angeles County Board of Supervisors');
  });

  it('leaves non-local tiers untouched', () => {
    expect(qualifyTitle('U.S. Senator', { government_name: 'United States Federal Government', district_type: 'NATIONAL_UPPER' }))
      .toBe('U.S. Senator');
  });

  it('is a no-op without a government name or a title', () => {
    expect(qualifyTitle('Mayor', { district_type: 'LOCAL' })).toBe('Mayor');
    expect(qualifyTitle('', local('City of Atlanta, Georgia, US'))).toBe('');
  });

  // 🔴 KNOWN REMAINING STUTTER, asserted so it is visible rather than forgotten.
  // The two compound consolidated governments still read twice, because their core name
  // ("Indianapolis and Marion") is not what their chamber is called, so no prefix strip can
  // make the duplicate check match. Fixing these needs a different mechanism — matching the
  // government's CITY column rather than parsing its name — which is a bigger change than the
  // one this test file covers. Indianapolis and Nashville are the only two affected.
  it('still double-names the compound consolidated governments (known gap)', () => {
    expect(qualifyTitle('Indianapolis City-County Council', local('Consolidated City of Indianapolis and Marion County, Indiana, US')))
      .toBe('Consolidated City of Indianapolis and Marion County Indianapolis City-County Council');
  });
});
