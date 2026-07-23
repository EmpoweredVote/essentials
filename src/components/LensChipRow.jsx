import { useState } from 'react';
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
import { useTheme } from '../hooks/useTheme';

// Blend a #RGB/#RRGGBB hex toward white by `amount` (0..1). Used so a dark lens
// color (e.g. federal navy #1E3A5F) stays legible as inactive text/border on the
// dark chip surface — the raw color is near-invisible there.
function lightenForDark(hex, amount = 0.5) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Icon for each lens chip: Capitol dome (federal), gavel (judicial), house
// (local), viewfinder (Best Match / custom — mirrors the retired binary Lens
// toggle icon in CompassControlsBar), neutral dot fallback for any future
// lens key returned by the API that isn't one of these four.
function renderLensIcon(lens) {
  const key = lens?.key;
  if (key === 'federal') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="15" height="15">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    );
  }
  if (key === 'judicial') {
    // Gavel (Lucide) — the prior path was a cpu-chip glyph, not a gavel; icon-only
    // mode made that obvious. Stroke-based to read clearly at 15px.
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
        <path d="m14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8" />
        <path d="m16 16 6-6" />
        <path d="m8 8 6-6" />
        <path d="m9 7 8 8" />
        <path d="m21 11-8-8" />
      </svg>
    );
  }
  if (key === 'local') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
        <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
      </svg>
    );
  }
  if (key === 'custom') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  // Neutral fallback for any future lens key (State/International, etc.) —
  // renders a plain dot rather than guessing at a metaphor.
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

// A single lens button with an accessible floating-ui tooltip (desktop only).
// The button carries its own aria-label so the accessible name survives once
// the visible text label is hidden on desktop. The tooltip is suppressed
// whenever the needs-calibration prompt is showing for this lens (Pitfall 3)
// so the two popups never stack, and the existing calibration hover handlers
// are merged into getReferenceProps (Pitfall 2) rather than bare-spread.
function LensButton({
  lens,
  isActive,
  needsCalibration,
  isDesktop,
  isDark,
  stateStyle,
  onClick,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom',
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, { enabled: isDesktop });
  const focus = useFocus(context, { enabled: isDesktop });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const tooltipText = lens.description || lens.name;

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        className="stance-btn"
        aria-label={lens.name}
        {...(needsCalibration ? {} : { 'aria-pressed': isActive })}
        {...getReferenceProps()}
        onClick={onClick}
        style={{
          width: 'auto',
          height: 34,
          padding: '0 12px',
          gap: 6,
          ...stateStyle,
        }}
      >
        {renderLensIcon(lens)}
        {!isDesktop && (
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{lens.name}</span>
        )}
      </button>

      {isDesktop && isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 32,
              background: isDark ? '#1f2937' : '#fff',
              color: isDark ? '#e5e7eb' : '#111827',
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              pointerEvents: 'none',
            }}
            {...getFloatingProps()}
          >
            {tooltipText}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

export default function LensChipRow({ lenses, activeLensKey, onSelectLens, onCalibrate, isDesktop }) {
  const { isDark } = useTheme();
  // Clicking an un-calibrated lens opens a confirmation dialog ("Calibrate these
  // N topics?") rather than jumping straight to the quiz. confirmLens holds the
  // lens whose dialog is open (null = no dialog).
  const [confirmLens, setConfirmLens] = useState(null);

  if (!Array.isArray(lenses) || lenses.length === 0) return null;

  const handleChipClick = (lens) => {
    if (lens.calibrated) {
      onSelectLens(lens.key);
      return;
    }
    // Needs calibration — confirm before leaving for the calibration flow.
    setConfirmLens(lens);
  };

  const confirmCalibrate = () => {
    if (confirmLens) onCalibrate(confirmLens.key);
    setConfirmLens(null);
  };

  return (
    <div style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      {lenses.map((lens) => {
        const isActive = activeLensKey === lens.key;
        const needsCalibration = lens.calibrated === false;

        // Chips overlay the location banner, so every state needs an OPAQUE
        // surface — a transparent/low-alpha fill lets the banner photo bleed
        // through and destroys contrast. Opaque surface matches .stance-btn
        // (#FFFFFF / #161b22) and the COMPASS KEY pill; the coloured border +
        // text carry the lit/needs-calibration language on top of it.
        const chipSurface = isDark ? '#161b22' : '#FFFFFF';
        let stateStyle = {};
        if (needsCalibration) {
          stateStyle = {
            background: chipSurface,
            color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
            border: '1.5px solid #7C3AED',
          };
        } else if (isActive) {
          stateStyle = { background: lens.color, borderColor: lens.color, color: '#fff' };
        } else {
          // Inactive/LIT: coloured outline + text on the opaque surface. In dark
          // mode lighten the lens colour so dark hues (federal navy) stay legible.
          const outline = isDark ? lightenForDark(lens.color) : lens.color;
          stateStyle = { background: chipSurface, color: outline, borderColor: outline };
        }

        return (
          <div key={lens.key} style={{ position: 'relative', display: 'inline-flex' }}>
            <LensButton
              lens={lens}
              isActive={isActive}
              needsCalibration={needsCalibration}
              isDesktop={isDesktop}
              isDark={isDark}
              stateStyle={stateStyle}
              onClick={() => handleChipClick(lens)}
            />
          </div>
        );
      })}

      {confirmLens && (
        <FloatingPortal>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Calibrate the ${confirmLens.name}`}
            onClick={() => setConfirmLens(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)', padding: 16,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 380,
                background: isDark ? '#161b22' : '#fff',
                color: isDark ? '#e5e7eb' : '#111827',
                borderRadius: 12,
                padding: '20px 22px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                border: `1.5px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', fontFamily: "'Manrope', sans-serif" }}>
                Calibrate the {confirmLens.name}?
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 18px', color: isDark ? '#9da5b4' : '#4b5563' }}>
                {confirmLens.topicCount
                  ? `Answer ${confirmLens.topicCount} quick questions to see how you align with each official on these issues.`
                  : 'Answer a few quick questions to see how you align with each official on these issues.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmLens(null)}
                  style={{
                    padding: '9px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    background: 'transparent',
                    color: isDark ? '#9da5b4' : '#4b5563',
                    border: `1px solid ${isDark ? '#30363d' : '#d1d5db'}`,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCalibrate}
                  style={{
                    padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: '#7C3AED', color: '#fff', border: 'none',
                  }}
                >
                  Calibrate
                </button>
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
