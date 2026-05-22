/**
 * LAUSD Board of Education Headshots - Download Script
 *
 * Sources:
 *   - D2 Rivas:          Supabase Storage (existing -202137 photo, 2112x2640 = perfect 4:5)
 *   - D3 Schmerelson:    Supabase Storage (existing -202138 photo, 200x300 = 2:3, needs crop)
 *   - D4 Melvoin:        Supabase Storage (existing -202139 photo, 200x300 = 2:3, needs crop)
 *   - D6 Gonez:          Wikimedia Commons (Kelly_Gonez,_2023_(cropped).jpg, 178x238)
 *   - D7 Ortiz Franklin: Supabase Storage (existing -202142 photo, 200x300 = 2:3, needs crop)
 *
 * Gaps (no official headshot found):
 *   - D1 Newbill (Sherlett Hendy Newbill): lausd.org blocked by Cloudflare; no Wikipedia/Commons image
 *   - D5 Griego (Karla Griego):             lausd.org blocked by Cloudflare; no Wikipedia/Commons image
 *
 * NOTE: lausd.org and lausd.net are behind Cloudflare WAF (HTTP 403/blocked).
 * laschoolboard.org is inaccessible (HTTP redirect loop). All photo requests are rejected
 * without a real browser session. No fallback sources were found without superimposed graphics.
 *
 * Usage: node scripts/lausd-headshots/download.js
 * Output: raw/ directory with downloaded originals
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const STORAGE_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos';
const RAW_DIR = path.join(__dirname, 'raw');

// Board members with downloadable sources
const SOURCES = [
  {
    externalId: -6004002,
    name: 'Dr. Rocio Rivas (D2)',
    filename: '-6004002_rivas.jpg',
    url: `${STORAGE_BASE}/b2cb156d-7322-470d-9f82-6f08e18991e8-headshot.jpg`,
    note: 'Existing storage photo (2112x2640, 4:5 ratio - only resize needed)',
  },
  {
    externalId: -6004003,
    name: 'Scott Schmerelson (D3)',
    filename: '-6004003_schmerelson.jpg',
    url: `${STORAGE_BASE}/ba333bf5-bba4-4c9c-9791-4a603d1a4d0a-headshot.jpg`,
    note: 'Existing storage photo (200x300, 2:3 ratio - crop to 4:5 then resize)',
  },
  {
    externalId: -6004004,
    name: 'Nick Melvoin (D4)',
    filename: '-6004004_melvoin.jpg',
    url: `${STORAGE_BASE}/3c29ed93-ba65-468d-b310-448134890d96-headshot.png`,
    note: 'Existing storage photo (200x300, 2:3 ratio - crop to 4:5 then resize)',
  },
  {
    externalId: -6004006,
    name: 'Kelly Gonez (D6)',
    filename: '-6004006_gonez.jpg',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Kelly_Gonez%2C_2023_%28cropped%29.jpg',
    note: 'Wikimedia Commons CC-Zero photo (178x238, close to 4:5)',
  },
  {
    externalId: -6004007,
    name: 'Tanya Ortiz Franklin (D7)',
    filename: '-6004007_ortiz_franklin.jpg',
    url: `${STORAGE_BASE}/ef193cfc-d30a-4085-b673-8b3a55da35c4-headshot.jpg`,
    note: 'Existing storage photo (200x300, 2:3 ratio - crop to 4:5 then resize)',
  },
];

// Gaps - no photo found
const GAPS = [
  {
    externalId: -6004001,
    name: 'Sherlett Hendy Newbill (D1)',
    reason: 'lausd.org blocked by Cloudflare WAF; no Wikipedia/Commons photo found',
  },
  {
    externalId: -6004005,
    name: 'Karla Griego (D5)',
    reason: 'lausd.org blocked by Cloudflare WAF; no Wikipedia/Commons photo found',
  },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(destPath, () => {});
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
      file.on('error', (err) => { fs.unlink(destPath, () => {}); reject(err); });
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });

  console.log('=== LAUSD Board Headshots - Download ===\n');

  for (const src of SOURCES) {
    const destPath = path.join(RAW_DIR, src.filename);
    console.log(`Downloading ${src.name}...`);
    console.log(`  Source: ${src.url}`);
    console.log(`  Note: ${src.note}`);
    try {
      await downloadFile(src.url, destPath);
      const stat = fs.statSync(destPath);
      console.log(`  -> ${destPath} (${Math.round(stat.size / 1024)}KB)`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
    console.log();
  }

  console.log('=== GAPS (no photo source found) ===');
  for (const gap of GAPS) {
    console.log(`  ${gap.name}: ${gap.reason}`);
  }
}

main().catch(console.error);
