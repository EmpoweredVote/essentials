/**
 * Unit tests for SeatTransition.jsx — pure-logic and source-text only (no jsdom, no React
 * render), matching src/components/SectionBanner.test.js.
 *
 * The render decisions that matter here are decisions, not pixels: which cases draw an arrow,
 * whether an unidentified winner becomes a link, and whether an empty model renders at all.
 * Those are exported so they can be asserted directly.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CASES } from '../lib/seatTransition.js';
import { ARROW_CASES, shouldRender } from './SeatTransition.jsx';

const SRC = readFileSync(new URL('./SeatTransition.jsx', import.meta.url), 'utf8');

describe('the arrow', () => {
  // 🔴 An arrow from someone to themselves reads as a bug. 451 of the 638 dated seats and 914
  // of the 1,419 result-only seats are the sitting person being returned to the same seat.
  it('renders no arrow for either re-election case', () => {
    expect(ARROW_CASES).not.toContain(CASES.DATED_REELECTION);
    expect(ARROW_CASES).not.toContain(CASES.RESULT_REELECTION);
  });

  // 🔴 A staggered body — five members, three seats up — would otherwise draw an arrow from
  // five people to three and tell a voter the body is shrinking.
  it('renders no arrow for an incomplete group', () => {
    expect(ARROW_CASES).not.toContain(CASES.RESULT_PARTIAL);
  });

  it('renders an arrow for a handover and for a whole group', () => {
    expect(ARROW_CASES).toEqual(
      expect.arrayContaining([CASES.DATED_HANDOVER, CASES.RESULT_GROUP])
    );
  });

  it('never draws an arrow for a case it does not know', () => {
    expect(ARROW_CASES).not.toContain(CASES.NONE);
  });
});

describe('what renders at all', () => {
  it('renders nothing for CASES.NONE', () => {
    expect(shouldRender({ case: CASES.NONE })).toBe(false);
  });

  it('renders nothing for a missing or empty model rather than throwing', () => {
    expect(shouldRender(null)).toBe(false);
    expect(shouldRender(undefined)).toBe(false);
    expect(shouldRender({ case: CASES.RESULT_HANDOVER, lines: [] })).toBe(false);
  });

  it('renders when there is a line to show', () => {
    expect(shouldRender({ case: CASES.DATED_HANDOVER, lines: ['Takes office January 3, 2027'] }))
      .toBe(true);
  });
});

describe('an unidentified winner', () => {
  // 🔴 237 winner rows have no politician record. /politician/null is a dead page, and a link
  // that goes nowhere is worse than plain text because it invites the click.
  it('never links a person whose id is null', () => {
    // The component must branch on person.id before producing a href.
    expect(SRC).toMatch(/person\.id\s*\?/);
    // And must never interpolate an id straight into a politician href unguarded.
    expect(SRC).not.toMatch(/\/politician\/\$\{[^}]*\}`\s*}\s*>\s*\{person\.name/);
  });
});

describe('dark mode', () => {
  // 🔴 FOUND IN THE PRODUCTION RENDER, NOT IN REVIEW. The first version set
  // color: '#334155' and borderTop: 'rgba(0,0,0,0.08)' inline. On the dark theme — which is what
  // the screenshot showed — that is slate on near-black and a black line on black: the
  // transition sentence was legible only if you knew it was there. Inline colours cannot respond
  // to the theme, so the rule is that this component states colour in Tailwind classes with a
  // dark: variant, the way every other card element here does.
  it('states every colour as a class with a dark variant, never as an inline hex', () => {
    expect(SRC).not.toMatch(/color:\s*['"]#[0-9a-fA-F]{3,8}['"]/);
    expect(SRC).not.toMatch(/borderTop:\s*['"][^'"]*rgba\(0,\s*0,\s*0/);
  });

  it('gives the text, the divider and the arrow each a dark variant', () => {
    expect(SRC).toMatch(/dark:text-/);
    expect(SRC).toMatch(/dark:border-/);
  });
});

describe('the card does not reach past its own repo', () => {
  // 🔴 PoliticianCard is published in @empoweredvote/ev-ui and is NOT modified by this work.
  // The local src/components/PoliticianCard.jsx is dead code nothing imports. If this component
  // ever starts importing either one, the transition block has stopped being a footer slot and
  // has become a change to a shared package.
  it('does not import PoliticianCard from anywhere', () => {
    expect(SRC).not.toMatch(/import[\s\S]{0,80}PoliticianCard/);
  });
});
