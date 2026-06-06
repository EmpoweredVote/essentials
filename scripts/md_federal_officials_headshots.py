#!/usr/bin/env python3
"""
MD Federal Officials headshot download + process + upload to Supabase Storage.
Phase 94-01 / MD-GOV-06 / D-05

10 Maryland federal officials:
  external_id -400033  — Chris Van Hollen (US Senate)
  external_id -400034  — Angela Alsobrooks (US Senate)
  external_id -2440001 — Andy Harris (US House, MD-01)
  external_id -2440002 — Johnny Olszewski (US House, MD-02)
  external_id -2440003 — Sarah Elfreth (US House, MD-03)
  external_id -2440004 — Glenn Ivey (US House, MD-04)
  external_id -2440005 — Steny Hoyer (US House, MD-05)
  external_id -2440006 — April McClain Delaney (US House, MD-06)
  external_id -2440007 — Kweisi Mfume (US House, MD-07)
  external_id -2440008 — Jamie Raskin (US House, MD-08)

Processing pipeline:
  1. Resolve politician UUIDs dynamically via psycopg2 (external_id IN (-400033, -400034)
     OR BETWEEN -2440008 AND -2440001) — asserts exactly 10 rows found
  2. Primary source: congress.gov member portrait
     (https://www.congress.gov/img/member/{bioguide_id}_200.jpg)
  3. On 4xx / URLError / timeout: auto-fall back to Wikimedia Commons public-domain photo
     (no halt — per D-02)
  4. Crop to 4:5 ratio FIRST (center crop if wider, top crop if taller — never stretch)
  5. Resize to 600x750 Lanczos, JPEG quality=90, optimize=True
  6. Upload to Supabase Storage bucket politician_photos as {politician_id}-headshot.jpg
     (x-upsert: true)
  7. INSERT into essentials.politician_images WHERE NOT EXISTS (idempotent guard on
     politician_id + type='default')

Idempotent: re-running results in 0 new uploads and 0 new inserts (skipped_exists=10).

Traceability: Phase 94 / D-05 / MD-GOV-06
Photo license: 'public_domain' (congress.gov official portraits + Wikimedia Commons
               government photos; same precedent as CA/OR/ME federal scripts)

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<key>  (or SUPABASE_SECRET_KEY)
  python3 scripts/md_federal_officials_headshots.py
"""

import io
import json
import os
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

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed. Run: python3 -m pip install psycopg2-binary")
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
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_md_federal_headshots")

TARGET_W = 600
TARGET_H = 750

# Per-official source URL pairs: (external_id, name, primary_url, fallback_url)
# UUIDs are resolved dynamically at runtime via resolve_politician_uuids()
# Bioguide IDs verified via https://bioguide.congress.gov/ 2026-06-05
_SOURCE_PAIRS = [
    (
        -400033,
        "Chris Van Hollen",
        "https://www.congress.gov/img/member/v000128_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Chris_Van_Hollen_official_portrait_117th_Congress.jpg/440px-Chris_Van_Hollen_official_portrait_117th_Congress.jpg",
    ),
    (
        -400034,
        "Angela Alsobrooks",
        "https://www.congress.gov/img/member/a000391_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Angela_Alsobrooks_official_portrait_119th_Congress.jpg/440px-Angela_Alsobrooks_official_portrait_119th_Congress.jpg",
    ),
    (
        -2440001,
        "Andy Harris",
        "https://www.congress.gov/img/member/h001052_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Andy_Harris_official_portrait_118th_Congress.jpg/440px-Andy_Harris_official_portrait_118th_Congress.jpg",
    ),
    (
        -2440002,
        "Johnny Olszewski",
        "https://www.congress.gov/img/member/o000200_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Johnny_Olszewski_official_portrait_119th_Congress.jpg/440px-Johnny_Olszewski_official_portrait_119th_Congress.jpg",
    ),
    (
        -2440003,
        "Sarah Elfreth",
        "https://www.congress.gov/img/member/e000299_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Sarah_Elfreth_official_portrait_119th_Congress.jpg/440px-Sarah_Elfreth_official_portrait_119th_Congress.jpg",
    ),
    (
        -2440004,
        "Glenn Ivey",
        "https://www.congress.gov/img/member/i000058_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Glenn_Ivey_official_portrait_118th_Congress.jpg/440px-Glenn_Ivey_official_portrait_118th_Congress.jpg",
    ),
    (
        -2440005,
        "Steny Hoyer",
        "https://www.congress.gov/img/member/h000874_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Steny_Hoyer_official_photo.jpg/440px-Steny_Hoyer_official_photo.jpg",
    ),
    (
        -2440006,
        "April McClain Delaney",
        "https://www.congress.gov/img/member/m001231_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/April_McClain_Delaney_official_portrait_119th_Congress.jpg/440px-April_McClain_Delaney_official_portrait_119th_Congress.jpg",
    ),
    (
        -2440007,
        "Kweisi Mfume",
        "https://www.congress.gov/img/member/m000687_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Kweisi_Mfume_official_portrait_117th_Congress.jpg/440px-Kweisi_Mfume_official_portrait_117th_Congress.jpg",
    ),
    (
        -2440008,
        "Jamie Raskin",
        "https://www.congress.gov/img/member/r000606_200.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Jamie_Raskin_official_portrait_117th_Congress.jpg/440px-Jamie_Raskin_official_portrait_117th_Congress.jpg",
    ),
]


