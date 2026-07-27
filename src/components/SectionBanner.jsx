/**
 * SectionBanner — reusable full-bleed dark band for City / State / Federal tiers.
 *
 * Used in:
 *   - Results.jsx (Phase 170): divides City → State → Federal in one continuous scroll.
 *   - ElectionsView (Phase 172): same SectionBanner dividers between tiers, no signature change.
 *
 * Two variants from one prop set:
 *   - Image variant:   <img> layer + mandatory dark gradient overlay (imageUrl is truthy)
 *   - Fallback variant: tier-tinted dark gradient band (imageUrl is null/undefined)
 *
 * Color/type values all trace to src/index.css @theme tokens (DARK-01: single source of truth).
 * No !important needed — first-party component, not an ev-ui override.
 * Dark-mode only: this component never runs in a light context.
 */

import { useState, useEffect } from 'react';
import {
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react';

/**
 * Fallback gradient tints per tier (D-10).
 * Tier-tinted enough to read clearly as a divider band even with no art, while
 * keeping the bottom-left (where the eyebrow/pin/title sit) dark for legibility —
 * the 135° axis runs #0d1117 (top-left) → tinted (bottom-right).
 */
// eslint-disable-next-line react-refresh/only-export-components
export const FALLBACK_GRADIENTS = {
  city:    'linear-gradient(135deg, #0d1117 0%, #15233a 55%, #1f3a5c 100%)',
  state:   'linear-gradient(135deg, #0d1117 0%, #14302a 55%, #1c4a3d 100%)',
  federal: 'linear-gradient(135deg, #0d1117 0%, #2e2113 55%, #4a3115 100%)',
};

/** Mandatory dark gradient overlay for image banners (UI-SPEC Color §). */
const IMAGE_OVERLAY_GRADIENT =
  'linear-gradient(to top, rgba(13,17,23,0.90) 0%, rgba(13,17,23,0.40) 50%, rgba(13,17,23,0.10) 100%)';

/**
 * Banner box aspect ratios — these decide how much of each asset is visible.
 *
 * Why aspect ratios and not fixed heights (changed 2026-07-27)
 * -----------------------------------------------------------
 * This box used to be a fixed-height Tailwind box — h-<120px>, md:h-<180px> — at full width.
 * (Written with angle brackets on purpose: in the real bracket syntax Tailwind's scanner
 * finds these in the comment and emits dead utilities into the CSS bundle.) Because the
 * <img> is `object-fit: cover`, a fixed height means the visible slice of the asset depends
 * on how wide the window happens to be: a 1296x180 desktop box covering a 1700x540 file kept
 * only the middle 43.7% (source rows 152-388 of 540), while a ~390x120 phone box kept ~97%.
 * The same file rendered as two different pictures, on a continuum with no fixed points.
 *
 * That silently shipped a broken banner. Bend, OR was certified against the full 3.15:1
 * frame with the Three Sisters in the upper third; those rows (0-110) were outside the
 * desktop slice, so desktop users saw a wall of trees for a day. It reviewed fine on a
 * phone, which is exactly why nobody caught it.
 *
 * Two ratios, not one, and why
 * ----------------------------
 * Cropping depends ONLY on the box's aspect ratio, never its absolute size. So a single
 * ratio cannot reproduce the old design, because the old design was already two different
 * ratios: mobile 390x120 is ~3.25:1 while desktop 1296x180 is ~7.2:1. Setting one global
 * ratio slim enough for desktop (7.2:1) would collapse mobile to a 54px sliver; setting one
 * generous enough to show the whole asset (3.148:1) makes desktop 412px tall, and
 * Results/ElectionsView render one banner per tier — 1236px of banner per page.
 *
 * So: keep mobile exactly as it was, and widen desktop only as far as it needs to go. This
 * still fixes the original defect. The bug was that a fixed HEIGHT made the crop vary
 * continuously with window width, so reviewing a banner told you nothing. A per-breakpoint
 * RATIO is stable inside its breakpoint — two known crops to review once each.
 *
 *     breakpoint      ratio        height          asset visible
 *     mobile          13 / 4       120px @390      96.9%   (unchanged from the old design)
 *     md and up       6 / 1        216px @1296     52.5%   (was 180px / 43.7%)
 *
 * Visible fraction is (asset ratio / box ratio) whenever the box is wider than the asset:
 * 3.1481/3.25 and 3.1481/6. Other desktop options, if 216px still reads too tall or too
 * short: '36 / 5' = 180px/43.7% (pixel-identical to the old desktop, bug included),
 * '5 / 1' = 259px/63%, '4 / 1' = 324px/79%, '1700 / 540' = 412px/100%.
 *
 * DO NOT go back to a fixed height to trim pixels — that restores the viewport-dependent
 * crop. Change the ratio instead. A regression test asserts this.
 *
 * Assets stay 1700x540 (docs/shared-banner-assets.md) — other apps consume that bucket, so
 * the asset spec is not ours to change unilaterally.
 *
 * No height fallback is needed: Tailwind v4's own browser baseline (Safari 16.4+, Chrome
 * 111+) is already well past `aspect-ratio` support, so the box cannot collapse to zero on
 * any browser that can render the rest of this app.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const BANNER_ASPECT = {
  mobile: '13 / 4',
  desktop: '6 / 1',
};

/**
 * The Tailwind classes that apply BANNER_ASPECT. These must be literal strings — Tailwind's
 * scanner cannot see a class name built at runtime — so they duplicate the numbers above.
 * A test asserts the two stay in agreement, because that duplication is the obvious way for
 * this to drift. `md:` is the same breakpoint the box already uses for its negative margin.
 */
export const BANNER_ASPECT_CLASS = 'aspect-[13/4] md:aspect-[6/1]';

/**
 * FeatureIconChip — a single circular semi-transparent chip (D-05) wrapping an
 * accessible external deep-link, with a hover+keyboard-focus tooltip naming the
 * product (D-08). Reimplements the @floating-ui hover+focus+dismiss+role('tooltip')
 * pattern from IconOverlay.jsx's IconWithTooltip, adapted to wrap a real <a> (not a
 * bare <span>) since the aria-label must live on the link itself.
 *
 * @param {{ icon: { key: string, href: string, label: string, iconSrc: string } }} props
 */
function FeatureIconChip({ icon }) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'top',
    middleware: [offset(8), flip(), shift({ padding: 4 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context);
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  return (
    <>
      <a
        ref={refs.setReference}
        href={icon.href}
        aria-label={icon.label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          // Semi-transparent navy chip (--color-ev-navy #0d1117 @ 55% alpha) — the
          // background layer that guarantees legibility for treasury-symbol.svg,
          // which ships with no dark variant (RESEARCH Pitfall 3).
          background: 'rgba(13, 17, 23, 0.55)',
          backdropFilter: 'blur(2px)',
        }}
        {...getReferenceProps()}
      >
        {/* objectFit:contain keeps non-square glyphs (e.g. the tall CTC symbol)
            from being distorted while the square treasury symbol still fills the box. */}
        <img
          src={icon.iconSrc}
          alt=""
          aria-hidden="true"
          style={{ width: '20px', height: '20px', objectFit: 'contain' }}
        />
      </a>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 70,
              background: '#2F3237',
              color: '#EBEDEF',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Manrope', sans-serif",
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
            {...getFloatingProps()}
          >
            {icon.label}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

/**
 * SectionBanner
 *
 * Props:
 *   tier          {'city'|'state'|'federal'}  required — determines eyebrow, fallback gradient
 *   locationName  {string}                    required — text shown after the coral pin
 *   imageUrl      {string|null}               optional — when truthy renders image + overlay
 *   stats         {{label:string,value:number}|null} optional — resolved population stat (STAT-01);
 *                                              renders a mid-left scrim (189 D-05) only when shouldRenderStat(stats)
 *                                              is true; null/undefined/0/NaN/non-number renders nothing (STAT-03)
 *   featureIcons  {array|null}                optional — [{key,href,label,iconSrc}]; renders a
 *                                              circular-chip row immediately right of the population
 *                                              stat (or in its place when stats is absent), with an
 *                                              accessible hover+focus tooltip per entry; [] or absent
 *                                              renders nothing (ICON-01/02/03, TETH-03, Phase 187)
 */

/**
 * Pure predicate (Phase 188): should the population stat scrim render?
 * Treats null/undefined/0/NaN/non-number identically — omit (STAT-03).
 * @param {{label?:string,value?:number}|null|undefined} stats
 */
// eslint-disable-next-line react-refresh/only-export-components
export function shouldRenderStat(stats) {
  return typeof stats?.value === 'number' && stats.value > 0;
}

/**
 * Pure predicate (Phase 189): should the feature-icon row render?
 * Mirrors shouldRenderStat's omit-cleanly convention (STAT-03/ICON-03/TETH-03) —
 * only a non-empty array renders; [] / null / undefined / non-array omit.
 * @param {Array|null|undefined} featureIcons
 */
// eslint-disable-next-line react-refresh/only-export-components
export function shouldRenderIcons(featureIcons) {
  return Array.isArray(featureIcons) && featureIcons.length > 0;
}
export default function SectionBanner({ tier, locationName, imageUrl, stats, featureIcons }) {
  // BANR-03: never show a broken <img>. If the image 404s (e.g. a paused storage
  // bucket), fall back to the tier-tinted gradient instead of a broken-image icon.
  const [imageFailed, setImageFailed] = useState(false);
  // Reset the error flag whenever the source changes so a new tier/address re-attempts.
  useEffect(() => { setImageFailed(false); }, [imageUrl]);

  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div className={`-mx-6 md:-mx-12 relative overflow-hidden ${BANNER_ASPECT_CLASS}`}>

      {showImage ? (
        <>
          {/* Image layer */}
          <img
            src={imageUrl}
            alt=""
            aria-hidden="true"
            onError={() => setImageFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* Mandatory dark gradient overlay — ensures title/eyebrow legibility (UI-SPEC constraint #7) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: IMAGE_OVERLAY_GRADIENT,
            }}
          />
        </>
      ) : (
        /* Fallback: tier-tinted dark gradient band (D-09, D-10) */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: FALLBACK_GRADIENTS[tier],
          }}
        />
      )}

      {/* Title — positioned at the bottom over the image/gradient (no pin, no eyebrow) */}
      <div
        className="px-6 md:px-12"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: '16px' }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '30px',
            lineHeight: '36px',
            letterSpacing: '-0.75px',
            color: 'var(--color-ev-text-primary)',
          }}
        >
          {locationName}
        </div>
      </div>

      {/* Left-anchored info row: population stat scrim (STAT-01/STAT-03, Phase 188)
          followed by the feature-icon chips (Treasury, then Civic Trivia Championship).
          The chips were previously a standalone bottom-right cluster; they now sit
          immediately to the RIGHT of the population stat — or, when the stat is absent,
          in the position the stat would occupy — so the products read as attributes of
          the community rather than a detached corner control.

          Left-aligned to the title's own px-6/md:px-12 margin; responsive vertical anchor
          (upper-left on mobile, vertically centered on desktop) needs Tailwind's md:
          breakpoint, which inline styles cannot express — hence the className on this
          wrapper (the sole deviation from this component's all-inline-style convention).
          Renders only when there is at least a stat or an icon to show. */}
      {(shouldRenderStat(stats) || shouldRenderIcons(featureIcons)) && (
        <div className="px-6 md:px-12 absolute left-0 top-4 md:top-1/2 md:-translate-y-1/2">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {shouldRenderStat(stats) && (
              <div
                data-slot="stats"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  background: 'rgba(13,17,23,0.55)',
                  backdropFilter: 'blur(2px)',
                  borderRadius: '10px',
                  padding: '4px 12px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    fontWeight: 600,
                    lineHeight: '13px',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    color: 'var(--color-ev-text-muted)',
                  }}
                >
                  {stats.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14px',
                    fontWeight: 700,
                    lineHeight: '16px',
                    color: 'var(--color-ev-text-primary)',
                  }}
                >
                  {stats.value.toLocaleString()}
                </span>
              </div>
            )}

            {shouldRenderIcons(featureIcons) && (
              <div
                data-slot="feature-icons"
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                {featureIcons.map((icon) => (
                  <FeatureIconChip key={icon.key} icon={icon} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
