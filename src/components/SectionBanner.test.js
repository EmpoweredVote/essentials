/**
 * Unit tests for SectionBanner.jsx — pure-logic only (no jsdom, no React render).
 * Asserts the tier→fallback-gradient mapping.
 *
 * Mirror of src/lib/groupHierarchy.test.js pattern: import from vitest,
 * no react/testing-library imports.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FALLBACK_GRADIENTS, shouldRenderStat, shouldRenderIcons, BANNER_ASPECT } from './SectionBanner.jsx';

describe('BANNER_ASPECT — the box must stay aspect-driven, never fixed-height', () => {
  // Regression guard for the 2026-07-27 Bend incident. A fixed-height box + object-fit:cover
  // makes the visible slice of the asset depend on viewport width: a 1296x180 desktop box
  // showed only the middle 43.7% of a 1700x540 file while a phone showed ~97%. Bend was
  // certified on the full frame, its subject sat in the cropped-out top third, and desktop
  // users got a wall of trees. Reverting to a fixed height silently restores that bug, so
  // these assertions exist to make that revert fail loudly.
  const SRC = readFileSync(new URL('./SectionBanner.jsx', import.meta.url), 'utf8');

  it('exports a CSS aspect-ratio value', () => {
    expect(BANNER_ASPECT).toBeTruthy();
    expect(String(BANNER_ASPECT)).toMatch(/^\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/);
  });

  it('defaults to the 1700x540 asset ratio, so nothing is cropped', () => {
    const [w, h] = String(BANNER_ASPECT).split('/').map((n) => parseFloat(n));
    expect(w / h).toBeCloseTo(1700 / 540, 3);
  });

  it('applies the ratio to the banner box via aspectRatio', () => {
    expect(SRC).toContain('aspectRatio: BANNER_ASPECT');
  });

  it('does not reintroduce a fixed-height banner box', () => {
    // The old markup was: className="-mx-6 md:-mx-12 relative overflow-hidden h-[120px] md:h-[180px]"
    expect(SRC).not.toMatch(/className="[^"]*\bh-\[\d+px\]/);
    expect(SRC).not.toMatch(/className="[^"]*\bmd:h-\[\d+px\]/);
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
