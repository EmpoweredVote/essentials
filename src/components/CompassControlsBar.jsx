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
        // The bar sits in normal document flow ABOVE the section banner (right-aligned
        // on desktop), rather than floating over it. An earlier version used
        // position:absolute to avoid layout shift when toggling Compass, but that
        // dropped the bar on top of the first tier's full-width city banner. Reserving
        // its own row keeps the lens chips / COMPASS KEY clear of the banner photo.
        position: 'static',
        zIndex: 30,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        justifyContent: isDesktop ? 'flex-end' : 'flex-start',
        paddingTop: 8,
        paddingLeft: isDesktop ? 48 : 24,
        paddingRight: isDesktop ? 48 : 24,
        marginBottom: 8,
        pointerEvents: 'auto',
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
