"""
Regression tests for process_banner.py.

These pin TRAPS BY NAME, the way src/lib/banners.test.js does: each test is a defect
that actually shipped or actually would have, named so a failure says which one came
back rather than just "assert False".

EXIF orientation is the reason this file exists. Tag 274 says how the STORED pixels
must be transformed to DISPLAY correctly, and Pillow does NOT apply it on open. A
pipeline that ignores it crops the raw buffer and ships the result silently — there
is no error, no warning, and the only signal is that the picture looks wrong to a
human. cities/glendora.jpg shipped upside down exactly that way.

Fixtures encode orientation unambiguously: the stored pixels are RED on the top half
and BLUE on the bottom half, so a 180-degree error is a colour check, not a judgement
call.

Run it either way — plain, so no test runner is needed:

    python scripts/banners/test_process_banner.py

or under pytest if you have it:

    pytest scripts/banners/test_process_banner.py
"""

import os
import sys
import tempfile

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from process_banner import process_banner, TARGET_W, TARGET_H  # noqa: E402

EXIF_ORIENTATION = 274
RED = (220, 30, 30)
BLUE = (30, 60, 220)


def _fixture(path, orientation, width, height):
    """A JPEG whose STORED pixels are red on top, blue on bottom, tagged `orientation`."""
    img = Image.new('RGB', (width, height))
    px = img.load()
    for y in range(height):
        colour = RED if y < height // 2 else BLUE
        for x in range(width):
            px[x, y] = colour
    exif = img.getexif()
    exif[EXIF_ORIENTATION] = orientation
    img.save(path, 'JPEG', quality=92, exif=exif)
    return path


def _band_colour(path, fraction):
    """Name the dominant colour at `fraction` down the image."""
    img = Image.open(path).convert('RGB')
    w, h = img.size
    r, _g, b = img.getpixel((w // 2, int(h * fraction)))
    return 'RED' if r > b else 'BLUE'


def _run(tmpdir, orientation, width, height, **kwargs):
    src = _fixture(os.path.join(tmpdir, 'src.jpg'), orientation, width, height)
    out = os.path.join(tmpdir, 'out.jpg')
    process_banner(src, out, **kwargs)
    return src, out


def test_orientation_3_is_corrected_the_glendora_trap():
    """orientation=3 means the pixels are stored upside down.

    cities/glendora.jpg shipped this way: the crop was taken from the raw buffer, so
    the sky landed at the bottom. Correct handling rotates it back, which puts the
    BLUE half on top of the output.
    """
    with tempfile.TemporaryDirectory() as tmp:
        _src, out = _run(tmp, 3, 2000, 800)
        assert _band_colour(out, 0.12) == 'BLUE', (
            'orientation=3 was not applied: the output still shows the stored '
            'top-half colour, i.e. the image is upside down (the Glendora defect)'
        )


def test_orientation_6_swaps_width_and_height():
    """orientation=5-8 rotate 90 degrees, so display W/H are the STORED H/W.

    Worse than a flip: a landscape photo stored portrait gets measured portrait, the
    vertical-slack report is computed off the wrong axis, and crop_to_ratio trims the
    wrong dimension entirely.

    The assertion is HORIZONTAL, deliberately. Rotating the fixture 90 degrees CW
    carries its stored top edge to the right, so a correctly handled source comes out
    BLUE on the left and RED on the right. Ignoring the tag crops the portrait down
    its middle instead and leaves both sides the same colour at mid-height — so
    left != right is the discriminator, and asserting on output SIZE is not: every
    path through crop_to_ratio lands on 1700x540 whether or not the tag was read.
    """
    with tempfile.TemporaryDirectory() as tmp:
        # Stored 800x2000 portrait; displays as 2000x800 landscape.
        src = _fixture(os.path.join(tmp, 'src.jpg'), 6, 800, 2000)
        out = os.path.join(tmp, 'out.jpg')
        process_banner(src, out)

        img = Image.open(out).convert('RGB')
        w, h = img.size
        left = 'RED' if img.getpixel((int(w * 0.15), h // 2))[0] > img.getpixel((int(w * 0.15), h // 2))[2] else 'BLUE'
        right = 'RED' if img.getpixel((int(w * 0.85), h // 2))[0] > img.getpixel((int(w * 0.85), h // 2))[2] else 'BLUE'

        assert (left, right) == ('BLUE', 'RED'), (
            f'orientation=6 was not applied: expected BLUE|RED across the frame, got '
            f'{left}|{right}. Equal halves mean the portrait buffer was cropped on '
            f'the wrong axis instead of being rotated to landscape first'
        )
        assert img.size == (TARGET_W, TARGET_H)


def test_orientation_1_is_left_byte_identical():
    """The control. A source that is already upright must not be touched.

    La Verne (orientation=1) reprocessed byte-identically after the EXIF fix landed,
    which is what proves the fix is additive rather than a second transform applied
    to every image.
    """
    with tempfile.TemporaryDirectory() as tmp:
        src = _fixture(os.path.join(tmp, 'src.jpg'), 1, 2000, 800)
        first = os.path.join(tmp, 'a.jpg')
        second = os.path.join(tmp, 'b.jpg')
        process_banner(src, first)
        process_banner(src, second)

        assert _band_colour(first, 0.12) == 'RED', (
            'an upright source was rotated: the fix is transforming images that '
            'carry no orientation correction'
        )
        with open(first, 'rb') as a, open(second, 'rb') as b:
            assert a.read() == b.read(), 'processing is not deterministic'


def test_no_exif_tag_at_all_is_safe():
    """Most Commons sources carry no tag 274 at all. That must not raise."""
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, 'plain.jpg')
        Image.new('RGB', (2000, 800), RED).save(src, 'JPEG', quality=92)
        out = os.path.join(tmp, 'out.jpg')
        process_banner(src, out)
        assert Image.open(out).size == (TARGET_W, TARGET_H)


def test_output_is_always_the_banner_spec():
    """Every path out of process_banner must land on 1700x540, upscales included."""
    with tempfile.TemporaryDirectory() as tmp:
        for orientation, w, h in ((1, 2400, 900), (3, 1600, 1127), (6, 900, 2400)):
            src = _fixture(os.path.join(tmp, f's{orientation}_{w}.jpg'), orientation, w, h)
            out = os.path.join(tmp, f'o{orientation}_{w}.jpg')
            process_banner(src, out)
            assert Image.open(out).size == (TARGET_W, TARGET_H), (
                f'orientation={orientation} source {w}x{h} did not produce '
                f'{TARGET_W}x{TARGET_H}'
            )


def _main():
    """Run the tests without pytest, so CI needs no extra dependency."""
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    failures = []
    for test in tests:
        try:
            test()
        except AssertionError as exc:
            failures.append((test.__name__, str(exc).strip().splitlines()[0]))
            print(f'FAIL  {test.__name__}')
        except Exception as exc:  # noqa: BLE001 - report, do not mask
            failures.append((test.__name__, f'{type(exc).__name__}: {exc}'))
            print(f'ERROR {test.__name__}')
        else:
            print(f'ok    {test.__name__}')

    print()
    if failures:
        for name, msg in failures:
            print(f'  {name}: {msg}')
        print(f'\n{len(failures)} of {len(tests)} failed')
        return 1
    print(f'{len(tests)} passed')
    return 0


if __name__ == '__main__':
    sys.exit(_main())
