import { useState, useRef, useId, useEffect } from 'react';
import {
  useFloating, useInteractions, useListNavigation, useRole, useDismiss,
  FloatingPortal, offset, flip, size, autoUpdate,
} from '@floating-ui/react';
import { classifyInput } from '../lib/inputClassifier';
import { searchLocationsByName } from '../lib/api';

// LocationCombobox — SRCH-02/03/04, D-01/02/03/04/08 (214-unified-location-combobox)
//
// One accessible, always-editable combobox shared by the Results header and the
// Landing search bar. Fully controlled (value/onChange only — no imperative DOM
// writes, per 214-RESEARCH.md Pitfall 2): classifies every keystroke via
// classifyInput() and, for name-like input only, debounce-queries
// GET /essentials/location-search for ranked candidates. Address/coordinate-shaped
// input never reaches the resolver — it renders an inline Enter-hint row instead
// and is handled entirely on submit by the host page's callbacks.
//
// Props:
//   value              — controlled input value (host owns state)
//   onChange(next)      — fired on every keystroke
//   onSubmitAddress(raw)             — Enter/Search for kind === 'address'
//   onSubmitCoordinate(lat,lng,raw)  — Enter/Search for kind === 'coordinate'
//   onSelectCandidate(candidate)     — a listbox row (or Enter on a name query
//                                       with an active row) was chosen
//   placeholder?, ariaLabel?         — copy overrides (UI-SPEC defaults below)
//   errorRow?                       — coral message string the HOST renders in
//                                      the hint-row slot (e.g. a coordinate 422)

const DEBOUNCE_MS = 250;
const MIN_NAME_CHARS = 3;

// area-type tag shown on a candidate row, derived from the /location-search
// mtfcc field (per PATTERNS.md's field-mapping note — the old LocalityMatches
// static-catalog `kind` field doesn't exist on the new resolver shape).
// Mirrors LocalityMatches' own display rule: hide the tag entirely for 'city'
// (the overwhelmingly common case) and only show it for anything else.
function candidateKindTag(mtfcc) {
  if (mtfcc === 'G4110' || mtfcc === 'G4120') return 'city';
  if (mtfcc === 'G4020') return 'county';
  if (!mtfcc) return 'state';
  return 'area';
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-[var(--ev-teal)] dark:text-[var(--color-ev-teal-light)]">
      <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 animate-spin text-[var(--ev-teal)] dark:text-[var(--color-ev-teal-light)]">
      <path d="M12 2a10 10 0 1 0 10 10" />
    </svg>
  );
}

