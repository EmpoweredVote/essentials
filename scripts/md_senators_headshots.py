#!/usr/bin/env python3
"""
MD State Senators headshot download + process + upload to Supabase Storage.
Phase 93-05 / Plan 05

47 Maryland state senators (external_id -2410001..-2410047) seeded in Plan 93-02.

Source: https://mgaleg.maryland.gov/2026RS/images/[lastname][nn].jpg
  - Official Maryland General Assembly portrait images
  - photo_license = 'public_domain' (official government portraits)

Processing:
  - Download from mgaleg.maryland.gov
  - Crop to 4:5 ratio FIRST (center crop if wider, top crop if taller — never stretch)
  - Resize to 600x750 Lanczos JPEG quality=90
  - Upload to politician_photos bucket as {politician_id}-headshot.jpg
  - Insert politician_images row (type='default', photo_license='public_domain')

Design decisions per Phase 93-05 PLAN:
  - D-05: Best-effort inline ingestion — senators whose headshot cannot be sourced
    are SKIPPED (logged); Phase 94 enforces 100% coverage. Script does NOT halt.
  - D-06: Senator headshots handled in this plan (Plan 05); delegate headshots
    in Plan 93-06. Split by chamber to keep failure scope bounded.

Idempotent: checks for existing politician_images row before inserting.
Re-running skips senators that already have images.

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<key>  (or SUPABASE_SECRET_KEY)
  python scripts/md_senators_headshots.py

Note on bucket: project uses 'politician_photos' bucket (not 'politician-headshots').
Storage path: politician_photos/{politician_id}-headshot.jpg
"""

import io
import os
import sys
import urllib.request
import urllib.error
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
# Note: project uses 'politician_photos' bucket with {politician_id}-headshot.jpg path.
# The plan spec referenced 'politician-headshots/md-senators/' but that bucket does not
# exist in production; all existing headshots use 'politician_photos' + this path pattern.
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_md_senators_headshots")

TARGET_W = 600
TARGET_H = 750

