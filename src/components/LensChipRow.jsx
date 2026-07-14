import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

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
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
        <path fillRule="evenodd" d="M10 1a.75.75 0 01.75.75v1.5h2.75A2.75 2.75 0 0116.25 6v.75H18a.75.75 0 010 1.5h-1.75v5H18a.75.75 0 010 1.5h-1.75V15a2.75 2.75 0 01-2.75 2.75H6.5A2.75 2.75 0 013.75 15v-.25H2a.75.75 0 010-1.5h1.75v-5H2a.75.75 0 010-1.5h1.75V6A2.75 2.75 0 016.5 3.25h2.75v-1.5A.75.75 0 0110 1zm0 4.25H6.5A1.25 1.25 0 005.25 6.5v7A1.25 1.25 0 006.5 14.75h7A1.25 1.25 0 0014.75 13.5v-7A1.25 1.25 0 0013.5 5.25H10z" clipRule="evenodd" />
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

export default function LensChipRow({ lenses, activeLensKey, onSelectLens, onCalibrate, isDesktop }) {
  const { isDark } = useTheme();
  // Desktop hover state (which purple chip currently shows the prompt) and
  // mobile first-tap state (which purple chip is awaiting its confirming
  // second tap) are tracked separately — the two affordances never overlap
  // on a single device (D-11).
  const [hoveredKey, setHoveredKey] = useState(null);
  const [tappedKey, setTappedKey] = useState(null);

  if (!Array.isArray(lenses) || lenses.length === 0) return null;

  const dismissPrompt = () => {
    setHoveredKey(null);
    setTappedKey(null);
  };

  const handleChipClick = (lens) => {
    if (lens.calibrated) {
      onSelectLens(lens.key);
      return;
    }
    // Needs-calibration chip.
    if (isDesktop) {
      // Desktop already revealed the prompt on hover — a click confirms it.
      onCalibrate(lens.key);
      dismissPrompt();
      return;
    }
    // Mobile: first tap reveals the prompt; second tap confirms (D-11).
    if (tappedKey === lens.key) {
      onCalibrate(lens.key);
      dismissPrompt();
    } else {
      setTappedKey(lens.key);
    }
  };

  const handlePromptClick = (lens, e) => {
    e.stopPropagation();
    onCalibrate(lens.key);
    dismissPrompt();
  };

  return (
    <div style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      {lenses.map((lens) => {
        const isActive = activeLensKey === lens.key;
        const needsCalibration = lens.calibrated === false;
        const showPrompt = needsCalibration && (
          (isDesktop && hoveredKey === lens.key) || (!isDesktop && tappedKey === lens.key)
        );

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
          stateStyle = { background: chipSurface, color: lens.color, borderColor: lens.color };
        }

        return (
          <div key={lens.key} style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              type="button"
              className="stance-btn"
              onClick={() => handleChipClick(lens)}
              onMouseEnter={() => { if (needsCalibration && isDesktop) setHoveredKey(lens.key); }}
              onMouseLeave={() => { if (isDesktop) setHoveredKey((k) => (k === lens.key ? null : k)); }}
              title={lens.description || lens.name}
              {...(needsCalibration ? {} : { 'aria-pressed': isActive })}
              style={{
                width: 'auto',
                height: 34,
                padding: '0 12px',
                gap: 6,
                ...stateStyle,
              }}
            >
              {renderLensIcon(lens)}
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{lens.name}</span>
            </button>
            {showPrompt && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => handlePromptClick(lens, e)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePromptClick(lens, e); }}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  zIndex: 31,
                  whiteSpace: 'nowrap',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '6px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: isDark ? '#1f2937' : '#fff',
                  color: isDark ? '#e5e7eb' : '#111827',
                  border: '1.5px solid #7C3AED',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                Calibrate this lens?
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
