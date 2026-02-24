/**
 * LocalFilterSidebar — local replacement for ev-ui FilterSidebar on the Results page.
 * Avoids an ev-ui publish cycle. Desktop-only (hidden on mobile via CSS; Results.jsx
 * conditionally renders it only when isDesktop is true).
 */
export default function LocalFilterSidebar({
  selectedFilter,
  onFilterChange,
  locationLabel,
  buildingImageSrc,
  searchQuery,
  onSearchChange,
  showCandidates,
  onShowCandidatesChange,
  candidatesLoading,
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
        <label
          className="flex items-center gap-2 cursor-pointer select-none"
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '13px',
            color: '#718096',
          }}
        >
          <input
            type="checkbox"
            checked={showCandidates}
            onChange={(e) => onShowCandidatesChange(e.target.checked)}
            style={{ accentColor: '#00657c', width: '14px', height: '14px' }}
          />
          Show Candidates
          {candidatesLoading && (
            <span style={{ fontSize: '11px', color: '#a0aec0' }}>(loading...)</span>
          )}
        </label>
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
              // Fall back to generic SVG if image fails to load
              if (!e.target.src.endsWith('.svg')) {
                e.target.src = '/images/state-capitol-generic.svg';
              }
            }}
          />
        </div>
      )}
    </aside>
  );
}
