"""
Banner uploader for Essentials section banners.

Uploads a local banner JPEG to Supabase Storage (politician_photos bucket)
using the secret key read from the SUPABASE_SERVICE_ROLE_KEY environment
variable. Never hardcodes, logs or prints the key value.

Supports all four storage tier paths:
  states/<ABBR>.jpg                        e.g. states/IN.jpg
  national/<name>.jpg                      e.g. national/us-capitol-banner.jpg
  la_county/building_photos/<geoid>.jpg    e.g. la_county/building_photos/0644000.jpg
  cities/<slug>.jpg                        e.g. cities/bloomington.jpg  (D-05)

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<secret key, starts sb_secret_>
  py scripts/banners/upload_banner.py --file /tmp/bloomington.jpg --dest cities/bloomington.jpg

Three things this script learned the hard way on 2026-11-18, when it could not
upload cities/los-angeles-county.jpg or cities/racine-county.jpg and both had to
go up through the Supabase dashboard instead:

  1. CREATE IS POST, NOT PUT. It used to send `-X PUT` for everything, with a
     comment claiming PUT was the overwrite-safe choice. PUT only *replaces* an
     object that already exists; against a new key Storage answers
     {"statusCode":"404","error":"not_found","message":"Object not found"} -
     which reads like a missing local file rather than the wrong verb. Every new
     banner hit this. It now POSTs with `x-upsert: true` and falls back to PUT
     only if Storage reports a duplicate.

  2. THE KEY FORMAT CHANGED. The legacy anon/service_role JWTs were disabled on
     2026-09-09. A current secret key starts `sb_secret_`; a legacy one starts
     `eyJ` and is dead; `sbp_` is a personal access token for the management API
     and has no access to Storage at all. Anything else (the value sitting in
     C:/EV-Accounts/backend/.env is 42 opaque characters) makes Storage try to
     parse the credential as a JWT and fail with "Invalid Compact JWS", which
     reads as a bad password rather than as the wrong kind of secret. The key is
     now classified BEFORE the upload, and known-bad kinds are refused by name.

  3. UPLOADING IS NOT SHIPPING. A 200 from Storage is not evidence the object is
     servable. After a successful upload the script re-downloads the public URL
     and compares the bytes against the local file, because that is the check
     that was done by hand for every banner before this.

Exit codes: 0 on a verified upload, 1 on anything else.
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

# Storage endpoints for the politician_photos bucket.
# Keep these in sync with buildingImages.js FEDERAL_IMAGE / STATE_PANORAMA_BASE.
BUCKET_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object'
BUCKET_PUBLIC_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public'
BUCKET_NAME = 'politician_photos'

# The four tiers buildingImages.js actually reads. A banner uploaded anywhere
# else - the bucket root above all, which is where a dashboard upload lands if
# you forget to open the folder first - is a different key and will never be
# found by the app.
DEST_PATTERN = re.compile(
    r'^(states/[A-Z]{2}'
    r'|national/[a-z0-9-]+'
    r'|la_county/building_photos/[0-9]+'
    r'|cities/[a-z0-9-]+)\.jpg$'
)


def classify_key(key):
    """Name the kind of credential we were handed, without revealing any of it.

    Returns (kind, explanation). kind is 'secret' (good), 'legacy' / 'pat'
    (known wrong), or 'unknown' (proceed, but say so).
    """
    if key.startswith('sb_secret_'):
        return 'secret', 'current secret key'
    if key.startswith('eyJ'):
        return 'legacy', (
            'This is a legacy service_role JWT. Those were DISABLED on 2026-09-09 and\n'
            '  Storage will reject it. Get the current secret key from the dashboard:\n'
            '  Project Settings > API Keys > secret key (it starts sb_secret_).'
        )
    if key.startswith('sbp_'):
        return 'pat', (
            'This is a personal access token for the Supabase MANAGEMENT API.\n'
            '  It has no access to Storage. You want the project secret key:\n'
            '  Project Settings > API Keys > secret key (it starts sb_secret_).'
        )
    return 'unknown', (
        f'Unrecognised key format (length {len(key)}, no known prefix).\n'
        '  A current secret key starts sb_secret_; a legacy JWT starts eyJ.\n'
        '  If Storage answers "Invalid Compact JWS", this is why: it is trying to\n'
        '  parse the credential as a JWT. The value under SUPABASE_SERVICE_ROLE_KEY\n'
        '  in C:/EV-Accounts/backend/.env was 42 opaque characters on 2026-11-18 and\n'
        '  did NOT work - prefer the dashboard key over whatever is in that file.'
    )


def get_service_key():
    """Read the secret key from the environment. Exit 1 if unset or known-bad."""
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not key:
        print('ERROR: SUPABASE_SERVICE_ROLE_KEY not set')
        print('  Export it before running (bash):')
        print("    export SUPABASE_SERVICE_ROLE_KEY='<secret key>'")
        print('  or (PowerShell):')
        print("    $env:SUPABASE_SERVICE_ROLE_KEY = '<secret key>'")
        print('  Get it from Project Settings > API Keys > secret key (starts sb_secret_).')
        sys.exit(1)

    if key != key.strip():
        print('ERROR: the key has leading or trailing whitespace - a copy/paste artifact.')
        print('  Re-export it with no stray spaces or newline.')
        sys.exit(1)

    kind, explanation = classify_key(key)
    if kind in ('legacy', 'pat'):
        print(f'ERROR: wrong kind of credential.\n  {explanation}')
        sys.exit(1)
    if kind == 'unknown':
        print(f'WARNING: {explanation}')
        print('  Trying it anyway.')
    return key


def _curl(args, timeout=120):
    """Run curl, returning (body, http_code). Never echoes the argv (it holds the key)."""
    result = subprocess.run(
        ['curl', '-s', '-w', '\n%{http_code}'] + args,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    out = result.stdout or ''
    if '\n' in out:
        body, _, code = out.rpartition('\n')
    else:
        body, code = out, ''
    if not code.strip().isdigit() and result.stderr:
        print(f'  curl stderr: {result.stderr[:200]}')
    return body, code.strip()


def _auth_headers(service_key):
    # BOTH Authorization AND apikey, both set to the same key. With the non-JWT
    # secret key, Authorization alone comes back HTTP 400 "Invalid Compact JWS".
    return [
        '-H', f'Authorization: Bearer {service_key}',
        '-H', f'apikey: {service_key}',
    ]


def object_exists(dest_path):
    """True if the object is already servable. Public bucket, so no auth needed."""
    _, code = _curl(['-o', os.devnull, '-I', f'{BUCKET_PUBLIC_BASE}/{BUCKET_NAME}/{dest_path}'],
                    timeout=30)
    return code == '200'


def _explain_failure(body, code):
    """Turn a Storage error into the thing to actually go and do."""
    try:
        resp = json.loads(body)
        msg = resp.get('message') or resp.get('error') or body[:200]
    except Exception:
        msg = body[:200] or '(empty response)'

    print(f'ERROR: upload failed (HTTP {code or "?"}) - {msg}')

    low = str(msg).lower()
    if 'compact jws' in low or 'jwt' in low:
        print('  The credential is not a current Supabase key. Storage tried to parse it as a')
        print('  JWT. Get the secret key from Project Settings > API Keys (starts sb_secret_).')
    elif 'not found' in low:
        print('  Storage says the OBJECT does not exist, which for a write means the verb was')
        print('  wrong. This script POSTs to create; if you are seeing this, the bucket name or')
        print(f'  the dest path is wrong - check that "{BUCKET_NAME}" and the tier folder exist.')
    elif code in ('401', '403'):
        print('  Authorised but refused: the key may be valid and lack Storage write access,')
        print('  or the bucket policy may have changed. Check Storage > Policies.')
    elif code == '413':
        print('  The file is too large for the bucket limit. Re-run process_banner.py.')
    elif 'exceed' in low or 'quota' in low or 'limit' in low:
        print('  This looks like a project usage limit, not a bad request. Check the dashboard')
        print('  header for EXCEEDING USAGE LIMITS and the billing page.')
    return False


def upload_banner(local_file, dest_path, service_key):
    """Create (POST) or replace (PUT) politician_photos/<dest_path>.

    Returns the public CDN URL on success; exits 1 on failure.
    """
    upload_url = f'{BUCKET_BASE}/{BUCKET_NAME}/{dest_path}'
    public_url = f'{BUCKET_PUBLIC_BASE}/{BUCKET_NAME}/{dest_path}'

    existed = object_exists(dest_path)
    print(f'Uploading: {local_file}')
    print(f'  -> {BUCKET_NAME}/{dest_path}  ({"REPLACING an existing object" if existed else "creating a new object"})')

    common = _auth_headers(service_key) + [
        '-H', 'Content-Type: image/jpeg',
        '--data-binary', f'@{local_file}',
    ]

    # POST creates. x-upsert lets the same call replace an existing object, so
    # the usual redo path needs no second request.
    body, code = _curl(['-X', 'POST', upload_url, '-H', 'x-upsert: true'] + common)

    duplicate = code == '409' or 'duplicate' in body.lower() or 'already exists' in body.lower()
    if duplicate:
        # Older Storage versions ignore x-upsert on POST; PUT is the explicit replace.
        print('  (object already exists and x-upsert was not honoured - replacing with PUT)')
        body, code = _curl(['-X', 'PUT', upload_url] + common)

    try:
        resp = json.loads(body)
    except Exception:
        resp = {}

    if code.startswith('2') and ('Key' in resp or 'Id' in resp or 'path' in resp):
        print(f'Uploaded: {public_url}')
        return public_url

    _explain_failure(body, code)
    sys.exit(1)


def verify_upload(local_file, dest_path, public_url):
    """Re-download the public URL and prove it is the file we just sent."""
    print('Verifying the served object...')
    with open(local_file, 'rb') as fh:
        local_bytes = fh.read()
    local_sha = hashlib.sha256(local_bytes).hexdigest()

    tmp_dir = tempfile.mkdtemp(prefix='banner-verify-')
    tmp_file = os.path.join(tmp_dir, 'served.jpg')
    try:
        _, code = _curl(['-o', tmp_file, f'{BUCKET_PUBLIC_BASE}/{BUCKET_NAME}/{dest_path}'],
                        timeout=60)
        if code != '200':
            print(f'ERROR: the object is not servable - GET returned HTTP {code or "?"}')
            print('  The upload reported success but readers cannot fetch it. Check the')
            print('  bucket is public and the path is right before wiring it into the app.')
            sys.exit(1)

        with open(tmp_file, 'rb') as fh:
            served = fh.read()
        served_sha = hashlib.sha256(served).hexdigest()

        if served_sha != local_sha:
            print('ERROR: the served object does NOT match the local file.')
            print(f'  local  {len(local_bytes):>9,} bytes  sha256 {local_sha[:32]}')
            print(f'  served {len(served):>9,} bytes  sha256 {served_sha[:32]}')
            print('  Something else is at that key, or a CDN cache is still serving the old')
            print('  object. Do not wire this path into buildingImages.js yet.')
            sys.exit(1)

        print(f'  OK: {len(served):,} bytes, sha256 matches the local file.')
        print(f'Success: {public_url}')
    finally:
        try:
            os.remove(tmp_file)
            os.rmdir(tmp_dir)
        except OSError:
            pass


def main():
    parser = argparse.ArgumentParser(
        description=(
            'Upload a banner JPEG to Supabase Storage (politician_photos bucket), then '
            'verify the served bytes match. Reads SUPABASE_SERVICE_ROLE_KEY from the '
            'environment; exits 1 if unset or the wrong kind of credential.'
        )
    )
    parser.add_argument(
        '--file', '-f',
        required=True,
        metavar='PATH',
        help='Local path to the processed banner JPEG to upload.'
    )
    parser.add_argument(
        '--dest', '-d',
        required=True,
        metavar='DEST',
        help=(
            'Destination object path within the politician_photos bucket. '
            'Examples: cities/bloomington.jpg  |  states/IN.jpg  |  '
            'national/us-capitol-banner.jpg  |  la_county/building_photos/0644000.jpg'
        )
    )
    parser.add_argument(
        '--skip-verify',
        action='store_true',
        help='Upload without re-downloading to compare bytes. Not recommended.'
    )

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f'ERROR: file not found: {args.file}')
        sys.exit(1)

    if not DEST_PATTERN.match(args.dest):
        print(f'ERROR: dest is not one of the four tier paths: {args.dest}')
        print('  Expected one of:')
        print('    states/<ABBR>.jpg                      e.g. states/IN.jpg')
        print('    national/<slug>.jpg                    e.g. national/us-capitol-banner.jpg')
        print('    la_county/building_photos/<geoid>.jpg  e.g. la_county/building_photos/0644000.jpg')
        print('    cities/<slug>.jpg                      e.g. cities/racine-county.jpg')
        print('  A banner at any other key - the bucket root especially - is a key the app')
        print('  never looks at, so it will 404 behind a banner that appears to exist.')
        sys.exit(1)

    service_key = get_service_key()
    public_url = upload_banner(args.file, args.dest, service_key)
    if args.skip_verify:
        print('Skipped verification (--skip-verify).')
    else:
        verify_upload(args.file, args.dest, public_url)


if __name__ == '__main__':
    main()
