/** Source-text guard (no jsdom), following the CompassCard.test.js pattern. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./LegislativeRecord.jsx', import.meta.url), 'utf8');

describe('LegislativeRecord page layout choice', () => {
  it('shows the council layout only when councilLayout says "council"', () => {
    expect(SRC).toMatch(/layout === 'council'/);
  });
  it('renders the usual loading placeholder while pending (no blank page)', () => {
    expect(SRC).not.toMatch(/layout === 'pending'\s*\?\s*null/);
    expect(SRC).toMatch(/\{loading \|\| !topicsSettled \? \(\s*<div className="rg-loading" role="status"/);
  });
});
