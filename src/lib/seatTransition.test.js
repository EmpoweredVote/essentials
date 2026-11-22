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
