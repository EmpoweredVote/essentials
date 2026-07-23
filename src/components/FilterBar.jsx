import { CompassKey, useMediaQuery } from '@empoweredvote/ev-ui';

/**
 * FilterBar — renders the Compass on/off toggle for the address-results page.
 * No wrapper chrome (no border/padding/background) so it can be dropped
 * directly into another row (e.g. next to the Reps/Elections tabs).
 */
export default function FilterBar({
  compassMode, onCompassModeChange,
  isDark,
}) {
  const compassTextColor = compassMode ? (isDark ? '#00c8d7' : '#00657c') : (isDark ? '#8b949e' : '#374151');

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', gap: '8px',
        minWidth: 0,
      }}
    >
      {onCompassModeChange !== undefined && (
        <button
          type="button"
          onClick={() => onCompassModeChange(!compassMode)}
          aria-pressed={!!compassMode}
          title={compassMode ? 'Compass on — click to turn off' : 'Compass off — click to turn on'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
            minHeight: '44px', padding: '0 8px',
            background: 'none', border: 'none',
            fontFamily: "'Manrope', sans-serif", fontSize: '13px',
            fontWeight: compassMode ? 600 : 500,
            color: compassTextColor,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {/* Compass symbol as the on/off affordance: full color when on,
              greyscale + dimmed when off. Theme-aware SVG. */}
          <img
            src={isDark ? '/compass-symbol-dark.svg' : '/compass-symbol-light.svg'}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            style={{
              display: 'block',
              filter: compassMode ? 'none' : 'grayscale(1)',
              opacity: compassMode ? 1 : 0.45,
              transition: 'filter 0.15s ease, opacity 0.15s ease',
            }}
          />
          Compass
        </button>
      )}
    </div>
  );
}

/**
 * Sticky CompassKey pill — pinned to top: 0 of its scroll container.
 * Designed to be placed inline (e.g. next to the address chip) so it visually
 * shares a line with the chip when the page is at the top, and stays pinned
 * to the top of the scroll container after the chip scrolls away.
 *
 * Caller controls horizontal positioning via the parent's flex layout.
 */
export function StickyCompassKey() {
  const isDesktop = useMediaQuery('(min-width: 769px)');
  return (
    <div style={{ position: 'sticky', top: 8, zIndex: 20 }}>
      <CompassKey compact={!isDesktop} />
    </div>
  );
}
