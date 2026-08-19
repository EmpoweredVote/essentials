// src/lib/stateGroups.test.js — pure-logic only, no jsdom/React import.
// Mirrors bannerProps.test.js / population.test.js convention.

import { describe, it, expect } from 'vitest';
import { splitBodiesByState, orderBodiesByState } from './stateGroups';

/**
 * Minimal stand-in for one entry of groupIntoHierarchy()'s `bodies` array.
 * Only the fields splitBodiesByState reads are populated: the key (for identity
 * in assertions) and the nested pols that carry representing_state.
 */
const body = (key, representingState) => ({
  key,
  title: key,
  url: '',
  subgroups: [
    { key: `${key}-sg`, label: '', url: '', pols: [{ representing_state: representingState }] },
  ],
});

const keysOf = (groups) => groups.map((g) => [g.stateAbbrev, g.bodies.map((b) => b.key)]);

describe('splitBodiesByState', () => {
  it('keeps a single-state tier as one group with bodies in their original order', () => {
    const bodies = [
      body('California Executive', 'CA'),
      body('California State Assembly', 'CA'),
      body('California Departments & Commissions', 'CA'),
    ];

    expect(keysOf(splitBodiesByState(bodies, { dominantState: 'CA' }))).toEqual([
      ['CA', ['California Executive', 'California State Assembly', 'California Departments & Commissions']],
    ]);
  });

  it('splits interleaved states into one group per state, dominant state first', () => {
    // The real 89439 ordering: CA and NV bodies alternate, and Washoe County
    // (32031) makes NV the dominant state, so NV must lead despite CA sorting first.
    const bodies = [
      body('California Executive', 'CA'),
      body('Nevada Executive', 'NV'),
      body('California State Assembly', 'CA'),
      body('Nevada Assembly', 'NV'),
    ];

    expect(keysOf(splitBodiesByState(bodies, { dominantState: 'NV' }))).toEqual([
      ['NV', ['Nevada Executive', 'Nevada Assembly']],
      ['CA', ['California Executive', 'California State Assembly']],
    ]);
  });

  it('orders states after the dominant one alphabetically', () => {
    const bodies = [
      body('Oregon Executive', 'OR'),
      body('Idaho Executive', 'ID'),
      body('Nevada Executive', 'NV'),
    ];

    expect(splitBodiesByState(bodies, { dominantState: 'OR' }).map((g) => g.stateAbbrev)).toEqual([
      'OR',
      'ID',
      'NV',
    ]);
  });

  it('falls back to alphabetical order when the dominant state has no bodies', () => {
    const bodies = [body('Nevada Executive', 'NV'), body('California Executive', 'CA')];

    expect(splitBodiesByState(bodies, { dominantState: 'AZ' }).map((g) => g.stateAbbrev)).toEqual([
      'CA',
      'NV',
    ]);
  });

  it('collects bodies with no representing_state into a trailing null group, losing none', () => {
    const bodies = [
      body('Nevada Executive', 'NV'),
      body('Unattributed Board', null),
      body('California Executive', 'CA'),
    ];

    const groups = splitBodiesByState(bodies, { dominantState: 'NV' });

    expect(keysOf(groups)).toEqual([
      ['NV', ['Nevada Executive']],
      ['CA', ['California Executive']],
      [null, ['Unattributed Board']],
    ]);
    // A body must never vanish just because its state could not be determined.
    expect(groups.reduce((n, g) => n + g.bodies.length, 0)).toBe(bodies.length);
  });

  it('reads the state from the first official that has one', () => {
    const mixed = {
      key: 'Nevada Courts',
      title: 'Nevada Courts',
      url: '',
      subgroups: [
        { key: 'a', label: '', url: '', pols: [{ representing_state: null }] },
        { key: 'b', label: '', url: '', pols: [{ representing_state: 'NV' }] },
      ],
    };

    expect(splitBodiesByState([mixed], { dominantState: 'NV' })[0].stateAbbrev).toBe('NV');
  });

  it('normalises abbreviation case so nv and NV are one group', () => {
    const bodies = [body('Nevada Executive', 'nv'), body('Nevada Assembly', 'NV')];

    expect(keysOf(splitBodiesByState(bodies, { dominantState: 'NV' }))).toEqual([
      ['NV', ['Nevada Executive', 'Nevada Assembly']],
    ]);
  });

  it('returns no groups for no bodies', () => {
    expect(splitBodiesByState([], { dominantState: 'NV' })).toEqual([]);
  });
});

describe('orderBodiesByState', () => {
  it('puts the dominant state first when alphabetical order would not', () => {
    // The case that makes this worth having: the minority state's community
    // sorts first by name, so leaving order to chance leads with the wrong side.
    const bodies = [body('Alpine County', 'CA'), body('Clark County', 'NV')];

    expect(
      orderBodiesByState(bodies, { dominantState: 'NV' }).map((b) => b.key)
    ).toEqual(['Clark County', 'Alpine County']);
  });

  it('keeps each state\u2019s bodies in their original relative order', () => {
    const bodies = [
      body('San Bernardino County', 'CA'),
      body('Clark County', 'NV'),
      body('Inyo County', 'CA'),
      body('Nye County', 'NV'),
    ];

    expect(
      orderBodiesByState(bodies, { dominantState: 'NV' }).map((b) => b.key)
    ).toEqual(['Clark County', 'Nye County', 'San Bernardino County', 'Inyo County']);
  });

  it('returns a single-state list unchanged', () => {
    const bodies = [body('Los Angeles', 'CA'), body('Culver City', 'CA'), body('Los Angeles County', 'CA')];

    expect(orderBodiesByState(bodies, { dominantState: 'CA' }).map((b) => b.key)).toEqual([
      'Los Angeles',
      'Culver City',
      'Los Angeles County',
    ]);
  });

  it('puts bodies with no determinable state last without losing them', () => {
    const bodies = [body('Unattributed Board', null), body('Clark County', 'NV')];

    const ordered = orderBodiesByState(bodies, { dominantState: 'NV' });
    expect(ordered.map((b) => b.key)).toEqual(['Clark County', 'Unattributed Board']);
    expect(ordered).toHaveLength(bodies.length);
  });
});
