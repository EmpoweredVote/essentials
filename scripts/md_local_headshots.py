#!/usr/bin/env python3
"""
MD local government headshot download + process + upload to Supabase Storage.
Phase 95-02

11 officials across 2 governments:
  St. Mary's County Board of County Commissioners:
    external_id -24037001 through -24037005 (5 commissioners)
  Town of Leonardtown Town Council:
    external_id -2446475001 through -2446475006 (Mayor + 5 council members)

Processing:
  - Resolve politician UUIDs from DB at runtime (no hardcoded UUIDs)
  - Download from official government sources only (D-03: no fallback sources)
  - Crop to 4:5 ratio FIRST (center crop if wider, top crop if taller — never stretch)
  - Resize to 600x750 Lanczos JPEG quality=90 (D-04)
  - Upload to politician_photos bucket as {politician_id}-headshot.jpg
  - Insert politician_images row (type='default', photo_license='public_domain')

Leonardtown hotlink protection: 5 of 6 Leonardtown photos return HTTP 403 without
a Referer header. This script adds Referer for all leonardtown.somd.com URLs
(Pitfall 2 from RESEARCH.md).

Idempotent: checks for existing politician_images row before inserting.
Re-running skips officials that already have images.

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<key>  (or SUPABASE_SECRET_KEY)
  python3 scripts/md_local_headshots.py
"""

import io
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
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_md_local_headshots")

TARGET_W = 600
TARGET_H = 750

# ============================================================
# Source URLs by external_id
# All URLs verified live 2026-06-05 (from RESEARCH.md "Verified Roster Data")
#
# St. Mary's County (no Referer needed — HTTP 200 direct):
#   stmaryscountymd.gov official government portraits — public domain
#
# Leonardtown (Referer REQUIRED: leonardtown.somd.com hotlink protection):
#   leonardtown.somd.com official government portraits — public domain
#   Pitfall 2: 5 of 6 URLs return HTTP 403 without Referer header
# ============================================================
URL_BY_EXT = {
    # St. Mary's County Board of County Commissioners
    -24037001: "https://www.stmaryscountymd.gov/_Media/Global/Headshots/guy_james.jpg",
    -24037002: "https://www.stmaryscountymd.gov/_Media/Global/Headshots/colvin_eric.jpg",
    -24037003: "https://www.stmaryscountymd.gov/_Media/Global/Headshots/hewitt_michael.jpg",
    -24037004: "https://www.stmaryscountymd.gov/_Media/Global/Headshots/alderson_mike.jpg",
    -24037005: "https://www.stmaryscountymd.gov/_Media/Global/Headshots/ostrow_scott.jpg",
    # Town of Leonardtown Town Council (all require Referer header)
    -2446475001: "https://leonardtown.somd.com/government/TownCouncil/Mayor%20Dan%20Burris.JPG",
    -2446475002: "https://leonardtown.somd.com/government/TownCouncil/JayMattingly.JPG",
    -2446475003: "https://leonardtown.somd.com/government/TownCouncil/NickColvin.JPG",
    -2446475004: "https://leonardtown.somd.com/government/TownCouncil/HeatherEarhart.jpg",
    -2446475005: "https://leonardtown.somd.com/government/TownCouncil/ChristyHollander.JPG",
    -2446475006: "https://leonardtown.somd.com/government/TownCouncil/MarySlade.JPG",
}

EXPECTED_COUNT = 11


# ============================================================
# UUID resolution from DB (no hardcoded politician UUIDs)
# ============================================================

def resolve_politician_uuids(db_url: str) -> dict:
    """
    Query DB for all 11 politician rows by external_id range.
    Returns dict: { external_id (int): (uuid_str, full_name) }
    Exits with sys.exit(1) if the count is not exactly 11.
    """
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
SELECT external_id, id, full_name
FROM essentials.politicians
WHERE (external_id BETWEEN -24037005 AND -24037001)
   OR (external_id BETWEEN -2446475006 AND -2446475001)
