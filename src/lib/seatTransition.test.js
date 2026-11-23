/**
 * Unit tests for seatTransition.js — pure logic only (no jsdom, no React render).
 *
 * Mirrors the pattern in src/components/SectionBanner.test.js and
 * src/lib/groupHierarchy.test.js: import from vitest, assert on exported functions.
 *
 * The copy strings here are the spec's, verbatim. They were chosen by the operator and a
 * paraphrase is a product change, so they are asserted exactly rather than by shape.
 */

import { describe, it, expect } from 'vitest';
import {
  CASES,
  formatElectionDay,
  formatTermStart,
  buildSeatTransition,
  buildGroupTransition,
  buildTransitionModel,
  arrivingNote,
} from './seatTransition.js';

describe('date formatting', () => {
  it('formats an election day without a year and a term start with one', () => {
    expect(formatElectionDay('2026-11-03')).toBe('November 3');
    expect(formatTermStart('2026-12-14')).toBe('December 14, 2026');
  });

  // Review Focus 4: 23 offices carry an older general, back to 2026-05-02. The card must name
  // the month the election was actually held in.
  it('names the month the election was actually held in', () => {
    expect(formatElectionDay('2026-05-02')).toBe('May 2');
  });

  // 🔴 A LOCAL-TIMEZONE PARSE MOVES THE DAY. new Date('2026-11-03') is UTC midnight, which is
  // November 2 at 4pm for anyone in California — and this site's readers are mostly there.
  it('does not shift the day for a reader west of UTC', () => {
    expect(formatElectionDay('2026-01-01')).toBe('January 1');
    expect(formatTermStart('2027-01-03')).toBe('January 3, 2027');
  });
});

describe('buildSeatTransition — a dated term', () => {
  it('an incoming person who is not the current holder is a dated handover', () => {
    const t = buildSeatTransition({
      id: 'a',
      incoming_holder_id: 'b',
      incoming_holder_name: 'Nithya Raman',
      incoming_on: '2026-12-14',
    });
    expect(t.case).toBe(CASES.DATED_HANDOVER);
    expect(t.lines).toEqual(['Takes office December 14, 2026']);
    expect(t.people).toEqual([{ id: 'b', name: 'Nithya Raman' }]);
  });

  // 🔴 An arrow from someone to themselves reads as a bug. 451 of the 638 dated seats are this.
  it('an incoming person who IS the current holder is a re-election, with no second person', () => {
    const t = buildSeatTransition({
      id: 'a',
      incoming_holder_id: 'a',
      incoming_holder_name: 'Jane Doe',
      incoming_on: '2027-01-03',
    });
    expect(t.case).toBe(CASES.DATED_REELECTION);
    expect(t.people).toEqual([]);
    expect(t.lines).toEqual(['Re-elected — next term begins January 3, 2027']);
  });

  it('a dated term wins over a result, because it is the stronger fact', () => {
    const t = buildSeatTransition({
      id: 'a',
      incoming_holder_id: 'b',
      incoming_holder_name: 'Nithya Raman',
      incoming_on: '2026-12-14',
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 1,
        winners: [{ id: 'c', name: 'Somebody Else' }],
      },
      seat_group: { group_id: 'g', offices: 1, winners: 1, seated: 1 },
    });
    expect(t.case).toBe(CASES.DATED_HANDOVER);
  });
});

