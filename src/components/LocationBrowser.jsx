import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/auth';

/**
 * Browse-by-location component with cascading State → Area Type → Area dropdowns.
 * Calls the browse API endpoints and returns politician data via onResults callback.
 */
export default function LocationBrowser({ onResults, onLoading }) {
  const [states, setStates] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedAreaType, setSelectedAreaType] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load states on mount
  useEffect(() => {
    apiFetch('/essentials/browse/states')
      .then((res) => res && res.ok ? res.json() : [])
      .then((data) => setStates(Array.isArray(data) ? data : []))
      .catch(() => setStates([]));
  }, []);

  // Load areas when state changes
  useEffect(() => {
    if (!selectedState) {
      setAreas([]);
      return;
    }
    apiFetch(`/essentials/browse/states/${selectedState}/areas`)
      .then((res) => res && res.ok ? res.json() : [])
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(() => setAreas([]));
  }, [selectedState]);

  // Reset downstream when state changes
  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setSelectedAreaType('');
    setSelectedArea(null);
    setError(null);
  };

  const handleAreaTypeChange = (e) => {
    setSelectedAreaType(e.target.value);
    setSelectedArea(null);
    setError(null);
  };

  // Group areas by type
  const areaTypes = [...new Set(areas.map((a) => a.area_type))];
  const filteredAreas = selectedAreaType
    ? areas.filter((a) => a.area_type === selectedAreaType)
    : [];

  const handleAreaSelect = (e) => {
    const geoId = e.target.value;
    if (!geoId) {
      setSelectedArea(null);
      return;
    }
    const area = areas.find((a) => a.geo_id === geoId);
    setSelectedArea(area || null);
  };

  const handleBrowse = async () => {
    if (!selectedArea) return;

    setLoading(true);
    setError(null);
    if (onLoading) onLoading(true);

    try {
      const res = await apiFetch('/essentials/browse/by-area', {
        method: 'POST',
        body: JSON.stringify({
          geo_id: selectedArea.geo_id,
          mtfcc: selectedArea.mtfcc,
        }),
      });

      if (!res || !res.ok) {
        setError('Failed to load politicians for this area.');
        if (onResults) onResults([]);
        return;
      }

      const data = await res.json();
      if (onResults) onResults(data, selectedArea.name, selectedState);
    } catch (err) {
      console.error('Browse error:', err);
      setError('Something went wrong. Please try again.');
      if (onResults) onResults([]);
    } finally {
      setLoading(false);
      if (onLoading) onLoading(false);
    }
  };

  const areaTypeLabels = {
    county: 'County',
    city: 'City',
    township: 'Township',
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {/* State select */}
        <select
          value={selectedState}
          onChange={handleStateChange}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white
                     focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]"
        >
          <option value="">Select state</option>
          {states.map((s) => (
            <option key={s.abbreviation} value={s.abbreviation}>
              {s.abbreviation} ({s.politician_count} officials)
            </option>
          ))}
        </select>

        {/* Area type select */}
        {selectedState && areaTypes.length > 0 && (
          <select
            value={selectedAreaType}
            onChange={handleAreaTypeChange}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white
                       focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]"
          >
            <option value="">Select type</option>
            {areaTypes.map((t) => (
              <option key={t} value={t}>
                {areaTypeLabels[t] || t}
              </option>
            ))}
          </select>
        )}

        {/* Area select */}
        {selectedAreaType && filteredAreas.length > 0 && (
          <select
            value={selectedArea?.geo_id || ''}
            onChange={handleAreaSelect}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg bg-white
                       focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]"
          >
            <option value="">
              Select {areaTypeLabels[selectedAreaType]?.toLowerCase() || 'area'}
            </option>
            {filteredAreas.map((a) => (
              <option key={a.geo_id} value={a.geo_id}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        {/* Browse button */}
        {selectedArea && (
          <button
            onClick={handleBrowse}
            disabled={loading}
            className="px-6 py-2 font-bold text-white bg-[var(--ev-teal)] rounded-lg
                       hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Loading...' : 'Browse'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
