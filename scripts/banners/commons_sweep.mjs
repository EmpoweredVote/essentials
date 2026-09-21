#!/usr/bin/env node
/**
 * Find banner candidates on Wikimedia Commons.
 *
 * 🔴 KEYWORD SEARCH AND GUESSED CATEGORY NAMES ARE BOTH UNRELIABLE, and this script
 * exists because both failed on real waves:
 *
 *   - The Bend original was missed by keyword search, by three plausible categories,
 *     AND by the Wikipedia article images. It was found only by sweeping ~1,328 files
 *     and matching on exact dimensions.
 *   - On Charlotte, SEVEN guessed category names returned 0 files
 *     ("Category:Skylines of Charlotte, North Carolina", "Category:Uptown Charlotte",
 *     "Category:Downtown Charlotte, North Carolina" -- none exist), and a recursive
 *     walk of "Category:Charlotte, North Carolina" to depth 3 drifted into US-74
 *     HIGHWAY PHOTOGRAPHY across the whole state without surfacing one skyline.
 *     The real category was "Category:Charlotte skylines" -- PLURAL.
 *
 * ▶ SO THE METHOD IS: find ONE good file with a keyword search, ask THAT FILE which
 *   categories it belongs to, then sweep those. Do not guess category names, and do
 *   not walk the city tree hoping to stumble on the right branch.
 *
 *     node scripts/banners/commons_sweep.mjs --search "Charlotte North Carolina skyline"
 *     node scripts/banners/commons_sweep.mjs --categories-of "File:<the good one>.jpg"
 *     node scripts/banners/commons_sweep.mjs --category "Category:Charlotte skylines"
 *
 * Filtering is on MEASURABLE properties only -- width, aspect, licence. Composition is
 * judged later, in the 6:1 band, by eye: that is certify_banner.py's job, not this one.
 *
 * ⚠ Wikimedia 429s a generic browser User-Agent, so this sends the project's own and
 *   backs off on 429.
 *
 * Output is a table, and --json writes a candidates file that certify_banner.py reads
 * directly, so the two tools chain.
 */

import fs from 'node:fs';
import process from 'node:process';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = { 'User-Agent': 'EmpoweredVote/1.0 (info@empowered.vote)' };

// The banner asset is 1700x540. A source narrower than that cannot fill it without
// upscaling, and one under ~1.4:1 loses most of its frame to the ratio crop.
const DEFAULT_MIN_WIDTH = 1700;
const DEFAULT_MIN_RATIO = 1.4;

// D-09: real licensed photos only. AI generation is excluded by design, because a
// fabricated cityscape risks inventing landmarks.
const OK_LICENCE = /^(cc0|cc[ -]by([ -]sa)?([ -][0-9.]+)?|public domain|pd[ -]|no restrictions)/i;

// Maintenance categories say nothing about a photograph's subject. The subject ones
// are the lead, so they are marked and the rest are quietly listed.
const NOISE_CATEGORY = /^Category:(CC-|Files? |Photos? from |Panoramio|Media |Self-published|Images? (with|from)|Photographs taken on|Uploaded|.*needing |.*missing )/i;

const USAGE = `
Find banner candidates on Wikimedia Commons.

  --search "<terms>"          keyword search; use it to find ONE good file
  --categories-of "File:X"    print the categories that file belongs to  <-- do this second
  --category "Category:Y"     sweep a category (repeatable)              <-- then this
  --min-width <px>            default ${DEFAULT_MIN_WIDTH}
  --min-ratio <n>             default ${DEFAULT_MIN_RATIO}
  --all-licences              include files whose licence is not obviously reusable
  --json <path>               write a certify_banner.py candidates file
  --limit <n>                 cap rows printed (default 60)
`;

const argv = process.argv.slice(2);
const opt = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const all = (name) => argv.reduce((acc, a, i) => (a === name ? [...acc, argv[i + 1]] : acc), []);

const minWidth = Number(opt('--min-width', DEFAULT_MIN_WIDTH));
const minRatio = Number(opt('--min-ratio', DEFAULT_MIN_RATIO));
const anyLicence = argv.includes('--all-licences');
const limit = Number(opt('--limit', 60));

async function api(params) {
  const url = new URL(API);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: 2, ...params })) {
    url.searchParams.set(k, v);
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const res = await fetch(url, { headers: UA });
    if (res.status === 429) {
      await new Promise((r) => { setTimeout(r, 1500 * (attempt + 1)); });
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('rate limited after 4 attempts');
}

const clean = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

const IMAGE_PROPS = {
  prop: 'imageinfo',
  iiprop: 'url|size|extmetadata',
  iiextmetadatafilter: 'LicenseShortName|Artist|DateTimeOriginal',
};

function toRow(page) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata || {};
  return {
    title: page.title.replace(/^File:/, ''),
    width: info.width,
    height: info.height,
    ratio: +(info.width / info.height).toFixed(2),
    license: clean(meta.LicenseShortName?.value),
    author: clean(meta.Artist?.value),
    date: clean(meta.DateTimeOriginal?.value).replace(/^Taken on /, '').slice(0, 19),
    url: info.url,
  };
}

