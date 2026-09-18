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
# The 6:1 DESKTOP window SectionBanner.jsx renders at md+ — 283 of the 540 rows.
# Certification happens here, never on the full frame; the full frame is what shipped
# the broken Bend banner.
BAND_H = round(TARGET_W / 6)


def download_image(url):
    """Download an image from a URL and return the raw bytes."""
    print(f"Downloading: {url}")
    r = requests.get(url, headers=HEADERS, timeout=30)
    if r.status_code != 200:
        print(f"ERROR: download failed with HTTP {r.status_code}")
        sys.exit(1)
    return r.content


def crop_to_ratio(img, target_ratio, vertical_anchor=0.5, crop_width=None,
                  horizontal_anchor=0.5):
    """
    Crop img to match target_ratio (width/height) WITHOUT stretching.
    Crops the longer dimension to preserve the shorter one.

    vertical_anchor controls WHERE the vertical crop is taken when the source is
    taller than the target (the common case for ultra-wide banners):
      0.0 = keep the TOP band (trims the bottom)
      0.5 = center (default — equivalent to the original center-crop)
      1.0 = keep the BOTTOM band (trims the top)
    A higher anchor trims more sky off the top, raising skyline/landmark features
    toward the upper third of the banner.

    crop_width NARROWS the source before the ratio crop, and horizontal_anchor
    (0.0 left .. 1.0 right) says where that narrower window sits.

    🔴 THE ANCHOR CANNOT CHOOSE THE BAND ON A SOURCE NARROWER THAN 3.148:1 --
    crop NARROWER instead. A full-width crop of such a source leaves almost no
    vertical slack, so the anchor has nothing to move through. states/CA.jpg had
    68px of slack with its subject pinned at the top edge and had to be re-cropped
    narrower; cities/charlotte.jpg had 105px, and sliding its anchor from 0.55 to
    1.0 moved the rendered band about 19px while the skyline stayed marooned under
    two-thirds of empty sky. Dropping crop_width from 3881 to 3000 raised the slack
    to 385 rows and was still a downscale, because the source was 3881px wide.
    Cropping narrower is lossless whenever the result is still wider than 1700.
    """
    w, h = img.size
    vertical_anchor = max(0.0, min(1.0, vertical_anchor))
    horizontal_anchor = max(0.0, min(1.0, horizontal_anchor))

    if crop_width and crop_width < w:
        left = int(round((w - crop_width) * horizontal_anchor))
        img = img.crop((left, 0, left + crop_width, h))
        w, h = img.size

    current_ratio = w / h

    if current_ratio > target_ratio:
        # Image is wider than target — crop sides (centered)
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Image is taller than target — crop top/bottom using the anchor
        new_h = int(w / target_ratio)
        top = int((h - new_h) * vertical_anchor)
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


def process_banner(input_path, output_path, apply_overlay=False, vertical_anchor=0.5,
                   crop_width=None, horizontal_anchor=0.5):
    """
    Open a source image, crop to 3.15:1 (vertical_anchor controls the vertical
    crop position), resize to 1700x540 LANCZOS, optionally apply dark overlay,
    and save as JPEG quality 90.
    """
    print(f"Opening: {input_path}")
    img = Image.open(input_path).convert('RGB')
    orig_w, orig_h = img.size
    print(f"Source size: {orig_w} x {orig_h} (ratio {orig_w/orig_h:.2f}:1)")

    # 🔴 REPORT THE VERTICAL SLACK, because it says whether the anchor is even a
    # lever. slack = source height - the height the ratio crop will keep. When it
    # is small the anchor cannot choose the band and --crop-width is the control
    # that can. Silence here is how a banner ships with its subject marooned.
    effective_w = min(crop_width, orig_w) if crop_width else orig_w
    slack = orig_h - (effective_w / TARGET_RATIO)
    if slack < 1:
        print(f"Vertical slack: none - source is {orig_w/orig_h:.2f}:1, at or wider than "
              f"{TARGET_RATIO:.3f}:1, so the crop is horizontal and --vertical-anchor does nothing.")
    else:
        rendered = slack * (TARGET_H / (effective_w / TARGET_RATIO))
        print(f"Vertical slack: {slack:.0f} source rows (~{rendered:.0f}px of the 540 asset). "
              f"The anchor can only move the frame within that.")
        # 🔴 THE THRESHOLD IS THE DESKTOP BAND, NOT A ROUND NUMBER. The band is 283 of
        # the 540 rows, so travel worth having is a real fraction of it; under about a
        # third (90px) the anchor cannot reframe anything. This was first set at 40px
        # and SILENTLY PASSED CHARLOTTE, whose 46px of travel is the exact case the
        # warning exists for. A threshold that misses its own founding case is not a
        # threshold.
        if rendered < 90:
            print(f"  WARNING: THAT IS TOO LITTLE FOR THE ANCHOR TO CHOOSE THE BAND "
                  f"({rendered:.0f}px against a {BAND_H}px desktop window). "
                  "Pass --crop-width to narrow the source instead; it stays lossless "
                  f"down to {TARGET_W}px wide.")

    # Crop to target aspect ratio (no distortion), honoring the anchors
    img = crop_to_ratio(img, TARGET_RATIO, vertical_anchor=vertical_anchor,
                        crop_width=crop_width, horizontal_anchor=horizontal_anchor)
    # Report the crop width only when it was actually APPLIED. Naming a --crop-width
    # wider than the source reads as though it took effect when it did not.
    applied = crop_width and crop_width < orig_w
    print(f"After crop: {img.size[0]} x {img.size[1]} (vertical anchor {vertical_anchor}"
          f"{f', crop width {crop_width}, horizontal anchor {horizontal_anchor}' if applied else ''})")
    if crop_width and not applied:
        print(f"  note: --crop-width {crop_width} is not narrower than the {orig_w}px source, so it was ignored.")
    if img.size[0] < TARGET_W:
        print(f"  WARNING - UPSCALING: the crop is {img.size[0]}px wide against a {TARGET_W}px target. "
              "The asset will carry no more detail than the crop does.")

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
    parser.add_argument(
        '--vertical-anchor',
        type=float,
        default=0.5,
        metavar='0.0-1.0',
        help=(
            'Vertical crop position for taller-than-banner sources: 0.0 keeps the top '
            'band, 0.5 centers (default), 1.0 keeps the bottom band. Raise it to trim '
            'sky and lift skyline/landmark features toward the top third.'
        )
    )

    parser.add_argument(
        '--crop-width',
        type=int,
        default=None,
        metavar='PX',
        help=(
            'Narrow the SOURCE to this pixel width before the ratio crop. Use it when '
            '--vertical-anchor cannot move the frame: a source narrower than 3.148:1 has '
            'almost no vertical slack, so the anchor has nothing to travel through and the '
            'subject stays where it fell. Cropping narrower is lossless while the result is '
            'still wider than 1700px. This is what states/CA.jpg and cities/charlotte.jpg '
            'both needed; the script prints the slack so you can see which lever applies.'
        )
    )
    parser.add_argument(
        '--horizontal-anchor',
        type=float,
        default=0.5,
        metavar='0.0-1.0',
        help=(
            'Where the --crop-width window sits: 0.0 keeps the left edge, 0.5 centers '
            '(default), 1.0 keeps the right edge. Ignored without --crop-width.'
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

    process_banner(input_path, args.output, apply_overlay=args.overlay,
                   vertical_anchor=args.vertical_anchor, crop_width=args.crop_width,
                   horizontal_anchor=args.horizontal_anchor)


if __name__ == '__main__':
    main()
