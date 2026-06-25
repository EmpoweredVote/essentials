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
 * SectionBanner
 *
 * Props:
 *   tier          {'city'|'state'|'federal'}  required — determines eyebrow, fallback gradient
 *   locationName  {string}                    required — text shown after the coral pin
 *   imageUrl      {string|null}               optional — when truthy renders image + overlay
 *   stats         {object|null}               optional — scaffolding slot, renders nothing (BANR-04)
 *   featureIcons  {array|null}                optional — scaffolding slot, renders nothing (BANR-04)
 */
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

      {/* Scaffolding slots (BANR-04) — zero visual impact, DOM anchors for a later milestone */}
      {stats && <div className="sr-only" data-slot="stats" />}
      {featureIcons && <div className="sr-only" data-slot="feature-icons" />}
    </div>
  );
}
