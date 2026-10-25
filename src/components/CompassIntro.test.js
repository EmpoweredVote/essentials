/**
 * Source-text guard for CompassIntro.jsx (no jsdom, no React render), following the
 * CompassCard.test.js / CategorizedStances.test.js pattern.
 *
 * The data and token literals are lifted out of the shipped file and evaluated, so
 * the contrast numbers below are measured against what actually renders rather than
 * against a transcription of it.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const SRC = readFileSync(new URL('./CompassIntro.jsx', import.meta.url), 'utf8');

/** Lift `const <name> = <literal>;` out of the source and evaluate the literal. */
function literal(name) {
  const start = SRC.indexOf(`const ${name} = `);
  if (start === -1) throw new Error(`${name} is not declared in CompassIntro.jsx`);
  const from = start + `const ${name} = `.length;
  const open = SRC[from];
  const close = open === '[' ? ']' : '}';
  let depth = 0;
  for (let i = from; i < SRC.length; i += 1) {
    if (SRC[i] === open) depth += 1;
    else if (SRC[i] === close) {
      depth -= 1;
      if (depth === 0) return runInNewContext(`(${SRC.slice(from, i + 1)})`);
    }
  }
  throw new Error(`${name} is not closed`);
}

const LABELS = literal('LABELS');
const DEMO_QUESTIONS = literal('DEMO_QUESTIONS');
const LIGHT = literal('LIGHT');
const DARK = literal('DARK');

// WCAG 2.x relative luminance and contrast ratio.
const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const linear = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminance = (rgb) => 0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2]);
const over = (fg, bg, alpha) => fg.map((c, i) => bg[i] + (c - bg[i]) * alpha);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('CompassIntro steps', () => {
  it('has three steps', () => {
    // Step 1 used to be the first half of step 2: a single pick that flipped to the radar
    // after 2.3s, too fast to read and easy to misread as choosing a topic. Splitting it
    // gave the questionnaire and the shape a step each.
    const block = SRC.split('const steps = [')[1].split('\n  ];')[0];
    expect(block.match(/^\s{4}\{$/gm)).toHaveLength(3);
    expect(SRC).toMatch(/<QuestionnaireVisual t=\{t\} \/>/);
    expect(SRC).toMatch(/<PrioritiesVisual t=\{t\} \/>/);
    expect(SRC).toMatch(/<CompareVisual t=\{t\} \/>/);
  });

  it('counts the steps from the array rather than hard-coding two', () => {
    expect(SRC).toMatch(/Step \{i \+ 1\} of \{steps\.length\}/);
    expect(SRC).toMatch(/const last = step === steps\.length - 1;/);
    expect(SRC).not.toMatch(/of 2</);
  });

  it('keeps the calibrate CTA on the last step only', () => {
    // The CTA is the only route into the compass from this card; it must not appear
    // on a step the viewer is still being explained the idea on.
    expect(SRC).toMatch(/\{last \? \(/);
    const controls = SRC.split('{last ? (')[1];
    expect(controls).toMatch(/Calibrate<span className="hidden sm:inline"> your compass<\/span>/);
  });
});

describe('CompassIntro step 1 script', () => {
  it('asks three questions with five positions each', () => {
    expect(DEMO_QUESTIONS).toHaveLength(3);
    for (const q of DEMO_QUESTIONS) {
      expect(q.options).toHaveLength(5);
      expect(q.pick).toBeGreaterThanOrEqual(0);
      expect(q.pick).toBeLessThan(q.options.length);
    }
  });

  it('asks about spokes the step 2 shape actually has', () => {
    // The point of the three questions is that the shape on step 2 reads as their
    // result. A question on a topic the radar does not draw breaks that.
    for (const q of DEMO_QUESTIONS) expect(LABELS).toContain(q.label);
  });

  it('keeps every option short enough for the 17rem column', () => {
    // The live ladders run 40-70 characters an option and none of the 43 live topics
    // has five that fit here, which is why this copy is written for the demo. If it
    // grows back to that length the rows wrap to three lines and FitToBox shrinks the
    // whole card to fit.
    for (const q of DEMO_QUESTIONS) {
      for (const option of q.options) expect(option.length).toBeLessThanOrEqual(28);
      expect(q.question.length).toBeLessThanOrEqual(40);
    }
  });

  it('paces the pick so all five can be read first', () => {
    const pickAt = Number(SRC.match(/const PICK_AT = ([\d.]+);/)[1]);
    const advanceAt = Number(SRC.match(/const ADVANCE_AT = ([\d.]+);/)[1]);
    // Last option finishes sliding in at 0.15 + 4*0.12 + 0.45 = 1.08s.
    expect(pickAt).toBeGreaterThan(1.08);
    expect(pickAt).toBe(2.8);
    // And the answer has to hold long enough to be taken in before the next question.
    expect(advanceAt - pickAt).toBeGreaterThanOrEqual(2);
    expect(advanceAt).toBe(5);
  });

  it('cycles indefinitely, but not under reduced motion', () => {
    const visual = SRC.split('function QuestionnaireVisual')[1].split('\nfunction ')[0];
    expect(visual).toMatch(/setInterval\(/);
    expect(visual).toMatch(/\(n \+ 1\) % DEMO_QUESTIONS\.length/);
    // The guard must come before the timer is created, not merely exist somewhere.
    expect(visual.indexOf('if (reduced) return undefined;')).toBeGreaterThan(-1);
    expect(visual.indexOf('if (reduced) return undefined;')).toBeLessThan(visual.indexOf('setInterval('));
  });
});

describe('CompassIntro picked-option contrast', () => {
  // The picked row used to recolour its TEXT to the accent blue in both themes, which
  // measured 2.23:1 in light mode — the selected answer was the faintest line on the
  // card. It is marked by its border, dot and tint instead; those are non-text marks
  // and only owe 3:1. Step 1 now loops indefinitely, so this is on screen for as long
  // as the viewer stays.
  const keyframe = SRC.split('@keyframes evi-select')[1].split('@keyframes')[0];

  it('drives the selected row from theme variables, not a fixed hex', () => {
    expect(keyframe).toMatch(/color: var\(--evi-head\)/);
    expect(keyframe).not.toMatch(/#[0-9A-Fa-f]{6}/);
    expect(SRC).not.toMatch(/const PICK_COLOR/);
    expect(SRC).toMatch(/'--evi-pick': t\.textAccent/);
    expect(SRC).toMatch(/'--evi-head': t\.textHead/);
  });

  for (const [theme, t] of [['light', LIGHT], ['dark', DARK]]) {
    it(`reads the selected answer at AA or better in ${theme} mode`, () => {
      const tint = over(channels(t.textAccent), channels(t.card), 0x22 / 255);
      expect(contrast(channels(t.textHead), tint)).toBeGreaterThanOrEqual(4.5);
    });

    it(`marks the selection visibly in ${theme} mode`, () => {
      // Border and filled dot: non-text, so 3:1.
      expect(contrast(channels(t.textAccent), channels(t.card))).toBeGreaterThanOrEqual(3);
    });
  }
});
