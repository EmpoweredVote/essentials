import { useState } from 'react';

export default function ResultsHeader({ resultsCount, onSearch, onSortChange }) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 px-4 sm:px-8 py-4">
      {/* Search Bar */}
      <div className="flex-1 max-w-full sm:max-w-md">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]"
          />
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Sort by</label>
        <select
          onChange={(e) => onSortChange?.(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] cursor-pointer"
        >
          <option value="name">Name</option>
          <option value="role">Role</option>
        </select>
      </div>
    </div>
  );
}
