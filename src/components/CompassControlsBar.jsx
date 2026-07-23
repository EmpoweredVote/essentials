import { CompassKey } from '@empoweredvote/ev-ui';
import LensChipRow from './LensChipRow';

export default function CompassControlsBar({
  userAnswers,
  lenses,
  activeLensKey,
  onSelectLens,
  onCalibrate,
  onStanceMin,
  onStanceMax,
  isDesktop,
  inline = false,
}) {
  const showStanceButtons = (userAnswers?.length ?? 0) >= 3;
  const hasLenses = Array.isArray(lenses) && lenses.length > 0;
  return (
    <div
      style={{
        // Renders in normal flow. When `inline`, it sits in the tab row's right
        // slot (no outer padding) so toggling Compass swaps this into the space
        // the toggle used to occupy — no vertical page shift. When not inline it
        // keeps its own full-width row padding (legacy callers).
        position: 'static',
        zIndex: 30,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        justifyContent: isDesktop ? 'flex-end' : 'flex-start',
        ...(inline
          ? {}
          : {
              paddingTop: 8,
              paddingLeft: isDesktop ? 48 : 24,
              paddingRight: isDesktop ? 48 : 24,
              marginBottom: 8,
            }),
        pointerEvents: 'auto',
      }}
    >
      <div style={{ pointerEvents: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {hasLenses && (
          <>
            {/* Global lens chip row. Shown whether or not the user has calibrated:
                clicking an un-calibrated lens opens a "calibrate these N topics?"
                confirmation (LensChipRow). Desktop: chips flow in this wrap row.
                Mobile: nowrap/overflowX:auto horizontal-scroll strip. */}
            {isDesktop ? (
              <LensChipRow
                lenses={lenses}
                activeLensKey={activeLensKey}
                onSelectLens={onSelectLens}
                onCalibrate={onCalibrate}
                isDesktop={isDesktop}
              />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%' }}>
                <LensChipRow
                  lenses={lenses}
                  activeLensKey={activeLensKey}
                  onSelectLens={onSelectLens}
                  onCalibrate={onCalibrate}
                  isDesktop={isDesktop}
                />
              </div>
            )}
            {/* First-run hint: nudge uncalibrated users to click a lens. */}
            {!showStanceButtons && (
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                Pick a lens to calibrate
              </span>
            )}
            {/* Stance Min/Max only make sense once the user has stances. */}
            {showStanceButtons && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="stance-btn" onClick={onStanceMin} style={{ width: 34, height: 34 }} title="Stance Min — pull strong spokes inward">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                </svg>
              </button>
              <button className="stance-btn" onClick={onStanceMax} style={{ width: 34, height: 34 }} title="Stance Max — push weak spokes outward">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              </button>
            </div>
            )}
          </>
        )}
        <CompassKey compact={!isDesktop} />
      </div>
    </div>
  );
}