export default function LocationCombobox({
  value,
  onChange,
  onSubmitAddress,
  onSubmitCoordinate,
  onSelectCandidate,
  placeholder = 'Address, city, or coordinates',
  ariaLabel = 'Search by address, city, county, state, or decimal coordinates',
  errorRow = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noMatchQuery, setNoMatchQuery] = useState(null);
  const listRef = useRef([]);
  const debounceRef = useRef(null);
  const listboxId = useId();

  const classified = classifyInput(value);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      // Match the floating listbox width to the input (SRCH-02 visual requirement).
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, { width: `${rects.reference.width}px` });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const role = useRole(context, { role: 'listbox' });
  const dismiss = useDismiss(context);
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    virtual: true, // keeps DOM focus on the <input> — supersedes the retired keydown-capture hack
    onNavigate: setActiveIndex,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([role, dismiss, listNav]);

  // Debounced name-search, GATED on the classifier so address/coordinate-shaped
  // input never fires a resolver call (T-214-04 / RESEARCH Pitfall 4).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const kind = classifyInput(value).kind;
    const trimmed = value.trim();

    if (kind !== 'name' || trimmed.length < MIN_NAME_CHARS) {
      setLoading(false);
      setCandidates([]);
      setNoMatchQuery(null);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await searchLocationsByName(trimmed);
      const list = Array.isArray(data) ? data : [];
      setLoading(false);
      setCandidates(list);
      setActiveIndex(list.length > 0 ? 0 : null);
      setIsOpen(list.length > 0);
      setNoMatchQuery(list.length === 0 ? trimmed : null);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const listboxVisible = isOpen && classified.kind === 'name' && candidates.length > 0;

  function handleSelectCandidate(candidate) {
    setIsOpen(false);
    setCandidates([]);
    setNoMatchQuery(null);
    onSelectCandidate?.(candidate);
  }

  function dispatchSubmit() {
    if (classified.kind === 'address') {
      onSubmitAddress?.(value.trim());
    } else if (classified.kind === 'coordinate') {
      onSubmitCoordinate?.(classified.lat, classified.lng, value);
    } else if (classified.kind === 'name') {
      const active = activeIndex != null ? candidates[activeIndex] : candidates[0];
      if (active) handleSelectCandidate(active);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      dispatchSubmit();
    }
  }

  function renderInlineRow() {
    if (errorRow) {
      return (
        <p role="alert" className="mt-2 flex items-center gap-1 text-sm text-[var(--ev-coral)]">
          <span aria-hidden="true" className="text-[12px] font-semibold">!</span>
          {errorRow}
        </p>
      );
    }
    if (listboxVisible) return null;
    if (classified.kind === 'address') {
      return (
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <span aria-hidden="true" className="text-[12px] font-semibold">↵</span>
          Press Enter to look up this address
        </p>
      );
    }
    if (classified.kind === 'coordinate') {
      return (
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <span aria-hidden="true" className="text-[12px] font-semibold">↵</span>
          Press Enter to look up this location
        </p>
      );
    }
    if (classified.kind === 'name' && noMatchQuery) {
      return (
        <p className="mt-2 flex items-center gap-1 text-sm text-[var(--ev-coral)]">
          <span aria-hidden="true" className="text-[12px] font-semibold">!</span>
          No matches for &#8220;{noMatchQuery}.&#8221; Check the spelling, or press Enter to search it as a street address.
        </p>
      );
    }
    return null;
  }

  return (
    <div className="relative w-full">
      <div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 focus-within:ring-2 focus-within:ring-[var(--ev-teal)] dark:border-gray-700 dark:bg-[var(--color-ev-navy-card)]">
        <PinIcon />
        <input
          ref={refs.setReference}
          role="combobox"
          aria-expanded={listboxVisible}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={listboxVisible && activeIndex != null ? `location-option-${activeIndex}` : undefined}
          aria-label={ariaLabel}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-base leading-[1.5] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
          {...getReferenceProps()}
        />
        {loading && <SpinnerIcon />}
        <button
          type="button"
          onClick={dispatchSubmit}
          aria-label="Search"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-lg bg-[var(--ev-teal)] px-3 text-white transition-colors hover:bg-[var(--ev-teal-dark)]"
        >
          <SearchIcon />
          <span className="hidden text-sm font-semibold sm:inline">Search</span>
        </button>
      </div>

      {listboxVisible && (
        <FloatingPortal>
          <ul
            ref={refs.setFloating}
            id={listboxId}
            role="listbox"
            style={{ ...floatingStyles, zIndex: 60 }}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-[var(--color-ev-navy-card)] divide-y divide-gray-100 dark:divide-gray-800"
            {...getFloatingProps()}
          >
            {candidates.map((candidate, i) => {
              const kindTag = candidateKindTag(candidate.mtfcc);
              return (
                <li
                  key={candidate.geo_id ?? `${candidate.label}-${i}`}
                  id={`location-option-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                >
                  <button
                    type="button"
                    ref={(node) => { listRef.current[i] = node; }}
                    onMouseDown={(e) => e.preventDefault()}
                    className={`flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                      i === activeIndex ? 'bg-[var(--ev-bg-light)] dark:bg-gray-800' : 'hover:bg-[var(--ev-bg-light)] dark:hover:bg-gray-800'
                    }`}
                    {...getItemProps({ onClick: () => handleSelectCandidate(candidate) })}
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-semibold text-[var(--ev-teal)] dark:text-[var(--color-ev-teal-light)]">
                        {candidate.label}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {kindTag !== 'city' && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          {kindTag}
                        </span>
                      )}
                      {candidate.has_local_data && (
                        <span className="rounded-full bg-[var(--ev-bg-light)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--ev-teal)] dark:bg-gray-800 dark:text-[var(--color-ev-teal-light)]">
                          Stances
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </FloatingPortal>
      )}

      {renderInlineRow()}
    </div>
  );
}