describe('buildSeatTransition — a result only', () => {
  const single = { group_id: 'g', offices: 1, winners: 1, seated: 1 };

  it('a called single-seat result hedges, and a certified one does not', () => {
    const base = {
      id: 'a',
      seat_group: single,
      pending_winner: {
        election_date: '2026-11-03',
        seats: 1,
        winners: [{ id: 'b', name: 'Sam Rivera' }],
      },
    };
    expect(
      buildSeatTransition({
        ...base,
        pending_winner: { ...base.pending_winner, certainty: 'certified' },
      }).lines
    ).toEqual(['Won the November 3 election:', 'Sam Rivera']);

    expect(
      buildSeatTransition({
        ...base,
        pending_winner: { ...base.pending_winner, certainty: 'called' },
      }).lines
    ).toEqual(['Declared winner, November 3:', 'Sam Rivera', 'Count not yet certified']);
  });

  // 914 of 1,419 result-only seats are this. It must not read "Jane Doe ... winner: Jane Doe".
  it('a single-seat result won by the sitting holder is a re-election', () => {
    const t = buildSeatTransition({
      id: 'a',
      seat_group: single,
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 1,
        winners: [{ id: 'a', name: 'Jane Doe' }],
      },
    });
    expect(t.case).toBe(CASES.RESULT_REELECTION);
    expect(t.people).toEqual([]);
    expect(t.lines).toEqual([
      'Declared re-elected November 3 — date of the new term not yet confirmed',
    ]);
  });

  it('a certified re-election drops the hedge', () => {
    const t = buildSeatTransition({
      id: 'a',
      seat_group: single,
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'certified',
        seats: 1,
        winners: [{ id: 'a', name: 'Jane Doe' }],
      },
    });
    expect(t.lines).toEqual([
      'Re-elected November 3 — date of the new term not yet confirmed',
    ]);
  });

  // Review Focus 2: a vacant seat has no current person at all.
  it('a vacant seat with a pending winner names the winner and claims no current holder', () => {
    const t = buildSeatTransition({
      id: null,
      seat_status: 'vacant',
      seat_group: { group_id: 'g', offices: 1, winners: 1, seated: 0 },
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 1,
        winners: [{ id: 'b', name: 'Sam Rivera' }],
      },
    });
    expect(t.case).toBe(CASES.RESULT_HANDOVER);
    expect(t.people).toEqual([{ id: 'b', name: 'Sam Rivera' }]);
  });

  // Review Focus 3: 237 winner rows have no politician record.
  it('keeps a winner with no record, with a null id', () => {
    const t = buildSeatTransition({
      id: 'a',
      seat_group: single,
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 1,
        winners: [{ id: null, name: 'Greg Wims' }],
      },
    });
    expect(t.people).toEqual([{ id: null, name: 'Greg Wims' }]);
  });

  // 🔴 A null id must never be mistaken for the viewer's own row. The re-election test is
  // "the winner IS the sitting person", and null === null would make every unidentified winner
  // in a vacant seat look like a re-election of nobody.
  it('does not treat a null winner id as matching a null row id', () => {
    const t = buildSeatTransition({
      id: null,
      seat_status: 'vacant',
      seat_group: { group_id: 'g', offices: 1, winners: 1, seated: 0 },
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 1,
        winners: [{ id: null, name: 'Greg Wims' }],
      },
    });
    expect(t.case).toBe(CASES.RESULT_HANDOVER);
  });

  it('returns NONE for a seat with neither a term nor a result', () => {
    expect(buildSeatTransition({ id: 'a' }).case).toBe(CASES.NONE);
    expect(buildSeatTransition({ id: 'a' }).lines).toEqual([]);
  });
});

describe('a multi-seat body whose mapping we DO know', () => {
  // 🔴 FOUND IN REVIEW. Spec §4's anti-goal says the group treatment exists BECAUSE "we know the
  // group and not the mapping". 46 multi-seat groups — 92 offices — carry one race per office
  // with exactly one winner each, so the mapping is fully known and the group display throws it
  // away. Washington's 1st legislative district is the live shape: two offices, one chamber, one
  // district, each with its own race.
  //
  // Keyed on THIS office's winner count, not on how many seats the body has. A single winner on
  // this office's own race is an unambiguous statement about THIS seat.
  const waPosition1 = {
    id: 'duerr',
    seat_group: { group_id: 'wa-ld1', offices: 2, winners: 2, seated: 2 },
    pending_winner: {
      election_date: '2026-11-03',
      certainty: 'called',
      seats: 1,
      winners: [{ id: 'duerr', name: 'Davina Duerr' }],
    },
  };

  it('is a per-seat re-election, never a group', () => {
    const t = buildSeatTransition(waPosition1);
    expect(t.case).toBe(CASES.RESULT_REELECTION);
    expect(t.lines).toEqual([
      'Declared re-elected November 3 — date of the new term not yet confirmed',
    ]);
  });

  it('states a per-seat handover precisely, instead of burying it in a body list', () => {
    // Spokane Position 2: Timm Ormsby is succeeded by Luc Jasmin III. The group card used to
    // list that name beside a re-election and claim nothing about which seat it belonged to.
    const t = buildSeatTransition({
      id: 'ormsby',
      seat_group: { group_id: 'wa-ld3', offices: 2, winners: 2, seated: 2 },
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 1,
        winners: [{ id: 'jasmin', name: 'Luc Jasmin III' }],
      },
    });
    expect(t.case).toBe(CASES.RESULT_HANDOVER);
    expect(t.people).toEqual([{ id: 'jasmin', name: 'Luc Jasmin III' }]);
  });

  it('still uses the group when several winners DO attach to one office row', () => {
    // Maryland District 13: three delegates, one race, three winners on a single office.
    const t = buildSeatTransition({
      id: 'a',
      seat_group: { group_id: 'md13', offices: 3, winners: 3, seated: 3 },
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 3,
        winners: [
          { id: 'x', name: 'Moreno' },
          { id: 'y', name: 'Guzzone' },
          { id: 'z', name: 'Brooks' },
        ],
      },
    });
    expect(t.case).toBe(CASES.NONE); // deferred to buildGroupTransition, which can see siblings
  });
});

