import { useState, useEffect, useRef } from 'react';
import { searchCoverageAreas } from '../lib/coverage';

/**
 * Typeahead dropdown of covered cities/counties/states, matched by name against
 * the static coverage list. Rendered below the address search box on Landing and
 * the Results edit-search box. Selecting an entry routes straight to its browse
 * view (via the parent's onSelect). Renders nothing when there are no matches
 * (including for street-address-style queries, which Google's autocomplete owns).
 *
 * Keyboard: when matches are showing we capture ArrowUp/ArrowDown/Enter at the
 * document level (which runs before Google Places' own listener on the shared
 * input) so the arrows drive THIS list and Enter selects the highlighted item —
 * otherwise Google would silently grab the keys (e.g. ↓+Enter picking a random
 * street like "California Incline" instead of the "California" state result).
 *
 * Props:
 *  - query: current text in the address box
 *  - inputRef: ref to the address <input> (to scope the key capture)
 *  - onSelect: (area) => void — receives the matched coverage entry
 */
export default function LocalityMatches({ query, inputRef, onSelect }) {
  const matches = searchCoverageAreas(query);
  const [active, setActive] = useState(0);

  // Latest values for the long-lived document listener (avoids re-binding).
  const ref = useRef({ matches, active, onSelect });
  ref.current = { matches, active, onSelect };

  // Reset the highlight to the top match as the query changes.
  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    const input = inputRef?.current;
    if (!input) return;
    const onKeyDown = (e) => {
      if (e.target !== input) return;
      const { matches: m, active: a, onSelect: sel } = ref.current;
      if (!m.length) return; // address-style query → let Google handle it
      if (e.key === 'ArrowDown') {
        e.preventDefault(); e.stopImmediatePropagation();
        setActive((i) => Math.min(i + 1, m.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); e.stopImmediatePropagation();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault(); e.stopImmediatePropagation();
        sel(m[a] || m[0]);
      }
    };
    // Capture phase on document: fires before Google's keydown listener on the input.
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [inputRef]);

  if (matches.length === 0) return null;

  return (
    <div className="mt-2">
      {/* Suppress Google Places' own dropdown so it doesn't overlap these results
          (we drive the keyboard ourselves above). Locality matches only show for
          name queries, so street addresses still get Google's dropdown. */}
      <style>{`.pac-container { display: none !important; }`}</style>
      <ul role="listbox" className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
        {matches.map((area, i) => (
          <li key={`${area.kind}-${area.stateAbbrev || area.browseState}-${area.label}`} role="option" aria-selected={i === active}>
            <button
              type="button"
              // Prevent the input from blurring before the click registers.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => onSelect(area)}
              className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                i === active ? 'bg-[var(--ev-bg-light)] dark:bg-gray-800' : 'hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800'
              }`}
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
