/**
 * Tests for inputClassifier.js — classifyInput() (SRCH-03 / D-02)
 * Mirrors src/lib/classify.test.js's structure: one describe per kind.
 */

import { describe, it, expect } from 'vitest';
import { classifyInput } from './inputClassifier.js';

describe('classifyInput — empty detection', () => {
  it('returns "empty" for an empty string', () => {
    expect(classifyInput('')).toEqual({ kind: 'empty' });
  });
  it('returns "empty" for a whitespace-only string', () => {
    expect(classifyInput('   ')).toEqual({ kind: 'empty' });
  });
  it('returns "empty" for null', () => {
    expect(classifyInput(null)).toEqual({ kind: 'empty' });
  });
  it('returns "empty" for undefined', () => {
    expect(classifyInput(undefined)).toEqual({ kind: 'empty' });
  });
});

describe('classifyInput — coordinate detection (D-02)', () => {
  it('classifies a comma-separated decimal pair as coordinate', () => {
    expect(classifyInput('39.17, -86.52')).toEqual({ kind: 'coordinate', lat: 39.17, lng: -86.52 });
  });
  it('classifies a negative-latitude pair as coordinate', () => {
    expect(classifyInput('-33.9, 151.2')).toEqual({ kind: 'coordinate', lat: -33.9, lng: 151.2 });
  });
  it('classifies a coordinate pair with no space after the comma', () => {
    expect(classifyInput('39.17,-86.52')).toEqual({ kind: 'coordinate', lat: 39.17, lng: -86.52 });
  });
});

describe('classifyInput — address detection (D-02)', () => {
  it('classifies a leading-street-number string as address', () => {
    expect(classifyInput('123 Main St')).toEqual({ kind: 'address' });
  });
  it('classifies a street address containing a ZIP as address', () => {
    // A full address must still geocode to a POINT — the precise answer. Only an
    // input that is NOTHING BUT a ZIP resolves as an area (see the zip block).
    expect(classifyInput('123 Main St, Bloomington IN 47401')).toEqual({ kind: 'address' });
  });
});

describe('classifyInput — ZIP detection', () => {
  // NOTE: two assertions in the address block above used to claim a BARE ZIP was
  // an address. They were deleted deliberately, not fixed: routing a bare ZIP
  // into the Census address path guarantees a 422 ADDRESS_NOT_FOUND, because the
  // Census geocoder cannot resolve a ZIP without a street. Inverting them IS the
  // feature — a bare ZIP now resolves as an AREA.
  it('classifies a bare 5-digit ZIP as zip, carrying the normalized code', () => {
    expect(classifyInput('46220')).toEqual({ kind: 'zip', zip: '46220' });
  });
  it('classifies a ZIP+4 as zip, normalized to five digits', () => {
    expect(classifyInput('46220-1234')).toEqual({ kind: 'zip', zip: '46220' });
  });
  it('trims surrounding whitespace', () => {
    expect(classifyInput('  46220  ')).toEqual({ kind: 'zip', zip: '46220' });
  });
  it('keeps a city+ZIP string as an address, not a zip', () => {
    expect(classifyInput('Bloomington 47401')).toEqual({ kind: 'address' });
  });
  it('does not treat a 4-digit number as a zip', () => {
    expect(classifyInput('4622')).toEqual({ kind: 'name' });
  });
  it('does not treat a 6-digit number as a zip', () => {
    expect(classifyInput('462201')).toEqual({ kind: 'name' });
  });
  it('does not treat a 9-digit run without the hyphen as a zip', () => {
    expect(classifyInput('462201234')).toEqual({ kind: 'name' });
  });
});

describe('classifyInput — name detection (D-02)', () => {
  it('classifies a bare city name as name', () => {
    expect(classifyInput('Bloomington')).toEqual({ kind: 'name' });
  });
  it('classifies a digit-glued-to-letters token with no space as name, not address', () => {
    // "5th Ward" — the digit is immediately followed by "th" (no whitespace),
    // so ADDRESS_LEADING_DIGIT_RE (\d+\s+\S) does not match.
    expect(classifyInput('5th Ward')).toEqual({ kind: 'name' });
  });
});

describe('classifyInput — documented-gap edge cases (accepted v1 tradeoffs)', () => {
  it('classifies "5 Points" as address, not name — Open Question 1 (214-RESEARCH.md): a leading digit followed by a space is indistinguishable from a street number client-side; accepted tradeoff, not silently drifting', () => {
    expect(classifyInput('5 Points')).toEqual({ kind: 'address' });
  });
  it('classifies space-separated coordinates without a comma as address, not coordinate — Open Question 2 (214-RESEARCH.md): COORDINATE_RE requires a comma, so "39.17 -86.52" falls through to the leading-digit address check instead; accepted tradeoff, not silently drifting', () => {
    expect(classifyInput('39.17 -86.52')).toEqual({ kind: 'address' });
  });
});
