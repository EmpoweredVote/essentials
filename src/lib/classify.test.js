/**
 * Tests for classify.js — computeVariant logic
 * Covers STATE-01 (empty), STATE-02 (administrative), STATE-03 (judicial)
 */

import { describe, it, expect, test } from 'vitest';
import { computeVariant, classifyCategory, classifyBucket } from './classify.js';

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

describe('computeVariant — no-stances detection', () => {
  const answers = [1, 2, 3];
  it('returns "no-stances" when compass-eligible role has no stances and user has answers', () => {
    expect(computeVariant(makePol({}), answers, false)).toBe('no-stances');
  });
  it('returns "compass" when hasStances defaults to true', () => {
    expect(computeVariant(makePol({}), answers)).toBe('compass');
  });
  it('returns "no-stances" even when user has < 3 answers (avoids baiting calibration)', () => {
    expect(computeVariant(makePol({}), [1], false)).toBe('no-stances');
    expect(computeVariant(makePol({}), [], false)).toBe('no-stances');
    expect(computeVariant(makePol({}), null, false)).toBe('no-stances');
  });
  it('returns "administrative" before checking hasStances for admin role', () => {
    expect(computeVariant(makePol({ office_title: 'City Clerk' }), answers, false)).toBe('administrative');
  });
});

describe('classifyCategory — SCHEMA-02 STATE_BOARD (Phase 133 D-09)', () => {
  test('STATE_BOARD classifies into State tier with State Board of Education group', () => {
    const pol = { district_type: 'STATE_BOARD', office_title: 'State Board of Education District 5' };
    expect(classifyCategory(pol)).toEqual({ tier: 'State', group: 'State Board of Education' });
  });
});

describe('computeVariant — role checked before answer count', () => {
  it('returns "administrative" for admin title even with 0 answers', () => {
    expect(computeVariant(makePol({ office_title: 'City Clerk' }), [])).toBe('administrative');
  });
  it('returns "judicial" for JUDICIAL district_type even with 0 answers', () => {
    expect(computeVariant(makePol({ district_type: 'JUDICIAL' }), [])).toBe('judicial');
  });
  it('returns "empty" for compass-eligible role with 0 answers', () => {
    expect(computeVariant(makePol({}), [])).toBe('empty');
  });
});

