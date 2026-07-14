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
}) {
  const showStanceButtons = (userAnswers?.length ?? 0) >= 3;
  return (
    <div
      style={{
        // Desktop: a true overlay anchored to the top-right of the results area. It is
        // taken out of normal flow (position:absolute) so toggling Compass never shifts
        // the surrounding content, and it lives below any full-width banner (locality
        // notice / voter info) so the COMPASS KEY can't cover it. See Results.jsx where
        // this is rendered inside a 0-height relative anchor placed after the banner.
        // Mobile: the content is too narrow to float over — the bar takes its own row
        // in normal flow so it can't overlap the cards/header.
        position: isDesktop ? 'absolute' : 'static',
        top: isDesktop ? 0 : undefined,
        right: isDesktop ? 48 : undefined,
        zIndex: 30,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-end',
        paddingTop: 8,
        paddingLeft: isDesktop ? 0 : 24,
        paddingRight: isDesktop ? 0 : 24,
        marginBottom: isDesktop ? 0 : 8,
        pointerEvents: isDesktop ? 'none' : 'auto',
      }}
    >
      <div style={{ pointerEvents: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {showStanceButtons && (
          <>
            {/* Global lens chip row — replaces the old binary Lens toggle.
                Desktop: chips flow inside this bar's existing flexWrap:'wrap'
                row (D-08). Mobile: wrapped below in a nowrap/overflowX:auto
                strip so it becomes a single-row horizontal scroll (D-09). */}
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
          </>
        )}
        <CompassKey compact={!isDesktop} />
      </div>
    </div>
  );
}
