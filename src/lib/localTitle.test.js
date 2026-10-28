import { describe, it, expect } from 'vitest';
import { qualifyLocalTitle, governmentCoreName } from './localTitle.js';

/**
 * `qualifyLocalTitle` prefixes a generic local title with its jurisdiction, and must NOT prefix
 * one that already names the jurisdiction. The duplicate check compares the chamber against the
 * government's CORE name, so every incorporated form has to be stripped before comparing.
 *
 * 🔴 These tests were originally written against the copy in components/PoliticianGrid.jsx,
 * which nothing imports — so they passed while production stayed broken. They now target the
 * module that pages/Results.jsx actually ships.
 *
 * Every case below was read off production on 2026-10-28, not invented.
 */
const local = (government_name) => ({ government_name, district_type: 'LOCAL' });
const county = (government_name) => ({ government_name, district_type: 'COUNTY' });

describe('qualifyLocalTitle — already-qualified titles are left alone', () => {
  it.each([
    ['City of Atlanta, Georgia, US', 'Atlanta City Council', 'Atlanta City Council'],
    ['Borough of State College, Pennsylvania, US', 'State College Borough Council', 'State College Borough Council'],
    ['Municipality of Anchorage, Alaska, US', 'Anchorage Assembly', 'Anchorage Assembly'],
    ['Municipality of Anchorage, Alaska, US', 'Anchorage School Board', 'Anchorage School Board'],
    ['Town of Ellettsville, Indiana, US', 'Ellettsville Town Council - Ward 1', 'Ellettsville Town Council - Ward 1'],
  ])('%s + %s', (gov, chamber, expected) => {
    expect(qualifyLocalTitle(chamber, local(gov))).toBe(expected);
  });
});

describe('qualifyLocalTitle — generic titles get the jurisdiction, without its legal form', () => {
  it.each([
    ['Municipality of Anchorage, Alaska, US', 'Office of the Mayor', 'Anchorage Office of the Mayor'],
    ['City of Atlanta, Georgia, US', 'Office of the Mayor', 'Atlanta Office of the Mayor'],
    ['Town of Burlington, Wisconsin, US', 'Town Board', 'Burlington Town Board'],
    ['Village of Caledonia, Wisconsin, US', 'Village Board', 'Caledonia Village Board'],
  ])('%s + %s', (gov, chamber, expected) => {
    expect(qualifyLocalTitle(chamber, local(gov))).toBe(expected);
  });
});

describe('qualifyLocalTitle — behaviour this fix must not change', () => {
  it('county officials keep the full government name', () => {
    expect(qualifyLocalTitle('Sheriff', county('Los Angeles County, California, US')))
      .toBe('Los Angeles County Sheriff');
  });

  it('does not produce "County County"', () => {
    expect(qualifyLocalTitle('County Board of Supervisors', county('Los Angeles County, California, US')))
      .toBe('Los Angeles County Board of Supervisors');
  });

  it('falls back to representing_city when there is no government record', () => {
    expect(qualifyLocalTitle('City Council', { representing_city: 'Orem', district_type: 'LOCAL' }))
      .toBe('Orem City Council');
  });

  it('leaves non-local tiers untouched', () => {
    expect(qualifyLocalTitle('U.S. Senator', { government_name: 'United States Federal Government', district_type: 'NATIONAL_UPPER' }))
      .toBe('U.S. Senator');
  });

  it('is a no-op without a government or a title', () => {
    expect(qualifyLocalTitle('Mayor', { district_type: 'LOCAL' })).toBe('Mayor');
    expect(qualifyLocalTitle('', local('City of Atlanta, Georgia, US'))).toBe('');
  });

  // 🔴 KNOWN REMAINING STUTTER, asserted so it stays visible rather than forgotten.
  // The compound consolidated governments still read twice: their core name
  // ("Indianapolis and Marion") is not what their chamber is called, so no prefix strip can make
  // the duplicate check match. Fixing them needs the government's `city` column instead of a
  // parse of its name. Indianapolis and Nashville are the only two affected.
  it('still double-names the compound consolidated governments (known gap)', () => {
    expect(qualifyLocalTitle('Indianapolis City-County Council', local('Consolidated City of Indianapolis and Marion County, Indiana, US')))
      .toBe('Consolidated City of Indianapolis and Marion County Indianapolis City-County Council');
  });
});

describe('governmentCoreName', () => {
  it.each([
    ['City of Atlanta, Georgia, US', 'Atlanta'],
    ['Borough of State College, Pennsylvania, US', 'State College'],
    ['Municipality of Anchorage, Alaska, US', 'Anchorage'],
    ['City and County of San Francisco', 'San Francisco'],
    ['Los Angeles County, California, US', 'Los Angeles'],
    ['', ''],
  ])('%s → %s', (gov, expected) => {
    expect(governmentCoreName(gov)).toBe(expected);
  });
});
