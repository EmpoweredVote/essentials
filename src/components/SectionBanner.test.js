/**
 * Unit tests for SectionBanner.jsx — pure-logic only (no jsdom, no React render).
 * Asserts the tier→eyebrow and tier→fallback-gradient mappings.
 *
 * Mirror of src/lib/groupHierarchy.test.js pattern: import from vitest,
 * no react/testing-library imports.
 */

import { describe, it, expect } from 'vitest';
import { EYEBROW_TEXT, FALLBACK_GRADIENTS } from './SectionBanner.jsx';

describe('EYEBROW_TEXT — tier to eyebrow label mapping', () => {
  it('city tier has exact eyebrow "YOUR CITY"', () => {
    expect(EYEBROW_TEXT.city).toBe('YOUR CITY');
  });

  it('state tier has exact eyebrow "YOUR STATE"', () => {
    expect(EYEBROW_TEXT.state).toBe('YOUR STATE');
  });

  it('federal tier has exact eyebrow "FEDERAL"', () => {
    expect(EYEBROW_TEXT.federal).toBe('FEDERAL');
  });

  it('all three tiers are defined', () => {
    expect(EYEBROW_TEXT.city).toBeDefined();
    expect(EYEBROW_TEXT.state).toBeDefined();
    expect(EYEBROW_TEXT.federal).toBeDefined();
  });
});

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
