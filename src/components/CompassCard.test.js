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
});
