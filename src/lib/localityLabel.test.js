// src/lib/localityLabel.test.js — pure-logic only, no jsdom/React import.
// Mirrors bannerProps.test.js convention.

import { describe, it, expect } from 'vitest';
import { unincorporatedLabel } from './localityLabel';

describe('unincorporatedLabel', () => {
  it('returns "Unincorporated {county}" when incorporated is false and county_name is present', () => {
    expect(unincorporatedLabel({ incorporated: false, county_name: 'Pima County' })).toBe(
      'Unincorporated Pima County'
    );
  });

  it('returns null when incorporated is true (has a place name)', () => {
    expect(
      unincorporatedLabel({ incorporated: true, place_name: 'Tucson', county_name: 'Pima County' })
    ).toBeNull();
  });

  it('returns null when incorporated is null (un-loaded state, unknown)', () => {
    expect(unincorporatedLabel({ incorporated: null, county_name: 'Monroe County' })).toBeNull();
  });

  it('returns null when incorporated is false but county_name is missing', () => {
    expect(unincorporatedLabel({ incorporated: false, county_name: null })).toBeNull();
  });

  it('returns null for null input', () => {
    expect(unincorporatedLabel(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(unincorporatedLabel(undefined)).toBeNull();
  });
});
