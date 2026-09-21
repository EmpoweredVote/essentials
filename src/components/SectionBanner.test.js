/**
 * Unit tests for SectionBanner.jsx — pure-logic only (no jsdom, no React render).
 * Asserts the tier→fallback-gradient mapping.
 *
 * Mirror of src/lib/groupHierarchy.test.js pattern: import from vitest,
 * no react/testing-library imports.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  FALLBACK_GRADIENTS, shouldRenderStat, shouldRenderIcons,
  BANNER_ASPECT, BANNER_ASPECT_CLASS,
  BANNER_FOCUS_DEFAULT, resolveImageFocus,
} from './SectionBanner.jsx';

describe('BANNER_ASPECT — the box must stay aspect-driven, never fixed-height', () => {
  // Regression guard for the 2026-07-27 Bend incident. A fixed-height box + object-fit:cover
  // makes the visible slice of the asset depend on viewport width: a 1296x180 desktop box
  // showed only the middle 43.7% of a 1700x540 file while a phone showed ~97%. Bend was
  // certified on the full frame, its subject sat in the cropped-out top third, and desktop
  // users got a wall of trees. Reverting to a fixed height silently restores that bug, so
  // these assertions exist to make that revert fail loudly.
  const SRC = readFileSync(new URL('./SectionBanner.jsx', import.meta.url), 'utf8');
  const ASSET = 1700 / 540;
  const ratio = (v) => {
    const [w, h] = String(v).split('/').map((n) => parseFloat(n));
    return w / h;
  };

  it('exports a CSS ratio for each breakpoint', () => {
    for (const key of ['mobile', 'desktop']) {
      expect(BANNER_ASPECT[key], key).toBeTruthy();
      expect(String(BANNER_ASPECT[key]), key).toMatch(/^\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*$/);
    }
  });

  it('never sets a box NARROWER than the asset — that would crop the sides', () => {
    // A box narrower than 3.148:1 crops left/right instead of top/bottom, which would cut
    // skylines off at the edges. Every ratio must be >= the asset ratio.
    expect(ratio(BANNER_ASPECT.mobile)).toBeGreaterThanOrEqual(ASSET);
    expect(ratio(BANNER_ASPECT.desktop)).toBeGreaterThanOrEqual(ASSET);
  });

  it('keeps mobile at the old ~97% visible and desktop wider', () => {
    expect(ASSET / ratio(BANNER_ASPECT.mobile)).toBeGreaterThan(0.95);
    expect(ratio(BANNER_ASPECT.desktop)).toBeGreaterThan(ratio(BANNER_ASPECT.mobile));
  });

  it('desktop still shows more of the asset than the old fixed height did', () => {
    // The old desktop box was ~1296x180 => 7.2:1 => 43.7% visible. Any chosen desktop ratio
    // should be at least that good, or the change bought nothing.
    const OLD_DESKTOP_VISIBLE = ASSET / (1296 / 180);
    expect(ASSET / ratio(BANNER_ASPECT.desktop)).toBeGreaterThanOrEqual(OLD_DESKTOP_VISIBLE);
  });

  it('the literal Tailwind classes agree with the constants (drift guard)', () => {
    // The classes must be literal for Tailwind's scanner, so the numbers are duplicated.
    const m = BANNER_ASPECT_CLASS.match(/(?:^|\s)aspect-\[([\d./]+)\]/);
    const d = BANNER_ASPECT_CLASS.match(/md:aspect-\[([\d./]+)\]/);
    expect(m, 'base aspect class').toBeTruthy();
    expect(d, 'md aspect class').toBeTruthy();
    expect(ratio(m[1])).toBeCloseTo(ratio(BANNER_ASPECT.mobile), 5);
    expect(ratio(d[1])).toBeCloseTo(ratio(BANNER_ASPECT.desktop), 5);
  });

  it('applies the classes to the banner box', () => {
    expect(SRC).toContain('${BANNER_ASPECT_CLASS}');
  });

  it('does not reintroduce a fixed-height banner box', () => {
    // The old markup was: className="-mx-6 md:-mx-12 relative overflow-hidden h-<120px> md:h-<180px>"
    expect(SRC).not.toMatch(/className=(?:"|\{`)[^"`]*\bh-\[\d+px\]/);
    expect(SRC).not.toMatch(/className=(?:"|\{`)[^"`]*\bmd:h-\[\d+px\]/);
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

describe('resolveImageFocus — the per-banner desktop crop target', () => {
  // Added 2026-09-21. Until now `object-fit: cover` with no `object-position`
  // pinned every banner's desktop slice to the CENTRE of its asset, which made
  // "compose a good 1700x540 picture" and "choose what desktop sees" the same
  // decision. South Carolina is where that bit: the Columbia State House frames
  // best with its dome, the dome sits above the centre band, and anchoring the
  // asset low enough to fix desktop threw the dome out of the asset entirely.
  const SRC = readFileSync(new URL('./SectionBanner.jsx', import.meta.url), 'utf8');

  it('defaults to the historical centre', () => {
    // EVERY banner that sets no focus must render byte-identically to before.
    expect(BANNER_FOCUS_DEFAULT).toBe('50% 50%');
    for (const absent of [null, undefined, '', '   ']) {
      expect(resolveImageFocus(absent)).toBe(BANNER_FOCUS_DEFAULT);
    }
  });

  it('passes a valid two-component value through unchanged', () => {
    for (const ok of ['50% 82%', '50% 0%', '50% 100%', 'center bottom', '0px 120px']) {
      expect(resolveImageFocus(ok), ok).toBe(ok);
    }
  });

  it('falls back rather than emitting invalid CSS', () => {
    // A malformed value must not reach the style object: the browser would drop
    // the whole object-position declaration, which looks exactly like "the focus
    // did nothing" and gets debugged in the wrong file.
    for (const bad of ['50%', '50% 82% 3%', 'junk', '50%; color:red', 42, {}, []]) {
      expect(resolveImageFocus(bad), String(bad)).toBe(BANNER_FOCUS_DEFAULT);
    }
  });

  it('applies object-position to the image layer', () => {
    // The knob is worthless if the component does not actually set it.
    expect(SRC).toMatch(/objectPosition:\s*resolveImageFocus\(imageFocus\)/);
  });

  it('still covers — the focus moves the crop, it never replaces object-fit', () => {
    expect(SRC).toMatch(/objectFit:\s*'cover'/);
  });

  it('can reach both edges of the desktop overflow', () => {
    // At md+ the 6/1 box shows 1700/6 = 283 of 540 rows, so 257 rows of overflow
    // exist for the focus to travel through. If this ever reached zero the knob
    // would be inert and a banner could not be retargeted at all.
    const BAND = Math.round(1700 / 6);
    expect(540 - BAND).toBeGreaterThan(200);
  });
});
