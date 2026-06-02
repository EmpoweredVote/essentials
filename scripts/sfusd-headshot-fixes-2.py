#!/usr/bin/env python3
"""
SFUSD headshot replacement script — batch 2.
Replaces 4 sepia/warm-toned headshots sourced from The Frisc with
candidate-submitted color photos from Mission Local (S3-hosted).

Uses direct HTTP (urllib) — no supabase SDK needed.
"""

import io
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

# Try to load .env from EV-Accounts backend
try:
    from dotenv import load_dotenv
    env_path = Path("C:/EV-Accounts/backend/.env")
    if env_path.exists():
        load_dotenv(env_path)
        print(f"Loaded .env from {env_path}")
except ImportError:
    pass  # python-dotenv not installed, rely on environment

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install Pillow")
    sys.exit(1)

# ============================================================
# Configuration
# ============================================================
SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
# Storage REST API requires the JWT service-role key (eyJ...).
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
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_sfusd_headshot_fixes_2")

TARGET_W = 600
TARGET_H = 750

# ============================================================
# 4 SFUSD commissioners to fix: (politician_id, name, primary_url, fallback_url)
# Note: "Hulling" double-L is intentional — that's the actual S3 filename.
# ============================================================
OFFICIALS = [
    (
        "f7d1b584-8c95-4e68-bedb-6f1b3fabab87",
        "Matt Alexander",
        "https://newspack-missionlocal.s3.amazonaws.com/mission/wp-content/uploads/2024/07/Matt-Alexander-640x640.png",
        "https://i0.wp.com/newspack-missionlocal.s3.amazonaws.com/mission/wp-content/uploads/2024/07/Matt-Alexander-640x640.png",
    ),
    (
        "6ef8e4aa-1262-4461-9124-93ef2aa34dc5",
        "Jaime Huling",
        "https://newspack-missionlocal.s3.amazonaws.com/mission/wp-content/uploads/2024/07/Jaime-Hulling-640x640.png",
        "https://i0.wp.com/newspack-missionlocal.s3.amazonaws.com/mission/wp-content/uploads/2024/07/Jaime-Hulling-640x640.png",
    ),
    (
        "8ca7781e-b688-4979-870d-80e36e21169f",
        "Parag Gupta",
        "https://newspack-missionlocal.s3.amazonaws.com/mission/wp-content/uploads/2024/07/Parag-Gupta-640x640.png",
        "https://i0.wp.com/newspack-missionlocal.s3.amazonaws.com/mission/wp-content/uploads/2024/07/Parag-Gupta-640x640.png",
    ),
    (
        "61965a0c-e156-4a4a-bd4e-229ea6a15bf2",
        "Supryia Ray",
        "https://newspack-missionlocal.s3.amazonaws.com/mission/wp-content/uploads/2024/07/Supryia-Ray-640x640.png",
        "https://i0.wp.com/newspack-missionlocal.s3.amazonaws.com/mission/wp-content/uploads/2024/07/Supryia-Ray-640x640.png",
    ),
]


def crop_and_resize(img: Image.Image) -> Image.Image:
    """Crop 640x640 square to 4:5 (512x640) then resize to 600x750 Lanczos."""
    w, h = img.size
    target_ratio = 4 / 5  # 0.80
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Too wide: center-crop width
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Too tall: top-crop (keep top, crop bottom)
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))

    return img.resize((TARGET_W, TARGET_H), Image.LANCZOS)


def download_image(url: str, name: str) -> bytes:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://missionlocal.org/',
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    print(f"  Downloaded {len(data):,} bytes for {name}")
    return data


def process_image(raw_bytes: bytes, name: str) -> tuple:
    """Returns (jpeg_bytes, orig_mode, orig_dims). Skips if greyscale."""
    img = Image.open(io.BytesIO(raw_bytes))
    orig_mode = img.mode
    orig_w, orig_h = img.size
    print(f"  Original: {orig_w}x{orig_h} mode={orig_mode}")

    # Greyscale rejection
    if orig_mode in ('L', 'LA'):
        raise ValueError(f"Greyscale image (mode={orig_mode}) — skipping; find a color source")

    # Convert RGBA/P/etc to RGB before processing
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

    for pol_id, name, primary_url, fallback_url in OFFICIALS:
        print(f"\n{name} ({pol_id[:8]}...)")
        orig_mode = "?"
        orig_dims = (0, 0)
        raw = None

        # Try primary URL, fall back if it fails
        for label, url in [("primary", primary_url), ("fallback", fallback_url)]:
            print(f"  Trying {label}: {url[:80]}")
            try:
                raw = download_image(url, name)
                print(f"  Using {label} URL")
                break
            except Exception as e:
                print(f"  {label} failed: {e}")

        if raw is None:
            status = "ERROR: both URLs failed"
            print(f"  {status}")
            results.append((name, orig_mode, orig_dims, status, pol_id))
            continue

        try:
            jpeg, orig_mode, orig_dims = process_image(raw, name)
            # Save processed locally for visual verification
            (TMP_DIR / f"{pol_id}-headshot.jpg").write_bytes(jpeg)
            upload_to_storage(pol_id, jpeg, name)
            status = "OK"
            results.append((name, orig_mode, orig_dims, status, pol_id))
        except Exception as e:
            print(f"  ERROR: {e}")
            status = f"ERROR: {e}"
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
