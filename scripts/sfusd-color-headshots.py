#!/usr/bin/env python3
"""
SFUSD color headshot replacement script.
Phase 87-05: Replace greyscale headshots with color versions for 7 SFUSD commissioners.

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
# Storage REST API requires the JWT service-role key (eyJ...), not the sb_secret_... format key.
# Prefer SUPABASE_SERVICE_ROLE_KEY (JWT); fall back to SUPABASE_SECRET_KEY only if it looks like a JWT.
_svc_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
_secret_key = os.environ.get('SUPABASE_SECRET_KEY', '')
if _svc_key and _svc_key.startswith('eyJ'):
    SERVICE_KEY = _svc_key
elif _secret_key and _secret_key.startswith('eyJ'):
    SERVICE_KEY = _secret_key
else:
    # Fallback: try service role key anyway
    SERVICE_KEY = _svc_key or _secret_key

if not SERVICE_KEY:
    print("ERROR: set SUPABASE_SERVICE_ROLE_KEY in your environment")
    sys.exit(1)
print(f"Using key prefix: {SERVICE_KEY[:20]}...")

BUCKET = "politician_photos"
STORAGE_BASE = f"https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/{BUCKET}/"
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_sfusd_color_headshots")

TARGET_W = 600
TARGET_H = 750

# ============================================================
# SFUSD commissioners: (politician_id, name, color_photo_url)
# ============================================================
OFFICIALS = [
    (
        "ab26f9f3-3cc1-43d3-b40a-717667af2284",
        "Alida Fisher",
        "https://assets.sfstandard.com/image/994911177489/image_u3sr0pfvvl6j172a7gs326nm62/-S3840x3840-FPNG",
    ),
    (
        "6ef8e4aa-1262-4461-9124-93ef2aa34dc5",
        "Jaime Huling",
        "https://cdn.prod.website-files.com/66693a8c69ac4e55ac576f31/666bdab415e9b1ad0c493e26_JaimeHuling_GarySexton_1.jpg",
    ),
    (
        "948dd349-1f56-4b65-bc1d-4a7affc05051",
        "Lisa Weissman-Ward",
        "https://assets.sfstandard.com/image/994911177489/image_okv5f451nd64h0v8fph3fqv87e/-S3840x2559-FPNG",
    ),
    (
        "f7d1b584-8c95-4e68-bedb-6f1b3fabab87",
        "Matt Alexander",
        "https://images.squarespace-cdn.com/content/v1/5ecbed064794354a7595e61f/398039cb-c34c-4867-80e6-b1c4c27b2c48/IMG_4904.JPG",
    ),
    (
        "8ca7781e-b688-4979-870d-80e36e21169f",
        "Parag Gupta",
        "https://thefrisc.com/wp-content/uploads/2024/10/Gupta-headshot-LVW-no-tint-1.jpeg",
    ),
    (
        "df88c679-1a6c-4ecf-8b55-3b6a59f01686",
        "Phil Kim",
        "https://assets.sfstandard.com/image/994911177489/image_gb94kmj2qp1tdd6vn28sv1et2j/-S3840x2561-FPNG",
    ),
    (
        "61965a0c-e156-4a4a-bd4e-229ea6a15bf2",
        "Supryia Ray",
        "https://thefrisc.com/wp-content/uploads/2024/10/Ray-headshot-LVW-no-tint-2.jpeg",
    ),
]


def crop_and_resize(img: Image.Image) -> Image.Image:
    """Crop to 4:5 ratio then resize to 600x750 Lanczos."""
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
        'Referer': 'https://www.sfusd.edu/',
    }
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    print(f"  Downloaded {len(data):,} bytes for {name}")
    return data


def process_image(raw_bytes: bytes, name: str) -> tuple:
    """Returns (jpeg_bytes, orig_mode, orig_dims). Raises if greyscale."""
    img = Image.open(io.BytesIO(raw_bytes))
    orig_mode = img.mode
    orig_w, orig_h = img.size
    print(f"  Original: {orig_w}x{orig_h} mode={orig_mode}")

    # Greyscale rejection
    if orig_mode in ('L', 'LA'):
        raise ValueError(f"Greyscale image rejected (mode={orig_mode}) — find a color source photo")

    # Convert RGBA/P/etc to RGB before processing
    if orig_mode != 'RGB':
        img = img.convert('RGB')

    img = crop_and_resize(img)

    # Double-check after crop/resize
    if img.mode in ('L', 'LA'):
        raise ValueError(f"Post-process greyscale detected (mode={img.mode})")

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

    for pol_id, name, source_url in OFFICIALS:
        print(f"\n{name} ({pol_id[:8]}...)")
        print(f"  Source: {source_url[:80]}")
        orig_mode = "?"
        orig_dims = (0, 0)
        status = "PENDING"
        try:
            raw = download_image(source_url, name)
            jpeg, orig_mode, orig_dims = process_image(raw, name)
            # Save processed locally
            (TMP_DIR / f"{pol_id}-headshot.jpg").write_bytes(jpeg)
            storage_url = upload_to_storage(pol_id, jpeg, name)
            status = "OK"
            results.append((name, source_url, orig_mode, orig_dims, "OK", pol_id))
        except Exception as e:
            print(f"  ERROR: {e}")
            status = f"ERROR: {e}"
            results.append((name, source_url, orig_mode, orig_dims, status, pol_id))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    ok = [r for r in results if r[4] == "OK"]
    err = [r for r in results if r[4] != "OK"]
    print(f"Succeeded: {len(ok)}/{len(results)}")
    for r in ok:
        print(f"  OK  {r[0]}  mode={r[2]}  dims={r[3]}")
    if err:
        print(f"\nFailed: {len(err)}")
        for r in err:
            print(f"  ERR {r[0]}: {r[4]}")

    if err:
        sys.exit(1)


if __name__ == "__main__":
    main()
