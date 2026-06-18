"""
LAUSD Board of Education Headshots - Process & Upload (Python PIL)

Processing pipeline:
1. Crop to 4:5 aspect ratio first (never stretch)
2. Resize to 600x750 (Lanczos)
3. Save as JPEG quality 90
4. Upload to Supabase Storage
5. Insert politician_images rows
"""

import os
import sys
import math
import requests
import psycopg2
import uuid
from PIL import Image
import io

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(SCRIPT_DIR, 'raw')
PROCESSED_DIR = os.path.join(SCRIPT_DIR, 'processed')

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: set DATABASE_URL in your environment")
    sys.exit(1)
SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SECRET_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
if not SUPABASE_SERVICE_KEY:
    print("ERROR: set SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in your environment")
    sys.exit(1)
BUCKET = "politician_photos"

# Maps raw filename -> politician UUID (from DB after migration 198)
MEMBERS = [
    {
        'external_id': -6004002,
        'name': 'Dr. Rocio Rivas',
        'politician_id': 'aefa83dc-6bd7-49fd-a759-2187a94ac0db',
        'raw_file': '-6004002_rivas.jpg',
        'license': 'government-official',
    },
    {
        'external_id': -6004003,
        'name': 'Scott Schmerelson',
        'politician_id': 'fcafc695-2a41-41c0-831d-da28c5bf3c9e',
        'raw_file': '-6004003_schmerelson.jpg',
        'license': 'government-official',
    },
    {
        'external_id': -6004004,
        'name': 'Nick Melvoin',
        'politician_id': '72828ba8-a748-4a81-80ff-774464e42640',
        'raw_file': '-6004004_melvoin.jpg',
        'license': 'government-official',
    },
    {
        'external_id': -6004006,
        'name': 'Kelly Gonez',
        'politician_id': '48f9dd33-0c21-4c49-a128-90dc8736bcef',
        'raw_file': '-6004006_gonez.jpg',
        'license': 'cc0',
    },
    {
        'external_id': -6004007,
        'name': 'Tanya Ortiz Franklin',
        'politician_id': '8bb33070-9af9-4aae-a5af-337414a35f0a',
        'raw_file': '-6004007_ortiz_franklin.jpg',
        'license': 'government-official',
    },
]

GAPS = [
    {
        'external_id': -6004001,
        'name': 'Sherlett Hendy Newbill (D1)',
        'politician_id': 'ba2fffa5-6ff1-4aae-b9ee-592e09ee86f0',
        'reason': 'lausd.org blocked by Cloudflare WAF; no Wikipedia/Commons photo found',
    },
    {
        'external_id': -6004005,
        'name': 'Karla Griego (D5)',
        'politician_id': '228a28d7-4057-4d08-aa65-c7a2f1b0f38e',
        'reason': 'lausd.org blocked by Cloudflare WAF; no Wikipedia/Commons photo found',
    },
]

def crop_to_4_5(img):
    """Crop image to 4:5 aspect ratio. Never stretch — only crop."""
    w, h = img.size
    target_ratio = 4 / 5  # 0.8

    current_ratio = w / h

    if abs(current_ratio - target_ratio) < 0.01:
        # Already close enough to 4:5
        return img

    if current_ratio > target_ratio:
        # Too wide — crop width
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    else:
        # Too tall — crop height (keep top to preserve face)
        # Keep top 80% to maintain eyes at ~1/3 from top
        new_h = int(w / target_ratio)
        # Don't go below 0 — if new_h > h, we have rounding issues
        new_h = min(new_h, h)
        return img.crop((0, 0, w, new_h))

def process_image(raw_path):
    """Crop to 4:5, resize to 600x750 Lanczos, return JPEG bytes at quality 90."""
    with Image.open(raw_path) as img:
        # Convert to RGB (handles PNG with alpha, palette modes, etc.)
        if img.mode in ('L', 'LA'):
            raise ValueError(f"Greyscale image rejected (mode={img.mode}) — find a color source photo")
        if img.mode in ('RGBA', 'P'):
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            bg.paste(img, mask=img.split()[-1])
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        print(f"    Input: {img.size[0]}x{img.size[1]} ({img.mode})")

        # Step 1: Crop to 4:5
        img = crop_to_4_5(img)
        print(f"    After crop: {img.size[0]}x{img.size[1]}")

        # Step 2: Resize to 600x750 Lanczos
        img = img.resize((600, 750), Image.LANCZOS)
        print(f"    After resize: {img.size[0]}x{img.size[1]}")

        # Step 3: Save as JPEG quality 90
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=90)
        return buf.getvalue()

