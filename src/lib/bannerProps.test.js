// src/lib/bannerProps.test.js — pure-logic only, no jsdom/React import.
// Mirrors featureIcons.test.js / population.test.js convention.

import { describe, it, expect } from 'vitest';
import { buildBannerProps } from './bannerProps';

const CTX = {
  representingCity: 'Plano',
  userState: 'TX',
  stateNames: { TX: 'Texas' },
  buildingImageMap: { Local: 'https://.../plano.jpg', State: null, Federal: 'https://.../capitol.jpg' },
  featureIconMap: { Local: [{ key: 'treasury' }], State: [], Federal: [{ key: 'treasury' }] },
  populationMap: { Local: { label: 'POPULATION', value: 285494 }, State: null, Federal: { label: 'POPULATION', value: 332387540 } },
};

describe('buildBannerProps', () => {
  it('assembles city-tier props from the ctx maps', () => {
    expect(buildBannerProps('city', CTX)).toEqual({
      tier: 'city',
      locationName: 'Plano, TX',
      imageUrl: 'https://.../plano.jpg',
      featureIcons: [{ key: 'treasury' }],
      stats: { label: 'POPULATION', value: 285494 },
    });
  });

  it('does not double the state when representingCity already ends in the state abbrev (browse mode)', () => {
    const browseCtx = { ...CTX, representingCity: 'Los Angeles County, California, US, CA', userState: 'CA', stateNames: { CA: 'California' } };
    expect(buildBannerProps('city', browseCtx).locationName).toBe('Los Angeles County, California, US, CA');
  });

  it('does not double the state when representingCity ends in the full state name', () => {
    const ctx = { ...CTX, representingCity: 'Springfield, Illinois', userState: 'IL', stateNames: { IL: 'Illinois' } };
    expect(buildBannerProps('city', ctx).locationName).toBe('Springfield, Illinois');
  });

  it('does not double the state for the "Unincorporated {County}" label (LOC-04)', () => {
    const ctx = { ...CTX, representingCity: 'Unincorporated Pima County', userState: 'AZ', stateNames: { AZ: 'Arizona' } };
    expect(buildBannerProps('city', ctx).locationName).toBe('Unincorporated Pima County, AZ');
  });

  it('does not append the abbrev to a statewide "State of X" label', () => {
    // A statewide browse label has no comma, so the old trailing-segment
    // equality test missed it and rendered "State of Wisconsin, WI".
    const ctx = { ...CTX, representingCity: 'State of Wisconsin', userState: 'WI', stateNames: { WI: 'Wisconsin' } };
    expect(buildBannerProps('city', ctx).locationName).toBe('State of Wisconsin');
  });

  it('suppresses the abbrev for every "State of X" label, not just Wisconsin', () => {
    for (const [abbrev, name] of [['CA', 'California'], ['NY', 'New York'], ['TX', 'Texas'], ['RI', 'Rhode Island']]) {
      const ctx = { ...CTX, representingCity: `State of ${name}`, userState: abbrev, stateNames: { [abbrev]: name } };
      expect(buildBannerProps('city', ctx).locationName).toBe(`State of ${name}`);
    }
  });

  it('still appends the abbrev when a city merely CONTAINS the state name (word-boundary guard)', () => {
    // "Indianapolis" contains the substring "Indiana". A bare `includes` check
    // would wrongly suppress the state here; \b keeps this correct.
    const ctx = { ...CTX, representingCity: 'Indianapolis', userState: 'IN', stateNames: { IN: 'Indiana' } };
    expect(buildBannerProps('city', ctx).locationName).toBe('Indianapolis, IN');
  });

  it('still appends the abbrev for an ordinary city in the same state', () => {
    const ctx = { ...CTX, representingCity: 'Madison', userState: 'WI', stateNames: { WI: 'Wisconsin' } };
    expect(buildBannerProps('city', ctx).locationName).toBe('Madison, WI');
  });

  it('falls back to the state abbreviation when stateNames has no entry', () => {
    expect(buildBannerProps('state', { ...CTX, stateNames: {} }).locationName).toBe('TX');
  });

  it('federal tier always reads "United States" regardless of city/state', () => {
    expect(buildBannerProps('federal', CTX).locationName).toBe('United States');
  });

  it('a tier with no image/icons/stats returns null/[]/null, never undefined (SBAN-04 precondition)', () => {
    const empty = buildBannerProps('state', CTX); // State map entries are null/[]/null above
    expect(empty.imageUrl).toBeNull();
    expect(empty.featureIcons).toEqual([]);
    expect(empty.stats).toBeNull();
  });

  it('tolerates a completely empty ctx (no throw)', () => {
    expect(() => buildBannerProps('city', {})).not.toThrow();
    const result = buildBannerProps('city', {});
    expect(result.locationName).toBe('Your City');
    expect(result.imageUrl).toBeNull();
    expect(result.featureIcons).toEqual([]);
    expect(result.stats).toBeNull();
  });
});
