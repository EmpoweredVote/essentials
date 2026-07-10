/**
 * Tests for population.js — resolvePopulation().
 * Pure-logic only (no jsdom, no React render), matching this repo's Vitest
 * convention (see treasury.test.js / SectionBanner.test.js / featureIcons.test.js).
 *
 * Fixtures are a small in-test MAPS object injected via resolvePopulation's
 * second (`maps`) argument — this file does NOT import ../data/population.js
 * (the real ~700KB generated bundle is never loaded in tests, per RESEARCH.md's
 * Wave-0 gap note).
 */

import { describe, it, expect } from 'vitest';
import { resolvePopulation } from './population';

const MAPS = {
  POP_BY_FIPS: {
    US: 334914895,
    '48': 30503301,
    '0644000': 3898747,
    '0600000': 0,
  },
  NAME_STATE_TO_FIPS: {
    'los angeles|CA': '0644000',
  },
  ABBREV_TO_STATE_FIPS: {
    TX: '48',
    CA: '06',
  },
};

describe('resolvePopulation', () => {
  it('federal tier always resolves to the national US total (D-06)', () => {
    expect(resolvePopulation({ tier: 'federal' }, MAPS)).toBe(334914895);
  });

  it('state tier resolves via mixed-case abbrev -> state FIPS -> population (D-04)', () => {
    expect(resolvePopulation({ tier: 'state', stateAbbrev: 'tx' }, MAPS)).toBe(30503301);
    expect(resolvePopulation({ tier: 'state', stateAbbrev: 'Tx' }, MAPS)).toBe(30503301);
    expect(resolvePopulation({ tier: 'state', stateAbbrev: 'TX' }, MAPS)).toBe(30503301);
  });

  it('state tier returns null for an unknown/bad abbrev (STAT-03)', () => {
    expect(resolvePopulation({ tier: 'state', stateAbbrev: 'ZZ' }, MAPS)).toBeNull();
    expect(resolvePopulation({ tier: 'state', stateAbbrev: '' }, MAPS)).toBeNull();
    expect(resolvePopulation({ tier: 'state' }, MAPS)).toBeNull();
  });

  it('city tier resolves via geoId when present (D-05 primary)', () => {
    expect(resolvePopulation({ tier: 'city', geoId: '0644000' }, MAPS)).toBe(3898747);
  });

  it('city tier resolves via the name|state index when geoId is absent (D-05 fallback)', () => {
    expect(
      resolvePopulation({ tier: 'city', city: 'Los Angeles', stateAbbrev: 'CA' }, MAPS)
    ).toBe(3898747);
  });

  it('city tier prefers geoId over the name|state index when both are present', () => {
    expect(
      resolvePopulation(
        { tier: 'city', geoId: '0644000', city: 'Los Angeles', stateAbbrev: 'CA' },
        MAPS
      )
    ).toBe(3898747);
  });

  it('city tier returns null for an unknown geoId AND an unknown name|state (STAT-03)', () => {
    expect(resolvePopulation({ tier: 'city', geoId: '9999999' }, MAPS)).toBeNull();
    expect(
      resolvePopulation({ tier: 'city', city: 'Nowheresville', stateAbbrev: 'ZZ' }, MAPS)
    ).toBeNull();
    expect(resolvePopulation({ tier: 'city' }, MAPS)).toBeNull();
  });

  it('returns null when city is present but stateAbbrev is missing (no index key possible)', () => {
    expect(resolvePopulation({ tier: 'city', city: 'Los Angeles' }, MAPS)).toBeNull();
  });

  it('returns null for an unrecognized tier', () => {
    expect(resolvePopulation({ tier: 'planet' }, MAPS)).toBeNull();
  });

  it('returns null when called with no arguments (no throw)', () => {
    expect(resolvePopulation()).toBeNull();
  });

  it('returns null for a resolved population value of 0 (STAT-03)', () => {
    expect(resolvePopulation({ tier: 'city', geoId: '0600000' }, MAPS)).toBeNull();
  });

  it('returns null for a resolved population value of NaN (STAT-03)', () => {
    const maps = { ...MAPS, POP_BY_FIPS: { ...MAPS.POP_BY_FIPS, '0600000': NaN } };
    expect(resolvePopulation({ tier: 'city', geoId: '0600000' }, maps)).toBeNull();
  });

  it('returns null for a non-number resolved population value (STAT-03)', () => {
    const stringMaps = {
      ...MAPS,
      POP_BY_FIPS: { ...MAPS.POP_BY_FIPS, '0600000': 'not a number' },
    };
    expect(resolvePopulation({ tier: 'city', geoId: '0600000' }, stringMaps)).toBeNull();

    const undefinedMaps = {
      ...MAPS,
      POP_BY_FIPS: { ...MAPS.POP_BY_FIPS, '0600000': undefined },
    };
    expect(resolvePopulation({ tier: 'city', geoId: '0600000' }, undefinedMaps)).toBeNull();
  });
});