describe('buildGroupTransition — a multi-seat body', () => {
  it('draws the group arrow only when offices, winners and seated all agree', () => {
    const rows = [
      {
        id: 'a',
        seat_group: { group_id: 'g', offices: 3, winners: 3, seated: 3 },
        pending_winner: {
          election_date: '2026-11-03',
          certainty: 'certified',
          seats: 3,
          winners: [
            { id: 'x', name: 'Moreno' },
            { id: 'y', name: 'Guzzone' },
            { id: 'z', name: 'Brooks' },
          ],
        },
      },
      { id: 'b', seat_group: { group_id: 'g', offices: 3, winners: 3, seated: 3 }, pending_winner: null },
      { id: 'c', seat_group: { group_id: 'g', offices: 3, winners: 3, seated: 3 }, pending_winner: null },
    ];
    const t = buildGroupTransition(rows);
    expect(t.case).toBe(CASES.RESULT_GROUP);
    expect(t.people).toHaveLength(3);
    expect(t.lines).toEqual(['Won the November 3 election']);
  });

  it('hedges the group line while the count is called', () => {
    const rows = [
      {
        id: 'a',
        seat_group: { group_id: 'g', offices: 2, winners: 2, seated: 2 },
        pending_winner: {
          election_date: '2026-11-03',
          certainty: 'called',
          seats: 2,
          winners: [
            { id: 'x', name: 'A One' },
            { id: 'y', name: 'B Two' },
          ],
        },
      },
      { id: 'b', seat_group: { group_id: 'g', offices: 2, winners: 2, seated: 2 }, pending_winner: null },
    ];
    expect(buildGroupTransition(rows).lines).toEqual([
      'Declared winners, November 3 — count not yet certified',
    ]);
  });

  // 🔴 A staggered body: five members, three seats up. An arrow would imply the body is shrinking.
  it('falls back to the body-level line when the counts disagree', () => {
    const rows = [
      {
        id: 'a',
        seat_group: { group_id: 'g', offices: 5, winners: 3, seated: 5 },
        pending_winner: {
          election_date: '2026-11-03',
          certainty: 'certified',
          seats: 3,
          winners: [
            { id: 'x', name: 'Greg Wims' },
            { id: 'y', name: 'Lesley J. Lopez' },
            { id: null, name: 'A Third' },
          ],
        },
      },
    ];
    const t = buildGroupTransition(rows);
    expect(t.case).toBe(CASES.RESULT_PARTIAL);
    expect(t.lines[0]).toBe('3 seats elected November 3:');
  });

  // 🔴 FOUND IN THE PRODUCTION RENDER. Fort Worth City Council District 3 has 11 offices and
  // ONE recorded winner, and the card read "1 seats elected May 2". The incomplete-group case is
  // precisely where a body has FEWER winners than seats, so a single winner is routine here, not
  // an edge case.
  it('says "1 seat" and not "1 seats"', () => {
    const rows = [
      {
        id: 'a',
        seat_group: { group_id: 'g', offices: 11, winners: 1, seated: 11 },
        pending_winner: {
          election_date: '2026-05-02',
          certainty: 'certified',
          seats: 1,
          winners: [{ id: 'x', name: 'Chris Jamieson' }],
        },
      },
    ];
    expect(buildGroupTransition(rows).lines[0]).toBe('1 seat elected May 2:');
  });

  // Review Focus 5: a data defect must degrade, not throw.
  it('refuses the arrow and does not throw when winners exceed offices', () => {
    const rows = [
      {
        id: 'a',
        seat_group: { group_id: 'g', offices: 2, winners: 3, seated: 2 },
        pending_winner: {
          election_date: '2026-11-03',
          certainty: 'called',
          seats: 2,
          winners: [
            { id: 'x', name: 'A' },
            { id: 'y', name: 'B' },
            { id: 'z', name: 'C' },
          ],
        },
      },
    ];
    expect(buildGroupTransition(rows).case).toBe(CASES.RESULT_PARTIAL);
  });

  // 🔴 THE SIBLING SEATS ARE THE WHOLE POINT. Measured live at Maryland District 19: only 1 of
  // the 3 office rows carries pending_winner, because a multi-seat race attaches all its winners
  // to ONE office. A group built only from rows that carry a result would lose the other two.
  it('unions the winners across sibling rows, where only one carries the result', () => {
    const g = { group_id: 'g', offices: 3, winners: 3, seated: 3 };
    const rows = [
      { id: 'a', seat_group: g, pending_winner: null },
      {
        id: 'b',
        seat_group: g,
        pending_winner: {
          election_date: '2026-11-03',
          certainty: 'called',
          seats: 3,
          winners: [
            { id: 'x', name: 'Charlotte Crutchfield' },
            { id: null, name: 'Christa Tichy' },
            { id: null, name: 'Vaughn Stewart' },
          ],
        },
      },
      { id: 'c', seat_group: g, pending_winner: null },
    ];
    const t = buildGroupTransition(rows);
    expect(t.case).toBe(CASES.RESULT_GROUP);
    expect(t.people.map((p) => p.name)).toEqual([
      'Charlotte Crutchfield',
      'Christa Tichy',
      'Vaughn Stewart',
    ]);
  });

  it('returns NONE for a group with no result anywhere in it', () => {
    const g = { group_id: 'g', offices: 3, winners: 0, seated: 3 };
    const rows = [
      { id: 'a', seat_group: g, pending_winner: null },
      { id: 'b', seat_group: g, pending_winner: null },
    ];
    expect(buildGroupTransition(rows).case).toBe(CASES.NONE);
  });

  it('returns NONE for an empty row list rather than throwing', () => {
    expect(buildGroupTransition([]).case).toBe(CASES.NONE);
  });
});

