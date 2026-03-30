/**
 * LocalFilterSidebar — local replacement for ev-ui FilterSidebar on the Results page.
 * Avoids an ev-ui publish cycle. Desktop-only (hidden on mobile via CSS; Results.jsx
 * conditionally renders it only when isDesktop is true).
 */
import SegmentedControl from './SegmentedControl';

export default function LocalFilterSidebar({
  selectedFilter,
  onFilterChange,
  appointedFilter,
  onAppointedFilterChange,
  locationLabel,
  buildingImageSrc,
  searchQuery,
  onSearchChange,
  showCandidates,
  onShowCandidatesChange,
  candidatesLoading,
  candidateCount,
}) {
  const filterOptions = [
    { value: 'All', label: 'All' },
    { value: 'Local', label: 'Local' },
    { value: 'State', label: 'State' },
    { value: 'Federal', label: 'Federal' },
  ];

  return (
    <aside
      style={{
        width: '300px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2ebef',
        overflowY: 'auto',
      }}
    >
      {/* Filter radio buttons */}
      <div className="mb-1">
        <p className="text-sm font-medium text-gray-500 mb-2">Group</p>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Filter by group">
          {filterOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              <input
                type="radio"
                name="tier-filter"
                value={option.value}
                checked={selectedFilter === option.value}
                onChange={() => onFilterChange(option.value)}
                style={{ accentColor: '#00657c', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span
                className="text-base text-gray-800"
                style={{ fontWeight: selectedFilter === option.value ? 600 : 400 }}
              >
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-200 my-4" />

      {/* Type filter — elected/appointed segmented control (per D-02, D-03) */}
      <div className="mb-1">
        <p className="text-sm font-medium text-gray-500 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>Type</p>
        <SegmentedControl
          options={[
            { value: 'All', label: 'All' },
            { value: 'Elected', label: 'Elected' },
            { value: 'Appointed', label: 'Appointed' },
          ]}
          value={appointedFilter}
          onChange={onAppointedFilterChange}
          ariaLabel="Filter by type"
        />
      </div>

      <hr className="border-gray-200 my-4" />

      {/* Name search input */}
      <div className="mb-1">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search representative"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          />
        </div>
      </div>

      <hr className="border-gray-200 my-4" />

      {/* Candidates toggle */}
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-500 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>Election</p>
        <button
          onClick={() => onShowCandidatesChange(!showCandidates)}
          disabled={candidatesLoading}
          role="switch"
          aria-checked={showCandidates}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '10px 12px',
            borderRadius: '8px',
            border: `2px solid ${showCandidates ? '#fbbf24' : '#e2e8f0'}`,
            backgroundColor: showCandidates ? '#fffbeb' : '#ffffff',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, background-color 0.2s ease',
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={showCandidates ? '#92400e' : '#718096'} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span style={{
                fontSize: '14px',
                fontWeight: showCandidates ? 600 : 400,
                color: showCandidates ? '#92400e' : '#718096',
              }}>
                Show Candidates
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {candidatesLoading && (
                <span style={{ fontSize: '11px', color: '#a0aec0' }}>Loading…</span>
              )}
              {showCandidates && candidateCount > 0 && !candidatesLoading && (
                <span style={{
                  backgroundColor: '#fed12e',
                  color: '#78350f',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  lineHeight: 1.4,
                }}>
                  {candidateCount}
                </span>
              )}
              {/* Toggle pill */}
              <div style={{
                width: '32px',
                height: '18px',
                borderRadius: '9999px',
                backgroundColor: showCandidates ? '#fed12e' : '#cbd5e0',
                position: 'relative',
                transition: 'background-color 0.2s ease',
                flexShrink: 0,
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: showCandidates ? '16px' : '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Location label */}
      {locationLabel && (
        <p
          className="text-sm text-gray-500 mt-1 mb-3"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          {locationLabel}
        </p>
      )}

      {/* Building image — fills remaining space */}
      {buildingImageSrc && (
        <div className="flex-1 flex flex-col min-h-0 mt-2">
          <img
            src={buildingImageSrc}
            alt="Government building"
            className="w-full rounded-lg object-cover flex-shrink"
            style={{ flexGrow: 1, minHeight: 0, aspectRatio: '1/2.25' }}
            onError={(e) => {
              // Hide the image if it fails to load
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
    </aside>
  );
}
