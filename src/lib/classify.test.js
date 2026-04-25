/**
 * Tests for classify.js — computeVariant logic
 * Covers STATE-01 (empty), STATE-02 (administrative), STATE-03 (judicial)
 */

import { describe, it, expect } from 'vitest';
import { computeVariant } from './classify.js';

function makePol(overrides) {
  return {
    district_type: 'LOCAL',
    office_title: 'Council Member',
    ...overrides,
  };
}

describe('computeVariant — empty detection (STATE-01)', () => {
  it('returns "empty" when userAnswers is null', () => {
    expect(computeVariant(makePol({}), null)).toBe('empty');
  });
  it('returns "empty" when userAnswers is undefined', () => {
    expect(computeVariant(makePol({}), undefined)).toBe('empty');
  });
  it('returns "empty" when userAnswers has fewer than 3 items', () => {
    expect(computeVariant(makePol({}), [1, 2])).toBe('empty');
  });
  it('returns "compass" when userAnswers has exactly 3 items and role is non-admin/judicial', () => {
    expect(computeVariant(makePol({}), [1, 2, 3])).toBe('compass');
  });
  it('returns "compass" when userAnswers has 5 items and role is non-admin/judicial', () => {
    expect(computeVariant(makePol({}), [1, 2, 3, 4, 5])).toBe('compass');
  });
});

describe('computeVariant — administrative detection (STATE-02)', () => {
  const answers = [1, 2, 3];
  it.each(['clerk', 'treasurer', 'auditor', 'recorder', 'assessor'])(
    'returns "administrative" for title containing "%s"',
    (keyword) => {
      expect(
        computeVariant(makePol({ office_title: `City ${keyword}` }), answers)
      ).toBe('administrative');
    }
  );
  it('matches case-insensitively (uppercase title)', () => {
    expect(
      computeVariant(makePol({ office_title: 'COUNTY CLERK' }), answers)
    ).toBe('administrative');
  });
  it('returns "compass" for non-admin title with >= 3 answers', () => {
    expect(
      computeVariant(makePol({ office_title: 'Council Member' }), answers)
    ).toBe('compass');
  });
});

describe('computeVariant — judicial detection (STATE-03)', () => {
  const answers = [1, 2, 3];
  it('returns "judicial" for district_type === "JUDICIAL"', () => {
    expect(
      computeVariant(makePol({ district_type: 'JUDICIAL', office_title: 'Some Role' }), answers)
    ).toBe('judicial');
  });
  it.each(['judge', 'justice', 'court'])(
    'returns "judicial" for title containing "%s" (district_type LOCAL)',
    (keyword) => {
      expect(
        computeVariant(
          makePol({ district_type: 'LOCAL', office_title: `Circuit ${keyword}` }),
          answers
        )
      ).toBe('judicial');
    }
  );
});
