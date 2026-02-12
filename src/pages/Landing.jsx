import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteHeader } from '@chrisandrewsedu/ev-ui';

export default function Landing() {
  const [zip, setZip] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    const normalized = zip.trim();
    if (!normalized) return;
    if (/^\d{5}$/.test(normalized)) {
      navigate(`/results?zip=${normalized}`);
    } else {
      navigate(`/results?q=${encodeURIComponent(normalized)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ev-bg-light)]">
      <SiteHeader logoSrc="/EVLogo.svg" />

      <main className="container mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          {/* Left side - Content */}
          <div className="flex-1 max-w-xl text-center">
            <h1 className="text-3xl sm:text-5xl font-bold text-[var(--ev-teal)] mb-6">
              Find Your Representatives
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Enter your ZIP code or address to see who represents you
            </p>

            {/* Search Input + Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter ZIP code or address"
                className="flex-1 min-w-0 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] bg-white shadow-sm"
              />
              <button
                onClick={handleSearch}
                disabled={!zip.trim()}
                className="px-4 sm:px-8 py-3 text-lg font-bold text-white bg-[var(--ev-teal)] rounded-lg hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="flex-1 max-w-md">
            <div className="aspect-square bg-gradient-to-br from-[var(--ev-light-blue)] to-[var(--ev-teal)] rounded-3xl p-8 flex items-center justify-center shadow-xl">
              {/* Placeholder for magnifying glass illustration */}
              <div className="text-white text-center">
                <svg
                  className="w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-4"
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Magnifying glass circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="50"
                    stroke="white"
                    strokeWidth="8"
                    fill="rgba(255,255,255,0.1)"
                  />
                  {/* Magnifying glass handle */}
                  <line
                    x1="120"
                    y1="120"
                    x2="170"
                    y2="170"
                    stroke="white"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Person silhouette inside magnifying glass */}
                  <circle cx="80" cy="70" r="12" fill="white" />
                  <path
                    d="M 60 95 Q 60 82 80 82 Q 100 82 100 95 L 100 105 Q 100 110 95 110 L 65 110 Q 60 110 60 105 Z"
                    fill="white"
                  />
                </svg>
                <p className="text-lg font-medium opacity-90">
                  Discover your elected officials
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
