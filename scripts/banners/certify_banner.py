"""
Banner certification sheet for Essentials section banners.

Renders every candidate at the shipping spec (1700x540), cuts the 6:1 DESKTOP BAND
out of each, measures the things that no licence or aspect check catches, and writes
one self-contained HTML sheet for a single batch approval.

WHY THE BAND AND NOT THE FULL FRAME
  SectionBanner.jsx renders a responsive aspect PAIR: 13/4 on mobile, which keeps
  96.9% of the asset, and 6/1 at md+, which keeps only 52.4% -- rows 128-411 of 540.
  A banner certified on the full frame is certified on a picture desktop visitors
  never see. That is exactly how the Bend banner shipped broken: its Three Sisters
  sat in rows 0-110, outside the desktop window, and it reviewed fine on a phone.
  banner_review.md once carried a "certify against the full frame" instruction; it
  was stale, and following it reproduces the defect.

WHAT IT MEASURES, AND WHY EACH ONE EXISTS
  vertical slack    How far --vertical-anchor can actually move the frame. A source
                    NARROWER than 3.148:1 has almost none, so the anchor is not the
                    lever and crop_width is. states/CA.jpg and cities/charlotte.jpg
                    both needed that correction.
  channel spread    Greyscale detector. Milledgeville's two widest, most permissively
                    licensed candidates -- federal HABS work, public domain -- measured
                    100% GREYSCALE. No licence check and no aspect check catches that.
  band luminance    Flags a frame that is too dark to read a title over, or blown flat.
  upscale factor    Whether the asset carries real pixels or interpolated ones.

ONE CROP IMPLEMENTATION, imported from process_banner.py, so the sheet shows exactly
what the processor will ship. Two implementations drift, and then the operator
approves a frame that never existed.

INPUT: a JSON array, one object per candidate:
    slug              short id, used for the output filenames
    title             photograph title, shown on the card
    author            photographer, for the credit line
    license           licence short name (CC BY-SA 4.0, CC0, public domain, ...)
    url  or  path     where to read the source from
    crop_width        optional, narrow the source before the ratio crop
    vertical_anchor   optional, 0.0 top .. 1.0 bottom (default 0.5)
    horizontal_anchor optional, 0.0 left .. 1.0 right (default 0.5)
    verdict           "proposed" (default) or "rejected"
    note              why it is proposed or rejected -- the reason transfers to the
                      next city, so write it down

USAGE (from the repo root):
  python scripts/banners/certify_banner.py \\
      --candidates /tmp/charlotte-candidates.json \\
      --title "Charlotte - cities/charlotte.jpg" \\
      --baseline states/NC.jpg --baseline cities/asheville.jpg \\
      --baseline cities/durham.jpg \\
      --sheet /tmp/charlotte-certification.html

Publish the sheet for approval. Then process the winner with the SAME crop numbers:
  python scripts/banners/process_banner.py --url <src> --output /tmp/<slug>.jpg \\
      --crop-width <n> --vertical-anchor <a>
"""

import argparse
import base64
import hashlib
import html
import io
import json
import os
import sys

import requests
from PIL import Image, ImageStat

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from process_banner import (  # noqa: E402
    BAND_H, TARGET_H, TARGET_RATIO, TARGET_W, crop_to_ratio,
)

HEADERS = {'User-Agent': 'EmpoweredVote/1.0 (info@empowered.vote)'}
BUCKET_PUBLIC = ('https://kxsdzaojfaibhuzmclfq.storage.supabase.co'
                 '/storage/v1/object/public/politician_photos/')
BAND_TOP = (TARGET_H - BAND_H) // 2          # rows 128..411 of 540
GREYSCALE_SPREAD = 6.0                       # below this, the frame has no colour
DARK_LUMINANCE = 70.0
BLOWN_LUMINANCE = 200.0


