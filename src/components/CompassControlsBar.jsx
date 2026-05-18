import { CompassKey } from '@empoweredvote/ev-ui';

export default function CompassControlsBar({
  userAnswers,
  localLensActive,
  toggleLocalLens,
  onStanceMin,
  onStanceMax,
  isDesktop,
}) {
  const showStanceButtons = (userAnswers?.length ?? 0) >= 3;
  return (
    <div
      style={{
        position: 'sticky',
        top: 8,
        zIndex: 30,
        display: 'flex',
        justifyContent: 'flex-end',
        paddingRight: isDesktop ? 48 : 12,
        paddingTop: 8,
        marginBottom: -70,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {showStanceButtons && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="stance-btn"
              onClick={toggleLocalLens}
              title={localLensActive ? 'Exit Local Lens' : 'Local Lens — 8 local questions'}
              style={localLensActive ? { background: '#FF5740', borderColor: '#FF5740', color: '#fff' } : {}}
            >
              {/* Location pin — matches EV brand local icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </button>
            <button className="stance-btn" onClick={onStanceMin} title="Stance Min — pull strong spokes inward">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
              </svg>
            </button>
            <button className="stance-btn" onClick={onStanceMax} title="Stance Max — push weak spokes outward">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            </button>
          </div>
        )}
        <CompassKey compact={!isDesktop} />
      </div>
    </div>
  );
}
