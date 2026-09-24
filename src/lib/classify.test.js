/**
 * Tests for classify.js — computeVariant logic
 * Covers STATE-01 (empty), STATE-02 (administrative), STATE-03 (judicial)
 */

import { describe, it, expect, test } from 'vitest';
import {
  computeVariant,
  classifyCategory,
  classifyBucket,
  TAB_TYPE_DEFAULTS,
  resolveIsAppointed,
  matchesAppointedFilter,
  partitionByTab,
  applyTabTypeDefault,
} from './classify.js';
import { groupIntoHierarchy } from './groupHierarchy.js';

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

// Phase 215 (HDR-01/HDR-02, decision D-05): per-tab type-filter default policy
// and the two pure filter functions moved verbatim out of Results.jsx so the
// Judges=Appointed exception is proven by an automated assertion, not just
// code inspection.
describe('TAB_TYPE_DEFAULTS + appointed-filter logic', () => {
  it('TAB_TYPE_DEFAULTS.representatives is "Elected"', () => {
    expect(TAB_TYPE_DEFAULTS.representatives).toBe('Elected');
  });
  it('TAB_TYPE_DEFAULTS.educators is "Elected"', () => {
    expect(TAB_TYPE_DEFAULTS.educators).toBe('Elected');
  });
  it('TAB_TYPE_DEFAULTS.judges is "Elected" (elected judges + retention-vote judges; appointed judges left out)', () => {
    expect(TAB_TYPE_DEFAULTS.judges).toBe('Elected');
  });

  describe('resolveIsAppointed', () => {
    it('returns true when pol.is_appointed is true (individual override wins)', () => {
      expect(resolveIsAppointed({ is_appointed: true })).toBe(true);
    });
    it('returns false when pol.is_elected is true', () => {
      expect(resolveIsAppointed({ is_elected: true })).toBe(false);
    });
    it('returns true when pol.is_elected is false', () => {
      expect(resolveIsAppointed({ is_elected: false })).toBe(true);
    });
  });

  describe('matchesAppointedFilter', () => {
    it('Elected filter matches an elected pol', () => {
      expect(matchesAppointedFilter({ is_elected: true }, 'Elected')).toBe(true);
    });
    it('Elected filter excludes an appointed pol', () => {
      expect(matchesAppointedFilter({ is_elected: false }, 'Elected')).toBe(false);
    });
    it('Elected filter includes a retention-vote judge (appointed but faces_retention_vote)', () => {
      expect(
        matchesAppointedFilter({ is_elected: false, faces_retention_vote: true }, 'Elected')
      ).toBe(true);
    });
    it('Appointed filter matches an appointed judge', () => {
      expect(matchesAppointedFilter({ is_elected: false }, 'Appointed')).toBe(true);
    });
    it('Appointed filter excludes an elected pol', () => {
      expect(matchesAppointedFilter({ is_elected: true }, 'Appointed')).toBe(false);
    });
    it('"All" filter matches regardless of appointed/elected status', () => {
      expect(matchesAppointedFilter({ is_elected: true }, 'All')).toBe(true);
      expect(matchesAppointedFilter({ is_elected: false }, 'All')).toBe(true);
    });
  });
});

// County Judge (TX / AR) and County Judge/Executive (KY) lead the county's
// governing body (Commissioners / Quorum / Fiscal Court). They are county
// executives, not adjudicators, so they route to Representatives.
describe('County Judge — county executive, not a court judge', () => {
  const countyJudge = makePol({
    district_type: 'COUNTY',
    office_title: 'County Judge',
    chamber_name: 'Commissioners Court',
  });

  it('classifyBucket routes a COUNTY "County Judge" to representative', () => {
    expect(classifyBucket(countyJudge)).toBe('representative');
  });
  it('classifyBucket routes a Kentucky "County Judge/Executive" to representative', () => {
    expect(
      classifyBucket(makePol({ district_type: 'COUNTY', office_title: 'County Judge/Executive' }))
    ).toBe('representative');
  });
  it('a JUDICIAL "County Judge" stays judge (district_type is decided first)', () => {
    expect(classifyBucket(makePol({ district_type: 'JUDICIAL', office_title: 'County Judge' }))).toBe('judge');
  });
  it('a COUNTY court title such as "Judge, County Court at Law No. 1" stays judge', () => {
    expect(
      classifyBucket(makePol({ district_type: 'COUNTY', office_title: 'Judge, County Court at Law No. 1' }))
    ).toBe('judge');
  });
  it('classifyCategory groups a COUNTY "County Judge" under County Executives', () => {
    expect(classifyCategory(countyJudge)).toEqual({ tier: 'Local', group: 'County Executives' });
  });
  it('computeVariant does not give a COUNTY "County Judge" the judicial plate', () => {
    expect(computeVariant(countyJudge, [1, 2, 3])).toBe('compass');
  });
});

