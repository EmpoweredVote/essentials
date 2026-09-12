#!/usr/bin/env node
/**
 * Generate public/banners.json — the machine-readable credits list for the banner
 * registry in src/lib/buildingImages.js.
 *
 *   node scripts/gen-banners-json.mjs           # write public/banners.json
 *   node scripts/gen-banners-json.mjs --check    # fail if the committed copy is stale
 *
 * WHY THIS EXISTS
 * Attribution is a licence condition, so every consumer that displays these banners has
 * to read author + licence off our registry — and the registry is a prose comment block.
 * Treasury Tracker wrote a parser. Civic Spaces wrote a parser (four rounds, each wrong in
 * a way that looked fine: Portland ME published under Portland OR's photographer; all
 * nineteen Utah banners silently dropped by one wrapping variant; licence fields carrying
 * production notes like "(anchor .85)"). The next consumer will write one too, and one of
 * them will ship a wrong photographer. This file makes that category impossible: we parse
 * once, here, where the registry lives and where a mistake is ours to catch.
 *
 * TWO RULES MAKE IT SAFE, AND BOTH MATTER MORE THAN COVERAGE:
 *
 * 1. KEYED BY BUCKET PATH, NEVER BY PLACE NAME. Portland OR and Portland ME are both keyed
 *    `portland`; only cities/portland.jpg vs cities/portland-me.jpg tells them apart. Paths
 *    come from the CODE (src: literals, the federal const, the state panorama set) — never
 *    from the prose — so the asset list is whatever actually ships.
 *
 * 2. IT FAILS RATHER THAN GUESSES. A credit line it cannot parse into exactly
 *    title | author | licence is an error, not a skipped line. Silently dropping is how
 *    nineteen Utah banners went missing from a downstream site. Anything unresolved lands in
 *    `uncredited` or `unparsed` in the output AND makes this script exit non-zero.
 *
 * The licence is matched against a CLOSED VOCABULARY. Everything after the licence is kept
 * separately as `license_note` ("(anchor .85)", "[brightened]", crop prose) rather than
 * being glued onto the licence or swallowing the author.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src', 'lib', 'buildingImages.js');
const OUT = join(ROOT, 'public', 'banners.json');
const CHECK = process.argv.includes('--check');

const BUCKET = 'politician_photos/';
const text = readFileSync(SRC, 'utf8');
const lines = text.split(/\r?\n/);

/* ── 1. Assets, from the CODE ─────────────────────────────────────────────── */

const bucketPath = (url) => {
  const i = url.indexOf(BUCKET);
  return i === -1 ? null : url.slice(i + BUCKET.length);
};

/** key -> [{path, state}] for every `key: { state, src }` / array-of-those entry. */
const assets = new Map(); // path -> {path, kind, key, state}
const addAsset = (path, kind, key, state) => {
  if (!path) return;
  if (!assets.has(path)) assets.set(path, { path, kind, key, state: state ?? null });
};

const kindOf = (p) =>
  p.startsWith('cities/') ? 'city'
    : p.startsWith('counties/') ? 'county'
      : p.startsWith('la_county/') ? 'city'
        : p.startsWith('states/') ? 'state'
          : p.startsWith('national/') ? 'federal' : 'other';

// Only CODE lines. A comment may quote an archived path (cities/_archive/...) that does
// not ship; including it would invent an asset.
let currentKey = null;
for (const raw of lines) {
  // A whole-line comment is prose. Do NOT strip from the first `//` on a code line --
  // `https://` contains one, and doing so deletes the very URLs this loop is here to read.
  const isComment = /^\s*(\/\/|\*)/.test(raw);
  const line = isComment ? '' : raw;
  if (!line.trim() || !line.includes(BUCKET)) {
    const km = raw.match(/^\s*'([^']+)'\s*:\s*\[/)
      || raw.match(/^\s*([A-Za-z0-9_$][A-Za-z0-9 .-]*?)\s*:\s*\[/);
    if (km) currentKey = km[1].trim();
    continue;
  }
  // Quoted keys first: a character class containing `'` eats the closing quote and
  // yields `american fork'`, which then matches no credit.
  const keyMatch = line.match(/^\s*'([^']+)'\s*:\s*\{/)
    || line.match(/^\s*([A-Za-z0-9_$][A-Za-z0-9 .-]*?)\s*:\s*\{/);
  const key = keyMatch ? keyMatch[1].trim() : currentKey;
  const stateMatch = line.match(/state:\s*'([A-Z]{2})'/);
  for (const m of line.matchAll(/'(https:\/\/[^']*politician_photos\/[^']+)'/g)) {
    const p = bucketPath(m[1]);
    // STATE_PANORAMA_BASE ends at the directory; it is a prefix, not an object.
    if (!p || p.endsWith('/')) continue;
    addAsset(p, kindOf(p), key ?? (kindOf(p) === 'federal' ? 'federal' : null),
      stateMatch ? stateMatch[1] : null);
  }
}

