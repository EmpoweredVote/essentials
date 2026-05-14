import { CompassKey } from '@empoweredvote/ev-ui';

export default function CompassControlsBar({
  userAnswers,
  localLensActive,
  toggleLocalLens,
  judicialLensActive,
  toggleJudicialLens,
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
              style={localLensActive ? { background: '#5A9A6E', borderColor: '#5A9A6E', color: '#fff' } : {}}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button
              className="stance-btn"
              onClick={toggleJudicialLens}
              title={judicialLensActive ? 'Exit Judicial Lens' : 'Judicial Lens — 8 judicial questions'}
              style={judicialLensActive ? { background: '#C2440A', borderColor: '#C2440A', color: '#fff' } : {}}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2L3 13l3 3L17 5l-3-3z" />
                <path d="M7 12l4 4" />
                <path d="M3 21h18" />
              </svg>
            </button>
            <button className="stance-btn" onClick={onStanceMin} title="Stance Min — pull strong spokes inward">⊟</button>
            <button className="stance-btn" onClick={onStanceMax} title="Stance Max — push weak spokes outward">⊞</button>
          </div>
        )}
        <CompassKey compact={!isDesktop} />
      </div>
    </div>
  );
}