// Court clerks sit in JUDICIAL districts but are court staff, not
// adjudicators (operator decision 2026-09-24), so they route to Representatives.
describe('court clerk — court staff, not a judge', () => {
  it('a JUDICIAL "Circuit Court Clerk" routes to representative', () => {
    expect(classifyBucket(makePol({ district_type: 'JUDICIAL', office_title: 'Circuit Court Clerk' }))).toBe(
      'representative'
    );
  });
  it('a JUDICIAL "Clerk of the Superior Court" routes to representative', () => {
    expect(
      classifyBucket(makePol({ district_type: 'JUDICIAL', office_title: 'Clerk of the Superior Court' }))
    ).toBe('representative');
  });
  it('a JUDICIAL judge title still routes to judge', () => {
    expect(
      classifyBucket(makePol({ district_type: 'JUDICIAL', office_title: 'Circuit Court Judge, Branch 1' }))
    ).toBe('judge');
  });
});

// Full tab pipeline, as Results.jsx runs it: partitionByTab -> groupIntoHierarchy
// -> applyTabTypeDefault. Results.jsx shows the Educators/Judges tab only when
// this returns at least one official. Fixtures copy live rows measured
// 2026-09-23/24. Operator decision 2026-09-24: the Judges tab shows elected
// judges (and appointed judges who face a retention vote) and leaves appointed
// judges out; no judge shows on Representatives.
describe('tab pipeline — who each tab shows', () => {
  let seq = 0;
  function row(overrides) {
    seq += 1;
    return {
      id: `pol-${seq}`,
      first_name: 'Test',
      full_name: `Test ${overrides.last_name}`,
      is_elected: true,
      is_appointed: false,
      faces_retention_vote: false,
      ...overrides,
    };
  }
  const justice = (last_name) =>
    row({
      last_name,
      district_type: 'NATIONAL_JUDICIAL',
      office_title: 'Associate Justice',
      chamber_name: 'Supreme Court',
      government_name: 'United States',
      is_elected: false,
      is_appointed: true,
    });
  const cabinetSecretary = row({
    last_name: 'Rubio',
    district_type: 'NATIONAL_EXEC',
    office_title: 'Secretary of State',
    government_name: 'United States',
    is_elected: false,
  });
  const circuitJudge = row({
    last_name: 'Boyle',
    district_type: 'JUDICIAL',
    office_title: 'Circuit Court Judge, Branch 10',
    chamber_name: 'Racine County Circuit Court',
    government_name: 'Racine County, Wisconsin, US',
  });

  function visible(pols, tab) {
    const bucket = { representatives: 'representative', educators: 'educator', judges: 'judge' }[tab];
    const hier = applyTabTypeDefault(groupIntoHierarchy(partitionByTab(pols)[bucket]), tab);
    return hier.flatMap((t) => t.bodies.flatMap((b) => b.subgroups.flatMap((sg) => sg.pols.map((p) => p.last_name))));
  }

  describe('partitionByTab', () => {
    it('folds federal-only judges into representative and leaves judge empty', () => {
      const buckets = partitionByTab([justice('Kagan'), cabinetSecretary]);
      expect(buckets.judge).toEqual([]);
      expect(buckets.representative.map((p) => p.last_name)).toEqual(['Rubio', 'Kagan']);
    });
    it('keeps federal judges on the judge bucket when a state/local judge exists', () => {
      const buckets = partitionByTab([justice('Kagan'), circuitJudge]);
      expect(buckets.judge.map((p) => p.last_name)).toEqual(['Kagan', 'Boyle']);
      expect(buckets.representative).toEqual([]);
    });
  });

  it('Racine County WI: elected Circuit Court judges show on Judges; appointed SCOTUS does not', () => {
    expect(visible([circuitJudge, justice('Kagan')], 'judges')).toEqual(['Boyle']);
  });

  it('an appointed judge who faces a retention vote shows on Judges', () => {
    const appeals = row({
      last_name: 'AppealsJudge',
      district_type: 'JUDICIAL',
      office_title: 'Indiana Appeals Court Judge - District 1',
      chamber_name: 'Indiana Appeals Court Judge - District 1',
      government_name: 'State of Indiana',
      is_elected: false,
      faces_retention_vote: true,
    });
    expect(visible([appeals, circuitJudge], 'judges')).toEqual(expect.arrayContaining(['AppealsJudge', 'Boyle']));
  });

  it('only appointed judges (no retention vote): no judge shows on any tab, so the Judges tab is hidden', () => {
    const appointed = row({
      last_name: 'SuperiorJudge',
      district_type: 'JUDICIAL',
      office_title: 'Judge, Los Angeles County Superior Court',
      chamber_name: 'Superior Court',
      government_name: 'Los Angeles County, California, US',
      is_elected: false,
    });
    const pols = [appointed, justice('Kagan')];
    expect(visible(pols, 'judges')).toEqual([]);
    expect(visible(pols, 'representatives')).toEqual([]);
  });

  it('King County WA: SCOTUS shows nowhere, and no judge lands on Representatives', () => {
    const councilMember = row({
      last_name: 'Balducci',
      district_type: 'COUNTY',
      office_title: 'Council Member, District 6',
      chamber_name: 'County Council',
      government_name: 'King County, Washington, US',
    });
    const pols = [councilMember, justice('Kagan'), justice('Roberts')];
    expect(visible(pols, 'representatives')).toEqual(['Balducci']);
    expect(visible(pols, 'judges')).toEqual([]);
  });

  it('Travis County TX: the elected County Judge shows on Representatives', () => {
    const countyJudge = row({
      last_name: 'Brown',
      district_type: 'COUNTY',
      office_title: 'County Judge',
      chamber_name: 'Commissioners Court',
      chamber_name_formal: 'Travis County Commissioners Court',
      government_name: 'Travis County, Texas, US',
    });
    const pols = [countyJudge, justice('Kagan')];
    expect(partitionByTab(pols).judge).toEqual([]);
    expect(visible(pols, 'representatives')).toEqual(['Brown']);
  });

  it('Monroe County IN: the elected Circuit Court Clerk shows on Representatives, not Judges', () => {
    const monroe = {
      district_type: 'JUDICIAL',
      chamber_name_formal: 'Monroe County Circuit Court',
      government_name: 'Monroe County, Indiana, US',
    };
    const clerk = row({ ...monroe, last_name: 'Clerk', office_title: 'Circuit Court Clerk' });
    const judge = row({
      ...monroe,
      last_name: 'CircuitJudge',
      office_title: 'Indiana Circuit Court Judge - 10th Circuit, Division 1',
    });
    expect(visible([clerk, judge], 'judges')).toEqual(['CircuitJudge']);
    expect(visible([clerk, judge], 'representatives')).toEqual(['Clerk']);
  });

  // Operator decision 2026-09-23: Representatives keeps its Elected default, so
  // appointed non-judge officials stay hidden (Phase 215 D-06 trade-off kept).
  it('appointed non-judges stay hidden on Representatives (Cabinet, appointed sheriff)', () => {
    const sheriff = row({
      last_name: 'Cole-Tindall',
      district_type: 'COUNTY',
      office_title: 'Sheriff',
      chamber_name: 'Sheriff',
      government_name: 'King County, Washington, US',
      is_elected: false,
      is_appointed: true,
    });
    const names = visible([sheriff, cabinetSecretary], 'representatives');
    expect(names).not.toContain('Cole-Tindall');
    expect(names).not.toContain('Rubio');
  });
});
