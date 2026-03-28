/**
 * NavSearchResult — individual result row with match highlighting.
 *
 * Props:
 *   result        — { uuid, name, office_title, jurisdiction, district }
 *   query         — string used to highlight matching text in name
 *   isSelected    — boolean for keyboard-nav highlight
 *   onClick       — callback fired when row is clicked
 */
export function NavSearchResult({ result, query, isSelected, onClick }) {
  // Build highlighted name segments
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const segments = result.name.split(new RegExp(`(${escapedQuery})`, 'gi'));

  // Build subtitle: office_title - jurisdiction[, district]
  const jurisdictionPart = result.district
    ? `${result.jurisdiction}, ${result.district}`
    : result.jurisdiction;
  const subtitle = [result.office_title, jurisdictionPart]
    .filter(Boolean)
    .join(' - ');

  return (
    <div
      role="option"
      tabIndex={-1}
      onClick={onClick}
      className={[
        'px-4 py-2 cursor-pointer',
        isSelected ? 'bg-[var(--ev-bg-light)]' : 'hover:bg-gray-50',
      ].join(' ')}
    >
      <div className="text-sm font-medium">
        {segments.map((seg, i) =>
          seg.toLowerCase() === query.toLowerCase() ? (
            <strong key={i} className="font-bold" style={{ color: 'var(--ev-teal)' }}>
              {seg}
            </strong>
          ) : (
            <span key={i}>{seg}</span>
          )
        )}
      </div>
      {subtitle && (
        <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}
