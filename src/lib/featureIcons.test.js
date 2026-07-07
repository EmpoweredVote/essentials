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

  it('never rendered non-treasury products today (no compass/readrank live entries)', () => {
    const liveKeys = PRODUCT_REGISTRY.map((p) => p.key);
    expect(liveKeys).toEqual(['treasury']);
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

  it('only the treasury product ever appears in output today', () => {
    const result = resolveFeatureIcons({
      representingCity: 'Plano',
      userState: 'TX',
      treasuryCities: CITIES,
    });
    const allKeys = [...result.Local, ...result.State, ...result.Federal].map((i) => i.key);
    expect(allKeys.every((k) => k === 'treasury')).toBe(true);
  });
});