def fetch(url, cache_dir):
    """
    Download url, caching the bytes under cache_dir keyed by sha1(url).

    The cache is a correctness feature, not a speed one: tuning crops means
    re-rendering repeatedly, and a live refetch can return something else -- a WAF
    page, a 503, or a silently updated image. It also keeps a rate-limited host
    (Wikimedia 429s a generic browser User-Agent) from being hammered.
    """
    os.makedirs(cache_dir, exist_ok=True)
    key = os.path.join(cache_dir, hashlib.sha1(url.encode()).hexdigest() + '.bin')
    if os.path.exists(key) and os.path.getsize(key) > 0:
        return open(key, 'rb').read()
    r = requests.get(url, headers=HEADERS, timeout=120)
    if r.status_code != 200:
        raise RuntimeError(f'HTTP {r.status_code}')
    open(key, 'wb').write(r.content)
    return r.content


def measure(band):
    """Return (luminance, channel_spread) for a band image."""
    luminance = ImageStat.Stat(band.convert('L')).mean[0]
    small = band.resize((80, 14))
    spread = sum(max(p) - min(p) for p in small.getdata()) / (80 * 14)
    return luminance, spread


def render(src_bytes, crop_width=None, vertical_anchor=0.5, horizontal_anchor=0.5):
    """
    Produce (asset, band, facts) for one source image.

    asset is the 1700x540 file that would ship; band is the 6:1 slice a desktop
    visitor actually sees; facts carries everything the sheet reports.
    """
    src = Image.open(io.BytesIO(src_bytes)).convert('RGB')
    w, h = src.size
    effective_w = min(crop_width, w) if crop_width else w
    slack = max(0.0, h - (effective_w / TARGET_RATIO))
    cropped = crop_to_ratio(src, TARGET_RATIO, vertical_anchor=vertical_anchor,
                            crop_width=crop_width, horizontal_anchor=horizontal_anchor)
    asset = cropped.resize((TARGET_W, TARGET_H), Image.LANCZOS)
    band = asset.crop((0, BAND_TOP, TARGET_W, BAND_TOP + BAND_H))
    luminance, spread = measure(band)
    kept_w = cropped.size[0]
    facts = {
        'src_w': w, 'src_h': h, 'src_ratio': round(w / h, 2),
        'crop_w': kept_w, 'crop_h': cropped.size[1],
        'scale': round(TARGET_W / kept_w, 2),
        'slack_rows': round(slack),
        'slack_px': round(slack * (TARGET_H / (effective_w / TARGET_RATIO))) if slack else 0,
        'luminance': round(luminance, 1),
        'spread': round(spread, 1),
    }
    flags = []
    if facts['spread'] < GREYSCALE_SPREAD:
        flags.append('GREYSCALE')
    if facts['luminance'] < DARK_LUMINANCE:
        flags.append('dark')
    if facts['luminance'] > BLOWN_LUMINANCE:
        flags.append('blown out')
    if facts['scale'] > 1.0:
        flags.append(f"upscaled {facts['scale']}x")
    if facts['slack_px'] < 90 and facts['slack_rows'] > 0:
        flags.append('anchor cannot reframe')
    facts['flags'] = flags
    return asset, band, facts


