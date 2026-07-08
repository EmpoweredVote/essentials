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
        target="_blank"
        rel="noopener noreferrer"
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
        <img src={icon.iconSrc} alt="" aria-hidden="true" style={{ width: '20px', height: '20px' }} />
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
 *                                              bottom-right circular-chip row with an accessible
 *                                              hover+focus tooltip per entry; [] or absent renders
 *                                              nothing (ICON-01/02/03, TETH-03, Phase 187)
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
    <div className="-mx-6 md:-mx-12 relative overflow-hidden h-[120px] md:h-[180px]">

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

      {/* Population stat scrim (STAT-01/STAT-03, Phase 188; repositioned mid-left per
          189 D-05, superseding 188 D-11/D-12's top-right placement) — floated above the
          location title, left-aligned to the title's own px-6/md:px-12 margin. Responsive
          vertical anchor (upper-left on mobile, vertically centered on desktop) requires
          Tailwind's md: breakpoint, which inline styles cannot express — hence the
          className on this outer wrapper (the only such deviation from this component's
          otherwise all-inline-style convention). Omits entirely when stats does not
          resolve to a positive number. */}
      {shouldRenderStat(stats) && (
        <div className="px-6 md:px-12 absolute left-0 top-4 md:top-1/2 md:-translate-y-1/2">
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
        </div>
      )}

      {/* Feature-icon row (ICON-01/02/03, D-05/D-06) — bottom-right, never overlaps the
          bottom-left title. Empty/absent array renders nothing (TETH-03). Top-right stays
          free for Phase 188's population stat (D-07). */}
      {shouldRenderIcons(featureIcons) && (
        <div
          data-slot="feature-icons"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
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
  );
}
