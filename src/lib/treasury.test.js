/**
 * Tests for treasury.js municipality matching — state disambiguation regression
 * guard (T-xxx). Locks in that a Utah city only matches a Utah treasury entity,
 * so same-named cities in other states can never win (Salem UT must NOT link to
 * salem-ma; Saratoga Springs UT must NOT link to saratoga-ca). Cities with no
 * same-state entity return null so the caller renders no link.
 */

import { describe, it, expect } from 'vitest';
import {
  findMatchingMunicipality,
  findStateTreasuryEntity,
  findCountyTreasuryEntity,
  findFederalTreasuryEntity,
  toTreasurySlug,
} from './treasury';

// Minimal slice of the live /treasury/cities shape (real duplicate-name data).
const ds = [{ fiscal_year: 2024, dataset_type: 'revenue' }];
const CITIES = [
  { name: 'Salem', state: 'MA', available_datasets: ds },
  { name: 'Salem', state: 'OH', available_datasets: ds },
  { name: 'Salem', state: 'VA', available_datasets: ds },
  { name: 'Saratoga', state: 'CA', available_datasets: ds },
  { name: 'Orem', state: 'UT', available_datasets: ds },
  { name: 'Provo', state: 'UT', available_datasets: ds },
  { name: 'Springfield', state: 'MO', available_datasets: ds },
  { name: 'Springfield', state: 'MA', available_datasets: ds },
  { name: 'Franklin', state: 'MA', available_datasets: ds },
  { name: 'Franklin', state: 'OH', available_datasets: ds },
];

describe('findMatchingMunicipality — state disambiguation', () => {
  it('renders NO match for a Utah city with no Utah treasury entity (Salem)', () => {
    expect(findMatchingMunicipality('Salem City Council', CITIES, 'UT')).toBeNull();
  });

  it('renders NO match for Saratoga Springs UT (only Saratoga CA exists)', () => {
    expect(findMatchingMunicipality('Saratoga Springs City Council', CITIES, 'UT')).toBeNull();
  });

  it('matches a Utah city to its Utah entity and slugs as -ut', () => {
    const m = findMatchingMunicipality('Orem City Council', CITIES, 'UT');
    expect(m).toMatchObject({ name: 'Orem', state: 'UT' });
    expect(toTreasurySlug(m)).toBe('orem-ut');
  });

  it('picks the correct state among same-named cities (Springfield MO, not MA)', () => {
    const m = findMatchingMunicipality('Springfield City Council', CITIES, 'MO');
    expect(m).toMatchObject({ name: 'Springfield', state: 'MO' });
    expect(toTreasurySlug(m)).toBe('springfield-mo');
  });

  it('does not regress Franklin matching within its own state', () => {
    const m = findMatchingMunicipality('Franklin City Council', CITIES, 'MA');
    expect(m).toMatchObject({ name: 'Franklin', state: 'MA' });
  });

  it('falls back to name-only matching when no state is supplied', () => {
    const m = findMatchingMunicipality('Orem City Council', CITIES);
    expect(m).toMatchObject({ name: 'Orem' });
  });

  it('ignores an invalid state token and still matches by name', () => {
    const m = findMatchingMunicipality('Orem City Council', CITIES, 'Utah');
    expect(m).toMatchObject({ name: 'Orem' });
  });
});

// Minimal slice of the live /treasury/cities shape for state/federal entities
// (real Texas / United States records, confirmed via live probe 2026-07-07).
const STATE_FEDERAL_CITIES = [
  { name: 'Texas', state: 'TX', entity_type: 'state', available_datasets: ds },
  { name: 'Oklahoma', state: 'OK', entity_type: 'state', available_datasets: [] },
  { name: 'United States', state: 'US', entity_type: 'federal', available_datasets: ds },
  { name: 'Plano', state: 'TX', entity_type: 'municipality', available_datasets: ds },
];

