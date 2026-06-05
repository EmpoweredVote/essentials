#!/usr/bin/env python3
"""
MD House of Delegates headshot download + process + upload to Supabase Storage.
Phase 93-06 / Plan 06

140 active Maryland delegates (external_id -2420001..-2420141, excluding vacant District 42A).
Seeded in Plan 93-03 (migration 274).

Source: https://mgaleg.maryland.gov/2026RS/images/[lastname][nn].jpg
  - Official Maryland General Assembly portrait images
  - photo_license = 'public_domain' (official government portraits)
  - URLs verified from roster page HTML (not just HEAD probing) per Plan 93-05 lesson

Processing:
  - Download from mgaleg.maryland.gov
  - Crop to 4:5 ratio FIRST (center crop if wider, top crop if taller — never stretch)
  - Resize to 600x750 Lanczos JPEG quality=90
  - Upload to politician_photos bucket as {politician_id}-headshot.jpg
  - Insert politician_images row (type='default', photo_license='public_domain')

Design decisions per Phase 93-06 PLAN:
  - D-05: Best-effort inline ingestion — delegates whose headshot cannot be sourced
    are SKIPPED (logged); Phase 94 enforces 100% coverage. Script does NOT halt.
  - D-06: Delegate headshots handled in this plan (Plan 06); senator headshots
    in Plan 93-05. Split by chamber to keep failure scope bounded.

Idempotent: checks for existing politician_images row before inserting.
Re-running skips delegates that already have images.

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<key>  (or SUPABASE_SECRET_KEY)
  python scripts/md_delegates_headshots.py

Note on bucket: project uses 'politician_photos' bucket (not 'politician-headshots').
Storage path: politician_photos/{politician_id}-headshot.jpg

Note on vacant seat: District 42A (external_id -2420124) is is_vacant=true.
That row is NOT in the OFFICIALS list and will receive no headshot.

URL disambiguation notes (from roster page scrape 2026-06-05):
  - Multiple delegates share last names: Johnson (johnson01=Steve, johnson02=Andre Jr.),
    Jones (jones=Adrienne, jones01=Dana), Long (long01=Robert, long02=Jeffrie),
    Morgan (morgan02=Matthew, morgan03=Todd)
  - Unusual suffixes: baker04, bartlett02, davis02, griffith02, hill02, patterson02,
    phillips02, taylor03, watson02, wells02, young05
  - No suffix: barnes, clippinger, conaway, cullison, fisher, healey, holmes, jones,
    kaiser, kipke, mccomas, rosenberg, stein, szeliga, valderrama, wilson
  - Space in filename: 'jacobs j.jpg' (Jay A. Jacobs) — URL-encoded in source_url
  - Peña-Melnyk: mgaleg uses 'pena.jpg' (no ñ, no hyphen, no melnyk)
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
# The plan spec referenced 'politician-headshots/md-delegates/' but that bucket does not
# exist in production; all existing headshots use 'politician_photos' + this path pattern.
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_md_delegates_headshots")

TARGET_W = 600
TARGET_H = 750

# ============================================================
# Officials: (external_id, politician_id, name, source_url)
# politician_id values confirmed from production DB 2026-06-05 via:
#   SELECT external_id, id, full_name FROM essentials.politicians
#   WHERE external_id BETWEEN -2420141 AND -2420001 ORDER BY external_id DESC
# source_url values verified from mgaleg.maryland.gov/mgawebsite/Members/Index/house
#   roster page img src attributes (2026-06-05). Roster page is authoritative —
#   HEAD probing alone misses higher suffixes.
# Vacant placeholder (external_id -2420124, is_vacant=true) is EXCLUDED per D-05/D-07.
# ============================================================
OFFICIALS = [
    (
        -2420001,
        "3817ad52-3f43-4bd3-8525-e7dcd0816153",
        "Jim Hinebaugh, Jr.",
        # HD-1A, Garrett/Allegany/Washington — hinebaugh01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/hinebaugh01.jpg",
    ),
    (
        -2420002,
        "5260bd6f-e70a-46f1-aa7d-49eaf22192cf",
        "Jason C. Buckel",
        # HD-1B, Allegany County — buckel01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/buckel01.jpg",
    ),
    (
        -2420003,
        "d049cf3e-6577-4f8d-ba7e-768ac2b78d66",
        "Terry L. Baker",
        # HD-1C, Washington County — baker04.jpg (suffix 04 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/baker04.jpg",
    ),
    (
        -2420004,
        "cdf746c1-8311-416b-9ad3-2684a83b6992",
        "William Valentine",
        # HD-2A (1/2), Washington County — valentine01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/valentine01.jpg",
    ),
    (
        -2420005,
        "df6fe96f-7795-4934-9acc-2b9f8f0aa8f7",
        "William J. Wivell",
        # HD-2A (2/2), Washington County — wivell01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/wivell01.jpg",
    ),
    (
        -2420006,
        "18c6abb4-7b4b-4e21-a7fe-008e43d6f3e5",
        "Matthew J. Schindler",
        # HD-2B, Washington County — schindler01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/schindler01.jpg",
    ),
    (
        -2420007,
        "dfb9ae21-4605-4c58-94e8-84b1eb1a30c1",
        "Kris Fair",
        # HD-3 (1/3), Frederick County — fair01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/fair01.jpg",
    ),
    (
        -2420008,
        "c0abb4fa-be8d-4fbe-9b6d-6319a8ecd255",
        "Kenneth Kerr",
        # HD-3 (2/3), Frederick County — kerr01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/kerr01.jpg",
    ),
    (
        -2420009,
        "5946ad0c-ddf5-4674-840e-6968105042cd",
        "Karen Simpson",
        # HD-3 (3/3), Frederick County — simpson01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/simpson01.jpg",
    ),
    (
        -2420010,
        "00a1eaeb-157c-42f8-a6e5-9a9d02decbe9",
        "Barrie S. Ciliberti",
        # HD-4 (1/3), Frederick County — ciliberti01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/ciliberti01.jpg",
    ),
    (
        -2420011,
        "b389687f-817b-4fda-8770-a888029f4629",
        "April Miller",
        # HD-4 (2/3), Frederick County — miller03.jpg (suffix 03 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/miller03.jpg",
    ),
    (
        -2420012,
        "ce2fc441-abd5-4d8f-9c56-114e31c4d43c",
        "Jesse T. Pippy",
        # HD-4 (3/3), Frederick County — pippy01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/pippy01.jpg",
    ),
    (
        -2420013,
        "c12bb600-318a-4541-bcdd-8260f1ba172e",
        "Christopher Eric Bouchat",
        # HD-5 (1/3), Carroll County — bouchat01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/bouchat01.jpg",
    ),
    (
        -2420014,
        "5967c703-2583-466f-a438-c3ac182111d5",
        "April Rose",
        # HD-5 (2/3), Carroll County — rose01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/rose01.jpg",
    ),
    (
        -2420015,
        "6e5ac4b7-73fd-497d-a4e9-7d5124c3d904",
        "Chris Tomlinson",
        # HD-5 (3/3), Carroll County — tomlinson01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/tomlinson01.jpg",
    ),
    (
        -2420016,
        "0608cc7a-72ed-4d24-b966-3eee82075bf1",
        "Robin L. Grammer, Jr.",
        # HD-6 (1/3), Baltimore County — grammer01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/grammer01.jpg",
    ),
    (
        -2420017,
        "eadb65c9-74b6-40c3-b9e7-159c5734c59f",
        "Robert B. Long",
        # HD-6 (2/3), Baltimore County — long01.jpg (disambiguates from Jeffrie Long)
        "https://mgaleg.maryland.gov/2026RS/images/long01.jpg",
    ),
    (
        -2420018,
        "ba85b633-32cf-4617-923c-3a325f39894e",
        "Ric Metzgar",
        # HD-6 (3/3), Baltimore County — metzgar01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/metzgar01.jpg",
    ),
    (
        -2420019,
        "f5224e0c-0761-4ca7-a889-ed44517e2b91",
        "Ryan Nawrocki",
        # HD-7A (1/2), Baltimore County — nawrocki01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/nawrocki01.jpg",
    ),
    (
        -2420020,
        "0945acd2-cb51-49ad-a22f-6043d2e61520",
        "Kathy Szeliga",
        # HD-7A (2/2), Baltimore County — szeliga.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/szeliga.jpg",
    ),
    (
        -2420021,
        "6a04e5b9-d532-4e80-bbca-6677a35620e5",
        "Lauren Arikan",
        # HD-7B, Baltimore County — arikan01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/arikan01.jpg",
    ),
    (
        -2420022,
        "a1f58b34-76ee-43ce-b152-4843c42f4f79",
        "Nick Allen",
        # HD-8 (1/3), Baltimore County — allen01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/allen01.jpg",
    ),
    (
        -2420023,
        "6d95657c-6c46-4aab-886f-f9688adc7b33",
        "Harry Bhandari",
        # HD-8 (2/3), Baltimore County — bhandari01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/bhandari01.jpg",
    ),
    (
        -2420024,
        "5d17e3ea-9d63-4a96-8848-9e293ac05fdb",
        "Kim Ross",
        # HD-8 (3/3), Baltimore County — ross01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/ross01.jpg",
    ),
    (
        -2420025,
        "7ced90a8-39dc-447e-ba33-e3af4cd47473",
        "Chao Wu",
        # HD-9A (1/2), Baltimore County — wu01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/wu01.jpg",
    ),
    (
        -2420026,
        "38b5030a-aa8b-4363-8b62-3ec384d22088",
        "Natalie Ziegler",
        # HD-9A (2/2), Baltimore County — ziegler01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/ziegler01.jpg",
    ),
    (
        -2420027,
        "a4b61b58-9006-4e58-952d-abeb2521cda0",
        "Courtney Watson",
        # HD-9B, Carroll/Howard — watson02.jpg (suffix 02 per roster; disambiguates from senate Watson)
        "https://mgaleg.maryland.gov/2026RS/images/watson02.jpg",
    ),
    (
        -2420028,
        "760cd4a7-235c-472f-a0ba-fb07098dfd57",
        "Adrienne A. Jones",
        # HD-10 (1/3), Baltimore County — jones.jpg (no suffix; House Majority Leader)
        "https://mgaleg.maryland.gov/2026RS/images/jones.jpg",
    ),
    (
        -2420029,
        "04eb4549-ad64-4ddc-ad53-8f90217f905f",
        "N. Scott Phillips",
        # HD-10 (2/3), Baltimore County — phillips02.jpg
        "https://mgaleg.maryland.gov/2026RS/images/phillips02.jpg",
    ),
    (
        -2420030,
        "d80816fc-da1d-48f4-95c9-467f8831933c",
        "Jennifer White Holland",
        # HD-10 (3/3), Baltimore County — white01.jpg (compound last name; mgaleg uses 'white')
        "https://mgaleg.maryland.gov/2026RS/images/white01.jpg",
    ),
    (
        -2420031,
        "b5aee428-9b2e-4c87-9a5c-63d44f58e1d8",
        "Cheryl E. Pasteur",
        # HD-11 (1/3), Baltimore County — pasteur01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/pasteur01.jpg",
    ),
    (
        -2420032,
        "631dac5c-fb86-41f5-a82d-5963164a9142",
        "Jon S. Cardin",
        # HD-11 (2/3), Baltimore County — cardin01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/cardin01.jpg",
    ),
    (
        -2420033,
        "e94337e1-4776-4058-87b4-32dfeb7732a0",
        "Dana Stein",
        # HD-11 (3/3), Baltimore County — stein.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/stein.jpg",
    ),
    (
        -2420034,
        "fdb9f7d3-93db-4436-bd82-5d7fd853f05e",
        "Jessica Feldmark",
        # HD-12 (1/2), Baltimore/Howard — feldmark01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/feldmark01.jpg",
    ),
    (
        -2420035,
        "f6a237a0-34ff-4a93-b05a-335ec38b6da3",
        "Terri L. Hill",
        # HD-12 (2/2), Howard County — hill02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/hill02.jpg",
    ),
    (
        -2420036,
        "69cbeb94-6978-4f3f-b8b7-735f789c6d3c",
        "Gary Simmons",
        # HD-12B, Howard County — simmons01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/simmons01.jpg",
    ),
    (
        -2420037,
        "589ed7af-602a-4ec9-8072-448b05446772",
        "Pam Lanman Guzzone",
        # HD-13 (1/3), Howard County — guzzone01.jpg (compound last name; mgaleg uses 'guzzone')
        "https://mgaleg.maryland.gov/2026RS/images/guzzone01.jpg",
    ),
    (
        -2420038,
        "c0ec0d09-db8f-49fe-b4b6-0221a59ab7ec",
        "Gabriel M. Moreno",
        # HD-13 (2/3), Howard County — moreno01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/moreno01.jpg",
    ),
    (
        -2420039,
        "f45e2178-2a05-4974-8af8-379662412060",
        "Jen Terrasa",
        # HD-13 (3/3), Howard County — terrasa01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/terrasa01.jpg",
    ),
    (
        -2420040,
        "bfd0f15f-abb1-4d28-b1f4-e06875adce16",
        "Anne R. Kaiser",
        # HD-14 (1/3), Montgomery County — kaiser.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/kaiser.jpg",
    ),
    (
        -2420041,
        "8abee534-5db0-4950-a2b9-d0d1e8088cc7",
        "Bernice Mireku-North",
        # HD-14 (2/3), Montgomery County — mireku01.jpg (compound last name; mgaleg uses 'mireku')
        "https://mgaleg.maryland.gov/2026RS/images/mireku01.jpg",
    ),
    (
        -2420042,
        "a11c027a-ef25-4a09-8df7-e9b7c60bea90",
        "Pam Queen",
        # HD-14 (3/3), Montgomery County — queen01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/queen01.jpg",
    ),
    (
        -2420043,
        "b80a680a-9f79-4d56-994b-00ce24ec7ef3",
        "Linda Foley",
        # HD-15 (1/3), Montgomery County — foley01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/foley01.jpg",
    ),
    (
        -2420044,
        "ab8aa19a-42c3-445e-9632-a5c7f05458ee",
        "David Fraser-Hidalgo",
        # HD-15 (2/3), Montgomery County — fraser01.jpg (compound last name; mgaleg uses 'fraser')
        "https://mgaleg.maryland.gov/2026RS/images/fraser01.jpg",
    ),
    (
        -2420045,
        "e00e72f9-6b53-46a7-a1e4-74ab7b91d68d",
        "Lily Qi",
        # HD-15 (3/3), Montgomery County — qi01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/qi01.jpg",
    ),
    (
        -2420046,
        "e76d0654-b0c6-43dc-9159-e929e480d070",
        "Marc Korman",
        # HD-16 (1/3), Montgomery County — korman01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/korman01.jpg",
    ),
    (
        -2420047,
        "4db476f3-bc84-484c-9440-666028942469",
        "Sarah Wolek",
        # HD-16 (2/3), Montgomery County — wolek01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/wolek01.jpg",
    ),
    (
        -2420048,
        "36171e41-704b-4bf9-b300-755afe4ee06f",
        "Teresa Woorman",
        # HD-16 (3/3), Montgomery County — woorman01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/woorman01.jpg",
    ),
    (
        -2420049,
        "70d58d4b-4203-4fc2-b36f-32e6231c4339",
        "Julie Palakovich Carr",
        # HD-17 (1/3), Montgomery County — palakovich01.jpg (compound last name; mgaleg uses 'palakovich')
        "https://mgaleg.maryland.gov/2026RS/images/palakovich01.jpg",
    ),
    (
        -2420050,
        "203a0228-7a63-4a6a-b26d-fa45ba139472",
        "Ryan Spiegel",
        # HD-17 (2/3), Montgomery County — spiegel01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/spiegel01.jpg",
    ),
    (
        -2420051,
        "458a60ba-a235-4b36-80bb-8b537375a4ff",
        "Joe Vogel",
        # HD-17 (3/3), Montgomery County — vogel01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/vogel01.jpg",
    ),
    (
        -2420052,
        "bc703231-6af8-48c6-8ae6-4a93fc60b18f",
        "Aaron M. Kaufman",
        # HD-18 (1/3), Montgomery County — kaufman01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/kaufman01.jpg",
    ),
    (
        -2420053,
        "d1a30768-52e8-4a0d-badc-3e5f2f5792c7",
        "Emily Shetty",
        # HD-18 (2/3), Montgomery County — shetty01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/shetty01.jpg",
    ),
    (
        -2420054,
        "c0bf0c64-6254-40a7-b810-8717977759dd",
        "Jared Solomon",
        # HD-18 (3/3), Montgomery County — solomon01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/solomon01.jpg",
    ),
    (
        -2420055,
        "98d6a17e-59dc-4d11-a342-869603862f10",
        "Charlotte Crutchfield",
        # HD-19 (1/3), Montgomery County — crutchfield01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/crutchfield01.jpg",
    ),
    (
        -2420056,
        "17c22fec-63a4-4f5d-8607-0c364ddffd71",
        "Bonnie Cullison",
        # HD-19 (2/3), Montgomery County — cullison.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/cullison.jpg",
    ),
    (
        -2420057,
        "ac558ee8-ecae-47b6-a25e-46307521b4af",
        "Vaughn Stewart",
        # HD-19 (3/3), Montgomery County — stewart01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/stewart01.jpg",
    ),
    (
        -2420058,
        "9c5e1ac7-8a39-4c6e-8b20-0788a92f8607",
        "Lorig Charkoudian",
        # HD-20 (1/3), Montgomery County — charkoudian01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/charkoudian01.jpg",
    ),
    (
        -2420059,
        "96876928-53f8-4ed5-b2de-deab3a456d83",
        "David Moon",
        # HD-20 (2/3), Montgomery County — moon01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/moon01.jpg",
    ),
    (
        -2420060,
        "cf68a5cd-f375-4296-8a87-1828d903baea",
        "Jheanelle K. Wilkins",
        # HD-20 (3/3), Montgomery County — wilkins01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/wilkins01.jpg",
    ),
    (
        -2420061,
        "590b56b2-1473-4e86-ba96-0490e172f6ff",
        "Ben Barnes",
        # HD-21 (1/3), Prince George's — barnes.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/barnes.jpg",
    ),
    (
        -2420062,
        "251a2047-372b-480e-aa09-231f9a5edeca",
        "Mary A. Lehman",
        # HD-21 (2/3), Prince George's — lehman01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/lehman01.jpg",
    ),
    (
        -2420063,
        "00cd05cc-75de-4d9a-ab23-9f53441bc186",
        "Joseline Peña-Melnyk",
        # HD-21 (3/3), Prince George's (Speaker of House) — pena.jpg
        # mgaleg uses 'pena' (no ñ, no hyphen, no melnyk in the filename)
        "https://mgaleg.maryland.gov/2026RS/images/pena.jpg",
    ),
    (
        -2420064,
        "4436b432-a63f-4946-919a-f30c41f899e4",
        "Anne Healey",
        # HD-22 (1/3), Prince George's — healey.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/healey.jpg",
    ),
    (
        -2420065,
        "d8eee978-cec3-492d-9867-9d40b2a50a9d",
        "Ashanti Martinez",
        # HD-22 (2/3), Prince George's — martinez01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/martinez01.jpg",
    ),
    (
        -2420066,
        "5c24446e-c9d6-4dda-9703-e3c049798315",
        "Nicole A. Williams",
        # HD-22 (3/3), Prince George's — williams01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/williams01.jpg",
    ),
    (
        -2420067,
        "1da26040-98b4-4eb0-aa1f-3ec05b297a29",
        "Adrian Boafo",
        # HD-23 (1/3), Prince George's — boafo01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/boafo01.jpg",
    ),
    (
        -2420068,
        "b8e331fa-d58e-479f-b076-8fda0b0604c5",
        "Marvin E. Holmes, Jr.",
        # HD-23 (2/3), Prince George's — holmes.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/holmes.jpg",
    ),
    (
        -2420069,
        "9273ed81-2052-428a-b39d-849abeef270b",
        "Kym Taylor",
        # HD-23 (3/3), Prince George's — taylor03.jpg (suffix 03 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/taylor03.jpg",
    ),
    (
        -2420070,
        "2e809682-2d95-480c-885e-d2174b811cfe",
        "Tiffany T. Alston",
        # HD-24 (1/3), Prince George's — alston01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/alston01.jpg",
    ),
    (
        -2420071,
        "8fab5ff7-603d-4ab0-a05c-a7070d187a48",
        "Derrick Coley",
        # HD-24 (2/3), Prince George's — coley01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/coley01.jpg",
    ),
    (
        -2420072,
        "d61a670a-7626-4464-93dc-c1e21d7b26da",
        "Andrea Fletcher Harrison",
        # HD-24 (3/3), Prince George's — harrison01.jpg (compound; mgaleg uses 'harrison')
        "https://mgaleg.maryland.gov/2026RS/images/harrison01.jpg",
    ),
    (
        -2420073,
        "338210ee-b9ab-4820-bfce-98f5354837af",
        "Kent Roberson",
        # HD-25 (1/3), Prince George's — roberson01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/roberson01.jpg",
    ),
    (
        -2420074,
        "d5999df9-83b8-4870-a170-4d13f40473e2",
        "Denise Roberts",
        # HD-25 (2/3), Prince George's — roberts01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/roberts01.jpg",
    ),
    (
        -2420075,
        "cd422f8c-913b-4280-987b-9383ead34e85",
        "Karen Toles",
        # HD-25 (3/3), Prince George's — toles01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/toles01.jpg",
    ),
    (
        -2420076,
        "7a76712a-38cd-41de-b260-cd0127284f16",
        "Veronica Turner",
        # HD-26 (1/3), Prince George's — turner01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/turner01.jpg",
    ),
    (
        -2420077,
        "768ac1cf-a599-4ddb-943c-c985fafb2607",
        "Kriselda Valderrama",
        # HD-26 (2/3), Prince George's — valderrama.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/valderrama.jpg",
    ),
    (
        -2420078,
        "916afe40-4061-476f-9a54-b271b32778d2",
        "Jamila J. Woods",
        # HD-26 (3/3), Prince George's — woods01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/woods01.jpg",
    ),
    (
        -2420079,
        "0e238dbf-5b4e-4e95-8a94-e02d97a136f5",
        "Darrell Odom",
        # HD-27A, Prince George's — odom01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/odom01.jpg",
    ),
    (
        -2420080,
        "70f63959-f51d-4411-adc1-f1c429bbc397",
        "Jeffrie E. Long, Jr.",
        # HD-27B (1/2), Prince George's — long02.jpg (disambiguates from Robert Long)
        "https://mgaleg.maryland.gov/2026RS/images/long02.jpg",
    ),
    (
        -2420081,
        "71542618-59c8-4b06-a765-e3df60cca763",
        "Mark N. Fisher",
        # HD-27B (2/2), Prince George's — fisher.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/fisher.jpg",
    ),
    (
        -2420082,
        "1cc5a555-4b8a-4573-8525-9ad2c7c0bf46",
        "Debra Davis",
        # HD-27C, Prince George's — davis02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/davis02.jpg",
    ),
    (
        -2420083,
        "b9c61fea-fcb1-45cc-8e2c-e5b3046b7266",
        "Edith J. Patterson",
        # HD-28 (1/3), Prince George's — patterson02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/patterson02.jpg",
    ),
    (
        -2420084,
        "69870c10-cea2-43c2-8cf9-bfcaf0b82265",
        "C. T. Wilson",
        # HD-28 (2/3), Charles County — wilson.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/wilson.jpg",
    ),
    (
        -2420085,
        "c4e4d811-1e14-45fe-9335-7521f1603856",
        "Matthew Morgan",
        # HD-28 (3/3), Charles County — morgan02.jpg (disambiguates from Todd Morgan)
        "https://mgaleg.maryland.gov/2026RS/images/morgan02.jpg",
    ),
    (
        -2420086,
        "898845f9-cb93-4162-b0ed-6842eacda5d6",
        "Brian M. Crosby",
        # HD-29A, St. Mary's/Charles — crosby01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/crosby01.jpg",
    ),
    (
        -2420087,
        "7d79931f-101c-415b-a6a0-b7a919f70905",
        "Todd B. Morgan",
        # HD-29B (1/2), St. Mary's — morgan03.jpg (disambiguates from Matthew Morgan)
        "https://mgaleg.maryland.gov/2026RS/images/morgan03.jpg",
    ),
    (
        -2420088,
        "3f45bad5-b856-4d8e-b3d9-8c03623e030a",
        "Dylan Behler",
        # HD-29B (2/2), St. Mary's — behler01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/behler01.jpg",
    ),
    (
        -2420089,
        "d8eabd9b-2aa8-40de-94ce-06ce6ef167cf",
        "Dana Jones",
        # HD-29C, Calvert County — jones01.jpg (disambiguates from Adrienne Jones)
        "https://mgaleg.maryland.gov/2026RS/images/jones01.jpg",
    ),
    (
        -2420090,
        "2fe3f655-c28e-40c3-a2f9-48ea9eb8b498",
        "Seth A. Howard",
        # HD-30 (1/3), Anne Arundel — howard01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/howard01.jpg",
    ),
    (
        -2420091,
        "cfc704da-dd6c-40b0-97fa-0c5ece8d3976",
        "Brian Chisholm",
        # HD-30 (2/3), Anne Arundel — chisholm01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/chisholm01.jpg",
    ),
    (
        -2420092,
        "0e0bdc53-b5a2-4292-aeb7-341a4c5bed08",
        "Nicholaus R. Kipke",
        # HD-30 (3/3), Anne Arundel — kipke.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/kipke.jpg",
    ),
    (
        -2420093,
        "13462ee2-0dd9-4f70-809f-a813c23951d4",
        "LaToya Nkongolo",
        # HD-30A, Anne Arundel — nkongolo01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/nkongolo01.jpg",
    ),
    (
        -2420094,
        "7d818044-a989-47e1-b6cf-d482ebad0600",
        "J. Sandy Bartlett",
        # HD-30B, Anne Arundel — bartlett02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/bartlett02.jpg",
    ),
    (
        -2420095,
        "4a409af4-8568-42c3-bb72-7bb7500c96ce",
        "Mark S. Chang",
        # HD-31 (1/3), Anne Arundel — chang01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/chang01.jpg",
    ),
    (
        -2420096,
        "24980735-6a39-4e48-94b0-7318cac8dfde",
        "Mike Rogers",
        # HD-31 (2/3), Anne Arundel — rogers01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/rogers01.jpg",
    ),
    (
        -2420097,
        "ddfd43d3-023d-417e-9b68-af5a693e601e",
        "Andrew C. Pruski",
        # HD-31 (3/3), Anne Arundel — pruski01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/pruski01.jpg",
    ),
    (
        -2420098,
        "55d9d0b6-78a3-460b-97b9-87913ffc8e85",
        "Stuart Michael Schmidt, Jr.",
        # HD-32 (1/3), Anne Arundel — schmidt01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/schmidt01.jpg",
    ),
    (
        -2420099,
        "41749b94-11b8-4047-8421-95db0900d4b2",
        "Heather Bagnall",
        # HD-32 (2/3), Anne Arundel — bagnall01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/bagnall01.jpg",
    ),
    (
        -2420100,
        "b592e432-6411-48b3-bca3-d5596d0d81e9",
        "Andre V. Johnson, Jr.",
        # HD-32 (3/3), Anne Arundel — johnson02.jpg (disambiguates from Steve Johnson)
        "https://mgaleg.maryland.gov/2026RS/images/johnson02.jpg",
    ),
    (
        -2420101,
        "dbb1c600-c87b-449c-bd3b-1c236287c00f",
        "Steve Johnson",
        # HD-33 (1/3), Anne Arundel — johnson01.jpg (disambiguates from Andre Johnson Jr.)
        "https://mgaleg.maryland.gov/2026RS/images/johnson01.jpg",
    ),
    (
        -2420102,
        "58d0ff82-631f-475f-889a-9a4ebb39fc07",
        "Susan K. McComas",
        # HD-33 (2/3), Harford County — mccomas.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/mccomas.jpg",
    ),
    (
        -2420103,
        "0c789b27-d50c-4822-95ff-409ecb7db08a",
        "Mike Griffith",
        # HD-33 (3/3), Harford County — griffith02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/griffith02.jpg",
    ),
    (
        -2420104,
        "547841f2-3476-4e83-9344-0cac984d44e8",
        "Teresa E. Reilly",
        # HD-34A (1/2), Harford County — reilly01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/reilly01.jpg",
    ),
    (
        -2420105,
        "96a6d696-50fd-4393-a0f6-19e69dc15716",
        "Kevin B. Hornberger",
        # HD-34A (2/2), Harford County — hornberger01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/hornberger01.jpg",
    ),
    (
        -2420106,
        "fee8a413-a3a8-4568-ad9b-db00f94f5ac2",
        "Steven J. Arentz",
        # HD-35A, Cecil County — arentz01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/arentz01.jpg",
    ),
    (
        -2420107,
        "eca530ff-628d-417d-a3dc-b858dc7c2376",
        "Jefferson L. Ghrist",
        # HD-35B (1/2), Cecil/Kent — ghrist01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/ghrist01.jpg",
    ),
    (
        -2420108,
        "8b43dd9c-26c3-48bb-ac60-d95f8a39349a",
        "Jay A. Jacobs",
        # HD-35B (2/2), Cecil County — 'jacobs j.jpg' (space in filename; URL-encoded as %20)
        "https://mgaleg.maryland.gov/2026RS/images/jacobs%20j.jpg",
    ),
    (
        -2420109,
        "a1c2b55c-df7d-487c-ad90-7f7e2c2e6951",
        "Sheree Sample-Hughes",
        # HD-36 (1/3), Eastern Shore (Wicomico) — sample01.jpg (compound; mgaleg uses 'sample')
        "https://mgaleg.maryland.gov/2026RS/images/sample01.jpg",
    ),
    (
        -2420110,
        "1eada938-f28c-46b9-bd21-df241656cd2b",
        "Christopher T. Adams",
        # HD-36 (2/3), Eastern Shore — adams01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/adams01.jpg",
    ),
    (
        -2420111,
        "fb1fe811-b340-42d3-88ee-97b5364117cd",
        "Thomas S. Hutchinson",
        # HD-36 (3/3), Eastern Shore — hutchinson01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/hutchinson01.jpg",
    ),
    (
        -2420112,
        "d17104a7-8a35-4bcd-8879-76ceb997df6a",
        "H. Kevin Anderson",
        # HD-37A (1/2), Eastern Shore — anderson01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/anderson01.jpg",
    ),
    (
        -2420113,
        "bc7ee014-a452-4eaf-81e9-2f4c55d3eaea",
        "Barry Beauchamp",
        # HD-37A (2/2), Eastern Shore — beauchamp01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/beauchamp01.jpg",
    ),
    (
        -2420114,
        "1ff2bb96-0e55-4893-8a4c-b675dfbb79f6",
        "Wayne A. Hartman",
        # HD-37B, Eastern Shore (Worcester) — hartman01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/hartman01.jpg",
    ),
    (
        -2420115,
        "e1b53b61-d4f7-4d10-bdb3-2a8dcfb12820",
        "Gabriel Acevero",
        # HD-38 (1/3), Montgomery County — acevero01.jpg
        # Note: HD-38 is in the A/B/C category; Acevedo covers 38A, 38B or 38C
        "https://mgaleg.maryland.gov/2026RS/images/acevero01.jpg",
    ),
    (
        -2420116,
        "2fa68ca4-00b5-4518-a692-d12447d7fec3",
        "Lesley J. Lopez",
        # HD-38 — lopez01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/lopez01.jpg",
    ),
    (
        -2420117,
        "b7e2aa8f-a301-4004-81e9-d1f857c81075",
        "Greg Wims",
        # HD-38 — wims01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/wims01.jpg",
    ),
    (
        -2420118,
        "62bed8b6-beb2-4c41-b234-dc6427bfc9c0",
        "Marlon Amprey",
        # HD-40 (1/3), Baltimore City — amprey01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/amprey01.jpg",
    ),
    (
        -2420119,
        "94855fb3-0e08-45ac-8c67-ba668ef67c4b",
        "Frank M. Conaway, Jr.",
        # HD-40 (2/3), Baltimore City — conaway.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/conaway.jpg",
    ),
    (
        -2420120,
        "7217c1b4-6fae-447d-9566-f2513319fa94",
        "Melissa Wells",
        # HD-40 (3/3), Baltimore City — wells02.jpg (suffix 02 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/wells02.jpg",
    ),
    (
        -2420121,
        "36eecaff-4677-441a-b36e-a323e87d9158",
        "Samuel I. Rosenberg",
        # HD-41 (1/3), Baltimore City — rosenberg.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/rosenberg.jpg",
    ),
    (
        -2420122,
        "7e1dfb66-1eff-4c8d-b3fe-d39f990b99c4",
        "Malcolm P. Ruff",
        # HD-41 (2/3), Baltimore City — ruff01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/ruff01.jpg",
    ),
    (
        -2420123,
        "012af8f7-693a-4ddc-b0bc-953dae8d2bc2",
        "Sean A. Stinnett",
        # HD-41 (3/3), Baltimore City — stinnett01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/stinnett01.jpg",
    ),
    # -2420124 EXCLUDED: Vacant (District 42A, is_vacant=true) — no headshot
    (
        -2420125,
        "bb180c23-b965-4bba-a2b9-73febd484d21",
        "Michele Guyton",
        # HD-42B (1/2), Baltimore County — guyton01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/guyton01.jpg",
    ),
    (
        -2420126,
        "656a8bc9-348e-4ffc-819c-2f4611b3ddc8",
        "Joshua J. Stonko",
        # HD-42B (2/2), Baltimore County — stonko01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/stonko01.jpg",
    ),
    (
        -2420127,
        "027a2610-1160-4525-a5c1-469fe85d46e1",
        "Regina T. Boyce",
        # HD-43 (1/3), Baltimore City — boyce01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/boyce01.jpg",
    ),
    (
        -2420128,
        "03a161cf-1da8-4c34-9c08-d91bbf958987",
        "Elizabeth Embry",
        # HD-43 (2/3), Baltimore City — embry01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/embry01.jpg",
    ),
    (
        -2420129,
        "c017b328-4469-45c4-aa8a-7b9035c77e22",
        "Catherine M. Forbes",
        # HD-43 (3/3), Baltimore City — forbes01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/forbes01.jpg",
    ),
    (
        -2420130,
        "22610d7f-eaca-4802-b486-0e48544e6e7d",
        "Eric Ebersole",
        # HD-44 (1/3), Baltimore City — ebersole01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/ebersole01.jpg",
    ),
    (
        -2420131,
        "fcfa1844-032e-4dba-9ae0-c52b82447fa8",
        "Aletheia McCaskill",
        # HD-44 (2/3), Baltimore City — mccaskill01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/mccaskill01.jpg",
    ),
    (
        -2420132,
        "df1a05a1-2a70-4e40-a0c6-5b3f81632c7e",
        "Sheila Ruth",
        # HD-44 (3/3), Baltimore City — ruth01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/ruth01.jpg",
    ),
    (
        -2420133,
        "01aaf4ba-c8ec-4a50-bd56-8d181d35e903",
        "Jackie Addison",
        # HD-45 (1/3), Baltimore City — addison01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/addison01.jpg",
    ),
    (
        -2420134,
        "848ac881-004b-436a-9a17-dfacbd33de5a",
        "Stephanie Smith",
        # HD-45 (2/3), Baltimore City — smith03.jpg (suffix 03 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/smith03.jpg",
    ),
    (
        -2420135,
        "92075c9b-6c7e-4763-981f-5a42a8afddf5",
        "Caylin Young",
        # HD-45 (3/3), Baltimore City — young05.jpg (suffix 05 per roster)
        "https://mgaleg.maryland.gov/2026RS/images/young05.jpg",
    ),
    (
        -2420136,
        "ad1aaa25-0ef6-4c88-9d78-d75aec7398c7",
        "Luke Clippinger",
        # HD-46 (1/3), Baltimore City — clippinger.jpg (no suffix, unique name)
        "https://mgaleg.maryland.gov/2026RS/images/clippinger.jpg",
    ),
    (
        -2420137,
        "bec4b395-bb4b-4740-ac1c-8e89f12608a2",
        "Mark Edelson",
        # HD-46 (2/3), Baltimore City — edelson01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/edelson01.jpg",
    ),
    (
        -2420138,
        "9285f590-79b5-48de-a1c0-a022629e6ebb",
        "Robbyn Lewis",
        # HD-46 (3/3), Baltimore City — lewis01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/lewis01.jpg",
    ),
    (
        -2420139,
        "192e8ffb-e576-41f1-915a-dbc0c30d4769",
        "Diana M. Fennell",
        # HD-47A (1/2), Prince George's — fennell01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/fennell01.jpg",
    ),
    (
        -2420140,
        "69bf6043-4546-4804-ae04-311cff54a986",
        "Julian Ivey",
        # HD-47A (2/2), Prince George's — ivey01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/ivey01.jpg",
    ),
    (
        -2420141,
        "a92085b6-642a-4cf6-a73e-c985a6fd09fa",
        "Deni Taveras",
        # HD-47B, Prince George's — taveras01.jpg
        "https://mgaleg.maryland.gov/2026RS/images/taveras01.jpg",
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

    print(f"Processing {len(OFFICIALS)} MD delegates (Plan 93-06, D-05 best-effort)")
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
            # Per D-05: per-delegate failures are logged, not fatal
            print(f"  SKIP: error — {e}")
            failed.append((ext_id, name, str(e)))

        print()

    # ============================================================
    # End-of-run summary
    # ============================================================
    print("=" * 60)
    print("SUMMARY — MD House of Delegates Headshots (Plan 93-06)")
    print("=" * 60)
    print(f"OFFICIALS={len(OFFICIALS)}, processed={len(processed)}, "
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

    # Per D-05: script exits 0 even if individual delegates failed (best-effort)
    # Only fails hard if SERVICE_KEY missing/invalid (already checked at startup) or DB unreachable
    print(f"\nDone. {len(processed)} new uploads, {len(skipped_exists)} already existed, "
          f"{len(skipped_no_url)} no-URL skips, {len(failed)} failures.")


if __name__ == "__main__":
    main()
