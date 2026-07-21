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
  it('classifies a bare 5-digit ZIP as address (flows through existing Census path)', () => {
    expect(classifyInput('90210')).toEqual({ kind: 'address' });
  });
  it('classifies a ZIP+4 as address', () => {
    expect(classifyInput('90210-1234')).toEqual({ kind: 'address' });
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
