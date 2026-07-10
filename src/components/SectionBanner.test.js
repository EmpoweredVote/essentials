/**
 * Unit tests for SectionBanner.jsx — pure-logic only (no jsdom, no React render).
 * Asserts the tier→fallback-gradient mapping.
 *
 * Mirror of src/lib/groupHierarchy.test.js pattern: import from vitest,
 * no react/testing-library imports.
 */

import { describe, it, expect } from 'vitest';
import { FALLBACK_GRADIENTS, shouldRenderStat, shouldRenderIcons } from './SectionBanner.jsx';

describe('FALLBACK_GRADIENTS — tier to gradient string mapping', () => {
  it('city gradient is defined and non-empty', () => {
    expect(FALLBACK_GRADIENTS.city).toBeTruthy();
  });

  it('state gradient is defined and non-empty', () => {
    expect(FALLBACK_GRADIENTS.state).toBeTruthy();
  });

  it('federal gradient is defined and non-empty', () => {
    expect(FALLBACK_GRADIENTS.federal).toBeTruthy();
  });

  it('all three tier gradients are mutually distinct', () => {
    expect(FALLBACK_GRADIENTS.city).not.toBe(FALLBACK_GRADIENTS.state);
    expect(FALLBACK_GRADIENTS.city).not.toBe(FALLBACK_GRADIENTS.federal);
    expect(FALLBACK_GRADIENTS.state).not.toBe(FALLBACK_GRADIENTS.federal);
  });

  it('each gradient uses 135deg direction', () => {
    expect(FALLBACK_GRADIENTS.city).toContain('135deg');
    expect(FALLBACK_GRADIENTS.state).toContain('135deg');
    expect(FALLBACK_GRADIENTS.federal).toContain('135deg');
  });

  it('each gradient starts from the navy base color #0d1117', () => {
    expect(FALLBACK_GRADIENTS.city).toContain('#0d1117');
    expect(FALLBACK_GRADIENTS.state).toContain('#0d1117');
    expect(FALLBACK_GRADIENTS.federal).toContain('#0d1117');
  });
});

describe('shouldRenderStat', () => {
  it('returns true for a positive numeric value', () => {
    expect(shouldRenderStat({ label: 'POPULATION', value: 652503 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(shouldRenderStat(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(shouldRenderStat(undefined)).toBe(false);
  });

  it('returns false for value: 0', () => {
    expect(shouldRenderStat({ value: 0 })).toBe(false);
  });

  it('returns false for value: NaN', () => {
    expect(shouldRenderStat({ value: NaN })).toBe(false);
  });

  it('returns false for a string value', () => {
    expect(shouldRenderStat({ value: '5' })).toBe(false);
  });

  it('returns false for an empty object', () => {
    expect(shouldRenderStat({})).toBe(false);
  });
});

describe('shouldRenderIcons', () => {
  it('returns true for a non-empty array', () => {
    expect(shouldRenderIcons([{ key: 'x' }])).toBe(true);
  });

  it('returns false for an empty array', () => {
    expect(shouldRenderIcons([])).toBe(false);
  });

  it('returns false for null', () => {
    expect(shouldRenderIcons(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(shouldRenderIcons(undefined)).toBe(false);
  });

  it('returns false for a non-array', () => {
    expect(shouldRenderIcons('x')).toBe(false);
  });
});