def embed(img, width):
    """Return a base64 JPEG of img at the given width, for a data: URI."""
    w, h = img.size
    if w > width:
        img = img.resize((width, round(h * width / w)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=86, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


CSS = """
:root{--ground:#EDF0F4;--panel:#fff;--sunk:#E3E8EF;--ink:#0F151D;--ink2:#4B5768;
--muted:#6B7788;--rule:#CBD3DE;--accent:#1B5C9E;--warn:#B4691A;--refuse:#8E3A2C;
--shadow:0 1px 2px rgba(15,21,29,.06),0 8px 24px -12px rgba(15,21,29,.22)}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--ground:#0D1219;
--panel:#151C25;--sunk:#101720;--ink:#E7ECF3;--ink2:#9CA9B9;--muted:#8290A2;
--rule:#26303D;--accent:#6FA8DC;--warn:#D79A44;--refuse:#D9857A;
--shadow:0 1px 2px rgba(0,0,0,.5),0 10px 28px -14px rgba(0,0,0,.8)}}
:root[data-theme="dark"]{--ground:#0D1219;--panel:#151C25;--sunk:#101720;--ink:#E7ECF3;
--ink2:#9CA9B9;--muted:#8290A2;--rule:#26303D;--accent:#6FA8DC;--warn:#D79A44;
--refuse:#D9857A;--shadow:0 1px 2px rgba(0,0,0,.5),0 10px 28px -14px rgba(0,0,0,.8)}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);padding:0 0 80px;
font:400 16px/1.6 "Source Sans 3",system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}
header.top{padding:48px 0 24px}
.eyebrow{font:500 12px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.14em;
text-transform:uppercase;color:var(--accent)}
h1{font:700 clamp(28px,4.4vw,42px)/1.1 Archivo,system-ui,sans-serif;letter-spacing:-.02em;
margin:12px 0 10px;text-wrap:balance}
.lede{max-width:66ch;color:var(--ink2);margin:0}
h2{font:700 13px/1 "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.16em;
text-transform:uppercase;color:var(--muted);margin:0;padding-bottom:10px;
border-bottom:1px solid var(--rule)}
section{margin-top:48px;display:flex;flex-direction:column;gap:18px}
section>p{max-width:70ch;margin:0;color:var(--ink2)}
.card{background:var(--panel);border-radius:3px;box-shadow:var(--shadow);overflow:hidden}
.card img{display:block;width:100%;height:auto}
.framelabel{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;
padding:9px 15px;background:var(--sunk);color:var(--muted);
font:400 12.5px/1.5 "IBM Plex Mono",ui-monospace,monospace}
.framelabel b{color:var(--ink2);font-weight:500}
.strip{margin:0;display:flex;flex-direction:column}
.strip img{border-radius:2px 2px 0 0}
.strip figcaption{display:flex;flex-direction:column;gap:3px;padding:11px 14px 13px;
background:var(--panel);border-left:3px solid var(--refuse);border-radius:0 0 2px 2px;
box-shadow:var(--shadow)}
.strip.live figcaption{border-left-color:var(--accent)}
.strip.proposed figcaption{border-left-color:var(--accent)}
.strip .h{font:600 15px/1.3 inherit}
.strip .s{font:400 12px/1.4 "IBM Plex Mono",ui-monospace,monospace;color:var(--muted)}
.strip .n{color:var(--ink2);font-size:14.5px;line-height:1.55;max-width:88ch;margin-top:3px}
.strips{display:flex;flex-direction:column;gap:20px}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1px;
background:var(--rule);border:1px solid var(--rule)}
.metric{background:var(--panel);padding:13px 15px;display:flex;flex-direction:column;gap:3px}
.metric b{font:700 24px/1 Archivo,system-ui,sans-serif;font-variant-numeric:tabular-nums}
.metric span{font:400 12px/1.4 "IBM Plex Mono",ui-monospace,monospace;color:var(--muted)}
.flag{display:inline-block;margin-right:6px;padding:1px 7px;border-radius:2px;
border:1px solid var(--warn);color:var(--warn);
font:500 11px/1.7 "IBM Plex Mono",ui-monospace,monospace;text-transform:uppercase}
footer{margin-top:52px;padding-top:16px;border-top:1px solid var(--rule);
color:var(--muted);font-size:14px}
"""


def strip_html(kind, heading, sub, note, band_b64, flags=()):
    """One band strip: the picture a desktop visitor sees, plus why it is here."""
    marks = ''.join(f'<span class="flag">{html.escape(f)}</span>' for f in flags)
    return f"""
      <figure class="strip {kind}">
        <img src="data:image/jpeg;base64,{band_b64}" alt="Desktop band for {html.escape(heading)}" loading="lazy" />
        <figcaption>
          <span class="h">{html.escape(heading)}</span>
          <span class="s">{html.escape(sub)}</span>
          {f'<span>{marks}</span>' if marks else ''}
          <span class="n">{html.escape(note)}</span>
        </figcaption>
      </figure>"""


def main():
    parser = argparse.ArgumentParser(
        description='Render banner candidates in the 6:1 desktop band and write a '
                    'certification sheet for batch approval.')
    parser.add_argument('--candidates', '-c', required=True, metavar='PATH',
                        help='JSON array of candidates. See the module docstring for the shape.')
    parser.add_argument('--sheet', '-s', required=True, metavar='PATH',
                        help='Output path for the self-contained HTML sheet.')
    parser.add_argument('--title', '-t', default='Banner certification', metavar='TEXT',
                        help='Sheet heading. Name the city and the storage key, so a later '
                             'reader knows what was approved.')
    parser.add_argument('--baseline', '-b', action='append', default=[], metavar='KEY',
                        help='A LIVE storage key to show for adjacency, e.g. states/NC.jpg. '
                             'Repeatable. Adjacency lives in the COMPOSITION -- camera height, '
                             'subject scale, what fills the frame -- never in the subject noun, '
                             'so the live bands have to sit beside the candidates to be judged.')
    parser.add_argument('--out-dir', '-o', default='.tmp-banner-frames', metavar='DIR',
                        help='Where the rendered asset and band JPEGs are written.')
    parser.add_argument('--cache-dir', default='.tmp-banner-cache', metavar='DIR',
                        help='Where downloaded sources are cached.')
    parser.add_argument('--embed-width', type=int, default=1240, metavar='PX',
                        help='Width of the embedded copies. Lower it only if the sheet would '
                             'exceed the 16 MB artifact cap; it changes the sheet, never the crop.')
    args = parser.parse_args()

    candidates = json.load(open(args.candidates, encoding='utf-8'))
    os.makedirs(args.out_dir, exist_ok=True)

    proposed, rejected, failed = [], [], []
    for c in candidates:
        slug = c['slug']
        try:
            if c.get('path'):
                raw = open(c['path'], 'rb').read()
            else:
                raw = fetch(c['url'], args.cache_dir)
            asset, band, facts = render(
                raw,
                crop_width=c.get('crop_width'),
                vertical_anchor=c.get('vertical_anchor', 0.5),
                horizontal_anchor=c.get('horizontal_anchor', 0.5))
        except Exception as exc:                                    # noqa: BLE001
            print(f'  FAILED   {slug:<24} {type(exc).__name__}: {exc}')
            failed.append((slug, f'{type(exc).__name__}: {exc}'))
            continue
        asset.save(os.path.join(args.out_dir, f'{slug}-asset.jpg'), 'JPEG',
                   quality=90, optimize=True)
        band.save(os.path.join(args.out_dir, f'{slug}-band.jpg'), 'JPEG',
                  quality=92, optimize=True)
        c['_facts'] = facts
        c['_asset_b64'] = embed(asset, args.embed_width)
        c['_band_b64'] = embed(band, args.embed_width)
        (rejected if c.get('verdict') == 'rejected' else proposed).append(c)
        flagtext = ('  [' + ', '.join(facts['flags']) + ']') if facts['flags'] else ''
        print(f"  rendered {slug:<24} {facts['src_w']}x{facts['src_h']} "
              f"({facts['src_ratio']}:1) -> {facts['scale']}x  "
              f"lum {facts['luminance']:5.1f}  spread {facts['spread']:5.1f}{flagtext}")

    baselines = []
    for key in args.baseline:
        try:
            raw = fetch(BUCKET_PUBLIC + key, args.cache_dir)
            _, band, facts = render(raw)
            baselines.append({'key': key, 'b64': embed(band, args.embed_width), 'facts': facts})
            print(f"  baseline {key:<24} live")
        except Exception as exc:                                    # noqa: BLE001
            print(f'  FAILED   baseline {key}: {exc}')

    # --- sheet ---------------------------------------------------------------
    parts = []
    for c in proposed:
        f = c['_facts']
        sub = f"{c.get('author', 'unknown')} | {c.get('license', 'unknown licence')}"
        parts.append(f"""
    <div class="card">
      <img src="data:image/jpeg;base64,{c['_asset_b64']}" alt="Full asset for {html.escape(c.get('title', c['slug']))}" />
      <div class="framelabel"><span><b>THE FULL ASSET.</b> Only the middle 52.4% reaches a desktop screen.</span><span>{TARGET_W} &times; {TARGET_H}</span></div>
      <img src="data:image/jpeg;base64,{c['_band_b64']}" alt="Desktop band for {html.escape(c.get('title', c['slug']))}" />
      <div class="framelabel"><span><b>THE DESKTOP BAND</b> &mdash; rows {BAND_TOP}&ndash;{BAND_TOP + BAND_H}. Certify here.</span><span>{TARGET_W} &times; {BAND_H} &middot; 6:1</span></div>
    </div>
    <div class="metrics">
      <div class="metric"><b>{f['src_w']}&times;{f['src_h']}</b><span>source &middot; {f['src_ratio']}:1</span></div>
      <div class="metric"><b>{f['crop_w']}&times;{f['crop_h']}</b><span>crop kept</span></div>
      <div class="metric"><b>{f['scale']}&times;</b><span>{'UPSCALE' if f['scale'] > 1 else 'downscale'}</span></div>
      <div class="metric"><b>{f['slack_px']}px</b><span>anchor travel of {BAND_H}px band</span></div>
      <div class="metric"><b>{f['luminance']}</b><span>band luminance of 255</span></div>
      <div class="metric"><b>{f['spread']}</b><span>channel spread &middot; &lt;{GREYSCALE_SPREAD:.0f} is greyscale</span></div>
    </div>""")
        if c.get('note'):
            parts.append(f'<p>{html.escape(c["note"])}</p>')

    baseline_html = ''.join(
        strip_html('live', b['key'], f"live &middot; band luminance {b['facts']['luminance']}",
                   'Compare camera height, subject scale and what fills the frame.', b['b64'])
        for b in baselines)
    rejected_html = ''.join(
        strip_html('reject', c.get('title', c['slug']),
                   f"{c.get('author', 'unknown')} | {c.get('license', 'unknown licence')}",
                   c.get('note', 'No reason recorded.'), c['_band_b64'], c['_facts']['flags'])
        for c in rejected)

    doc = f"""<title>{html.escape(args.title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700&family=Source+Sans+3:wght@400;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>{CSS}</style>
<div class="wrap">
  <header class="top">
    <div class="eyebrow">Essentials &middot; banner certification</div>
    <h1>{html.escape(args.title)}</h1>
    <p class="lede">Every frame below is rendered at the shipping spec. The 6:1 strips
    ARE the desktop window &mdash; rows {BAND_TOP}&ndash;{BAND_TOP + BAND_H} of {TARGET_H}.
    A banner is certified there, never on the full frame.</p>
  </header>
  <section>
    <h2>Proposed</h2>
    {''.join(parts) if parts else '<p>No candidate proposed.</p>'}
  </section>
  {f'<section><h2>Adjacency &mdash; live bands</h2><p>Compare compositions, never subject nouns.</p><div class="strips">{baseline_html}</div></section>' if baselines else ''}
  {f'<section><h2>Refused &mdash; {len(rejected)}, with the measured reason</h2><p>Recorded because the reasons transfer to the next city.</p><div class="strips">{rejected_html}</div></section>' if rejected else ''}
  <footer>{len(proposed)} proposed &middot; {len(rejected)} refused &middot; {len(failed)} failed to render
  &middot; certified in the 6:1 desktop band.</footer>
</div>
"""
    out_dir = os.path.dirname(args.sheet)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    open(args.sheet, 'w', encoding='utf-8').write(doc)
    size_kb = os.path.getsize(args.sheet) / 1024
    print(f'\nwrote {args.sheet} ({size_kb:.0f} KB) -- '
          f'{len(proposed)} proposed, {len(rejected)} refused, {len(failed)} failed')
    if size_kb > 16000:
        print('  WARNING: over the 16 MB artifact cap. Lower --embed-width.')
    if failed:
        sys.exit(1)


if __name__ == '__main__':
    main()
