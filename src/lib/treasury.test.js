/**
 * Tests for treasury.js municipality matching — state disambiguation regression
 * guard (T-xxx). Locks in that a Utah city only matches a Utah treasury entity,
 * so same-named cities in other states can never win (Salem UT must NOT link to
 * salem-ma; Saratoga Springs UT must NOT link to saratoga-ca). Cities with no
 * same-state entity return null so the caller renders no link.
 */

import { describe, it, expect } from 'vitest';
import { findMatchingMunicipality, toTreasurySlug } from './treasury';

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