describe('classifyBucket', () => {
  // Base district_type -> bucket cases (CLASS-01 / SC-01). All 15 live literals
  // from RESEARCH.md's District Type Enumeration table.
  it.each([
    ['JUDICIAL', 'judge'],
    ['NATIONAL_JUDICIAL', 'judge'],
    ['SCHOOL', 'educator'],
    ['STATE_BOARD', 'educator'],
    ['SCHOOL_BOARD', 'educator'],
    ['LOCAL', 'representative'],
    ['STATE_LOWER', 'representative'],
    ['NATIONAL_LOWER', 'representative'],
    ['STATE_UPPER', 'representative'],
    ['COUNTY', 'representative'],
    ['STATE_EXEC', 'representative'],
    ['LOCAL_EXEC', 'representative'],
    ['NATIONAL_UPPER', 'representative'],
    ['NATIONAL_EXEC', 'representative'],
    ['CITY_COUNCIL', 'representative'],
  ])('district_type %s (plain title) classifies as %s', (dt, expected) => {
    expect(classifyBucket(makePol({ district_type: dt, office_title: 'Council Member' }))).toBe(expected);
  });

  // 208-02 (reverses 207-D-02): the "Judges" tab is for adjudicators only.
  // Prosecutors and public defenders are lawyers in the justice system, not
  // judges, so they route to the 'representative' catch-all — NOT 'judge'.
  // These cases guard against the override being reintroduced or a DA leaking
  // into the judge bucket via some other path.
  describe('prosecutors / public defenders are representatives, not judges (208-02)', () => {
    const titles = [
      'District Attorney',
      'County Attorney',
      'Prosecuting Attorney',
      "State's Attorney",
      'City Prosecutor',
      'Public Defender',
    ];
    it.each(titles)('"%s" under district_type COUNTY classifies as representative', (title) => {
      expect(classifyBucket(makePol({ district_type: 'COUNTY', office_title: title }))).toBe('representative');
    });
    it.each(titles)('"%s" under district_type LOCAL_EXEC classifies as representative', (title) => {
      expect(classifyBucket(makePol({ district_type: 'LOCAL_EXEC', office_title: title }))).toBe('representative');
    });
  });

  // State-specific elected-prosecutor titles (Florida's bare "State Attorney",
  // VA/KY's "Commonwealth's Attorney") and their apostrophe variants: all are
  // prosecutors, so all classify as 'representative' after the 208-02 reversal.
  describe('state-specific prosecutor titles are representatives (208-02)', () => {
    const prosecutorTitles = [
      'State Attorney',
      "Commonwealth's Attorney",
      'State’s Attorney',        // curly apostrophe
      'States Attorney',         // missing apostrophe
      'Commonwealth’s Attorney', // curly apostrophe
      'Commonwealths Attorney',  // missing apostrophe
    ];
    it.each(prosecutorTitles)('"%s" (district_type COUNTY) classifies as representative', (title) => {
      expect(
        classifyBucket(makePol({ district_type: 'COUNTY', office_title: title }))
      ).toBe('representative');
    });
  });

  // Pitfall 3: negative attorney guards — civil-counsel titles must NOT be swept
  // into 'judge' by an over-broad /attorney/ match.
  describe('Attorney General / City Attorney negative guards (Pitfall 3)', () => {
    it('Attorney General (STATE_EXEC) classifies as representative', () => {
      expect(classifyBucket(makePol({ district_type: 'STATE_EXEC', office_title: 'Attorney General' }))).toBe(
        'representative'
      );
    });
    it('City Attorney (LOCAL_EXEC) classifies as representative', () => {
      expect(classifyBucket(makePol({ district_type: 'LOCAL_EXEC', office_title: 'City Attorney' }))).toBe(
        'representative'
      );
    });
  });

  // D-05 / Pitfall 5: school-superintendent override, positive + negative guard.
  describe('Superintendent override (D-05)', () => {
    it('"Superintendent of Public Instruction" (STATE_EXEC) classifies as educator', () => {
      expect(
        classifyBucket(makePol({ district_type: 'STATE_EXEC', office_title: 'Superintendent of Public Instruction' }))
      ).toBe('educator');
    });
    it('"State Superintendent of Schools" classifies as educator', () => {
      expect(
        classifyBucket(makePol({ district_type: 'STATE_EXEC', office_title: 'State Superintendent of Schools' }))
      ).toBe('educator');
    });
    it('"Superintendent of Police" (LOCAL_EXEC) classifies as representative', () => {
      expect(
        classifyBucket(makePol({ district_type: 'LOCAL_EXEC', office_title: 'Superintendent of Police' }))
      ).toBe('representative');
    });
    it('"Superintendent of Public Works" (LOCAL_EXEC) classifies as representative', () => {
      expect(
        classifyBucket(makePol({ district_type: 'LOCAL_EXEC', office_title: 'Superintendent of Public Works' }))
      ).toBe('representative');
    });
  });

  // D-04 (live Portland-ME case): a LOCAL-mistyped school board is rescued into
  // 'educator' via title OR chamber text match.
  describe('LOCAL-mistyped school board (D-04, Portland-ME)', () => {
    it('district_type LOCAL with office_title containing "School Board Member" classifies as educator', () => {
      expect(
        classifyBucket(makePol({ district_type: 'LOCAL', office_title: 'School Board Member' }))
      ).toBe('educator');
    });
    it('district_type LOCAL with chamber_name "Board of Education" classifies as educator', () => {
      expect(
        classifyBucket(
          makePol({ district_type: 'LOCAL', office_title: 'Member', chamber_name: 'Board of Education' })
        )
      ).toBe('educator');
    });
  });

  // WR-03: the school-board chamber/title text fallback is intentionally
  // dt-independent (mirrors D-02's DA override precedent), not scoped to
  // district_type === 'LOCAL' as the pre-fix comment implied. Any row still
  // in the base 'representative' bucket is eligible.
  describe('School-board text fallback is dt-independent (WR-03)', () => {
    it('district_type STATE_EXEC with office_title containing "Board of Education" classifies as educator', () => {
      expect(
        classifyBucket(
          makePol({ district_type: 'STATE_EXEC', office_title: 'Liaison, State Board of Education' })
        )
      ).toBe('educator');
    });
    it('district_type COUNTY with chamber_name "School Board" classifies as educator', () => {
      expect(
        classifyBucket(
          makePol({ district_type: 'COUNTY', office_title: 'Member', chamber_name: 'County School Board' })
        )
      ).toBe('educator');
    });
  });

  // D-03: title-detected judge/justice fallback fires when district_type is
  // missing or mistyped — proves the fallback actually fires, not just D-08.
  describe('Title-detected judge/justice fallback (D-03)', () => {
    it('district_type "" with office_title "Circuit Judge" classifies as judge', () => {
      expect(classifyBucket(makePol({ district_type: '', office_title: 'Circuit Judge' }))).toBe('judge');
    });
    it('unmapped district_type "FOO" with office_title containing "Justice" classifies as judge', () => {
      expect(classifyBucket(makePol({ district_type: 'FOO', office_title: 'Chief Justice' }))).toBe('judge');
    });
  });

  // D-08: additive-only invariant — a stray keyword must never pull a cleanly-typed
  // row OUT of its base bucket.
  describe('Additive-only invariant (D-08)', () => {
    it('district_type SCHOOL with office_title containing "Judge" stays educator', () => {
      expect(classifyBucket(makePol({ district_type: 'SCHOOL', office_title: 'Board Judge' }))).toBe('educator');
    });
    it('district_type JUDICIAL with office_title containing "School" stays judge', () => {
      expect(classifyBucket(makePol({ district_type: 'JUDICIAL', office_title: 'School Court Judge' }))).toBe(
        'judge'
      );
    });
  });

  // D-09 / T-207-01: null-safety — classifyBucket must never throw and must
  // fall back to 'representative' on malformed/missing rows.
  describe('Null-safety (D-09 / T-207-01)', () => {
    it('classifyBucket(null) returns representative without throwing', () => {
      expect(() => classifyBucket(null)).not.toThrow();
      expect(classifyBucket(null)).toBe('representative');
    });
    it('classifyBucket({}) returns representative without throwing', () => {
      expect(() => classifyBucket({})).not.toThrow();
      expect(classifyBucket({})).toBe('representative');
    });
    it('classifyBucket({ district_type: null }) returns representative without throwing', () => {
      expect(() => classifyBucket({ district_type: null })).not.toThrow();
      expect(classifyBucket({ district_type: null })).toBe('representative');
    });
  });
});

