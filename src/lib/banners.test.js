import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = JSON.parse(readFileSync(join(ROOT, 'public', 'banners.json'), 'utf8'));

// The closed vocabulary the generator matches against. A licence outside it means either a
// new licence in the registry (add it deliberately) or a parse that swallowed prose.
const LICENSES = new Set([
  'CC BY-SA 1.0', 'CC BY-SA 2.0', 'CC BY-SA 2.5', 'CC BY-SA 3.0', 'CC BY-SA 4.0',
  'CC BY 1.0', 'CC BY 2.0', 'CC BY 2.5', 'CC BY 3.0', 'CC BY 4.0',
  'CC BY-SA 3.0/GFDL', 'CC BY-SA 4.0/GFDL',
  'CC0 / Public Domain', 'CC0', 'Public Domain',
]);

const byPath = Object.fromEntries(doc.assets.map((a) => [a.path, a]));

describe('banners.json — shape', () => {
  it('is keyed by bucket path, with no duplicates', () => {
    const paths = doc.assets.map((a) => a.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('counts agree with the arrays they describe', () => {
    expect(doc.counts.credited).toBe(doc.assets.length);
    expect(doc.counts.uncredited).toBe(doc.uncredited.length);
    expect(doc.counts.unmatched_credits).toBe(doc.unmatched_credits.length);
    expect(doc.counts.assets).toBe(doc.assets.length + doc.uncredited.length);
  });

  it('every credited asset carries a non-empty author and a known licence', () => {
    for (const a of doc.assets) {
      expect(a.author, a.path).toBeTruthy();
      expect(a.title, a.path).toBeTruthy();
      expect(LICENSES.has(a.license), `${a.path} -> ${a.license}`).toBe(true);
    }
  });

  it('leaves no credit unattached — an orphan credit means a broken join', () => {
    expect(doc.unmatched_credits).toEqual([]);
  });

  it('never lets a production note leak into the author or licence field', () => {
    for (const a of doc.assets) {
      expect(a.author, a.path).not.toMatch(/\b(anchor|levelled|leveled|brightened|crop)\b/i);
      expect(a.license, a.path).not.toMatch(/[([]/);
    }
  });
});

// These are the failures other consumers actually shipped. They are cheap to re-break —
// one over-eager fallback in the join is enough — so each gets its own assertion.
describe('banners.json — the same-name traps', () => {
  it('does not publish Portland ME under Portland OR\'s photographer', () => {
    expect(byPath['cities/portland.jpg'].state).toBe('OR');
    expect(byPath['cities/portland.jpg'].author).toBe('Daderot');
    // ME has no credit of its own in the registry. Honestly absent beats plausibly wrong.
    expect(byPath['cities/portland-me.jpg']).toBeUndefined();
    expect(doc.uncredited.map((u) => u.path)).toContain('cities/portland-me.jpg');
  });

  it('splits Fairview OR and Fairview TX onto their own photographers', () => {
    expect(byPath['cities/fairview-or.jpg'].author).toBe('Finetooth');
    expect(byPath['cities/fairview.jpg'].state).toBe('TX');
    expect(byPath['cities/fairview.jpg'].author).toBe('Fairsaka');
    expect(byPath['cities/fairview.jpg'].author)
      .not.toBe(byPath['cities/fairview-or.jpg'].author);
  });

  it('keeps the nineteen Utah banners, whose credit sits on a continuation line', () => {
    // The two-line `(File:...)` form is what silently dropped these downstream.
    const ut = doc.assets.filter((a) => a.state === 'UT');
    expect(ut.length).toBeGreaterThanOrEqual(19);
    expect(byPath['cities/midvale.jpg'].author).toBe('An Errant Knight');
    expect(byPath['cities/midvale.jpg'].license).toBe('CC BY-SA 4.0');
  });

  it('credits all four la_county assets, which have per-file licences', () => {
    const la = doc.assets.filter((a) => a.path.startsWith('la_county/'));
    expect(la).toHaveLength(4);
    expect(byPath['la_county/building_photos/0658072.jpg'].license).toBe('CC BY 2.5');
    expect(byPath['la_county/building_photos/0644000-skyline.jpg'].author).toBe('Adoramassey');
    // Not a batch licence: three differ from the fourth.
    expect(new Set(la.map((a) => a.license)).size).toBeGreaterThan(1);
  });

  it('carries the 50 state panoramas, versioned filenames included', () => {
    const states = doc.assets.filter((a) => a.kind === 'state');
    expect(states).toHaveLength(50);
    expect(byPath['states/CA-v2.jpg']).toBeDefined();
    expect(byPath['states/TX-v2.jpg']).toBeDefined();
    expect(byPath['states/FL-v2.jpg']).toBeDefined();
  });

  it('excludes archived objects that no longer ship', () => {
    expect(doc.assets.some((a) => a.path.includes('_archive/'))).toBe(false);
  });
});
