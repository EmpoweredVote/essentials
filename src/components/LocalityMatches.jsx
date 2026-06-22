import { searchCoverageAreas } from '../lib/coverage';

/**
 * Typeahead dropdown of covered cities/areas, matched by name against the static
 * coverage list. Rendered below the address search box on Landing and the Results
 * edit-search box. Selecting an area routes straight to its browse view (via the
 * parent's onSelect), so users can type "Burbank" and jump there instead of needing
 * a full street address. Renders nothing when there are no matches (including for
 * street-address-style queries, which the Google autocomplete handles instead).
 *
 * Props:
 *  - query: current text in the address box
 *  - onSelect: (area) => void — receives the matched coverage area entry
 */
export default function LocalityMatches({ query, onSelect }) {
  const matches = searchCoverageAreas(query);
  if (matches.length === 0) return null;

  return (
    <div className="mt-2">
      {/* When our locality matches are showing (name queries — the address-style
          ones are filtered out upstream), suppress Google Places' own dropdown so
          it doesn't overlap and intercept clicks on these results. */}
      <style>{`.pac-container { display: none !important; }`}</style>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
        {matches.map((area) => (
          <li key={`${area.stateAbbrev}-${area.label}`}>
            <button
              type="button"
              // Prevent the input from blurring before the click registers
              // (matters while the field is focused / Google's dropdown is open).
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(area)}
              className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800 transition-colors"
            >
              <span className="min-w-0 truncate">
                <span className="font-semibold text-[var(--ev-teal)] dark:text-ev-teal-light">{area.label}</span>
                {area.stateAbbrev && <span className="text-sm text-gray-500 dark:text-gray-400">, {area.stateAbbrev}</span>}
              </span>
              <span className="shrink-0 flex items-center gap-2">
                {area.kind && area.kind !== 'city' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                    {area.kind}
                  </span>
                )}
                {area.hasContext && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ev-teal)] dark:text-ev-teal-light bg-[var(--ev-bg-light)] dark:bg-gray-800 rounded-full px-2 py-0.5">
                    Stances
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
