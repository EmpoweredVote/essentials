/**
 * Tests for featureIcons.js — product registry + resolveFeatureIcons.
 * Pure-logic only (no jsdom, no React render), matching this repo's Vitest
 * convention (see treasury.test.js / SectionBanner.test.js).
 *
 * Fixtures mirror the real live /treasury/cities records confirmed in
 * 187-RESEARCH.md (probed 2026-07-07): Texas (state), United States
 * (federal), Plano TX (municipality).
 */

import { describe, it, expect } from 'vitest';
import { PRODUCT_REGISTRY, resolveFeatureIcons } from './featureIcons';
import { TREASURY_URL } from './treasury';
import { TRIVIA_URL } from './trivia';

const ds = [{ fiscal_year: 2024, dataset_type: 'revenue' }];

const CITIES = [
  { name: 'Texas', state: 'TX', entity_type: 'state', available_datasets: ds },
  { name: 'United States', state: 'US', entity_type: 'federal', available_datasets: ds },
  { name: 'Plano', state: 'TX', entity_type: 'municipality', available_datasets: ds },
];

describe('PRODUCT_REGISTRY', () => {
  it('lists treasury first with the correct iconSrc', () => {
    expect(PRODUCT_REGISTRY[0].key).toBe('treasury');
    expect(PRODUCT_REGISTRY[0].iconSrc).toBe('/treasury-symbol.svg');
  });

  it('lists treasury then trivia, in that order (no compass/readrank live entries)', () => {
    const liveKeys = PRODUCT_REGISTRY.map((p) => p.key);
    expect(liveKeys).toEqual(['treasury', 'trivia']);
  });

  it('lists trivia second with the correct iconSrc', () => {
    const trivia = PRODUCT_REGISTRY.find((p) => p.key === 'trivia');
    expect(PRODUCT_REGISTRY[1].key).toBe('trivia');
    expect(trivia.iconSrc).toBe('/trivia-symbol.svg');
  });
});

describe('resolveFeatureIcons', () => {
  it('resolves Local/State/Federal treasury icons for a matching location', () => {
    const result = resolveFeatureIcons({
      representingCity: 'Plano',
      userState: 'TX',
      treasuryCities: CITIES,
    });

    expect(result.Local).toHaveLength(1);
    expect(result.Local[0]).toMatchObject({
      key: 'treasury',
      label: 'Treasury Tracker',
    });
    expect(result.Local[0].href).toBe(`${TREASURY_URL}/?entity=plano-tx`);

    expect(result.State).toHaveLength(1);
    expect(result.State[0].href).toBe(`${TREASURY_URL}/?entity=texas-tx`);

    expect(result.Federal).toHaveLength(1);
    expect(result.Federal[0].href).toBe(`${TREASURY_URL}/?entity=united-states-us`);
  });

  it('every resolved href begins with the financials.empowered.vote contract', () => {
    const result = resolveFeatureIcons({
      representingCity: 'Plano',
      userState: 'TX',
      treasuryCities: CITIES,
    });
    expect(result.Local[0].href.startsWith('https://financials.empowered.vote/?entity=')).toBe(true);
  });

  it('omits the icon entirely for a tier with no matching entity (TETH-03) — never a null/placeholder entry', () => {
    const result = resolveFeatureIcons({
      representingCity: 'Nowheresville',
      userState: 'ZZ',
      treasuryCities: CITIES,
    });
    expect(result.Local).toEqual([]);
    expect(result.State).toEqual([]);
    // Federal still resolves — United States is location-independent.
    expect(result.Federal).toHaveLength(1);
  });

  it('returns all-empty arrays for an empty treasuryCities list (no throw)', () => {
    const result = resolveFeatureIcons({
      representingCity: 'Plano',
      userState: 'TX',
      treasuryCities: [],
    });
    expect(result).toEqual({ Local: [], State: [], Federal: [] });
  });

  it('returns all-empty arrays when called with no arguments (no throw)', () => {
    const result = resolveFeatureIcons({});
    expect(result).toEqual({ Local: [], State: [], Federal: [] });
  });

  it('resolves only treasury when triviaCollections is absent', () => {
    const result = resolveFeatureIcons({
      representingCity: 'Plano',
      userState: 'TX',
      treasuryCities: CITIES,
    });
    const allKeys = [...result.Local, ...result.State, ...result.Federal].map((i) => i.key);
    expect(allKeys.every((k) => k === 'treasury')).toBe(true);
  });
});

const COLLECTIONS = [
  { slug: 'los-angeles-ca', tier: 'city', localeName: 'Los Angeles, California' },
  { slug: 'california-state', tier: 'state', localeName: 'California' },
  { slug: 'federal', tier: 'federal', localeName: 'United States' },
];

describe('resolveFeatureIcons — Civic Trivia Championship', () => {
  it('adds a trivia chip AFTER treasury when a collection matches the tier', () => {
    const result = resolveFeatureIcons({
      representingCity: 'Los Angeles',
      userState: 'CA',
      stateName: 'California',
      treasuryCities: [
        { name: 'Los Angeles', state: 'CA', entity_type: 'municipality', available_datasets: ds },
        { name: 'California', state: 'CA', entity_type: 'state', available_datasets: ds },
        { name: 'United States', state: 'US', entity_type: 'federal', available_datasets: ds },
      ],
      triviaCollections: COLLECTIONS,
    });

    // Order: treasury first, trivia second (D-01/D-03 fixed order).
    expect(result.Local.map((i) => i.key)).toEqual(['treasury', 'trivia']);
    expect(result.Local[1].href).toBe(`${TRIVIA_URL}/?collection=los-angeles-ca`);

    expect(result.State.map((i) => i.key)).toContain('trivia');
    expect(result.State.find((i) => i.key === 'trivia').href).toBe(
      `${TRIVIA_URL}/?collection=california-state`
    );

    expect(result.Federal.find((i) => i.key === 'trivia').href).toBe(
      `${TRIVIA_URL}/?collection=federal`
    );
  });

  it('omits the trivia chip for a city with no matching collection (TETH-03)', () => {
    const result = resolveFeatureIcons({
      representingCity: 'Nowheresville',
      userState: 'ZZ',
      stateName: 'Nowhere',
      triviaCollections: COLLECTIONS,
    });
    expect(result.Local).toEqual([]);
    expect(result.State).toEqual([]);
    // Federal collection is location-independent, so its trivia chip still resolves.
    expect(result.Federal.map((i) => i.key)).toEqual(['trivia']);
  });

  it('strips a "City of" prefix before matching the collection slug', () => {
    const result = resolveFeatureIcons({
      representingCity: 'City of Los Angeles',
      userState: 'CA',
      triviaCollections: COLLECTIONS,
    });
    expect(result.Local.map((i) => i.key)).toEqual(['trivia']);
    expect(result.Local[0].href).toBe(`${TRIVIA_URL}/?collection=los-angeles-ca`);
  });
});