describe('buildTransitionModel — choosing per-seat or per-body, from the whole response', () => {
  // 🔴 FOUND IN REVIEW. This was previously an untested helper inside a 2,300-line page
  // component, and it assembled the body from `sg.pols` — the SUBGROUP being rendered — while
  // the group key is (district_id, chamber_id). getSubGroupKey splits one body by role, so a
  // Mayor sits alone in the EXEC subgroup while their council sits in MEMBER. The Mayor's
  // "body" was therefore one row, and a re-elected Texas mayor got
  // "1 seat elected November 3: <their own name>" — the self-pointing card §7.2(b-ii) exists to
  // remove, with a body count that was wrong as well. Measured: four such mayors, three of them
  // re-elected.
  const md13 = (officeId, pendingWinners) => ({
    id: officeId,
    office_id: officeId,
    seat_group: { group_id: 'md13', offices: 3, winners: 3, seated: 3 },
    pending_winner: pendingWinners
      ? {
          election_date: '2026-11-03',
          certainty: 'called',
          seats: 3,
          winners: pendingWinners,
        }
      : null,
  });

  const threeWinners = [
    { id: 'x', name: 'Moreno' },
    { id: 'y', name: 'Guzzone' },
    { id: 'z', name: 'Brooks' },
  ];

  it('draws the body block once, on the first sibling by office_id', () => {
    const rows = [md13('b-office', threeWinners), md13('a-office', null), md13('c-office', null)];
    const drawn = rows.filter((r) => buildTransitionModel(r, rows).case !== CASES.NONE);
    expect(drawn).toHaveLength(1);
    expect(drawn[0].office_id).toBe('a-office');
    expect(buildTransitionModel(drawn[0], rows).case).toBe(CASES.RESULT_GROUP);
  });

  // 🔴 THE REGRESSION THIS FUNCTION EXISTS TO PREVENT. Given only the rows that happen to share
  // a subgroup, a lone row of a larger body must NOT be described as that whole body.
  it('says nothing for a lone row of a body whose siblings were not passed in', () => {
    const lone = md13('a-office', threeWinners);
    expect(buildTransitionModel(lone, [lone]).case).toBe(CASES.RESULT_GROUP);
    // ...but the counts must come from seat_group, never from how many rows were handed over.
    expect(buildTransitionModel(lone, [lone]).lines[0]).toBe(
      'Declared winners, November 3 — count not yet certified'
    );
  });

  it('a re-elected mayor alone in their subgroup is a per-seat re-election, not a body', () => {
    const mayor = {
      id: 'mayor',
      office_id: 'mayor-office',
      // The LOCAL body has 7 offices; the mayor is rendered in a subgroup of one.
      seat_group: { group_id: 'tx-city', offices: 7, winners: 3, seated: 7 },
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 1,
        winners: [{ id: 'mayor', name: 'Jane Mayor' }],
      },
    };
    const t = buildTransitionModel(mayor, [mayor]);
    expect(t.case).toBe(CASES.RESULT_REELECTION);
    expect(t.lines).toEqual([
      'Declared re-elected November 3 — date of the new term not yet confirmed',
    ]);
  });

  it('a dated term still wins, even inside a multi-seat body', () => {
    const rows = [
      {
        id: 'p',
        office_id: 'a-office',
        incoming_holder_id: 'q',
        incoming_holder_name: 'Successor',
        incoming_on: '2027-01-03',
        seat_group: { group_id: 'md13', offices: 3, winners: 2, seated: 3 },
      },
      md13('b-office', [{ id: 'x', name: 'Moreno' }, { id: 'y', name: 'Guzzone' }]),
    ];
    expect(buildTransitionModel(rows[0], rows).case).toBe(CASES.DATED_HANDOVER);
  });

  it('carries a body heading so the block is not read as a claim about one seat', () => {
    const rows = [md13('a-office', threeWinners), md13('b-office', null), md13('c-office', null)];
    rows.forEach((r) => {
      r.chamber_name = 'Maryland House of Delegates';
    });
    expect(buildTransitionModel(rows[0], rows).heading).toBe('Maryland House of Delegates');
  });

  it('gives a per-seat model no heading', () => {
    const solo = {
      id: 'a',
      office_id: 'a',
      chamber_name: 'State Senate',
      seat_group: { group_id: 'g', offices: 1, winners: 1, seated: 1 },
      pending_winner: {
        election_date: '2026-11-03',
        certainty: 'called',
        seats: 1,
        winners: [{ id: 'b', name: 'Sam Rivera' }],
      },
    };
    expect(buildTransitionModel(solo, [solo]).heading).toBeUndefined();
  });
});

describe('arrivingNote — the incoming person’s own profile page', () => {
  // 🔴 136 people hold a future term and NO current seat, so office_current_holder resolves
  // nothing for them and every office field on their profile is null. That is the page a voter
  // lands on after clicking the incoming name on an address result, and it read as though the
  // person were nobody. Spec §7.3 and §11 call 4 put this page explicitly in scope.
  it('names the seat and the date', () => {
    expect(
      arrivingNote({ arriving_office_title: 'U.S. Representative', arriving_on: '2027-01-03' })
    ).toBe('Takes office as U.S. Representative on January 3, 2027');
  });

  it('is silent when either half is missing, rather than half-stating it', () => {
    expect(arrivingNote({ arriving_office_title: 'Mayor', arriving_on: null })).toBeNull();
    expect(arrivingNote({ arriving_office_title: null, arriving_on: '2027-01-03' })).toBeNull();
    expect(arrivingNote(null)).toBeNull();
  });
});
