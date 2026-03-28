import { NavSearchResult } from './NavSearchResult';

/**
 * NavSearchDropdown — dropdown container for search results.
 *
 * Props:
 *   results       — array of result objects
 *   phase         — "idle" | "loading" | "fresh" | "error"
 *   query         — current search query (passed to NavSearchResult for highlighting)
 *   selectedIndex — index of keyboard-selected result (-1 = none)
 *   onSelect      — callback(result) when a result is chosen
 */
export function NavSearchDropdown({ results, phase, query, selectedIndex, onSelect }) {
  if (phase === 'loading') {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-2">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse mt-1" />
          </div>
        ))}
      </div>
    );
  }

  if (phase === 'fresh' && results.length > 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
        {results.map((result, index) => (
          <NavSearchResult
            key={result.uuid}
            result={result}
            query={query}
            isSelected={index === selectedIndex}
            onClick={() => onSelect(result)}
          />
        ))}
      </div>
    );
  }

  if (phase === 'fresh' && results.length === 0) {
    return (
      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
        <div className="text-sm text-gray-500 px-4 py-3">
          No results on Empowered Vote.
        </div>
        <div className="px-4 pb-3">
          <a
            href="https://www.fec.gov/data/candidates/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium"
            style={{ color: 'var(--ev-teal)' }}
          >
            Search FEC.gov &rarr;
          </a>
        </div>
      </div>
    );
  }

  return null;
}
