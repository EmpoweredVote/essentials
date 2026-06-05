#!/usr/bin/env python3
"""
MD State Executives headshot download + process + upload to Supabase Storage.
Phase 92-02 / Migration 270

5 Maryland constitutional officers:
  external_id -240001 — Wes Moore (Governor)
  external_id -240002 — Aruna Miller (Lieutenant Governor)
  external_id -240003 — Anthony G. Brown (Attorney General)
  external_id -240004 — Brooke Lierman (Comptroller)
  external_id -240005 — Dereck E. Davis (State Treasurer)

Processing:
  - Download from official government sources or Wikimedia Commons
  - Crop to 4:5 ratio FIRST (center crop, never stretch)
  - Resize to 600x750 Lanczos JPEG quality=90
  - Upload to politician_photos bucket as {politician_id}-headshot.jpg
  - Insert politician_images row (type='default', photo_license='public_domain')

Idempotent: checks for existing politician_images row before inserting.
Re-running skips officials that already have images.

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<key>  (or SUPABASE_SECRET_KEY)
  python3 scripts/md_executives_headshots.py
"""

import io
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: python3 -m pip install Pillow")
    sys.exit(1)

# ============================================================
# Configuration
# ============================================================
SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
SERVICE_KEY = (
    os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or
    os.environ.get('SUPABASE_SECRET_KEY') or
    ''
)
if not SERVICE_KEY:
    print("ERROR: set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in your environment")
    sys.exit(1)

# Security check: key must start with eyJ (JWT); never commit a key
if not SERVICE_KEY.startswith('eyJ'):
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY does not look like a valid JWT (must start with eyJ)")
    sys.exit(1)

BUCKET = "politician_photos"
STORAGE_BASE = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/"
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_md_exec_headshots")

TARGET_W = 600
TARGET_H = 750

# ============================================================
# Officials: (external_id, politician_id, name, source_url)
# politician_id values confirmed from DB 2026-06-05 via:
#   SELECT external_id, id FROM essentials.politicians
#   WHERE external_id BETWEEN -240010 AND -240001 ORDER BY external_id DESC
# ============================================================
OFFICIALS = [
    (
        -240001,
        "21e534c8-c0c0-42f5-b52b-5eb2f246d632",
        "Wes Moore",
        # Maryland Governor's office CDN — WebP, labeled 3:4 (504x672); crop to 4:5
        "https://cdn.maryland.gov/maryland-cms/prod/governor/s3fs-public/styles/3_4_504x672_focal_point_webp/public/images/2026-04/gov%201st%20size.png.webp",
    ),
    (
        -240002,
        "ea9fc2d6-3b26-469a-978c-e8c846d2d49a",
        "Aruna Miller",
        # Maryland LG office CDN — WebP, same style as Governor
        "https://cdn.maryland.gov/maryland-cms/prod/governor/s3fs-public/styles/3_4_504x672_focal_point_webp/public/images/2026-04/lg%201st%20size.png.webp",
    ),
    (
        -240003,
        "60329719-1d5b-4bb4-8295-38ea18f6f378",
        "Anthony G. Brown",
        # Maryland Office of the Attorney General — JPEG 512x512 square; center-crop to 4:5
        "https://oag.maryland.gov/our-office/PublishingImages/AttorneyGeneral.jpg",
    ),
    (
        -240004,
        "b26fb5d2-90eb-4108-8ce5-838df719473d",
        "Brooke Lierman",
        # Maryland Comptroller office — PNG, already portrait-cropped per filename
        "https://www.marylandcomptroller.gov/about/brooke-lierman/_jcr_content/root/container/heroContainer/hero.coreimg.png/1740686184941/comptroller-portrait-cropped.png",
    ),
    (
        -240005,
        "75378a96-8886-46eb-b0c1-37cbe2579265",
        "Dereck E. Davis",
        # Wikimedia Commons — public domain government photo, already cropped per filename
        "https://upload.wikimedia.org/wikipedia/commons/c/cb/Dereck_E._Davis_4_23_2025_%2854473095147%29_%28cropped%29.jpg",
    ),
]


# ============================================================
# Image processing
# ============================================================

def crop_and_resize(img: Image.Image, name: str) -> Image.Image:
    """Crop to 4:5 ratio FIRST (center crop, never stretch), then resize to 600x750 Lanczos."""
    w, h = img.size
    target_ratio = 4 / 5  # 0.80

    current_ratio = w / h

    if current_ratio > target_ratio:
        # Image is wider than 4:5 — center-crop width
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
        print(f"  Crop: too wide ({w}x{h}) -> center-crop to ({new_w}x{h})")
    elif current_ratio < target_ratio:
        # Image is taller than 4:5 — top-crop (keep top portion; eyes at ~1/3 from top)
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))
        print(f"  Crop: too tall ({w}x{h}) -> top-crop to ({w}x{new_h})")
    else:
        print(f"  Crop: already 4:5 ({w}x{h}) — no crop needed")

    # Convert to RGB for JPEG (handles WebP, PNG with alpha, RGBA, etc.)
    if img.mode != 'RGB':
        img = img.convert('RGB')

    # Resize to target dimensions using Lanczos resampling
    result = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)
    print(f"  Resize: -> {TARGET_W}x{TARGET_H} Lanczos")
    return result


def download_image(url: str, name: str) -> bytes:
    """Download image with browser-like User-Agent (some .gov hosts 403 on empty UA)."""
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        ),
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = resp.read()
    print(f"  Downloaded {len(data):,} bytes")
    return data


