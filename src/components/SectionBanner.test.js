/**
 * Unit tests for SectionBanner.jsx — pure-logic only (no jsdom, no React render).
 * Asserts the tier→fallback-gradient mapping.
 *
 * Mirror of src/lib/groupHierarchy.test.js pattern: import from vitest,
 * no react/testing-library imports.
 */

import { describe, it, expect } from 'vitest';
import { FALLBACK_GRADIENTS } from './SectionBanner.jsx';

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