ORDER BY external_id DESC
"""
            )
            rows = cur.fetchall()
    finally:
        conn.close()

    result = {row[0]: (str(row[1]), row[2]) for row in rows}

    if len(result) != EXPECTED_COUNT:
        found_ids = sorted(result.keys())
        expected_sm = list(range(-24037005, -24037000))  # -24037005 to -24037001
        expected_lt = list(range(-2446475006, -2446475000))  # -2446475006 to -2446475001
        expected_all = set(expected_sm + expected_lt)
        missing = sorted(expected_all - set(result.keys()))
        print(f"ERROR: resolve_politician_uuids expected {EXPECTED_COUNT} rows, found {len(result)}")
        print(f"  Found external_ids: {found_ids}")
        print(f"  Missing external_ids: {missing}")
        print("  Check that migrations 276 and 277 have been applied successfully.")
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
    """Download with browser UA. Leonardtown images require Referer header (Pitfall 2)."""
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        ),
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    # Leonardtown hotlink protection: add Referer for leonardtown.somd.com URLs
    if 'leonardtown.somd.com' in url:
        headers['Referer'] = 'https://leonardtown.somd.com/government/government-initial.htm'
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
# Supabase DB — politician_images insert (via psycopg2 direct connection)
# Note: Supabase REST API does not expose the 'essentials' schema
# (only public, civic_spaces, connect, empower, inform, etc. are exposed).
# Direct psycopg2 connection is required for essentials schema writes.
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
    """Insert row into essentials.politician_images via psycopg2 (essentials schema not in REST API)."""
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
    results = []

    db_url = get_db_url()
    if not db_url:
        print("ERROR: could not find DATABASE_URL in C:/EV-Accounts/backend/.env or environment")
        sys.exit(1)

    print(f"Phase 95-02: MD local officials headshot pipeline")
    print(f"Resolving {EXPECTED_COUNT} politician UUIDs from DB...")
    uuid_map = resolve_politician_uuids(db_url)

    # Build OFFICIALS list: (external_id, politician_id, full_name, source_url)
    OFFICIALS = []
    for ext_id, (pol_id, full_name) in sorted(uuid_map.items(), reverse=True):
        source_url = URL_BY_EXT.get(ext_id)
        if source_url is None:
            print(f"ERROR: No URL found in URL_BY_EXT for external_id={ext_id} ({full_name})")
            sys.exit(1)
        OFFICIALS.append((ext_id, pol_id, full_name, source_url))

    print(f"Resolved {len(OFFICIALS)} officials")
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
                print(f"  SKIPPED: politician_images row already exists — idempotent")
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

    processed = len(ok)
    skipped_exists = len(skipped)
    failed = len(err)
    total = len(OFFICIALS)

    print(f"OFFICIALS={EXPECTED_COUNT} processed={processed} skipped_exists={skipped_exists} failed={failed} total={total}")
    print()

    if ok:
        print(f"Succeeded: {processed}")
        for r in ok:
            storage_url = r[3] if len(r) > 3 else "N/A"
            print(f"  OK      [{r[0]}] {r[1]}")
            print(f"           {storage_url}")

    if skipped:
        print(f"\nSkipped (already uploaded): {skipped_exists}")
        for r in skipped:
            print(f"  SKIPPED [{r[0]}] {r[1]}")

    if err:
        print(f"\nFailed: {failed}")
        for r in err:
            print(f"  ERR     [{r[0]}] {r[1]}: {r[2]}")
        print()
        print("Per D-03: do NOT substitute non-official sources for failed downloads.")
        print("Verify the official URL is still live; update URL_BY_EXT if the URL moved.")
        sys.exit(1)

    done_count = processed + skipped_exists
    if done_count < total:
        print(f"\nWARNING: Only {done_count}/{total} officials processed successfully")
        sys.exit(1)
    else:
        print(f"\nAll {total} officials complete ({processed} new uploads, {skipped_exists} skipped)")


if __name__ == "__main__":
    main()