// The 50 state panoramas are templated, not literal.
const panoSet = text.match(/const STATE_PANORAMAS = new Set\(\[([\s\S]*?)\]\)/);
const panoFiles = text.match(/const STATE_PANORAMA_FILES = \{([\s\S]*?)\n\};/);
if (!panoSet) throw new Error('STATE_PANORAMAS not found — registry shape changed');
const stateAbbrevs = [...panoSet[1].matchAll(/'([A-Z]{2})'/g)].map((m) => m[1]);
const versioned = Object.fromEntries(
  [...(panoFiles ? panoFiles[1].matchAll(/^\s*([A-Z]{2}):\s*'([^']+)'/gm) : [])]
    .map((m) => [m[1], m[2]]),
);
for (const ab of stateAbbrevs) {
  addAsset(`states/${versioned[ab] || `${ab}.jpg`}`, 'state', ab, ab);
}

/* ── 2. Credits, from the COMMENTS ────────────────────────────────────────── */

// Closed vocabulary. Anything outside it is not treated as a licence.
const LICENSES = [
  'CC BY-SA 1.0', 'CC BY-SA 2.0', 'CC BY-SA 2.5', 'CC BY-SA 3.0', 'CC BY-SA 4.0',
  'CC BY 1.0', 'CC BY 2.0', 'CC BY 2.5', 'CC BY 3.0', 'CC BY 4.0',
  'CC BY-SA 3.0/GFDL', 'CC BY-SA 4.0/GFDL',
  'CC0 / Public Domain', 'CC0', 'Public Domain',
];
const splitLicense = (field) => {
  const f = field.trim();
  // Case-insensitive: the registry writes both "Public Domain" and "Public domain".
  // Normalising case is not guessing -- the vocabulary is still closed.
  const lower = f.toLowerCase();
  for (const lic of LICENSES) {
    const l = lic.toLowerCase();
    if (lower === l) return { license: lic, note: null };
    if (lower.startsWith(l + ' ') || lower.startsWith(l + '.') ||
        lower.startsWith(l + ',') || lower.startsWith(l + '[')) {
      const note = f.slice(lic.length).replace(/^[.,]\s*/, '').trim();
      return { license: lic, note: note || null };
    }
  }
  return null;
};

// A credit line: `//   <key> - <title> | <author> | <license>`, possibly wrapping.
// \s* up front is load-bearing: most credit blocks live INSIDE the object literal and
// are indented (`  //   bend - ...`). Anchoring at `^//` silently skipped all of them --
// which is the same silent-drop failure this whole file exists to prevent.
const KEY_LINE = /^\s*\/\/\s{2,}([A-Za-z0-9][A-Za-z0-9 '().\-]*?)\s+-\s+(\S.*)$/;
// A continuation carries the rest of an unfinished credit. Annotations and asides never do.
const CONT = /^\s*\/\/\s{6,}(\S.*)$/;
const NOT_CONT = /^(\[|\(was\b|🔴|🟢|⚠|🔑|https?:)/u;

const credits = [];
const unparsed = [];

for (let i = 0; i < lines.length; i += 1) {
  const m = lines[i].match(KEY_LINE);
  if (!m) continue;
  const key = m[1].trim();
  let rest = m[2].trim();

  // 🔴 DO NOT `continue` HERE WHEN THE LINE HAS NO `|`. That one shortcut is exactly how
  // nineteen Utah banners vanished from a downstream site: this registry's commonest
  // two-line form puts the whole credit on the CONTINUATION --
  //     //   midvale - the brick 'Midvale City Old Town' sign
  //     //            (File:Midvale CIty Old Town sign.JPG) | An Errant Knight | CC BY-SA 4.0
  // so the key line carries no pipe at all. Strictness is preserved by the licence
  // vocabulary below, not by requiring a pipe up front.
  let j = i;
  while (rest.split('|').length < 3 && j + 1 < lines.length) {
    const c = lines[j + 1].match(CONT);
    if (!c || NOT_CONT.test(c[1].trim())) break;
    rest = `${rest} ${c[1].trim()}`;
    j += 1;
  }

  const parts = rest.split('|').map((s) => s.trim());
  if (parts.length < 3) {
    // No pipes at all after following continuations => an ordinary prose bullet, not a
    // credit. Only a line that LOOKS like a credit (has a pipe) and still will not parse
    // is an error worth failing on.
    if (rest.includes('|')) {
      unparsed.push({ line: i + 1, key, text: rest, why: 'fewer than 3 fields' });
    }
    continue;
  }
  const lic = splitLicense(parts.slice(2).join(' | '));
  if (!lic) {
    unparsed.push({ line: i + 1, key, text: rest, why: `licence not in closed vocabulary: ${parts[2]}` });
    continue;
  }
  credits.push({ key, title: parts[0], author: parts[1], ...lic, line: i + 1 });
  i = j;
}

/* ── 3. Join credits to paths ─────────────────────────────────────────────── */

// Credit keys are written either as the place name (`long beach`) or as the file slug
// (`long-beach`). Normalise both to the slug so the join does not depend on which.
const norm = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[\s_]+/g, '-')
  .replace(/-+/g, '-').replace(/^-|-$/g, '').trim();
const stem = (p) => p.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
const byKey = new Map();
for (const c of credits) {
  const k = norm(c.key);
  if (!byKey.has(k)) byKey.set(k, []);
  byKey.get(k).push(c);
}

const out = [];
const uncredited = [];
const usedLines = new Set();

// How many SHIPPING ASSETS share each code key. Portland is one key over two photographs
// (cities/portland.jpg in OR, cities/portland-me.jpg in ME). A lone credit under that key
// therefore identifies ONE of them, and broadcasting it to both publishes a real
// photographer against a picture they did not take -- the precise failure this file exists
// to prevent. Where a key is shared, the filename must settle it or nothing is claimed.
const assetsPerKey = new Map();
for (const a of assets.values()) {
  const k = norm(a.key ?? '');
  assetsPerKey.set(k, (assetsPerKey.get(k) ?? 0) + 1);
}

for (const a of [...assets.values()].sort((x, y) => x.path.localeCompare(y.path))) {
  // Try the code key, then the filename stem, then the stem with a version suffix
  // dropped (bend-v2 -> bend). Filename is what distinguishes portland OR from ME.
  const st = stem(a.path);
  const candidates = byKey.get(norm(a.key ?? ''))
    ?? byKey.get(norm(st))
    ?? byKey.get(norm(st.replace(/-v\d+$/, '')))
    ?? [];
  const keyIsShared = (assetsPerKey.get(norm(a.key ?? '')) ?? 0) > 1;
  let credit = null;
  if (candidates.length === 1 && !keyIsShared) {
    credit = candidates[0];
  } else if (candidates.length === 1 && keyIsShared) {
    // One credit, several assets under the same key: claim it ONLY for the asset whose
    // filename the credit key names. Everything else stays uncredited on purpose.
    const c = candidates[0];
    const marker = c.key.match(/\(([A-Z]{2})\)/);
    // A (STATE) marker in the credit key is BINDING, never advisory. `fairview(OR)` names
    // Oregon's photograph; letting a generic key match then hand it to Fairview TX is the
    // Portland error wearing a different hat.
    credit = marker
      ? (marker[1] === a.state ? c : null)
      : (norm(c.key) === norm(stem(a.path)) ? c : null);
  } else if (candidates.length > 1) {
    // Several credits share this key (fairview has one for OR and one for TX). Resolve by
    // STATE MARKER FIRST: norm() deliberately strips "(OR)", so a stem comparison alone
    // would hand Oregon's photograph to Fairview, Texas.
    const markerOf = (c) => (c.key.match(/\(([A-Z]{2})\)/) || [])[1] || null;
    credit = candidates.find((c) => markerOf(c) && markerOf(c) === a.state)
      ?? candidates.find((c) => !markerOf(c) && norm(c.key) === norm(stem(a.path)))
      ?? candidates.find((c) => !markerOf(c) && norm(c.key) === norm(a.key ?? '')
           && (assetsPerKey.get(norm(a.key ?? '')) ?? 0) === 1)
      ?? null;
  }
  if (!credit) {
    uncredited.push({ path: a.path, kind: a.kind, key: a.key, state: a.state });
    continue;
  }
  usedLines.add(credit.line);
  out.push({
    path: a.path,
    kind: a.kind,
    state: a.state,
    title: credit.title,
    author: credit.author,
    license: credit.license,
    ...(credit.note ? { license_note: credit.note } : {}),
  });
}

const unmatched = credits
  .filter((c) => !usedLines.has(c.line))
  .map((c) => ({ key: c.key, title: c.title, author: c.author, license: c.license, line: c.line }));

const doc = {
  $comment:
    'GENERATED by scripts/gen-banners-json.mjs from src/lib/buildingImages.js. Do not edit by hand. '
    + 'Keyed by bucket path: the same place name can hold two different photographs (portland OR vs ME). '
    + 'Attribution is a licence condition — display author and license verbatim.',
  bucket_base:
    'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/',
  counts: {
    assets: assets.size,
    credited: out.length,
    uncredited: uncredited.length,
    unmatched_credits: unmatched.length,
  },
  assets: out,
  uncredited,
  unmatched_credits: unmatched,
};

const json = `${JSON.stringify(doc, null, 2)}\n`;

if (unparsed.length) {
  console.error('UNPARSEABLE CREDIT LINES — fix the registry or the parser, do not ignore:');
  for (const u of unparsed) console.error(`  line ${u.line}: ${u.key} — ${u.why}\n    ${u.text}`);
}

if (CHECK) {
  let current = null;
  try { current = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
  if (current !== json) {
    console.error(`\n${OUT} is stale. Run: node scripts/gen-banners-json.mjs`);
    process.exit(1);
  }
  console.log(`banners.json up to date — ${out.length}/${assets.size} credited`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, json);
  console.log(`wrote ${OUT}`);
}

console.log(`assets ${assets.size} · credited ${out.length} · uncredited ${uncredited.length}`
  + ` · unmatched credits ${unmatched.length} · unparsed ${unparsed.length}`);

if (unparsed.length) process.exit(1);
