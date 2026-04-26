import { CompassKey, useMediaQuery } from '@empoweredvote/ev-ui';

/**
 * FilterBar — single horizontal strip that consolidates tier/type/name filters
 * for the address-results page. Replaces the desktop sidebar AND the mobile
 * filter strip with one shared layout.
 *
 * Sticky to its scroll container. Wraps to a second row on narrow viewports.
 */

const TIER_OPTIONS = [
  { value: 'All', label: 'All tiers' },
  { value: 'Local', label: 'Local' },
  { value: 'State', label: 'State' },
  { value: 'Federal', label: 'Federal' },
];

const TYPE_OPTIONS = [
  { value: 'All', label: 'All types' },
  { value: 'Elected', label: 'Elected' },
  { value: 'Appointed', label: 'Appointed' },
];

function Dropdown({ label, value, options, onChange, ariaLabel }) {
  const isActive = value !== 'All';
  return (
    <label
      style={{
        position: 'relative',
        display: 'inline-flex', alignItems: 'center',
        padding: 0, margin: 0, minWidth: 0,
      }}
    >
      <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {ariaLabel || label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          padding: '6px 28px 6px 10px',
          fontFamily: "'Manrope', sans-serif", fontSize: '13px',
          fontWeight: 500,
          color: isActive ? '#00657c' : '#374151',
          background: '#fff',
          border: `1px solid ${isActive ? '#00657c' : '#d1d5db'}`,
          borderRadius: '6px',
          minHeight: '34px',
          cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%236b7280' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          backgroundSize: '10px 6px',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

/**
 * Inline filter controls — Tier dropdown, Type dropdown, name search input.
 * No wrapper chrome (no border/padding/background) so it can be dropped
 * directly into another row (e.g. next to the Reps/Elections tabs).
 */
export default function FilterBar({
  selectedFilter, onFilterChange,
  appointedFilter, onAppointedFilterChange,
  searchQuery, onSearchChange,
}) {
  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', gap: '8px',
        minWidth: 0,
      }}
    >
      <Dropdown
        label="Tier"
        ariaLabel="Filter by tier"
        value={selectedFilter}
        onChange={onFilterChange}
        options={TIER_OPTIONS}
      />
      <Dropdown
        label="Type"
        ariaLabel="Filter by type"
        value={appointedFilter}
        onChange={onAppointedFilterChange}
        options={TYPE_OPTIONS}
      />
      <div style={{ position: 'relative', flex: '1 1 120px', minWidth: 0 }}>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name…"
          aria-label="Search by name"
          style={{
            width: '100%',
            padding: '6px 10px 6px 30px',
            fontFamily: "'Manrope', sans-serif", fontSize: '13px',
            border: '1px solid #d1d5db', borderRadius: '6px',
            minHeight: '34px',
            background: '#fff', color: '#374151',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#00657c'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
        />
      </div>
    </div>
  );
}

/**
 * Sticky CompassKey pill — pinned to top: 0 of its scroll container.
 * Designed to be placed inline (e.g. next to the address chip) so it visually
 * shares a line with the chip when the page is at the top, and stays pinned
 * to the top of the scroll container after the chip scrolls away.
 *
 * Caller controls horizontal positioning via the parent's flex layout.
 */
export function StickyCompassKey() {
  const isDesktop = useMediaQuery('(min-width: 769px)');
  return (
    <div style={{ position: 'sticky', top: 8, zIndex: 20 }}>
      <CompassKey compact={!isDesktop} />
    </div>
  );
}