describe('findStateTreasuryEntity', () => {
  it('returns the Texas state entity for TX', () => {
    const m = findStateTreasuryEntity('TX', STATE_FEDERAL_CITIES);
    expect(m).toMatchObject({ name: 'Texas', state: 'TX', entity_type: 'state' });
    expect(toTreasurySlug(m)).toBe('texas-tx');
  });

  it('renders NO match for a state abbreviation with no state entity (ZZ)', () => {
    expect(findStateTreasuryEntity('ZZ', STATE_FEDERAL_CITIES)).toBeNull();
  });

  it('renders NO match for a state entity with empty available_datasets (Oklahoma)', () => {
    expect(findStateTreasuryEntity('OK', STATE_FEDERAL_CITIES)).toBeNull();
  });

  it('returns null when cities is an empty array', () => {
    expect(findStateTreasuryEntity('TX', [])).toBeNull();
  });

  it('returns null for falsy state or non-array cities (guards)', () => {
    expect(findStateTreasuryEntity(null, STATE_FEDERAL_CITIES)).toBeNull();
    expect(findStateTreasuryEntity('TX', null)).toBeNull();
  });
});

describe('findFederalTreasuryEntity', () => {
  it("returns the 'United States' federal entity", () => {
    const m = findFederalTreasuryEntity(STATE_FEDERAL_CITIES);
    expect(m).toMatchObject({ name: 'United States', state: 'US', entity_type: 'federal' });
    expect(toTreasurySlug(m)).toBe('united-states-us');
  });

  it('returns null for an empty list', () => {
    expect(findFederalTreasuryEntity([])).toBeNull();
  });

  it('returns null for non-array input (guard)', () => {
    expect(findFederalTreasuryEntity(null)).toBeNull();
  });
});

describe('findCountyTreasuryEntity', () => {
  const COUNTIES = [
    { name: 'Dane County', state: 'WI', entity_type: 'county', available_datasets: [{ fiscal_year: 2024 }] },
    { name: 'Los Angeles County', state: 'CA', entity_type: 'county', available_datasets: [{ fiscal_year: 2024 }] },
    // A budget-less "grouper" county: getCities() returns these because they parent
    // municipalities that DO have data, but linking one lands on an empty page.
    { name: 'Orange County', state: 'CA', entity_type: 'county', available_datasets: [] },
    // Same county name in another state — must not win on a state-scoped lookup.
    { name: 'Dane County', state: 'MN', entity_type: 'county', available_datasets: [{ fiscal_year: 2024 }] },
    // A municipality that happens to share the stem.
    { name: 'Dane', state: 'WI', entity_type: 'city', available_datasets: [{ fiscal_year: 2024 }] },
  ];

  it('matches a bare county title', () => {
    expect(findCountyTreasuryEntity('Dane County', COUNTIES, 'WI')?.state).toBe('WI');
  });

  it('matches a county title carrying body words', () => {
    const m = findCountyTreasuryEntity('Dane County Board of Supervisors', COUNTIES, 'WI');
    expect(m?.name).toBe('Dane County');
    expect(m?.state).toBe('WI');
  });

  it('matches the inverted "County of X" form', () => {
    expect(findCountyTreasuryEntity('County of Los Angeles', COUNTIES, 'CA')?.name).toBe('Los Angeles County');
    expect(findCountyTreasuryEntity('County of Los Angeles Board of Supervisors', COUNTIES, 'CA')?.name)
      .toBe('Los Angeles County');
  });

  it('never returns a budget-less grouper county', () => {
    // Orange County parents cities that have data but has none itself.
    expect(findCountyTreasuryEntity('Orange County', COUNTIES, 'CA')).toBeNull();
  });

  it('respects the state scope for same-named counties', () => {
    expect(findCountyTreasuryEntity('Dane County', COUNTIES, 'MN')?.state).toBe('MN');
    expect(findCountyTreasuryEntity('Dane County', COUNTIES, 'TX')).toBeNull();
  });

  it('does not match a city that shares the county stem', () => {
    // "Dane" the city must not be returned for a county lookup, nor the county
    // for a plain city title.
    expect(findCountyTreasuryEntity('Dane Village Board', COUNTIES, 'WI')).toBeNull();
  });

  it('does not match a municipality title', () => {
    expect(findCountyTreasuryEntity('Madison Common Council', COUNTIES, 'WI')).toBeNull();
  });

  it('returns null on empty/garbage input rather than throwing', () => {
    expect(findCountyTreasuryEntity('', COUNTIES, 'WI')).toBeNull();
    expect(findCountyTreasuryEntity('Dane County', null, 'WI')).toBeNull();
    expect(() => findCountyTreasuryEntity('Dane County', COUNTIES)).not.toThrow();
  });
});
