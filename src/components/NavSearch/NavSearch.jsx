import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNameSearch } from '../../hooks/useNameSearch';
import { NavSearchDropdown } from './NavSearchDropdown';

/**
 * NavSearch — search bar rendered below the header on every page.
 *
 * Self-contained: manages own state, hook, and navigation.
 * Rendered by Layout with no props required.
 *
 * compact — when true, renders as a bare search input (no header-bar wrapper),
 *   suitable for embedding in sidebars.
 */
export function NavSearch({ compact = false }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const { results, phase } = useNameSearch(query);
  const navigate = useNavigate();

  // Open dropdown when results arrive
  useEffect(() => {
    if (query.length >= 2 && (phase === 'loading' || phase === 'fresh')) {
      setIsOpen(true);
    }
  }, [query, phase]);

  // Reset selection on new results
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Click-outside dismiss
  useEffect(() => {
    function handleMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  function handleSelect(result) {
    navigate(`/politician/${result.uuid}`);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i <= 0 ? -1 : i - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }

  function handleChange(e) {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  }

  function handleFocus() {
    if (query.length >= 2) {
      setIsOpen(true);
    }
  }

  const searchInput = (
    <div className="relative">
      {/* Search icon */}
      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search politicians..."
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[var(--ev-teal)] focus:ring-1 focus:ring-[var(--ev-teal)] placeholder-gray-400"
      />
    </div>
  );

  if (compact) {
    return (
      <div ref={containerRef} className="relative">
        {searchInput}
        {isOpen && (
          <NavSearchDropdown
            results={results}
            phase={phase}
            query={query}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white border-b border-gray-100">
      <div className="max-w-xl mx-auto px-4 py-2 relative">
        {searchInput}
        {isOpen && (
          <NavSearchDropdown
            results={results}
            phase={phase}
            query={query}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  );
}
