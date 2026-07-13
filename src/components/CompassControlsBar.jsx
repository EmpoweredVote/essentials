import { CompassKey } from '@empoweredvote/ev-ui';

export default function CompassControlsBar({
  userAnswers,
  lensActive,
  onToggleLens,
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
            {/* Lens — labeled, touch-friendly toggle. Default ON; focuses each
                race on its most relevant issues (local races → local issues,
                U.S. House/Senate → federal issues). Clearly reflects on/off. */}
            <button
              className="stance-btn"
              onClick={onToggleLens}
              aria-pressed={lensActive}
              title={lensActive ? 'Lens on — each race focuses on its most relevant issues' : 'Lens off — full compass for every race'}
              style={{
                width: 'auto',
                height: 34,
                padding: '0 12px',
                gap: 6,
                ...(lensActive ? { background: '#FF5740', borderColor: '#FF5740', color: '#fff' } : {}),
              }}
            >
              {/* Viewfinder — "focus this view on its key issues" (lens metaphor) */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Lens</span>
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
