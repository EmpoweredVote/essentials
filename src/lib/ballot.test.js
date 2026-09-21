/**
 * Tests for ballot.js — mergeUpcomingBallot
 *
 * Regression: an LA address returned the county general and the statewide/federal
 * general as two separate election records on the same day, and the old code kept
 * only the first — hiding every state and federal race. These lock in the merge.
 */

import { describe, it, expect } from 'vitest';
import { mergeUpcomingBallot } from './ballot.js';

const NOW = new Date('2026-09-21T12:00:00');

const race = (district_type, position_name, extra = {}) => ({
  district_type,
  position_name,
  race_id: `${district_type}:${position_name}`,
  candidates: [{ candidate_id: `${position_name}-a` }],
  ...extra,
});

describe('mergeUpcomingBallot', () => {
  it('returns [] for null/empty input', () => {
    expect(mergeUpcomingBallot(null, NOW)).toEqual([]);
    expect(mergeUpcomingBallot([], NOW)).toEqual([]);
  });

  it('merges same-day county + state elections into one ballot (the LA bug)', () => {
    const data = [
      {
        election_id: 'county',
        election_type: 'general',
        election_date: '2026-11-03',
        races: [race('COUNTY', 'LA County Sheriff'), race('LOCAL_EXEC', 'Los Angeles Mayor')],
      },
      {
        election_id: 'state',
        election_type: 'general',
        election_date: '2026-11-03',
        races: [race('NATIONAL_LOWER', 'U.S. Representative District 34')],
      },
    ];
    const out = mergeUpcomingBallot(data, NOW);
    expect(out).toHaveLength(1);
    const names = out[0].races.map((r) => r.position_name);
    expect(names).toContain('LA County Sheriff');
    expect(names).toContain('Los Angeles Mayor');
    expect(names).toContain('U.S. Representative District 34');
    expect(out[0].races).toHaveLength(3);
  });

  it('dedupes a seat across a primary and a general — soonest instance wins', () => {
    const data = [
      {
        election_id: 'general',
        election_type: 'general',
        election_date: '2026-11-03',
        races: [race('NATIONAL_LOWER', 'U.S. Representative District 34')],
      },
      {
        election_id: 'primary',
        election_type: 'primary',
        election_date: '2026-10-01',
        races: [race('NATIONAL_LOWER', 'U.S. Representative District 34', { primary_party: 'Democratic' })],
      },
    ];
    const out = mergeUpcomingBallot(data, NOW);
    const usRep = out[0].races.filter((r) => r.position_name === 'U.S. Representative District 34');
    expect(usRep).toHaveLength(1);
    // The Oct 1 primary is sooner, so it wins and carries its own type/date.
    expect(usRep[0].election_type).toBe('primary');
    expect(usRep[0].election_date).toBe('2026-10-01');
  });

  it('keeps distinct same-titled races within a single election (no over-dedupe)', () => {
    const data = [
      {
        election_id: 'e1',
        election_type: 'general',
        election_date: '2026-11-03',
        races: [
          race('JUDICIAL', 'Judge', { race_id: 'seat-1', candidates: [{ candidate_id: 'x' }] }),
          race('JUDICIAL', 'Judge', { race_id: 'seat-2', candidates: [{ candidate_id: 'y' }] }),
        ],
      },
    ];
    const out = mergeUpcomingBallot(data, NOW);
    expect(out[0].races).toHaveLength(2);
  });

  it('tags each race with its own election type/date', () => {
    const data = [
      {
        election_id: 'state',
        election_type: 'general',
        election_date: '2026-11-03',
        races: [race('STATE_EXEC', 'CA Governor')],
      },
    ];
    const out = mergeUpcomingBallot(data, NOW);
    expect(out[0].races[0].election_type).toBe('general');
    expect(out[0].races[0].election_date).toBe('2026-11-03');
  });

  it('ignores past elections when an upcoming one exists', () => {
    const data = [
      {
        election_id: 'past',
        election_type: 'primary',
        election_date: '2026-06-02',
        races: [race('STATE_UPPER', 'CA State Senate District 26')],
      },
      {
        election_id: 'future',
        election_type: 'general',
        election_date: '2026-11-03',
        races: [race('LOCAL_EXEC', 'Los Angeles Mayor')],
      },
    ];
    const out = mergeUpcomingBallot(data, NOW);
    const names = out[0].races.map((r) => r.position_name);
    expect(names).toEqual(['Los Angeles Mayor']);
  });

  it('falls back to the most recent past election when none are upcoming', () => {
    const data = [
      { election_id: 'old', election_type: 'general', election_date: '2024-11-05', races: [race('LOCAL_EXEC', 'Old Mayor')] },
      { election_id: 'recent', election_type: 'primary', election_date: '2026-06-02', races: [race('COUNTY', 'Recent Race')] },
    ];
    const out = mergeUpcomingBallot(data, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].election_id).toBe('recent');
  });

  it('includes an election dated exactly today', () => {
    const data = [
      { election_id: 'today', election_type: 'general', election_date: '2026-09-21', races: [race('COUNTY', 'Today Race')] },
    ];
    const out = mergeUpcomingBallot(data, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].races.map((r) => r.position_name)).toEqual(['Today Race']);
  });
});
