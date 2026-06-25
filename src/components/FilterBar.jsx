import { CompassKey, useMediaQuery } from '@empoweredvote/ev-ui';

/**
 * FilterBar — single horizontal strip that consolidates type/name filters
 * for the address-results page. Replaces the desktop sidebar AND the mobile
 * filter strip with one shared layout.
 *
 * Sticky to its scroll container. Wraps to a second row on narrow viewports.
 */

const TYPE_OPTIONS = [
  { value: 'All', label: 'All types' },
  { value: 'Elected', label: 'Elected' },
  { value: 'Appointed', label: 'Appointed' },
];

function Dropdown({ label, value, options, onChange, ariaLabel, isDark }) {
  const isActive = value !== 'All';
  const bg = isDark ? '#161b22' : '#fff';
  const borderColor = isActive ? (isDark ? '#00c8d7' : '#59b0c4') : (isDark ? '#2d3748' : '#d1d5db');
  const textColor = isActive ? (isDark ? '#00c8d7' : '#00657c') : (isDark ? '#8b949e' : '#374151');
  const chevronStroke = isDark ? '%2300c8d7' : '%236b7280';
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
          color: textColor,
          backgroundColor: bg,
          border: `1px solid ${borderColor}`,
          borderRadius: '6px',
          minHeight: '44px',
          cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='${chevronStroke}' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          backgroundSize: '10px 6px',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ backgroundColor: isDark ? '#161b22' : '#fff', color: textColor }}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

/**
 * Inline filter controls — Type dropdown, name search input,
 * and an optional Compass toggle checkbox.
 * No wrapper chrome (no border/padding/background) so it can be dropped
 * directly into another row (e.g. next to the Reps/Elections tabs).
 */
export default function FilterBar({
  appointedFilter, onAppointedFilterChange,
  searchQuery, onSearchChange,
  compassMode, onCompassModeChange,
  isDark,
}) {
  const inputBg = isDark ? '#161b22' : '#fff';
  const inputBorder = isDark ? '#2d3748' : '#d1d5db';
  const inputBorderFocus = isDark ? '#00c8d7' : '#00657c';
  const inputText = isDark ? '#8b949e' : '#374151';
  const iconStroke = isDark ? '#00c8d7' : '#6b7280';
  const compassTextColor = compassMode ? (isDark ? '#00c8d7' : '#00657c') : (isDark ? '#8b949e' : '#374151');

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', gap: '8px',
        minWidth: 0,
      }}
    >
      <Dropdown
        label="Type"
        ariaLabel="Filter by type"
        value={appointedFilter}
        onChange={onAppointedFilterChange}
        options={TYPE_OPTIONS}
        isDark={isDark}
      />
      <div style={{ position: 'relative', flex: '1 1 120px', minWidth: 0 }}>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={iconStroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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
            border: `1px solid ${inputBorder}`, borderRadius: '6px',
            minHeight: '44px',
            backgroundColor: inputBg, color: inputText,
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = inputBorderFocus; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = inputBorder; }}
        />
      </div>
      {onCompassModeChange !== undefined && (
        <label
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer',
            minHeight: '44px', padding: '0 4px',
            fontFamily: "'Manrope', sans-serif", fontSize: '13px',
            fontWeight: 500,
            color: compassTextColor,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={!!compassMode}
            onChange={(e) => onCompassModeChange(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: isDark ? '#00c8d7' : '#00657c', cursor: 'pointer' }}
          />
          Compass
        </label>
      )}
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
