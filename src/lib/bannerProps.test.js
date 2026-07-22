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
