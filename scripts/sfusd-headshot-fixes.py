#!/usr/bin/env python3
"""
SFUSD headshot fixes — replace 3 bad photos uploaded in phase 87-05.

Bad photos:
  - Jaime Huling: campaign group photo (4 people)
  - Matt Alexander: group photo (3 people)
  - Alida Fisher: light crop on dark background

Uses same auth / upload pattern as sfusd-color-headshots.py.
"""

import io
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

try:
    from dotenv import load_dotenv
    env_path = Path("C:/EV-Accounts/backend/.env")
    if env_path.exists():
        load_dotenv(env_path)
        print(f"Loaded .env from {env_path}")
except ImportError:
    pass

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

# ============================================================
# Configuration — identical to sfusd-color-headshots.py
# ============================================================
SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
_svc_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
_secret_key = os.environ.get('SUPABASE_SECRET_KEY', '')
if _svc_key and _svc_key.startswith('eyJ'):
    SERVICE_KEY = _svc_key
elif _secret_key and _secret_key.startswith('eyJ'):
    SERVICE_KEY = _secret_key
else:
    SERVICE_KEY = _svc_key or _secret_key

if not SERVICE_KEY:
    print("ERROR: set SUPABASE_SERVICE_ROLE_KEY in your environment")
    sys.exit(1)
print(f"Using key prefix: {SERVICE_KEY[:20]}...")

BUCKET = "politician_photos"
STORAGE_BASE = f"https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/{BUCKET}/"
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_sfusd_fixes")

TARGET_W = 600
TARGET_H = 750

# ============================================================
# 3 replacement photos only
# ============================================================
FIXES = [
    (
        "6ef8e4aa-1262-4461-9124-93ef2aa34dc5",
        "Jaime Huling",
        "https://thefrisc.com/wp-content/uploads/2024/10/Huling-headshot-LWV-filter-NO-TINT-1.jpeg",
        "https://i0.wp.com/thefrisc.com/wp-content/uploads/2024/10/Huling-headshot-LWV-filter-NO-TINT-1.jpeg?resize=662%2C786&ssl=1",
    ),
    (
        "f7d1b584-8c95-4e68-bedb-6f1b3fabab87",
        "Matt Alexander",
        "https://thefrisc.com/wp-content/uploads/2024/10/Alexander-headshot-LWV-no-tint-3.jpeg",
        "https://i0.wp.com/thefrisc.com/wp-content/uploads/2024/10/Alexander-headshot-LWV-no-tint-3.jpeg?resize=650%2C866&ssl=1",
    ),
    (
        "ab26f9f3-3cc1-43d3-b40a-717667af2284",
        "Alida Fisher",
        "https://assets.sfstandard.com/image/994911177489/image_3biuin3kjd1qpcffp5eh2kg00n/-S3840x2561-FPNG",
        None,  # no fallback for SF Standard
    ),
]


def download_image(url: str, name: str) -> bytes:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.sfusd.edu/',
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    print(f"  Downloaded {len(data):,} bytes for {name}")
    return data


def crop_and_resize(img: Image.Image) -> Image.Image:
    """Crop to 4:5 ratio then resize to 600x750 Lanczos."""
    w, h = img.size
    target_ratio = 4 / 5
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Too wide: center-crop width
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Too tall: top-crop (keep top, crop bottom to preserve face)
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))

    return img.resize((TARGET_W, TARGET_H), Image.LANCZOS)


def process_image(raw_bytes: bytes, name: str) -> tuple:
    """Returns (jpeg_bytes, orig_mode, orig_dims). Raises if greyscale."""
    img = Image.open(io.BytesIO(raw_bytes))
    orig_mode = img.mode
    orig_w, orig_h = img.size
    print(f"  Original: {orig_w}x{orig_h} mode={orig_mode}")

    if orig_mode in ('L', 'LA'):
        raise ValueError(f"Greyscale image rejected (mode={orig_mode})")

    if orig_mode != 'RGB':
        img = img.convert('RGB')

    img = crop_and_resize(img)

    out = io.BytesIO()
    img.save(out, format='JPEG', quality=90, optimize=True)
    jpeg_bytes = out.getvalue()
    print(f"  Processed: {img.size[0]}x{img.size[1]} -> {len(jpeg_bytes):,} bytes JPEG")
    return jpeg_bytes, orig_mode, (orig_w, orig_h)


def upload_to_storage(politician_id: str, jpeg_bytes: bytes, name: str) -> str:
    """Upload JPEG to Supabase Storage via direct REST API (upsert)."""
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
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Storage upload HTTP {e.code} for {name}: {body}")

    public_url = f"{STORAGE_BASE}{storage_path}"
    print(f"  Uploaded to storage: {storage_path}")
    return public_url


def main():
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    results = []

    for pol_id, name, primary_url, fallback_url in FIXES:
        print(f"\n{name} ({pol_id[:8]}...)")
        orig_mode = "?"
        orig_dims = (0, 0)
        status = "PENDING"

        # Try primary URL, then fallback
        urls_to_try = [primary_url]
        if fallback_url:
            urls_to_try.append(fallback_url)

        last_error = None
        for url in urls_to_try:
            print(f"  Source: {url[:100]}")
            try:
                raw = download_image(url, name)
                jpeg, orig_mode, orig_dims = process_image(raw, name)
                (TMP_DIR / f"{pol_id}-headshot.jpg").write_bytes(jpeg)
                upload_to_storage(pol_id, jpeg, name)
                status = "OK"
                last_error = None
                break
            except Exception as e:
                last_error = e
                print(f"  WARNING: {e} — trying fallback..." if url != urls_to_try[-1] else f"  ERROR: {e}")

        if last_error and status != "OK":
            status = f"ERROR: {last_error}"

        results.append((name, orig_mode, orig_dims, status, pol_id))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    ok = [r for r in results if r[3] == "OK"]
    err = [r for r in results if r[3] != "OK"]
    print(f"Succeeded: {len(ok)}/{len(results)}")
    for r in ok:
        print(f"  OK  {r[0]}  mode={r[1]}  dims={r[2]}")
    if err:
        print(f"\nFailed: {len(err)}")
        for r in err:
            print(f"  ERR {r[0]}: {r[3]}")

    if err:
        sys.exit(1)


if __name__ == "__main__":
    main()