# ============================================================
# UUID resolution
# ============================================================

def resolve_politician_uuids(db_url: str) -> dict:
    """Resolve politician UUIDs from external_id via psycopg2.

    Returns dict keyed by external_id -> (uuid, full_name).
    Asserts exactly 10 rows found (sys.exit(1) otherwise).
    """
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
SELECT external_id, id, full_name
FROM essentials.politicians
WHERE external_id IN (-400033, -400034)
   OR external_id BETWEEN -2440008 AND -2440001
ORDER BY external_id
"""
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    result = {row[0]: (str(row[1]), row[2]) for row in rows}
    if len(result) != 10:
        found_ids = sorted(result.keys())
        print(f"ERROR: expected 10 MD federal officials, found {len(result)}")
        print(f"  Found external_ids: {found_ids}")
        print("  Run migration 275_md_federal_officials.sql first")
        sys.exit(1)
    return result


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


def download_with_fallback(primary_url: str, fallback_url: str, name: str) -> tuple:
    """Try primary URL first; on HTTPError / URLError / timeout, fall back to Wikimedia.

    Returns (bytes, source_label) where source_label is 'congress.gov' or 'wikimedia'.
    If both fail, raises the last exception (caught by main loop).
    """
    try:
        data = download_image(primary_url, name)
        return data, "congress.gov"
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        print(f"  FALLBACK: primary failed ({e}) — trying Wikimedia Commons")
        data = download_image(fallback_url, name)
        return data, "wikimedia"


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
                    val = line.split("=", 1)[1].strip()
                    # Strip surrounding quotes (single or double) if present
                    if len(val) >= 2 and val[0] == val[-1] and val[0] in ('"', "'"):
                        val = val[1:-1]
                    return val
    except FileNotFoundError:
        pass
    # Fallback to environment variable
    return os.environ.get("DATABASE_URL", "")


def check_image_exists(politician_id: str, db_url: str) -> bool:
    """Check if a politician_images row already exists for this politician_id via psycopg2."""
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM essentials.politician_images"
                " WHERE politician_id = %s::uuid AND type = 'default'",
                (politician_id,)
            )
            row = cur.fetchone()
            return (row[0] > 0) if row else False
    finally:
        conn.close()


def insert_politician_image(politician_id: str, url: str, name: str, db_url: str) -> None:
    """Insert row into essentials.politician_images via psycopg2 (essentials schema not in REST API).

    Inserts with type='default' and photo_license='public_domain' (congress.gov / Wikimedia Commons).
    """
    conn = psycopg2.connect(db_url)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), %s::uuid, %s, 'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images WHERE politician_id = %s::uuid AND type = 'default'
)
""",
                    (politician_id, url, politician_id)
                )
                if cur.rowcount == 0:
                    print(f"  Row already exists (idempotent skip)")
                else:
                    print(f"  Inserted politician_images row")
    finally:
        conn.close()


