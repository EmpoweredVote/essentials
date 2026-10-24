/**
 * Source-text guard for CompassCard.jsx (no jsdom, no React render), following the
 * CategorizedStances.test.js pattern. The gate logic itself is tested in
 * src/lib/compass.researchStates.test.js (compassCardMode).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./CompassCard.jsx', import.meta.url), 'utf8');

describe('CompassCard gate', () => {
  it('gates on compassCardMode, not on the compass id list alone', () => {
    // The id list leaves out people Stage 5 researched who have no answers; gating on it alone
    // hid their "no public stance" and own-words rows.
    expect(SRC).toMatch(/compassCardMode\(/);
    expect(SRC).not.toMatch(/if \(!politicianIdsWithStances\.has\(politicianId\)\) return null/);
  });

  it('does not fetch answers for a research-only person', () => {
    expect(SRC).toMatch(/researchOnly \? \[\] : fetchedAnswers/);
  });

  it('gives a research-only person the breakdown alone, guest or not', () => {
    // The guest zone opens with CompassIntro, whose second step offers to lay the viewer's
    // compass over this person's. A research-only person has no positions to lay one over —
    // every row says we found no public stance — so the breakdown-only branch takes guests
    // too. Gating it on hasUserCompass sent exactly these guests to that pitch.
    expect(SRC).toMatch(/\{researchOnly \? \(/);
    expect(SRC).not.toMatch(/researchOnly && hasUserCompass/);
  });
});

describe('CompassCard calibrate invitation', () => {
  // CompassIntro is the only place the calibrate CTA lives, so the branch above — which drops
  // the intro — took away the one route into the compass for the visitors this card exists for.
  // A guest could read the whole card and have no way to calibrate. These pin the way back.

  it('offers a research-only visitor a calibrate link', () => {
    const branch = SRC.split('{researchOnly ? (')[1].split(') : hasUserCompass ? (')[0];
    expect(branch).toMatch(/href=\{ctaHref\}/);
    expect(branch).toMatch(/Calibrate your compass/);
  });

  it('does not offer it to someone who already has a compass', () => {
    const branch = SRC.split('{researchOnly ? (')[1].split(') : hasUserCompass ? (')[0];
    expect(branch).toMatch(/\{!hasUserCompass &&/);
  });

  it('does not flash it at a logged-in user whose answers are still loading', () => {
    // Same reason the zone below shows a spinner instead of the CTA: compassLoading clears
    // before loadCompassData() finishes, so hasUserCompass is briefly false for someone who
    // does have a compass.
    const branch = SRC.split('{researchOnly ? (')[1].split(') : hasUserCompass ? (')[0];
    expect(branch).toMatch(/!\(isLoggedIn && !compassDataLoaded\)/);
  });

  it('does not re-introduce the comparison pitch alongside it', () => {
    // The invitation points at the people we do hold positions for. Promising a comparison
    // with *this* person is the thing the branch exists to avoid.
    const branch = SRC.split('{researchOnly ? (')[1].split(') : hasUserCompass ? (')[0];
    expect(branch).not.toMatch(/<CompassIntro/);
  });
});
