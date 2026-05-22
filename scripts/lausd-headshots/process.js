/**
 * LAUSD Board of Education Headshots - Process & Upload Script
 *
 * Processing pipeline per image:
 *   1. Crop to 4:5 aspect ratio FIRST (never stretch, only crop)
 *      - If width/height > 4/5 (too wide): center-crop width to height * 4/5
 *      - If width/height < 4/5 (too tall): top-crop height to width * 5/4 (keep top 80%)
 *   2. Resize to 600x750 (Lanczos resampling, quality 90)
 *   3. Save as JPEG to processed/ directory
 *   4. Upload to Supabase Storage bucket 'politician_photos' at {politician_id}-headshot.jpg
 *   5. Insert into essentials.politician_images (id, politician_id, url, type='headshot')
 *      - NO photo_origin_url column (does not exist on this table)
 *
 * Politician UUIDs (from migration 198 insert):
 *   -6004001 Newbill:        ba2fffa5-6ff1-4aae-b9ee-592e09ee86f0 (GAP - no image)
 *   -6004002 Rivas:          aefa83dc-6bd7-49fd-a759-2187a94ac0db
 *   -6004003 Schmerelson:    fcafc695-2a41-41c0-831d-da28c5bf3c9e
 *   -6004004 Melvoin:        72828ba8-a748-4a81-80ff-774464e42640
 *   -6004005 Griego:         228a28d7-4057-4d08-aa65-c7a2f1b0f38e (GAP - no image)
 *   -6004006 Gonez:          48f9dd33-0c21-4c49-a128-90dc8736bcef
 *   -6004007 Ortiz Franklin: 8bb33070-9af9-4aae-a5af-337414a35f0a
 *
 * Usage: node scripts/lausd-headshots/process.js
 *   Requires: npm install sharp (or use Python PIL approach via process_py.py)
 *
 * NOTE: This script uses Python PIL via child_process since sharp is not installed.
 */

// Since sharp is not installed, we use a Python subprocess for PIL processing
// The actual processing is done by process.py which this script delegates to

const { execSync } = require('child_process');
const path = require('path');

const scriptDir = path.join(__dirname);

// Run the Python processing script
console.log('Running Python PIL processing script...');
try {
  execSync(`python3 "${path.join(scriptDir, 'process.py')}"`, {
    stdio: 'inherit',
    cwd: scriptDir,
  });
} catch (err) {
  console.error('Python processing failed:', err.message);
  process.exit(1);
}