# ============================================================
# Main
# ============================================================

def main():
    TMP_DIR.mkdir(parents=True, exist_ok=True)

    db_url = get_db_url()
    if not db_url:
        print("ERROR: could not find DATABASE_URL in C:/EV-Accounts/backend/.env or environment")
        sys.exit(1)

    # Resolve politician UUIDs dynamically — asserts exactly 10 found
    print("Resolving MD federal politician UUIDs from DB...")
    uuid_map = resolve_politician_uuids(db_url)

    # Build OFFICIALS list: (external_id, uuid, name, primary_url, fallback_url)
    OFFICIALS = []
    for ext_id, name, primary_url, fallback_url in _SOURCE_PAIRS:
        if ext_id not in uuid_map:
            print(f"ERROR: external_id {ext_id} ({name}) not found in DB")
            sys.exit(1)
        uuid, db_name = uuid_map[ext_id]
        OFFICIALS.append((ext_id, uuid, name, primary_url, fallback_url))

    print(f"\nProcessing {len(OFFICIALS)} MD federal officials")
    print(f"Storage bucket: {BUCKET}")
    print(f"Temp dir: {TMP_DIR}")
    print()

    results = []
    source_counts = {"congress.gov": 0, "wikimedia": 0}

    for ext_id, pol_id, name, primary_url, fallback_url in OFFICIALS:
        print(f"[{ext_id}] {name}")
        print(f"  UUID:    {pol_id}")
        print(f"  Primary: {primary_url[:80]}")

        try:
            # Idempotency check: skip if image already exists in DB
            if check_image_exists(pol_id, db_url):
                print(f"  SKIP: politician_images row already exists — idempotent")
                results.append((ext_id, name, "SKIPPED_EXISTS"))
                print()
                continue

            raw, source_label = download_with_fallback(primary_url, fallback_url, name)
            source_counts[source_label] += 1
            print(f"  Source used: {source_label}")

            jpeg = process_image(raw, name)

            # Save processed locally for reference
            local_path = TMP_DIR / f"{pol_id}-headshot.jpg"
            local_path.write_bytes(jpeg)
            print(f"  Saved locally: {local_path.name}")

            storage_url = upload_to_storage(pol_id, jpeg, name)
            insert_politician_image(pol_id, storage_url, name, db_url)
            results.append((ext_id, name, "OK", storage_url, source_label))

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
    skipped = [r for r in results if len(r) >= 3 and r[2] == "SKIPPED_EXISTS"]
    err = [r for r in results if len(r) >= 3 and r[2].startswith("ERROR")]

    processed = len(ok)
    skipped_exists = len(skipped)
    failed = len(err)

    print(f"OFFICIALS=10  processed={processed}  skipped_exists={skipped_exists}  failed={failed}")
    print()

    if ok:
        print(f"Processed ({len(ok)}):")
        for r in ok:
            src = r[4] if len(r) > 4 else "unknown"
            print(f"  OK      [{r[0]}] {r[1]}  (source: {src})")
            storage_url = r[3] if len(r) > 3 else "N/A"
            print(f"           {storage_url}")

    if skipped:
        print(f"\nSkipped/already uploaded ({len(skipped)}):")
        for r in skipped:
            print(f"  SKIP    [{r[0]}] {r[1]}")

    if err:
        print(f"\nFailed ({len(err)}):")
        for r in err:
            print(f"  ERR     [{r[0]}] {r[1]}: {r[2]}")
        sys.exit(1)

    total_done = processed + skipped_exists
    if total_done < len(OFFICIALS):
        print(f"\nWARNING: Only {total_done}/{len(OFFICIALS)} officials processed successfully")
        sys.exit(1)
    else:
        if processed > 0:
            print(f"\nSource mix: {source_counts['congress.gov']}/{processed} from congress.gov, "
                  f"{source_counts['wikimedia']}/{processed} from Wikimedia fallback")
        print(f"All {len(OFFICIALS)} officials complete "
              f"({processed} new uploads, {skipped_exists} skipped)")


if __name__ == "__main__":
    main()
