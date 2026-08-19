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

  it('lets a caller override the no-city label — ZIP mode has no city of record', () => {
    // A ZIP spans several cities (47401 covers Bloomington plus four townships
    // across two counties), so "Your City" would claim a possession the ZIP
    // cannot establish.
    const result = buildBannerProps('city', { cityFallbackLabel: 'In ZIP 47401' });
    expect(result.locationName).toBe('In ZIP 47401');
  });

  it('still says "Your City" when the override is undefined', () => {
    // Results passes `undefined` for non-ZIP modes; the default must survive it.
    const result = buildBannerProps('city', { cityFallbackLabel: undefined });
    expect(result.locationName).toBe('Your City');
  });

  it('names the state on the state band when userState is known', () => {
    // Reported 2026-08-18: a ZIP search resolved Los Angeles and Culver City
    // correctly, but the state band still read "Your State". userState was null
    // because it was derived only from the address string or the browse params,
    // and ZIP mode has neither — see the zipInfo branch in Results' userState.
    const result = buildBannerProps('state', {
      userState: 'CA',
      stateNames: { CA: 'California' },
    });
    expect(result.locationName).toBe('California');
  });

  it('lets a caller override the no-state label — a multi-state ZIP has no state of record', () => {
    // Same argument as cityFallbackLabel, one tier up. ZIP 63673 straddles
    // Illinois and Missouri and 89439 straddles California and Nevada, so
    // "Your State" would claim a possession the ZIP cannot establish. Naming
    // either one of the two would be worse still.
    const result = buildBannerProps('state', { stateFallbackLabel: 'In ZIP 63673' });
    expect(result.locationName).toBe('In ZIP 63673');
  });

  it('still says "Your State" when the state override is undefined', () => {
    const result = buildBannerProps('state', { stateFallbackLabel: undefined });
    expect(result.locationName).toBe('Your State');
  });

  it('prefers the real state name over the fallback even when a fallback is supplied', () => {
    // A single-state ZIP supplies BOTH a resolved userState and a fallback
    // label; the resolved state must win, or the fix for the reported bug does
    // nothing in exactly the case it was written for.
    const result = buildBannerProps('state', {
      userState: 'CA',
      stateNames: { CA: 'California' },
      stateFallbackLabel: 'In ZIP 90232',
    });
    expect(result.locationName).toBe('California');
  });
});
