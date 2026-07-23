// inputClassifier.js — SRCH-03 / D-02 / D-06
//
// Pure, DOM-free classifier that buckets a raw combobox input string into
// exactly one of 'empty' | 'coordinate' | 'address' | 'name'. No imports, no
// side effects — safe to unit test without jsdom (mirrors src/lib/classify.js's
// pure-function-plus-colocated-vitest idiom).
//
// D-02 (214-CONTEXT.md): coordinates and addresses are classified locally;
// names are handed off to the Phase 212 place-name resolver. Regex shapes and
// thresholds are executor discretion (D-06) — drafted in 214-RESEARCH.md's
// "Input Classification Heuristic" section and reproduced here verbatim.

// Comma-separated decimal lat/lng pair, e.g. "39.17, -86.52" or "-33.9,151.2".
const COORDINATE_RE = /^\s*-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?\s*$/;

// Leading street number ("123 Main St") — digit(s) (optionally decimal, e.g.
// a bare "39.17 -86.52" coordinate typed without a comma) at the start,
// followed by whitespace, followed by a non-whitespace token. Per
// RESEARCH.md's Open Questions 1 & 2, this also catches "5 Points"-style
// neighborhood names and comma-less coordinate pairs as an accepted v1
// tradeoff (documented, not silently drifting).
const ADDRESS_LEADING_DIGIT_RE = /^\s*-?\d+(?:\.\d+)?\s+\S/;

// 5-digit ZIP (optionally +4) anywhere in the string. ZIPs flow through the
// existing Census/searchPoliticians address path, never the name resolver.
const ZIP_RE = /\b\d{5}(-\d{4})?\b/;

/**
 * classifyInput(raw) -> { kind: 'empty' }
 *                     | { kind: 'coordinate', lat: number, lng: number }
 *                     | { kind: 'address' }
 *                     | { kind: 'name' }
 */
export function classifyInput(raw) {
  const value = (raw || '').trim();
  if (!value) return { kind: 'empty' };

  if (COORDINATE_RE.test(value)) {
    const [lat, lng] = value.split(',').map((s) => Number(s.trim()));
    return { kind: 'coordinate', lat, lng };
  }

  if (ADDRESS_LEADING_DIGIT_RE.test(value) || ZIP_RE.test(value)) {
    return { kind: 'address' };
  }

  return { kind: 'name' };
}