async function search(terms) {
  const json = await api({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${terms}`,
    gsrnamespace: 6,
    gsrlimit: 100,
    ...IMAGE_PROPS,
  });
  return (json.query?.pages || []).map(toRow).filter(Boolean);
}

async function categoryFiles(category) {
  const out = [];
  let cont;
  do {
    const json = await api({
      action: 'query',
      generator: 'categorymembers',
      gcmtitle: category,
      gcmtype: 'file',
      gcmlimit: 500,
      ...(cont ? { gcmcontinue: cont } : {}),
      ...IMAGE_PROPS,
    });
    out.push(...(json.query?.pages || []).map(toRow).filter(Boolean));
    cont = json.continue?.gcmcontinue;
  } while (cont);
  return out;
}

async function categoriesOf(file) {
  const json = await api({
    action: 'query', titles: file, prop: 'categories', cllimit: 200,
  });
  const page = json.query?.pages?.[0];
  if (!page || page.missing) throw new Error(`no such file: ${file}`);
  return (page.categories || []).map((c) => c.title);
}

const slugify = (title) => title
  .replace(/\.[a-z0-9]+$/i, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 48);

function writeCandidates(jsonPath, kept) {
  // Deliberately NO crop_width and NO anchors: those are decided by looking at the
  // band, and writing a guess here would dress a guess up as a measurement.
  const candidates = kept.map((r) => ({
    slug: slugify(r.title),
    title: r.title.replace(/\.[a-z0-9]+$/i, ''),
    author: r.author,
    license: r.license,
    url: r.url,
    verdict: 'rejected',
    note: '',
  }));
  fs.writeFileSync(jsonPath, JSON.stringify(candidates, null, 1));
  console.log(`\nwrote ${jsonPath} (${candidates.length} candidates, all marked "rejected")`);
  console.log('  Set verdict:"proposed" on the one you are proposing, add crop_width and');
  console.log('  anchors once you have seen the band, and write a note on every refusal --');
  console.log('  the reasons transfer to the next city. Then:');
  console.log(`    python scripts/banners/certify_banner.py --candidates ${jsonPath} \\`);
  console.log('        --baseline states/<AB>.jpg --sheet /tmp/certification.html');
}

// 🔴 EVERYTHING ASYNC LIVES IN main() AND RETURNS A CODE. Calling process.exit() while
// a fetch keep-alive socket is still open trips a libuv assertion on Windows
// ("!(handle->flags & UV_HANDLE_CLOSING)") and the process leaves with code 127 -- a
// script that printed the right answer and then reported failure.
async function main() {
  if (!argv.length || argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    return argv.length ? 0 : 1;
  }

  const categoriesTarget = opt('--categories-of');
  if (categoriesTarget) {
    const cats = await categoriesOf(categoriesTarget);
    console.log(`\n${cats.length} categories on ${categoriesTarget}:`);
    for (const c of cats) console.log(`  ${NOISE_CATEGORY.test(c) ? ' ' : '>'} ${c}`);
    console.log('\n  > marks the subject categories. Sweep those next:');
    console.log('    node scripts/banners/commons_sweep.mjs --category "<one of them>"');
    return 0;
  }

  const searchTerms = all('--search');
  const categories = all('--category');
  if (!searchTerms.length && !categories.length) {
    console.log(USAGE);
    return 1;
  }

  const seen = new Map();
  for (const terms of searchTerms) {
    const rows = await search(terms);
    console.log(`${String(rows.length).padStart(5)} hits   search: ${terms}`);
    for (const r of rows) if (!seen.has(r.title)) seen.set(r.title, r);
  }
  for (const category of categories) {
    try {
      const rows = await categoryFiles(category);
      console.log(`${String(rows.length).padStart(5)} files  ${category}`);
      if (!rows.length) {
        console.log('        ^ 0 files usually means the category name is GUESSED and does '
          + 'not exist. Use --categories-of on a file you know is good.');
      }
      for (const r of rows) if (!seen.has(r.title)) seen.set(r.title, r);
    } catch (err) {
      console.log(`  ! ${category}: ${err.message}`);
    }
  }

  const kept = [...seen.values()]
    .filter((r) => r.width >= minWidth && r.ratio >= minRatio)
    .filter((r) => anyLicence || OK_LICENCE.test(r.license))
    .sort((a, b) => b.ratio - a.ratio || b.width - a.width);

  console.log(`\n${seen.size} distinct files; ${kept.length} are >=${minWidth}px wide, `
    + `>=${minRatio}:1${anyLicence ? '' : ', and obviously reusable'}\n`);
  for (const r of kept.slice(0, limit)) {
    console.log(`${String(r.width).padStart(6)}x${String(r.height).padStart(5)} `
      + `${String(r.ratio).padStart(5)}:1 ${r.date.padEnd(19)} ${r.license.padEnd(15)} `
      + `${r.author.slice(0, 30).padEnd(30)} ${r.title.slice(0, 54)}`);
  }
  if (kept.length > limit) console.log(`  ... and ${kept.length - limit} more (raise --limit)`);

  const jsonPath = opt('--json');
  if (jsonPath) writeCandidates(jsonPath, kept);
  return 0;
}

main()
  .then((code) => { process.exitCode = code; })
  .catch((err) => {
    console.error(`ERROR: ${err.message}`);
    process.exitCode = 1;
  });
