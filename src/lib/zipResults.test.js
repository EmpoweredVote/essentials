/**
 * Tests for zipResults.js — pure presentation helpers for the ?zip= mode.
 */

import { describe, it, expect } from 'vitest';
import {
  SHARE_DISCLOSURE_THRESHOLD,
  splitByShare,
  ambiguityCopy,
  zipHeading,
} from './zipResults.js';

describe('SHARE_DISCLOSURE_THRESHOLD', () => {
  it('is 2% — the value that keeps Bloomington in 47401', () => {
    // Measured against prod: ZIP 46360 touches 7 places and only 1 clears 2%,
    // while 47401's Bloomington slice sits under 10%. A 10% cutoff would have
    // deleted a legitimate answer.
    expect(SHARE_DISCLOSURE_THRESHOLD).toBe(0.02);
  });
});

describe('splitByShare', () => {
  it('keeps officials at or above the threshold as primary', () => {
    const pols = [{ id: 'a', share: 0.5 }, { id: 'b', share: 0.02 }];
    const { primary, collapsed } = splitByShare(pols);
    expect(primary.map((p) => p.id)).toEqual(['a', 'b']);
    expect(collapsed).toEqual([]);
  });

  it('collapses slivers below the threshold WITHOUT dropping them', () => {
    // 46360's real shape: 7 places touch the ZIP, 6 are edge slivers.
    const pols = [
      { id: 'real', share: 0.61 },
      ...Array.from({ length: 6 }, (_, i) => ({ id: `sliver${i}`, share: 0.001 })),
    ];
    const { primary, collapsed } = splitByShare(pols);
    expect(primary.map((p) => p.id)).toEqual(['real']);
    expect(collapsed).toHaveLength(6);
    // Nothing is lost — that is the whole contract.
    expect(primary.length + collapsed.length).toBe(pols.length);
  });

  it('treats a null share (statewide office) as primary, never a sliver', () => {
    // A Governor has no share because a state contains the whole ZIP. That is
    // not a reason to bury them behind a disclosure.
    expect(splitByShare([{ id: 'gov', share: null }]).collapsed).toEqual([]);
  });

  it('sorts primary by share descending with nulls last', () => {
    const pols = [{ id: 'a', share: 0.1 }, { id: 'sen', share: null }, { id: 'b', share: 0.9 }];
    expect(splitByShare(pols).primary.map((p) => p.id)).toEqual(['b', 'a', 'sen']);
  });

  it('sorts collapsed by share descending too', () => {
    const pols = [{ id: 'tiny', share: 0.0001 }, { id: 'small', share: 0.01 }];
    expect(splitByShare(pols).collapsed.map((p) => p.id)).toEqual(['small', 'tiny']);
  });

  it('handles an empty list', () => {
    expect(splitByShare([])).toEqual({ primary: [], collapsed: [] });
  });

  it('handles a non-array defensively', () => {
    expect(splitByShare(null)).toEqual({ primary: [], collapsed: [] });
    expect(splitByShare(undefined)).toEqual({ primary: [], collapsed: [] });
  });

  it('treats a missing share field as primary rather than hiding the official', () => {
    // Fail open: an official with no share data must still be visible.
    expect(splitByShare([{ id: 'x' }]).primary.map((p) => p.id)).toEqual(['x']);
  });
});

describe('ambiguityCopy', () => {
  it('names the office and count for a doubled district type', () => {
    expect(ambiguityCopy([{ district_type: 'STATE_LOWER', count: 4 }]))
      .toBe('4 state house members serve parts of this ZIP code.');
  });

  it('joins two ambiguities into one sentence', () => {
    expect(ambiguityCopy([
      { district_type: 'STATE_LOWER', count: 4 },
      { district_type: 'STATE_UPPER', count: 3 },
    ])).toBe('4 state house members and 3 state senators serve parts of this ZIP code.');
  });

  it('joins three ambiguities with commas plus a final "and"', () => {
    expect(ambiguityCopy([
      { district_type: 'STATE_LOWER', count: 4 },
      { district_type: 'STATE_UPPER', count: 3 },
      { district_type: 'SCHOOL', count: 2 },
    ])).toBe('4 state house members, 3 state senators and 2 school board members serve parts of this ZIP code.');
  });

  it('caps at three named types and says "other offices" rather than truncating silently', () => {
    // ZIP 47401's real shape, measured against prod: ambiguous across SIX types
    // at once. Naming all six is unreadable; dropping three silently would
    // understate the ambiguity, which is the one unacceptable outcome.
    expect(ambiguityCopy([
      { district_type: 'LOCAL', count: 13 },
      { district_type: 'COUNTY', count: 5 },
      { district_type: 'LOCAL_EXEC', count: 5 },
      { district_type: 'JUDICIAL', count: 2 },
      { district_type: 'STATE_LOWER', count: 2 },
      { district_type: 'STATE_UPPER', count: 2 },
    ])).toBe('13 local officials, 5 county officials, 5 local executives and other offices serve parts of this ZIP code.');
  });

  it('does not add "other offices" at exactly three types', () => {
    expect(ambiguityCopy([
      { district_type: 'LOCAL', count: 3 },
      { district_type: 'COUNTY', count: 2 },
      { district_type: 'JUDICIAL', count: 2 },
    ])).not.toContain('other offices');
  });

  it('returns an empty string when nothing is ambiguous', () => {
    expect(ambiguityCopy([])).toBe('');
  });

  it('returns an empty string for a non-array', () => {
    expect(ambiguityCopy(null)).toBe('');
    expect(ambiguityCopy(undefined)).toBe('');
  });

  it('falls back to a generic phrase for an unmapped district type', () => {
    expect(ambiguityCopy([{ district_type: 'WEIRD_TYPE', count: 2 }]))
      .toBe('2 officials serve parts of this ZIP code.');
  });
});

describe('zipHeading', () => {
  it('speaks in area voice, never claiming the officials are the visitor\'s own', () => {
    // A ZIP cannot establish which side of a district line someone lives on, so
    // "your representatives" would be false for most of a doubled office.
    expect(zipHeading('46220')).toBe('Officials serving 46220');
  });

  it('does not say "your"', () => {
    expect(zipHeading('46220').toLowerCase()).not.toContain('your');
  });
});
