"""
Banner image processor for Essentials section banners.

Crops a source image to the banner aspect ratio (1700x540, ~3.15:1 landscape),
resizes with LANCZOS, and saves as JPEG quality 90.

Target spec (measured from live production assets in politician_photos bucket):
  - Dimensions: 1700 x 540 px
  - Aspect:     ~3.15:1 (ultra-wide landscape)
  - Format:     JPEG quality 90, optimize=True
  - Overlay:    NOT applied here — SectionBanner.jsx applies the dark gradient at
                render. Use --overlay to optionally bake it in (off by default).

Usage (local file):
  python scripts/banners/process_banner.py --input photo.jpg --output cities/bloomington.jpg

Usage (download from URL first):
  python scripts/banners/process_banner.py --url https://... --output cities/bloomington.jpg

Optional flags:
  --overlay   Bake a bottom-up dark gradient into the JPEG (off by default;
              the 50 live state panoramas are NOT pre-darkened).
"""

import argparse
import os
import sys
from io import BytesIO

import requests
from PIL import Image, ImageDraw

HEADERS = {'User-Agent': 'EmpoweredVote/1.0 (info@empowered.vote)'}

TARGET_W = 1700
TARGET_H = 540
TARGET_RATIO = TARGET_W / TARGET_H  # ~3.148


def download_image(url):
    """Download an image from a URL and return the raw bytes."""
    print(f"Downloading: {url}")
    r = requests.get(url, headers=HEADERS, timeout=30)
    if r.status_code != 200:
        print(f"ERROR: download failed with HTTP {r.status_code}")
        sys.exit(1)
    return r.content


def center_crop_to_ratio(img, target_ratio):
    """
    Center-crop img to match target_ratio (width/height) WITHOUT stretching.
    Crops the longer dimension to preserve the shorter one.
    """
    w, h = img.size
    current_ratio = w / h

    if current_ratio > target_ratio:
        # Image is wider than target — crop sides
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Image is taller than target — crop top/bottom (center vertically)
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        img = img.crop((0, top, w, top + new_h))
    # Exactly equal ratio: no crop needed

    return img


def apply_dark_overlay(img):
    """
    Bake a bottom-up dark gradient overlay into the image.
    Simulates the SectionBanner.jsx IMAGE_OVERLAY_GRADIENT at source level.
    Only used when --overlay flag is passed; off by default.
    """
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = img.size
    # Gradient from transparent at top to semi-opaque at bottom
    for y in range(h):
        alpha = int(180 * (y / h))
        draw.line([(0, y), (w, y)], fill=(0, 0, 0, alpha))
    img_rgba = img.convert('RGBA')
    composited = Image.alpha_composite(img_rgba, overlay)
    return composited.convert('RGB')


def process_banner(input_path, output_path, apply_overlay=False):
    """
    Open a source image, center-crop to 3.15:1, resize to 1700x540 LANCZOS,
    optionally apply dark overlay, and save as JPEG quality 90.
    """
    print(f"Opening: {input_path}")
    img = Image.open(input_path).convert('RGB')
    orig_w, orig_h = img.size
    print(f"Source size: {orig_w} x {orig_h} (ratio {orig_w/orig_h:.2f}:1)")

    # Center-crop to target aspect ratio (no distortion)
    img = center_crop_to_ratio(img, TARGET_RATIO)
    print(f"After crop: {img.size[0]} x {img.size[1]}")

    # Resize to banner spec
    img = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)
    print(f"After resize: {img.size[0]} x {img.size[1]}")

    if apply_overlay:
        print("Applying dark overlay (--overlay flag set)...")
        img = apply_dark_overlay(img)

    # Ensure output directory exists
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    img.save(output_path, 'JPEG', quality=90, optimize=True)
    file_size = os.path.getsize(output_path)
    print(f"Saved: {output_path} ({img.size[0]} x {img.size[1]} px, {file_size / 1024:.1f} KB)")


def main():
    parser = argparse.ArgumentParser(
        description='Process a source photo to the Essentials banner spec (1700x540 JPEG q90).'
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument(
        '--input', '-i',
        metavar='PATH',
        help='Local path to the source image file.'
    )
    source.add_argument(
        '--url', '-u',
        metavar='URL',
        help='URL to download the source image from (uses descriptive User-Agent for Wikimedia).'
    )
    parser.add_argument(
        '--output', '-o',
        required=True,
        metavar='PATH',
        help='Output path for the processed banner JPEG (e.g. /tmp/bloomington.jpg).'
    )
    parser.add_argument(
        '--overlay',
        action='store_true',
        default=False,
        help=(
            'Bake a bottom-up dark gradient overlay into the JPEG (off by default). '
            'The 50 live state panoramas are NOT pre-darkened; SectionBanner.jsx applies '
            'the overlay at render. Only use this to match sources that need extra legibility.'
        )
    )

    args = parser.parse_args()

    # Resolve input: download if URL, otherwise use local file
    if args.url:
        img_bytes = download_image(args.url)
        input_path = BytesIO(img_bytes)
    else:
        if not os.path.exists(args.input):
            print(f"ERROR: input file not found: {args.input}")
            sys.exit(1)
        input_path = args.input

    process_banner(input_path, args.output, apply_overlay=args.overlay)


if __name__ == '__main__':
    main()