def upload_to_storage(jpg_bytes, politician_id):
    """Upload JPEG bytes to Supabase Storage."""
    object_path = f"{politician_id}-headshot.jpg"
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{object_path}"
    headers = {
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
    }
    resp = requests.post(url, data=jpg_bytes, headers=headers)
    if resp.status_code not in (200, 201):
        raise Exception(f"Storage upload failed: {resp.status_code} {resp.text}")
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{object_path}"
    return public_url

def insert_politician_image(conn, politician_id, url, photo_license):
    """Insert a row into essentials.politician_images."""
    with conn.cursor() as cur:
        # Check if row already exists for this politician (check both 'default' and 'headshot' for idempotency)
        cur.execute(
            "SELECT id FROM essentials.politician_images WHERE politician_id = %s AND type IN ('default', 'headshot')",
            (politician_id,)
        )
        existing = cur.fetchone()
        if existing:
            # Update existing row — ensure type='default' (UI filters on type='default')
            cur.execute(
                "UPDATE essentials.politician_images SET url = %s, photo_license = %s, type = 'default' WHERE politician_id = %s AND type IN ('default', 'headshot')",
                (url, photo_license, politician_id)
            )
            print(f"    Updated existing politician_images row (type set to 'default')")
        else:
            # Insert new row — type='default' so UI can display it
            img_id = str(uuid.uuid4())
            cur.execute(
                """INSERT INTO essentials.politician_images
                   (id, politician_id, url, type, photo_license)
                   VALUES (%s, %s, %s, 'default', %s)""",
                (img_id, politician_id, url, photo_license)
            )
            print(f"    Inserted politician_images row id={img_id}")
    conn.commit()

def main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    print("=== LAUSD Board Headshots - Process & Upload ===\n")

    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    print("Connected.\n")

    processed_count = 0
    errors = []

    for member in MEMBERS:
        print(f"Processing: {member['name']} (ext={member['external_id']})")
        raw_path = os.path.join(RAW_DIR, member['raw_file'])

        if not os.path.exists(raw_path):
            msg = f"RAW FILE NOT FOUND: {raw_path}"
            print(f"  ERROR: {msg}")
            errors.append(f"{member['name']}: {msg}")
            continue

        try:
            # Process image
            jpg_bytes = process_image(raw_path)

            # Save processed copy
            processed_path = os.path.join(PROCESSED_DIR, f"{member['politician_id']}-headshot.jpg")
            with open(processed_path, 'wb') as f:
                f.write(jpg_bytes)
            print(f"    Saved: {processed_path} ({len(jpg_bytes) // 1024}KB)")

            # Upload to storage
            public_url = upload_to_storage(jpg_bytes, member['politician_id'])
            print(f"    Uploaded: {public_url}")

            # Insert DB row
            insert_politician_image(conn, member['politician_id'], public_url, member['license'])

            processed_count += 1
            print(f"  OK: {member['name']}\n")

        except Exception as e:
            msg = str(e)
            print(f"  ERROR: {msg}\n")
            errors.append(f"{member['name']}: {msg}")

    conn.close()

    print("\n=== SUMMARY ===")
    print(f"Processed: {processed_count}/{len(MEMBERS)}")
    print()

    if errors:
        print("Errors:")
        for e in errors:
            print(f"  - {e}")
        print()

    print("GAPS (no official headshot found - documented, not silently skipped):")
    for gap in GAPS:
        print(f"  - {gap['name']}: {gap['reason']}")

    print(f"\nHeadshot coverage: {processed_count}/7 board members have 600x750 headshots")
    print("2 gaps (D1 Newbill, D5 Griego) need manual photo sourcing from lausd.org")

if __name__ == '__main__':
    main()