# ============================================================
# Officials: (external_id, politician_id, name, source_url)
# politician_id values confirmed from production DB 2026-06-05 via:
#   SELECT external_id, id, last_name FROM essentials.politicians
#   WHERE external_id BETWEEN -2410047 AND -2410001 ORDER BY external_id DESC
# source_url values verified via HEAD probe + authoritative mgaleg senate roster page:
#   https://mgaleg.maryland.gov/mgawebsite/Members/Index/senate (2026-06-05)
# URL pattern: https://mgaleg.maryland.gov/2026RS/images/[lastname][nn].jpg
# Suffix disambiguation: most senators use a 2-digit numeric suffix (01, 02, etc.)
#   to distinguish multiple officials sharing the same last name.
# ============================================================
OFFICIALS = [
    (
        -2410001,
        "f88cd73d-1970-4da1-9bea-2142a25999a7",
        "Mike McKay",
        # SD-01, Frederick/Allegany/Washington — mckay02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/mckay02.jpg",
    ),
    (
        -2410002,
        "5127f8d8-ca40-40aa-8773-4c1abad66f41",
        "Paul D. Corderman",
        # SD-02, Washington County — corderman02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/corderman02.jpg",
    ),
    (
        -2410003,
        "1f78b5e2-b192-4aae-8112-19338aaa891d",
        "Karen Lewis Young",
        # SD-03, Frederick County — young04.jpg (last_name='Lewis Young', normalized='young' with suffix 04)
        # Note: 'lewisyoung.jpg' does not exist; mgaleg uses just 'young' portion with suffix
        "https://mgaleg.maryland.gov/2026RS/images/young04.jpg",
    ),
    (
        -2410004,
        "4a5241b7-8737-4a58-adf2-c5335111d3c4",
        "William G. Folden",
        # SD-04, Frederick/Carroll — folden02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/folden02.jpg",
    ),
    (
        -2410005,
        "493c5d0c-1986-40d4-9fff-3a3bc3fe62e8",
        "Justin Ready",
        # SD-05, Carroll County — ready01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/ready01.jpg",
    ),
    (
        -2410006,
        "9f8d0005-c5ff-42f8-b158-cdb6e4eee872",
        "Johnny Ray Salling",
        # SD-06, Baltimore County — salling01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/salling01.jpg",
    ),
    (
        -2410007,
        "5927d5ab-2fd7-4454-bcc3-34e494821aac",
        "J.B. Jennings",
        # SD-07, Baltimore/Harford — jennings.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/jennings.jpg",
    ),
    (
        -2410008,
        "2fbad601-c2da-4f99-b04f-d28ae30b80f7",
        "Carl Jackson",
        # SD-08, Baltimore County — jackson04.jpg (suffix 04 — multiple Jacksons on roster)
        "https://mgaleg.maryland.gov/2026RS/images/jackson04.jpg",
    ),
    (
        -2410009,
        "6da20195-1b0c-43f2-b1b3-7a3954326fe6",
        "Katie Fry Hester",
        # SD-09, Carroll/Howard — hester01.jpg (last_name='Fry Hester', mgaleg uses 'hester')
        # Note: 'fryhester.jpg' does not exist; mgaleg uses last word of compound name
        "https://mgaleg.maryland.gov/2026RS/images/hester01.jpg",
    ),
    (
        -2410010,
        "a16b94b0-dd22-40a9-af91-03295ea27986",
        "Benjamin Brooks",
        # SD-10, Baltimore County — brooks02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/brooks02.jpg",
    ),
    (
        -2410011,
        "3089c813-f0a8-46af-9a7b-1699129037e9",
        "Shelly Hettleman",
        # SD-11, Baltimore County — hettleman02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/hettleman02.jpg",
    ),
    (
        -2410012,
        "fc23b939-0dfd-4968-ab19-fc1e7745e997",
        "Clarence K. Lam",
        # SD-12, Baltimore/Howard — lam02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/lam02.jpg",
    ),
    (
        -2410013,
        "f0fafa0e-3dd9-4d50-bc5e-c96315f766d7",
        "Guy Guzzone",
        # SD-13, Howard County — guzzone.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/guzzone.jpg",
    ),
    (
        -2410014,
        "82145bc2-770a-421e-a2a1-0e79aae5b643",
        "Craig J. Zucker",
        # SD-14, Montgomery County — zucker01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/zucker01.jpg",
    ),
    (
        -2410015,
        "d423151e-8477-470d-8f73-ba7d2092f714",
        "Brian J. Feldman",
        # SD-15, Montgomery County — feldman.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/feldman.jpg",
    ),
    (
        -2410016,
        "c5d2cd24-170a-4f87-8fde-84216fe62806",
        "Sara Love",
        # SD-16, Montgomery County — love02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/love02.jpg",
    ),
    (
        -2410017,
        "e35d5990-55c7-42e2-94bc-27cb1c49b5f1",
        "Cheryl C. Kagan",
        # SD-17, Montgomery County — kagan01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/kagan01.jpg",
    ),
    (
        -2410018,
        "da75c207-bb23-477e-b3c0-7c462394b570",
        "Jeff Waldstreicher",
        # SD-18, Montgomery County — waldstreicher1.jpg (suffix '1' not '01' per roster)
        "https://mgaleg.maryland.gov/2026RS/images/waldstreicher1.jpg",
    ),
    (
        -2410019,
        "7a2d1548-3268-4767-97a8-bb8b142d5a33",
        "Benjamin F. Kramer",
        # SD-19, Montgomery County — kramer02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/kramer02.jpg",
    ),
    (
        -2410020,
        "b05ff6cb-1ea9-4904-8ecd-5d9aba5c61fc",
        "William C. Smith, Jr.",
        # SD-20, Montgomery County — smith02.jpg (suffix 02 — multiple Smiths in legislature)
        "https://mgaleg.maryland.gov/2026RS/images/smith02.jpg",
    ),
    (
        -2410021,
        "9c400214-f007-4a8d-92fe-5f5d23b3838e",
        "Jim Rosapepe",
        # SD-21, Prince George's — rosapepe.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/rosapepe.jpg",
    ),
    (
        -2410022,
        "8c8b0896-dfd0-4d3c-8492-e594d93b78ca",
        "Alonzo T. Washington",
        # SD-22, Prince George's — washington02.jpg (disambiguates from Mary Washington SD-43)
        "https://mgaleg.maryland.gov/2026RS/images/washington02.jpg",
    ),
    (
        -2410023,
        "9aef8bfb-8e0c-4f00-9898-c738abe4970c",
        "Ron Watson",
        # SD-23, Prince George's — watson04.jpg (suffix 04 — multiple Watsons in legislature)
        "https://mgaleg.maryland.gov/2026RS/images/watson04.jpg",
    ),
    (
        -2410024,
        "4a7dc8a6-2138-4472-8197-8b878034f029",
        "Joanne C. Benson",
        # SD-24, Prince George's — benson.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/benson.jpg",
    ),
    (
        -2410025,
        "cf190bac-9369-4175-bd4b-8ba776697d9c",
        "Nick Charles",
        # SD-25, Prince George's — charles02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/charles02.jpg",
    ),
    (
        -2410026,
        "47823046-7dea-4a4f-a11b-0c5890539891",
        "C. Anthony Muse",
        # SD-26, Prince George's — muse01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/muse01.jpg",
    ),
    (
        -2410027,
        "8c6327bf-2eb4-4788-91f7-c5518ab5a3f1",
        "Kevin M. Harris",
        # SD-27, Prince George's — harris03.jpg (suffix 03 — multiple Harris in legislature)
        "https://mgaleg.maryland.gov/2026RS/images/harris03.jpg",
    ),
    (
        -2410028,
        "4754dede-4a3b-4280-a8b1-7497530107f7",
        "Arthur Ellis",
        # SD-28, Prince George's — ellis01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/ellis01.jpg",
    ),
    (
        -2410029,
        "0abc8345-1fbb-4994-b39c-c3c4f4eefc9f",
        "Jack Bailey",
        # SD-29, Calvert/St. Mary's/Anne Arundel — bailey01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/bailey01.jpg",
    ),
    (
        -2410030,
        "05c9b5b9-cb2b-4387-ab6b-350b69553fac",
        "Shaneka Henson",
        # SD-30, Anne Arundel — henson02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/henson02.jpg",
    ),
    (
        -2410031,
        "4aa50ee7-aeed-48ae-96e7-142bd9ac731b",
        "Bryan W. Simonaire",
        # SD-31, Anne Arundel — simonaire.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/simonaire.jpg",
    ),
    (
        -2410032,
        "409ad653-a4fc-41d0-bb61-a933c5bc45c7",
        "Pamela Beidle",
        # SD-32, Anne Arundel — beidle01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/beidle01.jpg",
    ),
    (
        -2410033,
        "ff266ecf-9ea5-4282-b729-9830cc8abfa3",
        "Dawn Gile",
        # SD-33, Anne Arundel — gile01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/gile01.jpg",
    ),
    (
        -2410034,
        "18313901-28d8-464c-9368-2873577e9d44",
        "Mary-Dulany James",
        # SD-34, Harford County — james01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/james01.jpg",
    ),
    (
        -2410035,
        "e2ca1bfd-255d-417b-a9d7-424e6c10749d",
        "Jason C. Gallion",
        # SD-35, Harford County — gallion01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/gallion01.jpg",
    ),
    (
        -2410036,
        "72287137-7faf-4570-8d9e-c6f8d162f4e0",
        "Stephen S. Hershey, Jr.",
        # SD-36, Eastern Shore — hershey.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/hershey.jpg",
    ),
    (
        -2410037,
        "34c94aa4-11b7-4594-9c3e-c506f10309f6",
        "Johnny Mautz",
        # SD-37, Eastern Shore — mautz02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/mautz02.jpg",
    ),
    (
        -2410038,
        "9b2fe9e6-21bf-4aee-b351-a841f3f382b9",
        "Mary Beth Carozza",
        # SD-38, Eastern Shore — carozza02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/carozza02.jpg",
    ),
    (
        -2410039,
        "81b8bae9-0b0f-43de-8079-c0b605e12cec",
        "Nancy J. King",
        # SD-39, Montgomery County — king.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/king.jpg",
    ),
    (
        -2410040,
        "04e1a744-acf5-4453-9172-7135b6bfce96",
        "Antonio Hayes",
        # SD-40, Baltimore City — hayes02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/hayes02.jpg",
    ),
    (
        -2410041,
        "fb714c92-166f-4cc1-bb6b-19988a81cefe",
        "Dalya Attar",
        # SD-41, Baltimore City — attar02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/attar02.jpg",
    ),
    (
        -2410042,
        "fc06c2bb-db76-43fa-8e2e-91a4c34e57ae",
        "Chris West",
        # SD-42, Baltimore County/City — west02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/west02.jpg",
    ),
    (
        -2410043,
        "38404814-7be0-40e3-b044-062f98b2a5b0",
        "Mary Washington",
        # SD-43, Baltimore City — washington01.jpg (disambiguates from Alonzo Washington SD-22)
        "https://mgaleg.maryland.gov/2026RS/images/washington01.jpg",
    ),
    (
        -2410044,
        "30f96c7e-7bf0-4270-bfbb-ee4c520a7344",
        "Charles E. Sydnor, III",
        # SD-44, Baltimore City — sydnor02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/sydnor02.jpg",
    ),
    (
        -2410045,
        "54ea8c48-d8d0-43e2-83fe-2f91cac71fdd",
        "Cory V. McCray",
        # SD-45, Baltimore City — mccray02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/mccray02.jpg",
    ),
    (
        -2410046,
        "6e3c30f5-52be-48b0-b5b4-383e5d745c57",
        "Bill Ferguson",
        # SD-46, Baltimore City (President of Senate) — ferguson.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/ferguson.jpg",
    ),
    (
        -2410047,
        "9d191d69-084f-4941-bc0a-c59d336f032e",
        "Malcolm Augustine",
        # SD-47, Prince George's — augustine01.jpg (suffix 01 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/augustine01.jpg",
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
  SELECT 1 FROM essentials.politician_images WHERE politician_id = %s::uuid
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

    print(f"Processing {len(OFFICIALS)} MD state senators (Plan 93-05, D-05 best-effort)")
    print(f"Storage bucket: {BUCKET}")
    print(f"Temp dir: {TMP_DIR}")
    print()

    processed = []
    skipped_no_url = []
    skipped_exists = []
    failed = []

    for ext_id, pol_id, name, source_url in OFFICIALS:
        print(f"[{ext_id}] {name}")
        if source_url:
            print(f"  Source: {source_url}")
        print(f"  UUID:   {pol_id}")

        try:
            # Best-effort D-05: source_url=None means skip (Phase 94 closes the gap)
            if source_url is None:
                print(f"  SKIP: no source URL — Phase 94 will close")
                skipped_no_url.append((ext_id, name))
                print()
                continue

            # Idempotency check: skip if image already exists in DB
            if check_image_exists(pol_id, db_url):
                print(f"  SKIP: already ingested (idempotent)")
                skipped_exists.append((ext_id, name))
                print()
                continue

            raw = download_image(source_url, name)
            jpeg = process_image(raw, name)

            # Save processed locally for human spot-check before Phase 94
            local_path = TMP_DIR / f"{pol_id}-headshot.jpg"
            local_path.write_bytes(jpeg)
            print(f"  Saved locally: {local_path.name}")

            storage_url = upload_to_storage(pol_id, jpeg, name)
            insert_politician_image(pol_id, storage_url, name, db_url)
            processed.append((ext_id, name, storage_url))

        except Exception as e:
            # Per D-05: per-senator failures are logged, not fatal
            print(f"  SKIP: error — {e}")
            failed.append((ext_id, name, str(e)))

        print()

    # ============================================================
    # End-of-run summary
    # ============================================================
    print("=" * 60)
    print("SUMMARY — MD State Senators Headshots (Plan 93-05)")
    print("=" * 60)
    print(f"OFFICIALS=47, processed={len(processed)}, "
          f"skipped_no_url={len(skipped_no_url)}, "
          f"skipped_exists={len(skipped_exists)}, "
          f"failed={len(failed)}")
    print(f"Total accounted: {len(processed) + len(skipped_no_url) + len(skipped_exists) + len(failed)}")
    print()

    if processed:
        print(f"Processed ({len(processed)}):")
        for ext_id, name, url in processed:
            print(f"  OK      [{ext_id}] {name}")
            print(f"           {url}")

    if skipped_no_url:
        print(f"\nSkipped — no source URL ({len(skipped_no_url)}) [Phase 94 will close]:")
        for ext_id, name in skipped_no_url:
            print(f"  SKIP_URL [{ext_id}] {name}")

    if skipped_exists:
        print(f"\nSkipped — already ingested ({len(skipped_exists)}):")
        for ext_id, name in skipped_exists:
            print(f"  SKIP_DUP [{ext_id}] {name}")

    if failed:
        print(f"\nFailed — download/process/upload error ({len(failed)}):")
        for ext_id, name, err in failed:
            print(f"  FAILED  [{ext_id}] {name}: {err}")

    total = len(processed) + len(skipped_no_url) + len(skipped_exists) + len(failed)
    assert total == len(OFFICIALS), f"Count mismatch: {total} != {len(OFFICIALS)}"

    # Per D-05: script exits 0 even if individual senators failed (best-effort)
    # Only fails hard if SERVICE_KEY missing/invalid (already checked at startup) or DB unreachable
    print(f"\nDone. {len(processed)} new uploads, {len(skipped_exists)} already existed, "
          f"{len(skipped_no_url)} no-URL skips, {len(failed)} failures.")


if __name__ == "__main__":
    main()