describe('classifyBucket — live location fixtures (SC-05)', () => {
  // LA (Los Angeles, CA) — exercises SCHOOL base bucket (LAUSD), the D-02
  // county DA override, and confirms ordinary reps stay in Representatives.
  // Does NOT exercise district_type === 'JUDICIAL' (CA has none seeded) —
  // see Bloomington/Monroe County IN below for that (Pitfall 4).
  describe('LA (Los Angeles, CA)', () => {
    it('LAUSD board member (district_type SCHOOL) classifies as educator', () => {
      expect(
        classifyBucket(
          makePol({ district_type: 'SCHOOL', office_title: 'Board Member, District 4', chamber_name: 'Los Angeles Unified School District' })
        )
      ).toBe('educator');
    });
    it('LA County District Attorney Nathan Hochman (district_type COUNTY) classifies as representative (208-02)', () => {
      expect(
        classifyBucket(makePol({ district_type: 'COUNTY', office_title: 'District Attorney' }))
      ).toBe('representative');
    });
    it.each([
      ['Mayor', 'LOCAL_EXEC'],
      ['City Council Member', 'LOCAL'],
      ['State Senator', 'STATE_UPPER'],
      ['U.S. Representative', 'NATIONAL_LOWER'],
    ])('LA %s (district_type %s) classifies as representative', (title, dt) => {
      expect(classifyBucket(makePol({ district_type: dt, office_title: title }))).toBe('representative');
    });
  });

  // Bloomington / Monroe County, Indiana — the true JUDICIAL base-case
  // location LA cannot exercise (Pitfall 4).
  describe('Bloomington / Monroe County, Indiana', () => {
    it('Monroe Circuit Court judge (district_type JUDICIAL) classifies as judge', () => {
      expect(
        classifyBucket(
          makePol({ district_type: 'JUDICIAL', office_title: 'Judge', chamber_name: 'Monroe Circuit Court' })
        )
      ).toBe('judge');
    });
    it('Monroe County Community School Corporation board member (district_type SCHOOL) classifies as educator', () => {
      expect(
        classifyBucket(
          makePol({ district_type: 'SCHOOL', office_title: 'Board Member', chamber_name: 'Monroe County Community School Corporation' })
        )
      ).toBe('educator');
    });
  });

  // A representatives-only AZ city (Marana / Oro Valley / Sahuarita) — AZ has
  // zero SCHOOL/JUDICIAL/SCHOOL_BOARD/STATE_BOARD rows statewide. State/local
  // rows must stay representative, and the 9 nationwide SCOTUS rows every US
  // address receives must still land in judge (true-positive check).
  describe('AZ city (reps-only statewide, plus nationwide SCOTUS)', () => {
    it.each([
      ['Mayor', 'LOCAL_EXEC'],
      ['Council Member', 'LOCAL'],
      ['State Representative', 'STATE_LOWER'],
    ])('AZ %s (district_type %s) classifies as representative', (title, dt) => {
      expect(classifyBucket(makePol({ district_type: dt, office_title: title }))).toBe('representative');
    });
    it('nationwide SCOTUS justice (district_type NATIONAL_JUDICIAL) classifies as judge', () => {
      expect(
        classifyBucket(
          makePol({ district_type: 'NATIONAL_JUDICIAL', office_title: 'Associate Justice', chamber_name: 'Supreme Court of the United States' })
        )
      ).toBe('judge');
    });
  });

  // Live-data-correction guards (RESEARCH.md Common Pitfalls #1/#2).
  describe('Live-data-correction guards', () => {
    it('DC State Board of Education member (district_type SCHOOL_BOARD) classifies as educator', () => {
      expect(
        classifyBucket(makePol({ district_type: 'SCHOOL_BOARD', office_title: 'SBOE Member (Ward 4)' }))
      ).toBe('educator');
    });
    it('SF District Attorney Brooke Jenkins (district_type LOCAL_EXEC) classifies as representative (208-02)', () => {
      expect(
        classifyBucket(makePol({ district_type: 'LOCAL_EXEC', office_title: 'District Attorney' }))
      ).toBe('representative');
    });
  });
});
