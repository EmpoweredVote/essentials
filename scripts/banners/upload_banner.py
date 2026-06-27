"""
Banner uploader for Essentials section banners.

Uploads a local banner JPEG to Supabase Storage (politician_photos bucket)
using the service-role key read from the SUPABASE_SERVICE_ROLE_KEY environment
variable. Never hardcodes or prints the key value.

Supports all four storage tier paths:
  states/<ABBR>.jpg                        e.g. states/IN.jpg
  national/<name>.jpg                      e.g. national/us-capitol-banner.jpg
  la_county/building_photos/<geoid>.jpg    e.g. la_county/building_photos/0644000.jpg
  cities/<slug>.jpg                        e.g. cities/bloomington.jpg  (D-05)

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<key from C:/EV-Accounts/backend/.env>
  python scripts/banners/upload_banner.py --file /tmp/bloomington.jpg --dest cities/bloomington.jpg

The script exits 1 if the key is unset, the file is missing, or the upload fails.
On success it prints the public CDN URL of the uploaded asset.
"""

import argparse
import json
import os
import subprocess
import sys

# Storage endpoints for the politician_photos bucket.
# Keep these in sync with buildingImages.js FEDERAL_IMAGE / STATE_PANORAMA_BASE.
BUCKET_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object'
BUCKET_PUBLIC_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public'
BUCKET_NAME = 'politician_photos'


def get_service_key():
    """Read the service-role key from the environment. Exit 1 if unset."""
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    if not key:
        print('ERROR: SUPABASE_SERVICE_ROLE_KEY not set')
        print('  Export the key before running:')
        print('    export SUPABASE_SERVICE_ROLE_KEY=<key>')
        print('  The key is in C:/EV-Accounts/backend/.env (use forward slashes or a code fence).')
        sys.exit(1)
    return key


def upload_banner(local_file, dest_path, service_key):
    """
    Upload a local JPEG to politician_photos/<dest_path> via PUT (overwrite-safe).
    Returns the public CDN URL on success; exits 1 on failure.
    """
    upload_url = f'{BUCKET_BASE}/{BUCKET_NAME}/{dest_path}'
    public_url = f'{BUCKET_PUBLIC_BASE}/{BUCKET_NAME}/{dest_path}'

    print(f'Uploading: {local_file}')
    print(f'  → {BUCKET_NAME}/{dest_path}')

    # Use curl --data-binary for binary-safe upload.
    # -X PUT to overwrite an existing key (vs POST which creates new only).
    # Authorization header uses the service-role key — never logged here.
    result = subprocess.run(
        [
            'curl', '-s', '-X', 'PUT', upload_url,
            '-H', f'Authorization: Bearer {service_key}',
            '-H', 'Content-Type: image/jpeg',
            '--data-binary', f'@{local_file}',
        ],
        capture_output=True,
        text=True,
        timeout=60,
    )

    try:
        resp = json.loads(result.stdout)
    except Exception:
        print(f'ERROR: could not parse Storage response: {result.stdout[:200]}')
        if result.stderr:
            print(f'  stderr: {result.stderr[:200]}')
        sys.exit(1)

    if 'Key' in resp or 'Id' in resp:
        print(f'Success: {public_url}')
        return public_url
    else:
        # Storage returns error objects with a "message" field
        msg = resp.get('message') or resp.get('error') or result.stdout[:200]
        print(f'ERROR: upload failed — {msg}')
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description=(
            'Upload a banner JPEG to Supabase Storage (politician_photos bucket). '
            'Reads SUPABASE_SERVICE_ROLE_KEY from environment; exits 1 if unset.'
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

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f'ERROR: file not found: {args.file}')
        sys.exit(1)

    service_key = get_service_key()
    upload_banner(args.file, args.dest, service_key)


if __name__ == '__main__':
    main()
