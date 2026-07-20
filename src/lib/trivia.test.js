/**
 * Tests for trivia.js — CTC collection matching + slug helper.
 * Pure-logic only (no jsdom, no network), matching treasury.test.js convention.
 */

import { describe, it, expect } from 'vitest';
import {
  toCollectionSlug,
  findMatchingCityCollection,
  findStateCollection,
  findFederalCollection,
  TRIVIA_URL,
} from './trivia';

const COLLECTIONS = [
  { slug: 'los-angeles-ca', tier: 'city', localeName: 'Los Angeles, California' },
  { slug: 'bloomington-in', tier: 'city', localeName: 'Bloomington, Indiana' },
  { slug: 'california-state', tier: 'state', localeName: 'California' },
  { slug: 'indiana-state', tier: 'state', localeName: 'Indiana' },
  { slug: 'federal', tier: 'federal', localeName: 'United States' },
];

describe('TRIVIA_URL', () => {
  it('defaults to the ctc.empowered.vote contract', () => {
    expect(TRIVIA_URL).toBe('https://ctc.empowered.vote');
  });
});

describe('toCollectionSlug', () => {
  it('mirrors the treasury slug format (name-state, lowercased, hyphenated)', () => {
    expect(toCollectionSlug({ name: 'Los Angeles', state: 'CA' })).toBe('los-angeles-ca');
    expect(toCollectionSlug({ name: 'Bloomington', state: 'IN' })).toBe('bloomington-in');
  });

  it('strips slash/question/hash characters', () => {
    expect(toCollectionSlug({ name: 'A/B?C#', state: 'ca' })).toBe('abc-ca');
  });
});

describe('findMatchingCityCollection', () => {
  it('matches a city + state to its city-tier collection slug', () => {
    expect(findMatchingCityCollection('Los Angeles', 'CA', COLLECTIONS)?.slug).toBe('los-angeles-ca');
  });

  it('strips a "City of" prefix', () => {
    expect(findMatchingCityCollection('City of Los Angeles', 'CA', COLLECTIONS)?.slug).toBe(
      'los-angeles-ca'
    );
  });

  it('returns null with no valid state (city slugs are always state-suffixed)', () => {
    expect(findMatchingCityCollection('Los Angeles', null, COLLECTIONS)).toBeNull();
    expect(findMatchingCityCollection('Los Angeles', 'ZZZ', COLLECTIONS)).toBeNull();
  });

  it('returns null when the wrong state would produce a non-matching slug', () => {
    // Los Angeles + IN would slug to los-angeles-in, which no collection has.
    expect(findMatchingCityCollection('Los Angeles', 'IN', COLLECTIONS)).toBeNull();
  });

  it('returns null for empty/invalid inputs (no throw)', () => {
    expect(findMatchingCityCollection('', 'CA', COLLECTIONS)).toBeNull();
    expect(findMatchingCityCollection('Los Angeles', 'CA', null)).toBeNull();
  });
});

describe('findStateCollection', () => {
  it('matches a full state name to its state-tier collection', () => {
    expect(findStateCollection('California', COLLECTIONS)?.slug).toBe('california-state');
    expect(findStateCollection('indiana', COLLECTIONS)?.slug).toBe('indiana-state');
  });

  it('returns null for an unknown state or missing input', () => {
    expect(findStateCollection('Nowhere', COLLECTIONS)).toBeNull();
    expect(findStateCollection(null, COLLECTIONS)).toBeNull();
  });
});

describe('findFederalCollection', () => {
  it('finds the singular federal collection', () => {
    expect(findFederalCollection(COLLECTIONS)?.slug).toBe('federal');
  });

  it('returns null for a non-array', () => {
    expect(findFederalCollection(undefined)).toBeNull();
  });
});
