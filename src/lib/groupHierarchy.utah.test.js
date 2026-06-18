/**
 * Regression tests for the Utah local-government grouping bugs:
 *  - chamber-less duplicate records of the same person appearing twice
 *    (once under "City of X", once under "Unknown")
 *  - mayor/council with a missing chamber→government link landing in "Unknown"
 *
 * Mirrors the real data shape: a chamber-linked record (government_name set,
 * issue stances attached) and a chamber-less duplicate (government_name empty).
 */
import { describe, it, expect } from 'vitest';
import { groupIntoHierarchy } from './groupHierarchy.js';

function localPol(o) {
  return {
    district_type: 'LOCAL',
    government_name: '',
    government_body_name: '',
    chamber_name_formal: '',
    chamber_name: '',
    office_title: 'City Council',
    full_name: 'Jane Doe',
    last_name: 'Doe',
    representing_city: '',
    district_label: '',
    id: Math.random().toString(36),
    ...o,
  };
}

describe('Utah local grouping regression', () => {
  it('Orem: chamber-less duplicate collapses into the chamber-linked (stance-bearing) record — no "Unknown"', () => {
    const linked = localPol({
      id: 'linked-1', full_name: 'Chris Killpack', office_title: 'City Council Member',
      district_type: 'LOCAL_EXEC', government_name: 'City of Orem, Utah, US',
      district_label: 'Orem Mayor',
    });
    const dupe = localPol({
      id: 'null-1', full_name: 'Chris Killpack', office_title: 'City Council',
      district_type: 'LOCAL', government_name: '', district_label: 'Orem City Council',
    });

    const hierarchy = groupIntoHierarchy([linked, dupe]);
    const local = hierarchy.find(t => t.tier === 'Local');
    const titles = local.bodies.map(b => b.title);

    expect(titles).not.toContain('Unknown');
    expect(titles).toContain('City of Orem');
    // exactly one card for Chris Killpack across the whole tier
    const cards = local.bodies.flatMap(b => b.subgroups.flatMap(s => s.pols));
    const killpack = cards.filter(p => p.full_name === 'Chris Killpack');
    expect(killpack.length).toBe(1);
    // the surviving card is the chamber-linked, stance-bearing record
    expect(killpack[0].id).toBe('linked-1');
  });

  it('Alpine: chamber-less mayor + council group under "City of Alpine", not "Unknown"', () => {
    const council = localPol({
      full_name: 'Council Person', office_title: 'City Council',
      district_type: 'LOCAL', district_label: 'Alpine City Council',
    });
    const mayor = localPol({
      full_name: 'Mayor Person', office_title: 'Mayor',
      district_type: 'LOCAL_EXEC', district_label: 'Alpine Mayor',
    });

    const hierarchy = groupIntoHierarchy([council, mayor]);
    const local = hierarchy.find(t => t.tier === 'Local');
    const titles = local.bodies.map(b => b.title);

    expect(titles).not.toContain('Unknown');
    expect(titles).toContain('City of Alpine');
  });
});
