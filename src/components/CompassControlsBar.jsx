import { CompassKey } from '@empoweredvote/ev-ui';

export default function CompassControlsBar({
  userAnswers,
  localLensActive,
  setLocalLens,
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
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-end',
        // Desktop: float over the whitespace to the right of content (negative margin
        // pulls the grid up under it). Mobile: the content is too narrow for that —
        // the bar takes its own row in normal flow so it can't overlap the cards/header.
        paddingTop: 8,
        paddingLeft: isDesktop ? 0 : 24,
        paddingRight: isDesktop ? 48 : 24,
        marginBottom: isDesktop ? -70 : 8,
        pointerEvents: isDesktop ? 'none' : 'auto',
      }}
    >
      <div style={{ pointerEvents: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {showStanceButtons && (
          <>
            {/* Local Lens — labeled, touch-friendly toggle. Default ON for the
                elections view; clearly reflects on/off so users can find it. */}
            <button
              className="stance-btn"
              onClick={() => setLocalLens(!localLensActive)}
              aria-pressed={localLensActive}
              title={localLensActive ? 'Local Lens on — focused on local issues' : 'Local Lens off — full compass'}
              style={{
                width: 'auto',
                height: 34,
                padding: '0 12px',
                gap: 6,
                ...(localLensActive ? { background: '#FF5740', borderColor: '#FF5740', color: '#fff' } : {}),
              }}
            >
              {/* Location pin — matches EV brand local icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Local Lens</span>
            </button>
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