def process_image(raw_bytes: bytes, name: str) -> bytes:
    """Open, inspect, crop to 4:5, resize to 600x750, return JPEG bytes."""
    img = Image.open(io.BytesIO(raw_bytes))
    orig_w, orig_h = img.size
    print(f"  Original: {orig_w}x{orig_h} mode={img.mode}")
    img = crop_and_resize(img, name)
    out = io.BytesIO()
    img.save(out, format='JPEG', quality=90, optimize=True)
    data = out.getvalue()
    print(f"  Final JPEG: {img.size[0]}x{img.size[1]} ({len(data):,} bytes)")
    return data


# ============================================================
# Supabase Storage upload
# ============================================================

def upload_to_storage(politician_id: str, jpeg_bytes: bytes, name: str) -> str:
    """Upload JPEG to Supabase Storage via REST API (upsert=true)."""
    storage_path = f"{politician_id}-headshot.jpg"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"

    req = urllib.request.Request(
        upload_url,
        data=jpeg_bytes,
        method="POST",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Storage upload HTTP {e.code} for {name}: {body}")

    public_url = f"{STORAGE_BASE}{storage_path}"
    print(f"  Uploaded: {storage_path}")
    return public_url


# ============================================================
# Supabase DB — politician_images insert (via psql direct connection)
# Note: Supabase REST API does not expose the 'essentials' schema
# (only public, civic_spaces, connect, empower, inform, etc. are exposed).
# Direct psql connection is required for essentials schema writes.
# ============================================================

def get_db_url() -> str:
    """Read DATABASE_URL from EV-Accounts backend .env file."""
    env_path = "C:/EV-Accounts/backend/.env"
    try:
        with open(env_path) as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    return line.split("=", 1)[1].strip()
    except FileNotFoundError:
        pass
    # Fallback to environment variable
    return os.environ.get("DATABASE_URL", "")


def check_image_exists(politician_id: str, db_url: str) -> bool:
    """Check if a politician_images row already exists for this politician_id via psql."""
    sql = f"SELECT COUNT(*) FROM essentials.politician_images WHERE politician_id = '{politician_id}' AND type = 'default';"
    result = subprocess.run(
        ["psql", db_url, "-t", "-c", sql],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode == 0:
        count = result.stdout.strip()
        try:
            return int(count) > 0
        except ValueError:
            return False
    return False


def insert_politician_image(politician_id: str, url: str, name: str, db_url: str) -> None:
    """Insert row into essentials.politician_images via psql (essentials schema not in REST API)."""
    sql = f"""
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       '{politician_id}',
       '{url}',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = '{politician_id}'
);
"""
    result = subprocess.run(
        ["psql", db_url, "-c", sql],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        raise RuntimeError(f"psql insert failed for {name}: {result.stderr}")
    output = result.stdout.strip()
    if "INSERT 0 0" in output:
        print(f"  Row already exists (idempotent skip)")
    else:
        print(f"  Inserted politician_images row via psql")


# ============================================================
# Main
# ============================================================

def main():
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    results = []

    db_url = get_db_url()
    if not db_url:
        print("ERROR: could not find DATABASE_URL in C:/EV-Accounts/backend/.env or environment")
        sys.exit(1)

    print(f"Processing {len(OFFICIALS)} MD executive officials")
    print(f"Storage bucket: {BUCKET}")
    print(f"Temp dir: {TMP_DIR}")
    print()

    for ext_id, pol_id, name, source_url in OFFICIALS:
        print(f"[{ext_id}] {name}")
        print(f"  Source: {source_url[:80]}")
        print(f"  UUID:   {pol_id}")

        try:
            # Idempotency check: skip if image already exists in DB
            if check_image_exists(pol_id, db_url):
                print(f"  SKIP: politician_images row already exists — idempotent")
                results.append((ext_id, name, "SKIPPED"))
                print()
                continue

            raw = download_image(source_url, name)
            jpeg = process_image(raw, name)

            # Save processed locally for reference
            local_path = TMP_DIR / f"{pol_id}-headshot.jpg"
            local_path.write_bytes(jpeg)
            print(f"  Saved locally: {local_path.name}")

            storage_url = upload_to_storage(pol_id, jpeg, name)
            insert_politician_image(pol_id, storage_url, name, db_url)
            results.append((ext_id, name, "OK", storage_url))

        except Exception as e:
            print(f"  ERROR: {e}")
            results.append((ext_id, name, f"ERROR: {e}"))

        print()

    # ============================================================
    # Summary
    # ============================================================
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    ok = [r for r in results if len(r) >= 3 and r[2] == "OK"]
    skipped = [r for r in results if len(r) >= 3 and r[2] == "SKIPPED"]
    err = [r for r in results if len(r) >= 3 and r[2].startswith("ERROR")]

    print(f"Succeeded: {len(ok)}")
    for r in ok:
        storage_url = r[3] if len(r) > 3 else "N/A"
        print(f"  OK      [{r[0]}] {r[1]}")
        print(f"           {storage_url}")

    if skipped:
        print(f"\nSkipped (already uploaded): {len(skipped)}")
        for r in skipped:
            print(f"  SKIPPED [{r[0]}] {r[1]}")

    if err:
        print(f"\nFailed: {len(err)}")
        for r in err:
            print(f"  ERR     [{r[0]}] {r[1]}: {r[2]}")
        sys.exit(1)

    total_done = len(ok) + len(skipped)
    if total_done < len(OFFICIALS):
        print(f"\nWARNING: Only {total_done}/{len(OFFICIALS)} officials processed successfully")
        sys.exit(1)
    else:
        print(f"\nAll {len(OFFICIALS)} officials complete ({len(ok)} new uploads, {len(skipped)} skipped)")


if __name__ == "__main__":
    main()
