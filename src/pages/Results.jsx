import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { track } from '@empoweredvote/analytics';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GovernmentBodySection, SubGroupSection, PoliticianCard, CompassCardVertical, useMediaQuery, tierColors, useEvContextPromotion } from '@empoweredvote/ev-ui';
import { computeVariant, classifyBucket, classifyCategory, TAB_TYPE_DEFAULTS, matchesAppointedFilter } from '../lib/classify';
import { fetchPoliticianAnswers, computeStanceSpokes, saveLensPending, resolveTabLens, loadLensPending } from '../lib/compass';
import IconOverlay from '../components/IconOverlay';
import { getBranch } from '../utils/branchType';
import { Layout } from '../components/Layout';
import { getSeatBallotStatus } from '../utils/ballotStatus';
import FilterBar, { StickyCompassKey } from '../components/FilterBar';
import { usePoliticianData } from '../hooks/usePoliticianData';
import { groupIntoHierarchy } from '../lib/groupHierarchy';
import { getBuildingImages, parseStateFromAddress, parseCityFromAddress, stateAbbrevFromGeoId } from '../lib/buildingImages';
import { fetchElectionsByAddress, fetchElectionsByArea, fetchElectionsByGovernmentList, fetchMyElections, saveMyLocation, browseByArea, browseByGovernmentList, browseByState, browseFederalOfficials, fetchVoterInfo, lookupCoordinate } from '../lib/api';
import { saveUserAddress, loadUserAddressFromContext } from '../lib/compass';
import { apiFetch } from '../lib/auth';
import { useCompass } from '../contexts/CompassContext';
import { useTheme } from '../hooks/useTheme';
import MiniCompass from '../components/MiniCompass';
import { resolveLocalityRoute, browseAreaRoute } from '../lib/localitySearch';
import LocationCombobox from '../components/LocationCombobox';
import ElectionsView from '../components/ElectionsView';
import VoterResourcesCard from '../components/VoterResourcesCard';
import CompassControlsBar from '../components/CompassControlsBar';
import SectionBanner from '../components/SectionBanner.jsx';
import { fetchTreasuryCities, findMatchingMunicipality, toTreasurySlug, TREASURY_URL } from '../lib/treasury';
import { fetchTriviaCollections } from '../lib/trivia';
import { resolveFeatureIcons } from '../lib/featureIcons';
import { resolvePopulation } from '../lib/population';
import { buildBannerProps } from '../lib/bannerProps';

/** Stable key that identifies a specific seat (office + district). */
function seatKey(pol) {
  return `${pol.office_title}||${pol.district_type}||${pol.district_id || ''}`;
}

function deriveScopedTopics(allTopics, districtType) {
  if (!districtType || allTopics.length === 0) return allTopics;
  const upper = String(districtType).toUpperCase();
  const key = upper.startsWith('STATE_')               ? 'applies_state'
            : upper.startsWith('NATIONAL_JUDICIAL')     ? 'applies_judicial'
            : upper === 'JUDICIAL'                      ? 'applies_judicial'
            : upper.startsWith('NATIONAL_')             ? 'applies_federal'
            : (upper === 'LOCAL' || upper === 'LOCAL_EXEC' || upper === 'COUNTY' || upper === 'SCHOOL') ? 'applies_local'
            : null;
  if (!key) return allTopics;
  return allTopics.filter((t) => t[key] !== false);
}

// Whether an office is a "local" office for Local Lens default purposes.
// Mirrors the local-tier mapping in Profile.jsx's districtScope.
function isLocalDistrict(districtType) {
  const upper = String(districtType || '').toUpperCase();
  return upper === 'LOCAL' || upper === 'LOCAL_EXEC' || upper === 'COUNTY';
}

function getImageData(pol) {
  if (pol.images && pol.images.length > 0) {
    const defaultImg = pol.images.find((img) => img.type === 'default');
    const img = defaultImg || pol.images[0];
    return { url: img.url, focalPoint: img.focal_point || null };
  }
  return { url: pol.photo_origin_url, focalPoint: null };
}

function getImageUrl(pol) {
  return getImageData(pol).url;
}

function formatElectionDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Normalize a Census Geocoder address (often ALL CAPS) to title case.
 * Handles common abbreviations: "ST", "AVE", "BLVD", "IN", "CA", etc.
 * e.g., "200 W KIRKWOOD AVE, BLOOMINGTON, IN, 47404"
 *    → "200 W Kirkwood Ave, Bloomington, IN, 47404"
 */
const STATE_ABBREVS = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
]);
const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};
const STREET_ABBREVS = new Set([
  'ST','AVE','BLVD','DR','RD','LN','CT','PL','WAY','TER','CIR','PKWY','HWY','FWY',
  'N','S','E','W','NE','NW','SE','SW',
]);
function toAddressTitleCase(address) {
  if (!address) return address;
  return address
    .split(', ')
    .map((part, partIdx) => {
      const upper = part.toUpperCase();
      // Keep state abbreviations and zip codes as-is
      if (partIdx > 0 && (STATE_ABBREVS.has(upper) || /^\d{5}(-\d{4})?$/.test(part))) {
        return upper;
      }
      return part
        .split(' ')
        .map((word) => {
          const up = word.toUpperCase();
          // Keep state abbreviations and single letters uppercase
          if (STATE_ABBREVS.has(up)) return up;
          // Common street abbreviations: capitalize first letter only
          if (STREET_ABBREVS.has(up)) return up.charAt(0) + up.slice(1).toLowerCase();
          if (!word) return word;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    })
    .join(', ');
}

/** Derive a short formal name for the compass legend, e.g. "Senator Young" */
function formatLegendName(pol) {
  const dt = pol.district_type || '';
  const last = pol.last_name || '';
  const titleMap = {
    NATIONAL_EXEC: 'President',
    NATIONAL_UPPER: 'Senator',
    NATIONAL_LOWER: 'Representative',
    STATE_EXEC: 'Governor',
    STATE_UPPER: 'Senator',
    STATE_LOWER: 'Representative',
    LOCAL_EXEC: 'Mayor',
  };
  const prefix = titleMap[dt];
  if (prefix) return `${prefix} ${last}`;
  // Fallback: full name
  return `${pol.first_name} ${last}`.trim();
}

/**
 * 260426-mw6 — Inline banner for guest → authed promotion (compass or address).
 * Rendered when useEvContextPromotion's shouldPrompt is true.
 */
function PromotionBanner({ kind, payload, onSave, onDismiss, status, error }) {
  const saving = status === 'saving';
  let message;
  if (kind === 'compass') {
    const ans = (payload && (payload.answers || payload.a)) || {};
    const count = Object.keys(ans).length;
    if (count === 0) return null;
    message = (
      <>You answered <strong>{count}</strong> question{count === 1 ? '' : 's'} before signing up — save them to your account?</>
    );
  } else if (kind === 'address') {
    const addr = (payload && (payload.formatted || payload.addr)) || '';
    if (!addr) return null;
    message = (
      <>Use <strong>{addr}</strong> as your saved address?</>
    );
  } else {
    return null;
  }
  return (
    <div
      role="status"
      className="flex items-center gap-3 px-4 py-[10px] bg-[#E4F3F6] dark:bg-gray-800 border-b border-[#C0E8F2] dark:border-gray-700 text-[#003E4D] dark:text-gray-200 text-sm"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {message}
        {status === 'error' && error && (
          <span style={{ color: '#e64a34', marginLeft: 8 }}>
            ({error.message})
          </span>
        )}
      </span>
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        style={{
          padding: '6px 14px', borderRadius: '9999px', border: 'none',
          background: '#00657c', color: '#fff', fontSize: '13px',
          fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        disabled={saving}
        aria-label="Dismiss"
        className="px-2 py-1 border-none bg-transparent text-gray-500 dark:text-gray-400 text-lg leading-none cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}

/** Loading skeleton for a single politician card row */
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 py-2 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

/** Loading skeleton for a tier section with header + cards */
function SkeletonSection() {
  return (
    <div className="mb-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

/** Normalize district subtitle for consistent display
 *  e.g. "Indiana 9th Congressional District" → "District 9" */
function normalizeDistrictSubtitle(raw) {
  if (!raw) return raw;
  const match = raw.match(/(\d+)(?:st|nd|rd|th)\s+Congressional\s+District/i);
  if (match) return `District ${match[1]}`;
  return raw;
}

/**
 * Derive a card subtitle from the seat designation embedded in the office title,
 * scoped to local offices. Returns "Ward N" | "District N" | "At-Large" | null.
 * Keeps each jurisdiction's own term (e.g. SLC councils say "Ward", Ogden says
 * "District") rather than normalizing, and surfaces at-large seats that carry the
 * marker in their title (e.g. "Council At-Large Seat A") regardless of district_id.
 * Mirror of deriveSeatSubtitle() in ev-ui/src/PoliticianProfile.jsx — keep in sync.
 */
function deriveSeatSubtitle(pol, cleanTitle) {
  const dt = pol.district_type || '';
  if (!dt.startsWith('LOCAL') && dt !== 'COUNTY' && dt !== 'SCHOOL') return null;
  const t = cleanTitle || '';
  if (/\bat[- ]large\b/i.test(t)) return 'At-Large';
  let m = t.match(/\bward\s+(\d+)/i);
  if (m) return `Ward ${m[1]}`;
  m = t.match(/\bdistrict\s+(\d+)/i);
  if (m) return `District ${m[1]}`;
  // SCHOOL: extract parenthetical area label e.g. "Board Member (Area 1)" → "Area 1"
  // ev-ui Profile.jsx mirror does not need updating (separate rendering path)
  if (dt === 'SCHOOL') {
    const pm = t.match(/\((.+?)\)/);
    return pm ? pm[1].trim() : null;
  }
  return null;
}

/**
 * Qualify a generic local title with the jurisdiction name.
 * e.g. "Mayor" → "Paramount Mayor", "Sheriff" → "Los Angeles County Sheriff"
 * Only used when a card is NOT inside a government_body_name section.
 */
function qualifyLocalTitle(baseTitle, pol) {
  if (!baseTitle) return baseTitle;

  const dt = pol.district_type || '';
  if (!dt.startsWith('LOCAL') && dt !== 'COUNTY') return baseTitle;

  // Use government_name if set; fall back to representing_city for loaders that
  // don't create a chamber→government record (e.g. Utah at-large city councils).
  const govRaw = pol.government_name || pol.representing_city || '';
  if (!govRaw) return baseTitle;

  const gov = govRaw.split(',')[0].trim();
  const govCore = gov
    .replace(/^(City|Town|Village)\s+of\s+/i, '')
    .replace(/\s+(Township|County)$/i, '')
    .trim();

  if (govCore && baseTitle.toLowerCase().includes(govCore.toLowerCase()))
    return baseTitle;

  let prefix = dt === 'COUNTY'
    ? gov
    : gov.replace(/^(City|Town|Village)\s+of\s+/i, '');

  if (prefix.endsWith('County') && baseTitle.startsWith('County'))
    prefix = prefix.replace(/\s+County$/, '');

  return `${prefix} ${baseTitle}`;
}

/**
 * Simplify a card title when it's displayed inside a government_body_name section.
 * The section header already shows the body name (e.g., "Ellettsville Town Council"),
 * so the card should only show what differentiates this position — not repeat the
 * jurisdiction or body name.
 *
 * Examples:
 *   "Ellettsville Town Council"        → "Town Council"   (section: "Ellettsville Town Council")
 *   "Monroe County: Richland Twp Board"→ "Township Board" (section: "Richland Township")
 *   "City Common Council"              → "City Common Council" (section: "Bloomington Common Council")
 *   "Assessor"                         → "Assessor"       (section: "Monroe County Government")
 */
function simplifyForBody(title, pol) {
  if (!title) return title;

  let simplified = title;

  // Strip "X County: " prefix (e.g., "Monroe County: Richland Township Board")
  simplified = simplified.replace(/^[\w\s]+?County:\s*/i, '');

  // For school districts, the section header already names the school corporation,
  // so extract just the board type (e.g., "School Board", "Board of Education").
  if (pol.district_type === 'SCHOOL') {
    const boardMatch = simplified.match(
      /\b(School Board|Board of Education|Board of Trustees)\b.*$/i
    );
    if (boardMatch) return boardMatch[0];
  }

  // Strip jurisdiction name derived from government_name
  if (pol.government_name) {
    const coreJurisdiction = pol.government_name
      .split(',')[0]
      .trim()
      .replace(/^(City|Town|Village)\s+of\s+/i, '')
      .replace(/\s+(Township|County)$/i, '');

    if (
      coreJurisdiction &&
      simplified.toLowerCase().startsWith(coreJurisdiction.toLowerCase() + ' ')
    ) {
      simplified = simplified.slice(coreJurisdiction.length).trim();
    }
  }

  return simplified || title;
}


// D-08 coordinate 422 -> coral message map (214-UI-SPEC.md Copywriting Contract).
// Keyed by the Phase 213 error taxonomy (OUTSIDE_US_BOUNDS/SWAPPED_COORDINATES/
// INVALID_COORDINATES); an unrecognized/missing code falls back to the generic
// invalid-coordinate copy.
const COORDINATE_ERROR_MESSAGES = {
  INVALID_COORDINATES: "That doesn't look like a valid coordinate. Use decimal degrees, like 39.17, -86.52.",
  OUTSIDE_US_BOUNDS: 'Those coordinates are outside the United States. Enter a US location.',
  SWAPPED_COORDINATES: 'Latitude and longitude look swapped — try lat, lng, like 39.17, -86.52.',
};

// Phase 208 (D-01/D-05/D-06): shared active/inactive className for all four tab
// buttons (Representatives, Educators, Judges, Elections) — avoids 4x copy-paste
// drift of the identical ternary. Every caller passes an isActive boolean derived
// from effectiveActiveView, never raw activeView.
function tabButtonClass(isActive) {
  return `px-2 sm:px-4 py-3 text-sm min-h-[44px] transition-colors whitespace-nowrap ${
    isActive
      ? 'text-[#00657C] dark:text-ev-teal-light font-semibold border-b-2 border-[#00657C] dark:border-ev-teal-light'
      : 'text-[#718096] dark:text-[#8b949e] font-normal hover:text-[#4A5568] dark:hover:text-gray-300'
  }`;
}

export default function Results() {
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryFromUrl = searchParams.get('q') || '';
  const activeView = searchParams.get('view') || 'representatives';
  // ADR-0001: arrived here from a city-level (locality) search, so results are the
  // whole city, not a specific parcel — show the precision banner.
  const fromLocality = searchParams.get('from_locality') === '1';
  const localityLabel = searchParams.get('browse_label') || '';

  // Search mode: 'address' | 'browse' | 'coordinate' (SRCH-05 — coordinate results
  // reuse the same browseResults/browseLoading direct-injection mechanism as 'browse').
  const [searchMode, setSearchMode] = useState('address');
  // Coordinate 422 message rendered inline in the LocationCombobox's errorRow slot (D-08).
  const [coordError, setCoordError] = useState('');
  // Browse results injected directly into the list
  const [browseResults, setBrowseResults] = useState(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  // Currently-browsed area (geo_id + mtfcc), captured from URL shortcut params.
  // Used to drive elections-by-area fetch.
  const [browseArea, setBrowseArea] = useState(() => {
    const g = searchParams.get('browse_geo_id');
    const m = searchParams.get('browse_mtfcc');
    return g && m ? { geo_id: g, mtfcc: m } : null;
  });

  // Address bar state
  const [addressInput, setAddressInput] = useState(
    queryFromUrl ? decodeURIComponent(queryFromUrl) : ''
  );
  // Search counter — incrementing this forces usePoliticianData to re-fetch
  // even when the query text hasn't changed (re-search same location edge case)
  const [searchKey, setSearchKey] = useState(0);

  // Prefill from cross-subdomain ev-context on mount when no URL query is present.
  // Lets a user who entered their address on read-rank/etc. land on essentials with
  // it already typed in, and vice versa. Empty/typed input wins over the prefill.
  // Also bail when the URL is a browse-by-area shortcut (e.g. ?browse_geo_id=...) —
  // the user explicitly chose a county/area and shouldn't see a stale address bleed in.
  useEffect(() => {
    if (queryFromUrl) return;
    if (addressInput.trim().length > 0) return;
    if (searchParams.get('browse_geo_id')) return;
    if (searchParams.get('browse_government_list')) return;
    if (searchParams.get('browse_state_officials')) return;
    if (searchParams.get('browse_federal_officials')) return;
    let cancelled = false;
    loadUserAddressFromContext().then((stored) => {
      if (cancelled || !stored?.addr) return;
      setAddressInput(toAddressTitleCase(stored.addr));
    });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mainRef = useRef(null);

  // Detect desktop breakpoint for two-panel layout
  const isDesktop = useMediaQuery('(min-width: 769px)');
  // Card grid breakpoints: 3 cols on big screens, 2 on medium, 1 below
  const isWideForVertical = useMediaQuery('(min-width: 1080px)');
  const isWideForThree = useMediaQuery('(min-width: 1500px)');

  // Attempt sessionStorage restore for back-navigation
  const [cachedResult, setCachedResult] = useState(() => {
    if (!queryFromUrl) return null;
    try {
      const cached = sessionStorage.getItem('ev:results');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.query === queryFromUrl && Date.now() - parsed.timestamp < 600000) {
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return null;
  });

  // Wire up the hook with sessionStorage gating
  // searchKey forces re-fetch even when the query text is unchanged (same-location re-search)
  const activeQuery = queryFromUrl;
  const {
    data: hookData,
    phase: hookPhase,
    error,
    formattedAddress,
    tribalLand,
  } = usePoliticianData(activeQuery, {
    enabled: !!activeQuery && !cachedResult,
    initialData: [],
    key: searchKey,
  });

  // Sync backend-validated formatted address into address bar (normalized to title case)
  // Also persist to cross-app localStorage bridge so Compass can pre-select user's state (G-114-011)
  useEffect(() => {
    if (formattedAddress) {
      setAddressInput(toAddressTitleCase(formattedAddress));
      // Parse state from formatted address — Census Geocoder format: "200 W KIRKWOOD AVE, BLOOMINGTON, IN, 47404"
      // Comma-separated segments; find the 2-letter uppercase state code segment.
      const segments = formattedAddress.split(',').map((s) => s.trim());
      const stateSeg = segments.find((s) => /^[A-Z]{2}$/.test(s));
      if (stateSeg) saveUserAddress(formattedAddress, stateSeg);
    }
  }, [formattedAddress]);

  // Derive actual data and phase from cache, hook, or browse results.
  // In browse mode ALWAYS use browseResults (never fall back to address hookData /
  // cache): an empty/unseeded browse must show "no results", not bleed the prior
  // address search's officials through (e.g. a stale Los Angeles list surfacing
  // under a Nevada browse). browseResults is null only while loading.
  const list = (searchMode === 'browse' || searchMode === 'coordinate')
    ? (browseResults || [])
    : (cachedResult ? cachedResult.list : hookData);
  const phase = (searchMode === 'browse' || searchMode === 'coordinate')
    ? (browseLoading ? 'loading' : (browseResults ? 'fresh' : 'idle'))
    : (cachedResult ? 'fresh' : hookPhase);

  // Compass mode toggle — persisted across sessions; off by default for dense view
  const [compassMode, setCompassMode] = useState(() => {
    try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
  });
  const handleCompassModeChange = (val) => {
    track('essentials_compass_mode_toggled', { enabled: val });
    setCompassMode(val);
    try { localStorage.setItem('ev:compassMode', val ? 'true' : 'false'); } catch {}
    if (val) enableCompass();
  };
  // Elections tab data
  const [electionsData, setElectionsData] = useState(null);
  const [electionsLoading, setElectionsLoading] = useState(false);
  const [voterInfo, setVoterInfo] = useState(null);
  const [voterInfoLoading, setVoterInfoLoading] = useState(false);

  // Treasury CTA — one-shot fetch of available municipalities on mount
  const [treasuryCities, setTreasuryCities] = useState([]);
  useEffect(() => { fetchTreasuryCities().then(setTreasuryCities); }, []);
  const [triviaCollections, setTriviaCollections] = useState([]);
  useEffect(() => { fetchTriviaCollections().then(setTriviaCollections); }, []);

  // Compass integration — context provides politician IDs with stances + user data
  const { isLoggedIn, userId, politicianIdsWithStances, allTopics, userAnswers: rawUserAnswers, selectedTopics, userJurisdiction, myRepresentatives, myRepresentativesAddress, compassLoading, suggestedSaveAddress, dismissSuggestedSaveAddress, invertedSpokes, batchInvertSpokes, activeLensKey, setActiveLens, lenses, isLensCalibrated, enableCompass } = useCompass();

  // Per-tab compass-lens memory (Req CMP-02, D-02): in-memory only, never
  // localStorage-persisted, never seeded with defaults — resolveTabLens falls
  // back to TAB_DEFAULTS/'custom' for any tab with no explicit remembered pick.
  const [tabLensMemory, setTabLensMemory] = useState({});

  // Auto-enable compass for calibrated users who haven't set an explicit preference
  useEffect(() => {
    if (!rawUserAnswers || rawUserAnswers.length < 3) return;
    try {
      if (localStorage.getItem('ev:compassMode') === null) {
        setCompassMode(true);
        localStorage.setItem('ev:compassMode', 'true');
      }
    } catch {}
  }, [rawUserAnswers]);

  const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';

  // Global lens switcher (Req 5/8): a synthesized "Best Match" chip (internal key
  // 'custom', D-05/D-07) prepended to the API-hydrated lenses, each annotated with
  // its own calibration state + topic count for LensChipRow. Replaces the retired
  // per-office auto-lensing — explicit selection now applies to every card.
  const augmentedLenses = useMemo(() => {
    const custom = {
      key: 'custom',
      name: 'Best Match',
      color: '#FF5740',
      calibrated: (rawUserAnswers?.length ?? 0) >= 3,
      topicCount: 0,
    };
    const named = (lenses || []).map((lens) => ({
      ...lens,
      calibrated: isLensCalibrated(lens, rawUserAnswers),
      topicCount: Array.isArray(lens.topicIds) ? lens.topicIds.length : 0,
    }));
    return [custom, ...named];
  }, [lenses, rawUserAnswers, isLensCalibrated]);

  const handleSelectLens = (key) => {
    track('essentials_compass_lens_selected', { lens: key, tab: effectiveActiveView });
    // D-04: record the explicit pick into the active tab's memory slot BEFORE
    // applying it — this re-fires the tab-entry effect below with the same
    // resolved key, a benign idempotent no-op (Pattern 2), not a loop.
    setTabLensMemory((prev) => ({ ...prev, [effectiveActiveView]: key }));
    setActiveLens(key);
  };

  const handleCalibrateLens = (key) => {
    const returnUrl = window.location.href;
    saveLensPending(key);
    window.location.assign(`${COMPASS_URL}/?calibrate=${encodeURIComponent(key)}&return=${encodeURIComponent(returnUrl)}`);
  };

  // Resolve the active lens's topic set for the grid: 'custom' means no explicit
  // lens is selected, so every card falls back to the Best Match overlap (Req 8).
  const activeLens = activeLensKey === 'custom' ? null : lenses.find((l) => l.key === activeLensKey);
  const activeLensTopicIds = activeLens ? activeLens.topicIds : null;

  // Auto-apply Stance Max the first time user crosses the 3-answer threshold
  const prevAnswerCountRef = useRef(0);
  useEffect(() => {
    const count = rawUserAnswers?.length ?? 0;
    const prev = prevAnswerCountRef.current;
    prevAnswerCountRef.current = count;
    if (prev < 3 && count >= 3) {
      const hasAnyInversion = Object.values(invertedSpokes || {}).some(Boolean);
      if (!hasAnyInversion && allTopics) {
        const newMap = computeStanceSpokes('max', rawUserAnswers, allTopics, invertedSpokes || {});
        batchInvertSpokes(newMap);
      }
    }
  }, [rawUserAnswers, invertedSpokes, allTopics, batchInvertSpokes]);

  const handleStanceMax = () => {
    if (!rawUserAnswers || !allTopics) return;
    track('essentials_stance_alignment_set', { alignment: 'max' });
    const newMap = computeStanceSpokes('max', rawUserAnswers, allTopics, invertedSpokes || {});
    batchInvertSpokes(newMap);
  };

  const handleStanceMin = () => {
    if (!rawUserAnswers || !allTopics) return;
    track('essentials_stance_alignment_set', { alignment: 'min' });
    const newMap = computeStanceSpokes('min', rawUserAnswers, allTopics, invertedSpokes || {});
    batchInvertSpokes(newMap);
  };

  // 260426-mw6 — guest → authed promotion. Two banners:
  //   1) compass: when API has zero answers but ev-context has guest answers.
  //   2) address: when no saved address but ev-context has a guest address.
  // Hook decides shouldPrompt; we just render the banner when true.
  const compassPromoteWriter = async (compassPayload) => {
    const ans = (compassPayload && (compassPayload.answers || compassPayload.a)) || {};
    const inv = (compassPayload && (compassPayload.invertedSpokes || compassPayload.i)) || {};
    const writeIns = (compassPayload && (compassPayload.writeIns || compassPayload.w)) || {};
    const titleToId = new Map((allTopics || []).map((t) => [t.short_title, t.id]));
    for (const [shortTitle, value] of Object.entries(ans)) {
      const topic_id = titleToId.get(shortTitle);
      if (!topic_id) continue;
      const numeric = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numeric) || numeric <= 0) continue;
      const body = { topic_id, value: numeric, inverted: !!inv[shortTitle] };
      if (typeof writeIns[shortTitle] === 'string' && writeIns[shortTitle].length > 0) {
        body.write_in_text = writeIns[shortTitle];
      }
      const res = await apiFetch('/compass/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res || !res.ok) {
        throw new Error(`Failed to save answer for ${shortTitle} (${res?.status ?? 'no response'})`);
      }
    }
  };
  const {
    shouldPrompt: promoteCompassShouldPrompt,
    payload: promoteCompassPayload,
    promote: promoteCompass,
    dismiss: dismissCompassPromotion,
    status: promoteCompassStatus,
    error: promoteCompassError,
  } = useEvContextPromotion({
    domain: 'compass',
    isLoggedIn,
    userId,
    apiData: rawUserAnswers, // empty array when API has nothing
    apiWriter: compassPromoteWriter,
  });

  const addressPromoteWriter = async (addressPayload) => {
    const addr = addressPayload && (addressPayload.formatted || addressPayload.addr);
    if (!addr) throw new Error('Missing address');
    const result = await saveMyLocation(addr);
    if (!result) throw new Error('Failed to save address');
    // Mirror through saveUserAddress for legacy cookie + ev-context guest slice.
    const state = (addressPayload && addressPayload.state)
      || (typeof addr === 'string' ? (addr.match(/\b([A-Z]{2})\b\s*\d{5}/) || [])[1] : null);
    if (state) saveUserAddress(addr, state, userId);
  };
  const {
    shouldPrompt: promoteAddressShouldPrompt,
    payload: promoteAddressPayload,
    promote: promoteAddress,
    dismiss: dismissAddressPromotion,
    status: promoteAddressStatus,
    error: promoteAddressError,
  } = useEvContextPromotion({
    domain: 'address',
    isLoggedIn,
    userId,
    apiData: myRepresentativesAddress, // string when API has it; null otherwise
    apiWriter: addressPromoteWriter,
  });
  // Enrich answers with topic objects (CompassCardVertical needs topic.short_title)
  const userAnswers = useMemo(() => (rawUserAnswers || []).map(a => {
    if (a.topic?.short_title) return a;
    const topic = allTopics.find(t => t.id === a.topic_id);
    return topic ? { ...a, topic } : a;
  }), [rawUserAnswers, allTopics]);
  // Filter answers by selectedTopics — when the user removes a spoke in CompassV2,
  // selectedTopics is updated but the answer value is preserved. Only show answers
  // for topics that are still selected. When selectedTopics is empty (no filtering),
  // show all answers to preserve existing behavior.
  const filteredAnswers = useMemo(() => {
    if (!selectedTopics || selectedTopics.length === 0) return userAnswers;
    return userAnswers.filter(a =>
      selectedTopics.includes(a.topic_id) || selectedTopics.includes(String(a.topic_id))
    );
  }, [userAnswers, selectedTopics]);
  const [savingSuggested, setSavingSuggested] = useState(false);

  // Prefilled mode: Connected user with saved location — use representatives from context (loaded at login)
  const isPrefilled = searchParams.get('prefilled') === 'true';
  useEffect(() => {
    if (!isPrefilled || compassLoading) return;
    if (myRepresentatives && myRepresentatives.length > 0) {
      setSearchMode('browse');
      setBrowseResults(myRepresentatives);
      const label = myRepresentativesAddress
        || userJurisdiction?.county_name
        || userJurisdiction?.congressional_district_name
        || 'Your area';
      setAddressInput(label);
    }
  }, [isPrefilled, compassLoading, myRepresentatives, myRepresentativesAddress, userJurisdiction]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save location for Connected users: fires only when no location is on file yet.
  // Do NOT fire when the user already has a saved location — require explicit user action to update.
  // Prevents automated tools (e.g. Playwright) or repeated searches from silently overwriting
  // stored coordinates with a different address.
  const savedAddressRef = useRef(null);
  useEffect(() => {
    if (!isLoggedIn || !formattedAddress || phase !== 'fresh' || searchMode === 'browse' || searchMode === 'coordinate') return;
    if (compassLoading || (myRepresentatives && myRepresentatives.length > 0)) return; // location already on file
    if (savedAddressRef.current === formattedAddress) return;
    savedAddressRef.current = formattedAddress;
    saveMyLocation(activeQuery).catch(() => {});
  }, [isLoggedIn, formattedAddress, phase, activeQuery, searchMode, compassLoading, myRepresentatives]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active compass preview state: { id, name, anchorEl } or null

  // Save results to sessionStorage for back-navigation restoration
  useEffect(() => {
    if (list.length > 0 && phase === 'fresh') {
      if (queryFromUrl) {
        sessionStorage.setItem('ev:results', JSON.stringify({
          query: queryFromUrl,
          list,
          timestamp: Date.now(),
        }));
      }
    }
  }, [list, phase, queryFromUrl]);

  // Restore scroll position when returning from a profile page
  useEffect(() => {
    if (!cachedResult) return;
    const saved = sessionStorage.getItem('ev:scrollTop');
    if (!saved) return;
    const scrollTop = parseInt(saved, 10);
    sessionStorage.removeItem('ev:scrollTop');
    // Wait a tick for the DOM to render cached results
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollTop);
    });
  }, [cachedResult, isDesktop]);

  // Eager-fetch elections when search completes (not lazily on tab click)
  // Branches on searchMode: address mode hits /elections-by-address, browse mode
  // hits /browse/elections-by-area using the current browseArea (geo_id + mtfcc).
  useEffect(() => {
    let cancelled = false;
    setElectionsData(null);

    if (searchMode === 'browse') {
      const rawGovList = searchParams.get('browse_government_list');
      if (rawGovList) {
        const ids = rawGovList.split(',').map((s) => s.trim()).filter(Boolean);
        if (ids.length > 0) {
          setElectionsLoading(true);
          fetchElectionsByGovernmentList(ids).then((data) => {
            if (!cancelled) {
              setElectionsData(data.elections || []);
              setElectionsLoading(false);
            }
          }).catch(() => { if (!cancelled) setElectionsLoading(false); });
          return;
        }
      }
      const geoId = browseArea?.geo_id || searchParams.get('browse_geo_id');
      const mtfcc = browseArea?.mtfcc || searchParams.get('browse_mtfcc');
      if (!geoId || !mtfcc) {
        // Prefilled mode: user is logged in with saved location but no browse area params.
        // Fall back to the auth-aware /elections/me endpoint.
        if (isPrefilled) {
          setElectionsLoading(true);
          fetchMyElections().then((data) => {
            if (!cancelled) {
              setElectionsData(data.elections || []);
              setElectionsLoading(false);
            }
          }).catch(() => { if (!cancelled) setElectionsLoading(false); });
        }
        return;
      }
      setElectionsLoading(true);
      fetchElectionsByArea(geoId, mtfcc).then((data) => {
        if (!cancelled) {
          setElectionsData(data.elections || []);
          setElectionsLoading(false);
        }
      }).catch(() => { if (!cancelled) setElectionsLoading(false); });
    } else {
      if (!activeQuery) return;
      setElectionsLoading(true);
      fetchElectionsByAddress(decodeURIComponent(activeQuery)).then((data) => {
        if (!cancelled) {
          setElectionsData(data.elections || []);
          setElectionsLoading(false);
        }
      }).catch(() => { if (!cancelled) setElectionsLoading(false); });
    }

    return () => { cancelled = true; };
  }, [activeQuery, searchMode, browseArea?.geo_id, browseArea?.mtfcc, isPrefilled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?mode=browse from Landing page "Browse by location" link (per D-05)
  useEffect(() => {
    if (searchParams.get('mode') === 'browse') {
      setSearchMode('browse');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?browse_government_list shortcut (e.g. Collin County TX) —
  // queries politicians directly by government geo_id list, bypassing geofences.
  useEffect(() => {
    const raw = searchParams.get('browse_government_list');
    const label = searchParams.get('browse_label');
    if (!raw) return;

    const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return;

    const browseState = searchParams.get('browse_state') ?? undefined;
    const browseCountyGeoId = searchParams.get('browse_county_geo_id') || undefined;
    const skipOverlap = searchParams.get('browse_skip_overlap') === '1';

    setSearchMode('browse');
    setBrowseLoading(true);
    if (label) setAddressInput(decodeURIComponent(label));

    browseByGovernmentList(ids, browseState, { countyGeoId: browseCountyGeoId, skipOverlap }).then(({ data, error }) => {
      if (error) console.error('browse government list error:', error);
      setBrowseResults(data);
      setBrowseLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?browse_geo_id + ?browse_mtfcc shortcut buttons (e.g. LA County)
  // Calls browse-by-area directly rather than geocoding an address.
  // Optional filters:
  //   browse_city_filter  — for LOCAL/LOCAL_EXEC, keep only where government_name includes this string
  //   browse_school_filter — for SCHOOL, keep only where government_name includes this string
  useEffect(() => {
    const geoId = searchParams.get('browse_geo_id');
    const mtfcc = searchParams.get('browse_mtfcc');
    const label = searchParams.get('browse_label');
    const cityFilter = searchParams.get('browse_city_filter');
    const schoolFilter = searchParams.get('browse_school_filter');
    if (!geoId || !mtfcc) return;

    setSearchMode('browse');
    setBrowseLoading(true);
    setBrowseArea({ geo_id: geoId, mtfcc });
    if (label) setAddressInput(decodeURIComponent(label));

    browseByArea(geoId, mtfcc).then(({ data, error }) => {
      if (error) console.error('browse shortcut error:', error);
      let filtered = data;
      if (cityFilter || schoolFilter) {
        const cityLower = cityFilter?.toLowerCase();
        const schoolLower = schoolFilter?.toLowerCase();
        filtered = data.filter((pol) => {
          const dt = pol.district_type || '';
          // Check both government_name and government_body_name — one may be empty
          const combinedLower = `${pol.government_name || ''} ${pol.government_body_name || ''}`.toLowerCase().trim();
          if (dt === 'LOCAL' || dt === 'LOCAL_EXEC') {
            // No name data — let it through rather than hide valid officials
            if (!combinedLower) return true;
            return cityLower ? combinedLower.includes(cityLower) : true;
          }
          if (dt === 'SCHOOL') {
            if (!combinedLower) return true;
            return schoolLower ? combinedLower.includes(schoolLower) : true;
          }
          return true;
        });
      }
      setBrowseResults(filtered);
      setBrowseLoading(false);
    });
    // Keyed on the browse-target param VALUES (not the searchParams object, which
    // changes on every tab switch) so selecting a new candidate from the in-page
    // combobox (Results→Results navigation, no remount) actually re-fetches instead
    // of leaving the prior location's officials on screen (214 combobox re-search).
  }, [
    searchParams.get('browse_geo_id'),
    searchParams.get('browse_mtfcc'),
    searchParams.get('browse_label'),
    searchParams.get('browse_city_filter'),
    searchParams.get('browse_school_filter'),
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?browse_state_officials=CA — statewide officials (executives + US
  // Senators + federal). The "browse a state" entry point from the typeahead.
  useEffect(() => {
    const stateAbbrev = searchParams.get('browse_state_officials');
    const label = searchParams.get('browse_label');
    if (!stateAbbrev) return;

    setSearchMode('browse');
    setBrowseLoading(true);
    if (label) setAddressInput(decodeURIComponent(label));

    browseByState(stateAbbrev).then(({ data, error }) => {
      if (error) console.error('browse state error:', error);
      setBrowseResults(data);
      setBrowseLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?browse_federal_officials=1 — all federal-tier officials nationally
  // (US Senate/House, President/VP/Cabinet/agencies, federal judiciary). The
  // "browse the United States" entry point; Treasury Tracker's federal deep-link
  // target (phase-125 coverage contract). No state — the Federal banner leads.
  useEffect(() => {
    if (searchParams.get('browse_federal_officials') !== '1') return;
    const label = searchParams.get('browse_label');

    setSearchMode('browse');
    setBrowseLoading(true);
    if (label) setAddressInput(decodeURIComponent(label));

    browseFederalOfficials().then(({ data, error }) => {
      if (error) console.error('browse federal error:', error);
      setBrowseResults(data);
      setBrowseLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle ?lat + ?lng + ?coord_raw — the Plan 02 coordinateRoute Landing->Results
  // coordinate hand-off contract (SRCH-05). Reads once on mount and resolves through
  // the SAME shared resolveCoordinate the in-page combobox submit uses below — no
  // duplicated lookup/injection/label logic. Runs once per mount ([] deps, mirroring
  // every other browse_* on-mount reader above) so a stale coordinate is never
  // re-resolved once the user starts editing the field.
  useEffect(() => {
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    if (!latParam || !lngParam) return;
    const lat = Number(latParam);
    const lng = Number(lngParam);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const coordRawParam = searchParams.get('coord_raw');
    const raw = coordRawParam ?? `${latParam}, ${lngParam}`;
    resolveCoordinate(lat, lng, raw, { method: 'url_handoff' });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchView = (view) => {
    track('essentials_tab_switched', { from: activeView, to: view });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (view === 'representatives') {
        next.delete('view');
      } else {
        next.set('view', view);
      }
      return next;
    });
  };

  const handleAddressSearch = async (overrideAddress) => {
    const isOverride = typeof overrideAddress === 'string';
    // LocationCombobox is fully controlled (value/onChange only, no imperative DOM
    // writes — RESEARCH Pitfall 2) — read the controlled addressInput state directly,
    // never a DOM ref. A candidate-select or coordinate submit passes an override.
    const addr = (isOverride ? overrideAddress : addressInput).trim();
    if (!addr) return;
    // Manual submit (not an autocomplete pick): apply the ADR-0001 locality
    // fallback. A covered city/state/county routes to Browse-by-Location; a
    // street address (or anything unclassifiable) falls through to normal search.
    if (!isOverride) {
      try {
        const route = await resolveLocalityRoute(addr);
        if (route.kind !== 'address') { navigate(route.to); return; }
      } catch { /* fall through to address search */ }
    }
    setCachedResult(null);
    sessionStorage.removeItem('ev:results');
    setSearchKey(k => k + 1);
    // Switching to address search clears any prior browse-by-area / coordinate
    // state so the URL doesn't end up with both ?browse_geo_id=... and ?q=...
    setBrowseResults(null);
    setCoordError('');
    setSearchMode('address');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('q', addr);
      next.delete('browse_geo_id');
      next.delete('browse_mtfcc');
      next.delete('browse_label');
      next.delete('browse_city_filter');
      next.delete('browse_school_filter');
      next.delete('from_locality');
      next.delete('lat');
      next.delete('lng');
      next.delete('coord_raw');
      return next;
    });
  };

  // Shared coordinate resolution path (SRCH-05) — BOTH the in-page LocationCombobox
  // onSubmitCoordinate callback (below) AND the on-mount lat/lng/coord_raw URL reader
  // (above) call this SAME function; no duplicated lookup/injection/label logic.
  // Coordinate results reuse the browseResults/browseLoading direct-injection state —
  // the same mechanism 'browse' mode uses to render a list without the
  // address-geocode hook — since a raw point has no geo_id to browse-by-area with.
  async function resolveCoordinate(lat, lng, raw, { method = 'combobox' } = {}) {
    // D-05: capture the literal typed text BEFORE the fetch — the resting label and
    // the banner label-of-record derive from this, never from the server response
    // (Phase 213 deliberately never echoes the coordinate back in matchedAddress).
    const label = (raw != null && raw !== '') ? raw : `${lat}, ${lng}`;
    setCoordError('');
    setCachedResult(null);
    sessionStorage.removeItem('ev:results');
    setSearchMode('coordinate');
    setAddressInput(label);
    setBrowseLoading(true);
    setBrowseResults(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      // No geo_id for a raw point — clear any conflicting address/browse/hand-off
      // params so they don't leak into this location.
      next.delete('q');
      next.delete('browse_geo_id');
      next.delete('browse_mtfcc');
      next.delete('browse_label');
      next.delete('browse_government_list');
      next.delete('browse_state_officials');
      next.delete('browse_federal_officials');
      next.delete('from_locality');
      next.delete('lat');
      next.delete('lng');
      next.delete('coord_raw');
      return next;
    }, { replace: true });

    // T-214-02: capture method/outcome (+ the 422 code, an enum string) only — never
    // the raw {lat, lng} pair, on either entry point.
    const { data, error, code } = await lookupCoordinate(lat, lng);
    setBrowseLoading(false);

    if (error) {
      track('essentials_coordinate_searched', { method, outcome: 'error', code: code || 'unknown' });
      setCoordError(COORDINATE_ERROR_MESSAGES[code] || COORDINATE_ERROR_MESSAGES.INVALID_COORDINATES);
      setBrowseResults(null);
      return;
    }

    track('essentials_coordinate_searched', { method, outcome: 'success' });
    setBrowseResults(data);
  }

  // Filter and classify (no longer filtering VACANT names — vacant offices come via is_vacant flag)
  // No name-search anymore (SRCH-07) — filteredPols reads the raw list directly.
  const filteredPols = list;

  // Per-politician stances cache for CompassCardVertical comparison overlay (compass mode only)
  const [stancesByPolId, setStancesByPolId] = useState({});

  // Reset the per-politician stance cache whenever the location changes. Without
  // this, stancesByPolId accumulated every politician's stances across every
  // location click and never evicted — 250+ entries after a handful of browses —
  // which is what made the app get progressively slower over a session.
  const locationKey = `${searchMode}|${activeQuery || ''}|${browseArea?.geo_id || ''}|${browseArea?.mtfcc || ''}|${searchMode === 'coordinate' ? addressInput : ''}`;
  useEffect(() => {
    setStancesByPolId({});
  }, [locationKey]);

  useEffect(() => {
    if (!compassMode) return;
    if (!filteredPols || filteredPols.length === 0 || allTopics.length === 0) return;
    const topicById = new Map(allTopics.map(t => [t.id, t]));
    const targets = filteredPols.filter(p => politicianIdsWithStances.has(String(p.id)) && !stancesByPolId[p.id]);
    if (targets.length === 0) return;
    let cancelled = false;

    // Fetch in bounded batches instead of firing one request per politician all
    // at once. A dense area (LA County, Las Vegas) could queue 50+ parallel
    // /answers requests; the browser caps concurrency per origin and the old
    // single Promise.all only rendered after the slowest of all 50 resolved.
    // Batching commits results per wave, so cards fill in progressively.
    const BATCH_SIZE = 6;
    (async () => {
      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const slice = targets.slice(i, i + BATCH_SIZE);
        const pairs = await Promise.all(
          slice.map(p =>
            fetchPoliticianAnswers(p.id)
              .then(rows => {
                const map = {};
                for (const r of rows) {
                  const t = topicById.get(r.topic_id);
                  if (t?.short_title) map[t.short_title] = r.value ?? 0;
                }
                return [p.id, map];
              })
              .catch(() => [p.id, {}])
          )
        );
        if (cancelled) return;
        setStancesByPolId(prev => {
          const next = { ...prev };
          for (const [id, m] of pairs) next[id] = m;
          return next;
        });
      }
    })();

    return () => { cancelled = true; };
  }, [compassMode, filteredPols, allTopics, politicianIdsWithStances]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compass controls rendered INLINE in the tab row's right slot (where the
  // Compass toggle used to live) so toggling Compass never shifts the page.
  // The lens chips show whether or not the user has calibrated — clicking an
  // un-calibrated lens opens a "calibrate these N topics?" confirmation dialog
  // (LensChipRow). The old below-tabs "Set your stances" CTA banner is retired.
  const compassControls = !compassMode ? null : (
    <CompassControlsBar
      inline
      userAnswers={rawUserAnswers}
      lenses={augmentedLenses}
      activeLensKey={activeLensKey}
      onSelectLens={handleSelectLens}
      onCalibrate={handleCalibrateLens}
      onStanceMin={handleStanceMin}
      onStanceMax={handleStanceMax}
      isDesktop={isDesktop}
    />
  );

  // Derive representing city for building image selection — uses unfiltered list
  // so the building image doesn't disappear when search filter narrows the grid.
  const representingCity = useMemo(() => {
    // In browse mode the browsed area label is authoritative for the city banner.
    // Deriving the city from politician records can surface a neighboring city
    // when districts overlap (e.g. a Culver City browse showing "Inglewood"
    // because an overlapping district's official has representing_city set).
    if (searchMode === 'browse') {
      const label = searchParams.get('browse_label');
      if (label && label.trim()) return label.trim();
    }
    // Coordinate-mode guard (T-214-06 / RESEARCH Pitfall 3): a raw lat/lng has no
    // resolved place name — the server never echoes an address (D-05) — so there is
    // no trustworthy label-of-record to derive here. Return null explicitly rather
    // than falling through to the "derive from politician records" branches below,
    // which can surface a neighboring jurisdiction's stray representing_city for a
    // boundary-straddling point (the same hijack the 'browse' branch above guards
    // against).
    if (searchMode === 'coordinate') {
      return null;
    }
    const src = Array.isArray(list) ? list : [];
    // Only local-government officials may set the local city banner. A statewide or
    // federal office (NATIONAL_* / STATE_*) can carry a stray representing_city — e.g. a
    // U.S. Senator whose office was tagged with a city from an old city-council record —
    // and, because it is returned for every address in the state, would otherwise hijack
    // the banner wherever the real local officials have no representing_city (a Riverside
    // County address rendering under an "Inglewood" banner via Sen. Padilla's office).
    for (const p of src) {
      const dt = p?.district_type || '';
      if (dt.startsWith('NATIONAL') || dt.startsWith('STATE')) continue;
      if (p.representing_city) return p.representing_city;
    }
    // Fallback 1: extract city name from local politicians' chamber_name.
    // Handles "Bloomington City Council" and "City of Bloomington".
    for (const p of src) {
      const dt = p?.district_type || '';
      if (dt === 'LOCAL' && p.chamber_name) {
        const beforeCity = p.chamber_name.match(/^(\w[\w\s]+?)\s+City\b/);
        if (beforeCity) return beforeCity[1];
        const cityOf = p.chamber_name.match(/^City of\s+(.+)$/i);
        if (cityOf) return cityOf[1].trim();
      }
    }
    // Fallback 2: parse the city out of the typed address ("…, Bloomington, IN 47404").
    // Reliable for address searches where politician data lacks representing_city.
    const fromAddress = parseCityFromAddress(addressInput);
    if (fromAddress) return fromAddress;
    return null;
  }, [list, addressInput, searchMode, searchParams]);

  // Extract state abbreviation from the address string
  // Handles "Orem, UT 84057" and "South Dakota, USA"
  const userState = useMemo(() => {
    const fromAddr = parseStateFromAddress(addressInput);
    if (fromAddr) return fromAddr;
    // In geo browse mode the geo_id's FIPS prefix is authoritative for the state,
    // so a stale/contradictory browse_state can never mislabel real officials
    // (e.g. Newsom shown as "Missouri"). Geo wins over the raw param.
    const fromGeo = stateAbbrevFromGeoId(searchParams.get('browse_geo_id'));
    if (fromGeo) return fromGeo;
    // Government-list browse has no browse_geo_id, but each government id's FIPS
    // prefix is just as authoritative (e.g. '3231900' -> NV). Use it before the
    // raw browse_state param so the geography — not a stale param — wins here too.
    // WR-03 defensive guard: only trust the derived state when EVERY id in the
    // list shares the same FIPS prefix. A multi-state government-list browse (not
    // observed today — all curated browses are single-state) must not silently
    // tether the State/Local Treasury chip to just the first id's state; when the
    // ids diverge, fall through so userState stays null/undefined and the tether
    // chip is omitted (TETH-03 graceful degradation) rather than pointing at the
    // wrong state for governments later in the list.
    const govList = searchParams.get('browse_government_list');
    if (govList) {
      const govIds = govList.split(',').map((s) => s.trim()).filter(Boolean);
      const govStates = new Set(govIds.map((id) => stateAbbrevFromGeoId(id)).filter(Boolean));
      if (govStates.size === 1) {
        return [...govStates][0];
      }
    }
    // Otherwise derive the state from the browse params so the State banner
    // shows e.g. "California" instead of "Your State".
    const browseState = searchParams.get('browse_state_officials')
      || searchParams.get('browse_state');
    if (browseState && /^[A-Za-z]{2}$/.test(browseState)) {
      return browseState.toUpperCase();
    }
    return null;
  }, [addressInput, searchParams]);

  const buildingImageMap = useMemo(
    () => getBuildingImages(representingCity, userState),
    [representingCity, userState]
  );

  const featureIconMap = useMemo(
    () => resolveFeatureIcons({
      representingCity,
      userState,
      stateName: userState ? (STATE_NAMES[userState] || null) : null,
      treasuryCities,
      triviaCollections,
    }),
    [representingCity, userState, treasuryCities, triviaCollections]
  );

  const populationMap = useMemo(() => {
    const cityPop = resolvePopulation({
      tier: 'city',
      geoId: searchParams.get('browse_geo_id'),
      city: representingCity,
      stateAbbrev: userState,
    });
    const statePop = resolvePopulation({ tier: 'state', stateAbbrev: userState });
    const federalPop = resolvePopulation({ tier: 'federal' });
    return {
      Local: cityPop != null ? { label: 'POPULATION', value: cityPop } : null,
      State: statePop != null ? { label: 'POPULATION', value: statePop } : null,
      Federal: federalPop != null ? { label: 'POPULATION', value: federalPop } : null,
    };
  }, [representingCity, userState, searchParams]);

  const bannerCtx = useMemo(
    () => ({
      representingCity,
      userState,
      stateNames: STATE_NAMES,
      buildingImageMap,
      featureIconMap,
      populationMap,
    }),
    [representingCity, userState, buildingImageMap, featureIconMap, populationMap]
  );

  // Only show the nearest upcoming election; hiding future elections avoids duplicate
  // race sections when a primary and general are both returned for the same seat.
  const nearestElection = useMemo(() => {
    if (!electionsData || electionsData.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sorted = [...electionsData]
      .filter((e) => e.election_date)
      .sort((a, b) => new Date(a.election_date) - new Date(b.election_date));
    const upcoming = sorted.filter((e) => new Date(e.election_date + 'T12:00:00') >= today);
    const nearest = upcoming.length > 0 ? upcoming[0] : sorted[sorted.length - 1];
    return nearest ? [nearest] : [];
  }, [electionsData]);

  const electionsLabelSuffix = useMemo(() => {
    if (!electionsData || electionsData.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sorted = [...electionsData]
      .filter((e) => e.election_date)
      .sort((a, b) => new Date(a.election_date) - new Date(b.election_date));
    const upcoming = sorted.filter((e) => new Date(e.election_date + 'T12:00:00') >= today);
    // Show the nearest upcoming election; fall back to most recent past election
    const next = upcoming.length > 0 ? upcoming[0] : sorted[sorted.length - 1];

    if (!next) return null;

    const stateName = userState ? (STATE_NAMES[userState] || '') : '';
    const typeRaw = next.election_type || '';
    const typeCap = typeRaw ? typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).toLowerCase() : '';
    const dateStr = new Date(next.election_date + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const parts = [stateName, typeCap].filter(Boolean).join(' ');
    if (!parts && !dateStr) return null;
    return `${parts} · ${dateStr}`;
  }, [electionsData, userState]);

  // Fetch voting locations + official sample-ballot links for the searched
  // address (any US state). The Civic proxy returns nothing off-cycle, and the
  // card self-hides when there's no useful content.
  useEffect(() => {
    if (searchMode !== 'address' || !activeQuery) {
      setVoterInfo(null);
      return;
    }
    let cancelled = false;
    setVoterInfoLoading(true);
    fetchVoterInfo(decodeURIComponent(activeQuery))
      .then(({ voterInfo: vi }) => {
        if (!cancelled) {
          setVoterInfo(vi);
          setVoterInfoLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setVoterInfoLoading(false); });
    return () => { cancelled = true; };
  }, [searchMode, activeQuery]);

  const electionsDaysAway = useMemo(() => {
    if (!electionsData || electionsData.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the nearest election (upcoming first, then most recent past within 7 days)
    const sorted = [...electionsData]
      .filter((e) => e.election_date)
      .sort((a, b) => new Date(a.election_date) - new Date(b.election_date));

    const upcoming = sorted.filter((e) => new Date(e.election_date + 'T12:00:00') >= today);
    const nearest = upcoming.length > 0 ? upcoming[0] : sorted[sorted.length - 1];
    if (!nearest) return null;

    const target = new Date(nearest.election_date + 'T12:00:00');
    target.setHours(0, 0, 0, 0);
    const days = Math.round((target - today) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days > 1) return `${days} days away`;
    if (days >= -7) return days === -1 ? 'Yesterday' : `${Math.abs(days)} days ago`;
    return null; // badge hidden for elections older than a week
  }, [electionsData]);

  // Filter federal politicians: only show senators/reps from user's state
  const federalFiltered = useMemo(() => {
    if (!userState) return filteredPols;
    return filteredPols.filter((p) => {
      const dt = p?.district_type;
      if (!dt?.includes('NATIONAL')) return true;
      if (dt === 'NATIONAL_EXEC') return true;
      if (dt === 'NATIONAL_UPPER' || dt === 'NATIONAL_LOWER') {
        return p.representing_state?.toUpperCase() === userState;
      }
      return true;
    });
  }, [filteredPols, userState]);

  const deduped = useMemo(() => {
    const seen = new Set();
    return federalFiltered.filter((pol) => {
      const key = `${pol.first_name}-${pol.last_name}-${pol.office_title}-${pol.government_body_name || ''}-${pol.is_vacant || false}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [federalFiltered]);

  // Phase 208 (TAB-01/TAB-02): partition deduped into three buckets via
  // classifyBucket (Phase 207, src/lib/classify.js) — the single source of
  // truth for tab routing. This is the ONLY place classifyBucket is called;
  // never add a parallel keyword check here or elsewhere (207-D-06/208-D-06 —
  // tab membership must not drift from list grouping).
  const bucketed = useMemo(() => {
    const buckets = { representative: [], educator: [], judge: [] };
    for (const pol of deduped) {
      buckets[classifyBucket(pol)].push(pol);
    }
    // 208-02 operator punch-list: the U.S. Supreme Court (Federal Judiciary)
    // exists for EVERY location, so it must not by itself summon a Judges tab.
    // Require a non-federal (state/local) judge to warrant the tab. When the
    // only judges are federal, fold them back into Representatives — their
    // pre-208 home under Federal → Federal Judiciary — so SCOTUS still renders
    // but the Judges tab stays hidden. When state/local judges DO exist, the
    // tab shows and keeps the federal judges alongside them.
    const hasNonFederalJudge = buckets.judge.some(
      (pol) => classifyCategory(pol).tier !== 'Federal'
    );
    if (!hasNonFederalJudge && buckets.judge.length > 0) {
      buckets.representative.push(...buckets.judge);
      buckets.judge = [];
    }
    return buckets;
  }, [deduped]);

  const hierarchy = useMemo(
    () => groupIntoHierarchy(bucketed.representative),
    [bucketed]
  );
  const educatorsHierarchy = useMemo(
    () => groupIntoHierarchy(bucketed.educator),
    [bucketed]
  );
  const judgesHierarchy = useMemo(
    () => groupIntoHierarchy(bucketed.judge),
    [bucketed]
  );

  // D-11: the elected/appointed ("All types") filter layer, generalized into a
  // reusable helper so it can be applied per-bucket without triplicating the
  // map/filter body. matchesAppointedFilter (below) is reused unchanged.
  function applyAppointedFilter(hier, filter) {
    if (filter === 'All') return hier;

    return hier
      .map(({ tier, bodies }) => ({
        tier,
        bodies: bodies.map((body) => ({
          ...body,
          subgroups: body.subgroups.map((sg) => ({
            ...sg,
            pols: sg.pols.filter((pol) => matchesAppointedFilter(pol, filter)),
          })).filter((sg) => sg.pols.length > 0),
        })).filter((body) => body.subgroups.length > 0),
      }))
      .filter(({ bodies }) => bodies.length > 0);
  }

  const filteredHierarchy = useMemo(
    () => applyAppointedFilter(hierarchy, TAB_TYPE_DEFAULTS.representatives),
    [hierarchy]
  );
  const educatorsFilteredHierarchy = useMemo(
    () => applyAppointedFilter(educatorsHierarchy, TAB_TYPE_DEFAULTS.educators),
    [educatorsHierarchy]
  );
  const judgesFilteredHierarchy = useMemo(
    () => applyAppointedFilter(judgesHierarchy, TAB_TYPE_DEFAULTS.judges),
    [judgesHierarchy]
  );

  // D-05: hide Educators/Judges tabs when the location has 0 office-holders of
  // that bucket — computed PRE-appointed-filter, so an active "All types"
  // narrowing never hides a tab that genuinely has data.
  const hasEducators = bucketed.educator.length > 0;
  const hasJudges = bucketed.judge.length > 0;

  // D-08 / T-208-01/T-208-02: never trust the raw `?view=` param. Validate
  // against the known tab set and fall back to Representatives when the
  // active tab is unknown OR empty for this location (covers both a stale
  // bookmarked URL and an in-session location change that empties the
  // current tab). A switch (rather than repeated equality comparisons on the
  // raw param) keeps this the single legitimate reader of the raw param —
  // every render branch and tab button downstream reads effectiveActiveView.
  const effectiveActiveView = useMemo(() => {
    switch (activeView) {
      case 'representatives':
        return 'representatives';
      case 'educators':
        return hasEducators ? 'educators' : 'representatives';
      case 'judges':
        return hasJudges ? 'judges' : 'representatives';
      case 'elections':
        return 'elections';
      default:
        return 'representatives';
    }
  }, [activeView, hasEducators, hasJudges]);

  // CR-01 fix (210-REVIEW.md): seed tabLensMemory from a pending-calibration marker
  // on the return mount from handleCalibrateLens's full-page redirect. Without this,
  // CompassContext's own pending-lens effect (CompassContext.jsx:447-456) applies the
  // calibrated lens via setActiveLens but never records it into tabLensMemory — so a
  // later async rawUserAnswers/lenses tick re-fires the tab-entry effect below, which
  // recomputes resolveTabLens against still-empty tabLensMemory and reverts to the tab
  // default, silently discarding the calibration the user just completed.
  // Keys on the RAW activeView URL param (not effectiveActiveView, which downgrades to
  // 'representatives' while hasJudges/hasEducators are still resolving on this fresh
  // mount). Runs once on mount only ([] deps) — handleCalibrateLens always does a
  // full-page navigation, so return is always a fresh mount, never a re-render. Does
  // NOT clear the marker — CompassContext owns clearLensPending() once it actually
  // adopts the lens; this effect only mirrors the intent into tabLensMemory so the
  // tab-entry effect resolves to the calibrated key instead of reverting it.
  useEffect(() => {
    const pendingKey = loadLensPending();
    if (pendingKey) {
      setTabLensMemory((prev) => ({ ...prev, [activeView]: pendingKey }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-tab default lens shift (Req CMP-02): entering a people-tab applies that
  // tab's remembered-or-default lens to the global switcher. Elections is not a
  // people-tab and has no TAB_DEFAULTS entry (compassTopSlot also renders there)
  // — the guard below keeps this effect from ever resetting the switcher on an
  // Elections visit. Deps never include activeLensKey (would create a feedback
  // loop with handleSelectLens); rawUserAnswers IS included so async compass
  // calibration (CompassContext's cross-subdomain live-sync) re-fires this once
  // calibration data arrives, e.g. on a deep-link straight to ?view=judges.
  useEffect(() => {
    if (effectiveActiveView === 'elections') return;
    const resolvedKey = resolveTabLens(effectiveActiveView, tabLensMemory, lenses, rawUserAnswers);
    setActiveLens(resolvedKey);
  }, [effectiveActiveView, tabLensMemory, lenses, rawUserAnswers, setActiveLens]);

  const handlePoliticianClick = (id) => {
    // Save scroll position before navigating to profile
    sessionStorage.setItem('ev:scrollTop', String(window.scrollY));
    sessionStorage.setItem('ev:fromView', 'representatives');
    const pol = filteredPols?.find((p) => p.id === id);
    if (pol) {
      const dt = pol.district_type || '';
      const level = dt.startsWith('NATIONAL') ? 'federal' : dt.startsWith('STATE') ? 'state' : 'local';
      track('essentials_politician_viewed', {
        level,
        district_type: pol.district_type,
        office_title: pol.office_title,
      });
    }
    navigate(`/politician/${id}`);
  };

  /** Render a politician or candidate card with election date below for candidates */
  const renderPoliticianCard = (pol) => {
    const isCandidate = pol.is_candidate;
    const isVacant = pol.is_vacant;

    // Strip "(Retain Name?)" from BallotReady retention election artifacts
    const stripRetain = (s) => (s || '').replace(/\s*\(Retain\s+.+?\?\)/, '');
    const cleanTitle = stripRetain(pol.office_title);
    const cleanChamber = stripRetain(pol.chamber_name);

    // Split office_title on " - " to separate body from seat designation
    // e.g., "Bloomington City Common Council - At Large" → title: "...Council", subtitle: "At Large"
    // Always prefer the dash-split over chamber_name (which may equal office_title for LOCAL)
    const dashIdx = cleanTitle.lastIndexOf(' - ');

    // Choose qualification strategy: when inside a body-name section (header
    // already shows "Ellettsville Town Council" etc.), simplify the card title
    // to avoid redundancy.  Otherwise qualify with jurisdiction name.
    const qualify = pol.government_body_name ? simplifyForBody : qualifyLocalTitle;

    const cardTitle = (() => {
      if (dashIdx > 0) return qualify(cleanTitle.slice(0, dashIdx), pol);
      // NATIONAL_JUDICIAL: use chamber name (e.g. "U.S. Supreme Court")
      if (pol.district_type === 'NATIONAL_JUDICIAL')
        return cleanChamber || cleanTitle;
      // JUDICIAL (state/local): show the role from office_title
      // e.g., "Indiana Supreme Court Chief Justice" → "Chief Justice"
      //        "Indiana Circuit Court Judge - 10th Circuit, Division 1" → handled by dashIdx above
      if (pol.district_type === 'JUDICIAL') {
        // Extract role: last word(s) like "Chief Justice", "Justice", "Judge"
        const roleMatch = cleanTitle.match(/((?:Chief\s+)?(?:Justice|Judge))\b/i);
        return roleMatch ? roleMatch[1] : cleanTitle;
      }
      // SCHOOL: use office_title (e.g. "Board Member", "Trustee")
      if (pol.district_type === 'SCHOOL')
        return qualify(cleanTitle, pol);
      // Executive/officer positions: prefer office_title (e.g. "Mayor", "Governor", "Sheriff")
      if (/(_EXEC)$/.test(pol.district_type) || pol.district_type === 'COUNTY')
        return qualify(cleanTitle || cleanChamber, pol);
      // LOCAL named officers (mayor, clerk, treasurer, etc.): use office_title
      // so the card shows "Mayor" or "City Clerk" rather than the chamber name they share with council members
      if (pol.district_type === 'LOCAL' && /\b(mayor|clerk|treasurer|auditor|recorder|assessor|city manager|city administrator|city secretary)\b/i.test(cleanTitle))
        return qualify(cleanTitle, pol);
      // Default: prefer chamber_name (e.g. "City Council", "State Senate")
      return qualify(cleanChamber || cleanTitle, pol);
    })();

    const subtitle = (() => {
      // Seat designation embedded in the office title takes priority for local offices,
      // so each jurisdiction's own term wins (SLC "Ward 3", Ogden "District 2", at-large
      // seats "At-Large") even when district_id is null or shared across seats.
      const seatFromTitle = deriveSeatSubtitle(pol, cleanTitle);
      let base;
      if (dashIdx > 0) base = normalizeDistrictSubtitle(cleanTitle.slice(dashIdx + 3));
      // NATIONAL_JUDICIAL: show role (e.g. "Chief Justice", "Associate Justice")
      else if (pol.district_type === 'NATIONAL_JUDICIAL') base = cleanTitle;
      else if (seatFromTitle) base = seatFromTitle;
      else if (pol.district_id && /^[1-9]\d*$/.test(pol.district_id))
        base = `District ${pol.district_id}`;
      else if (pol.district_id === '0' && !/(_EXEC)$/.test(pol.district_type))
        base = 'At-Large';
      // State/federal legislators (e.g. Utah) carry an empty district_id; the
      // district lives in district_label ("State House District 24",
      // "State Senate District 9", "Congressional District 1"). Surface just the
      // "District N" portion. Scoped to legislator types so jurisdiction-style
      // labels (county/school: "Salt Lake County") never render as a district.
      else if (
        pol.district_type === 'STATE_LOWER' ||
        pol.district_type === 'STATE_UPPER' ||
        pol.district_type === 'NATIONAL_LOWER'
      ) {
        const m = (pol.district_label || '').match(/district\s+(\w+)/i);
        base = m ? `District ${m[1]}` : undefined;
      }
      else base = undefined;

      // For candidates: append "Candidate" to subtitle
      if (isCandidate) return base ? `${base} · Candidate` : 'Candidate';
      return base;
    })();

    // Vacant offices: render dimmed card with "Vacant" name, no photo, no click handler
    if (isVacant) {
      return (
        <div key={pol.id || `vacant-${pol.office_title}`} style={{ opacity: 0.55, height: '100%' }}>
          <PoliticianCard
            id={pol.id}
            imageSrc={undefined}
            name="Vacant"
            title={cardTitle}
            subtitle={subtitle}
            badge="Vacant"
            onClick={undefined}
            variant="horizontal"
          />
        </div>
      );
    }

    const hasStances = politicianIdsWithStances && politicianIdsWithStances.has(String(pol.id));
    const ballot = !isCandidate && getSeatBallotStatus(pol.term_end, pol.term_date_precision, pol.next_primary_date, pol.next_general_date);
    const branch = getBranch(pol.district_type, pol.office_title);

    const imgData = getImageData(pol);
    const handleCardClick = () => {
      sessionStorage.setItem('ev:scrollTop', String(window.scrollY));
      if (isCandidate) navigate(`/candidate/${pol.id}`);
      else handlePoliticianClick(pol.id);
    };

    const stanceData = stancesByPolId[pol.id];
    const polAnswersForMini = stanceData
      ? Object.entries(stanceData).map(([short_title, value]) => {
          const t = allTopics.find((x) => x.short_title === short_title);
          return t ? { topic_id: t.id, value } : null;
        }).filter(Boolean)
      : null;
    // Global lens applies to every card (Req 8): a narrow non-local lens must use
    // the full topic pool, matching CompassCard; only the 'local' lens scopes down.
    const scopedTopicsForPol = activeLensKey === 'local'
      ? allTopics.filter((t) => t.applies_local !== false)
      : allTopics;

    // Pre-check: only show the overlay when MiniCompass will actually draw ≥3 spokes.
    // Mirrors computeDisplaySpokes exactly: the chosen topic set is the active lens's
    // topics, or the user's selected compass for Best Match; a spoke needs both sides
    // answered + in scope.
    const userAnsweredIds = new Set((rawUserAnswers || []).map((a) => String(a.topic_id)));
    const polAnsweredIds = new Set((polAnswersForMini || []).filter((a) => a.value > 0).map((a) => String(a.topic_id)));
    const scopedIdsForPol = new Set((scopedTopicsForPol || []).map((t) => String(t.id)));
    // Best Match (custom) is drawn by computeDisplaySpokes' Req 9 fill, which pulls
    // from ALL both-answered in-scope topics — not just selectedTopics. Gating on
    // selectedTopics alone hid the overlay whenever the user's selected compass had
    // <3 topics in common with an official, even when a strong best match existed in
    // the wider pool. Use the empty-preferred (full both-answered) count for custom so
    // the gate matches what actually renders. Named lenses keep their curated set.
    const preferredForPol = (activeLensKey === 'custom' ? [] : activeLensTopicIds) || [];
    let matchCount;
    if (preferredForPol.length > 0) {
      matchCount = preferredForPol.filter(
        (id) => scopedIdsForPol.has(String(id)) && userAnsweredIds.has(String(id)) && polAnsweredIds.has(String(id))
      ).length;
    } else {
      matchCount = (scopedTopicsForPol || []).filter(
        (t) => userAnsweredIds.has(String(t.id)) && polAnsweredIds.has(String(t.id))
      ).length;
    }
    const showCompassOverlay = compassMode && matchCount >= 3;
    // Desktop: float the compass over the right edge of the card. Mobile: the card is
    // too narrow for a 190px overlay (it squeezes the name to initials), so stack the
    // compass below the card content in normal flow instead.
    const overlayCompass = showCompassOverlay && isDesktop;
    const stackCompass = showCompassOverlay && !isDesktop;

    const compassOverlayWidth = 190;
    const compassBg = isDark ? '#161b22' : isCandidate ? '#fffef5' : '#fff';
    const wrapperBorderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2EBEF';
    const cardEl = (
      <PoliticianCard
        id={pol.id}
        imageSrc={imgData.url}
        name={`${pol.first_name} ${pol.last_name}`}
        title={cardTitle}
        subtitle={subtitle}
        imageFocalPoint={imgData.focalPoint || 'center 20%'}
        style={{
          ...(isCandidate ? { borderLeft: '4px solid #fed12e', backgroundColor: '#fffef5' } : isDark ? { backgroundColor: '#161b22', borderColor: '#2d3748' } : {}),
          border: 'none',
          borderRadius: 0,
          cursor: 'pointer',
        }}
        contentStyle={overlayCompass ? { marginRight: compassOverlayWidth } : undefined}
        onClick={null}
        variant="horizontal"
        imageWidth="95px"
        footer={<IconOverlay ballot={ballot} hasStances={hasStances} branch={branch} />}
      />
    );
    return (
      <div
        key={pol.id}
        data-pol-id={pol.id}
        style={{
          position: 'relative',
          border: `1px solid ${wrapperBorderColor}`,
          borderRadius: 10,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          // Grid virtualization: skip layout+paint for off-screen cards (the heavy part —
          // image + SVG MiniCompass). Preserves DOM structure, scroll-spy ([data-tier]),
          // scroll-restore (ev:scrollTop) and the CSS grid, unlike windowing. `auto 120px`
          // is the placeholder height while skipped; `auto` makes the browser remember each
          // card's real measured size after its first render so the scrollbar stays accurate.
          contentVisibility: 'auto',
          containIntrinsicSize: 'auto 120px',
          // Stacked (mobile) layout: flex column so the card region keeps a definite
          // height. PoliticianCard's photo is height:100% and collapses/stretches
          // without one — same reason ElectionsView wraps its card in flex:0 0 auto.
          ...(stackCompass ? { display: 'flex', flexDirection: 'column' } : {}),
        }}
        onClick={handleCardClick}
        role="link"
        tabIndex={0}
        aria-label={`${pol.first_name} ${pol.last_name}, ${cardTitle}`}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCardClick(); } }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
      >
        {stackCompass
          ? <div style={{ position: 'relative', flex: '0 0 auto' }}>{cardEl}</div>
          : cardEl}
        {overlayCompass && (
          <div
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: compassOverlayWidth,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: compassBg,
            }}
          >
            <MiniCompass
              userAnswers={rawUserAnswers}
              polAnswers={polAnswersForMini}
              selectedTopics={selectedTopics}
              scopedTopics={scopedTopicsForPol}
              invertedSpokes={invertedSpokes}
              lensTopicIds={activeLensTopicIds}
              localLensActive={activeLensKey === 'local'}
              isDark={isDark}
              size={190}
            />
          </div>
        )}
        {stackCompass && (
          <div
            style={{
              flex: '0 0 auto',
              borderTop: `1px solid ${wrapperBorderColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0',
              backgroundColor: compassBg,
            }}
          >
            <MiniCompass
              userAnswers={rawUserAnswers}
              polAnswers={polAnswersForMini}
              selectedTopics={selectedTopics}
              scopedTopics={scopedTopicsForPol}
              invertedSpokes={invertedSpokes}
              lensTopicIds={activeLensTopicIds}
              localLensActive={activeLensKey === 'local'}
              isDark={isDark}
              size={200}
            />
          </div>
        )}
      </div>
    );
  };

  const renderSeatGroup = (pol) => {
    return (
      <Fragment key={pol.id ?? `seat-${seatKey(pol)}`}>
        {renderPoliticianCard(pol)}
      </Fragment>
    );
  };

  return (
    <Layout>
    <div className="min-h-screen bg-[var(--ev-bg-light)] dark:bg-ev-navy">

      {/* Page body */}
      <div className={isDesktop ? 'flex' : 'flex flex-col'}>
        {/* Main Content — capped at 1808px (3 × 560 cards + gaps + side padding)
            and centered so the workspace doesn't sprawl across ultrawide monitors. */}
        <main
          ref={mainRef}
          className="flex-1"
          style={{
            maxWidth: 1808,
            marginInline: 'auto',
            width: '100%',
          }}
        >
          {/* CompassKey now lives inside the representatives area below — no sticky overlay */}

          {/* 260426-mw6 — compass promotion banner: API empty + guest answers exist */}
          {promoteCompassShouldPrompt && (
            <PromotionBanner
              kind="compass"
              payload={promoteCompassPayload}
              onSave={promoteCompass}
              onDismiss={dismissCompassPromotion}
              status={promoteCompassStatus}
              error={promoteCompassError}
            />
          )}

          {/* 260426-mw6 — address promotion banner: no saved address + guest address exists */}
          {promoteAddressShouldPrompt && (
            <PromotionBanner
              kind="address"
              payload={promoteAddressPayload}
              onSave={promoteAddress}
              onDismiss={dismissAddressPromotion}
              status={promoteAddressStatus}
              error={promoteAddressError}
            />
          )}

          {/* "Save this address?" prompt for authed users with no API location */}
          {isLoggedIn && suggestedSaveAddress && (
            <div
              role="status"
              className="flex items-center gap-3 px-4 py-[10px] bg-[#E4F3F6] dark:bg-gray-800 border-b border-[#C0E8F2] dark:border-gray-700 text-[#003E4D] dark:text-gray-200 text-sm"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                Use <strong>{suggestedSaveAddress.addr}</strong> as your saved address?
              </span>
              <button
                type="button"
                disabled={savingSuggested}
                onClick={async () => {
                  setSavingSuggested(true);
                  try { await saveMyLocation(suggestedSaveAddress.addr); } catch {}
                  setSavingSuggested(false);
                  dismissSuggestedSaveAddress();
                  setAddressInput(toAddressTitleCase(suggestedSaveAddress.addr));
                }}
                style={{
                  padding: '6px 14px', borderRadius: '9999px', border: 'none',
                  background: '#00657c', color: '#fff', fontSize: '13px',
                  fontWeight: 600, cursor: savingSuggested ? 'wait' : 'pointer',
                  opacity: savingSuggested ? 0.6 : 1,
                }}
              >
                {savingSuggested ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={dismissSuggestedSaveAddress}
                aria-label="Dismiss"
                className="px-2 py-1 border-none bg-transparent text-gray-500 dark:text-gray-400 text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
          )}
          {/* Search Bar — a single always-editable LocationCombobox (SRCH-01, D-03).
              No pill->input display/edit toggle: the field itself IS the resting
              state (pre-filled with the current location label; focus selects-all).
              Tribal-land badge + elections summary render as a secondary info row
              once a location has resolved (address, browse-by-area, or coordinate
              direct-injection). */}
          <div className="px-6 sm:px-12 py-3 bg-[var(--ev-bg-light)] dark:bg-ev-navy">
            <LocationCombobox
              value={addressInput}
              onChange={(next) => {
                setAddressInput(next);
                if (coordError) setCoordError('');
              }}
              onSubmitAddress={(raw) => handleAddressSearch(raw)}
              onSubmitCoordinate={(lat, lng, raw) => resolveCoordinate(lat, lng, raw, { method: 'combobox' })}
              onSelectCandidate={(candidate) => {
                track('essentials_locality_searched', { label: candidate.label, state: candidate.state });
                navigate(browseAreaRoute(candidate));
              }}
              errorRow={coordError}
            />

            {/* Secondary info row: tribal/elections badges (when present) plus the
                Compass on/off toggle, right-aligned on the same line as the election
                chip — moved up here (208→215 follow-up) so turning Compass on swaps
                the lens/key controls into the tab row without shifting the page. */}
            {(activeQuery || browseResults) && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {/* SCHEMA-03 (Phase 133 D-09): tribal_land badge in ev-coral.
                    Renders only when API response.tribal_land.on_reservation === true.
                    Non-jurisdictional — federal/state/local officials still render normally. */}
                {tribalLand?.on_reservation && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap shrink-0"
                    style={{ backgroundColor: '#ff5740', color: '#fff', fontFamily: "'Manrope', sans-serif" }}
                    title={`On tribal land: ${tribalLand.name || 'Reservation'}`}
                  >
                    Tribal Land — {tribalLand.name || 'Reservation'}
                  </span>
                )}
                {/* Election summary. Relocated from the Elections tab button
                    (208-D-02/D-03) — location-level, renders once and stays visible
                    across all four tabs. Guarded on electionsLabelSuffix. */}
                {electionsLabelSuffix && (
                  <span className="inline-flex items-center whitespace-nowrap shrink-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      <span className="sm:hidden">Elections</span>
                      <span className="hidden sm:inline">{`Elections - ${electionsLabelSuffix}`}</span>
                    </span>
                    {electionsDaysAway && (
                      <span
                        className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
                        style={{ backgroundColor: '#FED12E', color: '#1a1a1a' }}
                      >
                        {/* compact on mobile (e.g. "3d"), full text from sm up */}
                        <span className="sm:hidden">{electionsDaysAway.replace(/ days? (away|ago)$/, 'd').replace(/^Yesterday$/, '1d')}</span>
                        <span className="hidden sm:inline">{electionsDaysAway}</span>
                      </span>
                    )}
                  </span>
                )}
                {/* Compass on/off toggle — right-aligned, on the same plane as the
                    election chip. When on, the lens/key controls render in the tab
                    row's right slot below (no page shift). */}
                <div className="ml-auto shrink-0">
                  <FilterBar
                    compassMode={compassMode}
                    onCompassModeChange={handleCompassModeChange}
                    isDark={isDark}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tab toggle + inline filters — tabs left, filters right */}
          {(activeQuery || browseResults) && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-2 border-b border-[#E2EBEF] dark:border-gray-800 px-4 sm:px-12">
              <div className="flex overflow-x-auto">
                <button
                  className={tabButtonClass(effectiveActiveView === 'representatives')}
                  onClick={() => switchView('representatives')}
                >
                  Representatives
                </button>
                {hasEducators && (
                  <button
                    className={tabButtonClass(effectiveActiveView === 'educators')}
                    onClick={() => switchView('educators')}
                  >
                    Educators
                  </button>
                )}
                {hasJudges && (
                  <button
                    className={tabButtonClass(effectiveActiveView === 'judges')}
                    onClick={() => switchView('judges')}
                  >
                    Judges
                  </button>
                )}
                <button
                  className={tabButtonClass(effectiveActiveView === 'elections')}
                  onClick={() => switchView('elections')}
                >
                  Elections
                </button>
              </div>
              {/* Compass lens/key controls occupy the slot the toggle used to sit in
                  (the toggle moved up to the election-chip row). Rendered only when
                  Compass is on; empty otherwise, so toggling doesn't shift the page. */}
              <div className="min-w-0 py-2 sm:py-0 w-full sm:flex sm:flex-1 sm:justify-end sm:pl-4 sm:w-auto">
                {compassControls}
              </div>
            </div>
          )}

          {(() => {
            // Phase 208 (D-09): Representatives, Educators, and Judges reuse this
            // single render pipeline byte-identical — only the hierarchy and the
            // zero-results fallback length vary per tab. compassTopSlot (D-10)
            // stays present on all three people-tabs. The error/precision banners
            // are location-level, so they only render once, on the Representatives
            // tab (the tab that's always present per D-07).
            const renderPeopleTab = (hier, fallbackListLength, viewName) => (
              <>
                {/* Error message — only for the current address query; never leak into a browse/locality view */}
                {viewName === 'representatives' && error && activeQuery && (
                  <div className="mx-8 mt-4 mb-4 text-center text-red-600 bg-red-50 border border-red-200 rounded p-4">
                    {error === 'address_not_found'
                      ? 'We couldn\'t find that address. Please enter a full street address (e.g. "123 Main St, Los Angeles, CA").'
                      : error}
                  </div>
                )}

                {/* ADR-0001 precision banner — results are city-wide, not parcel-specific */}
                {viewName === 'representatives' && fromLocality && (
                  <div className="mx-6 md:mx-12 mt-4 mb-2 px-4 py-3 rounded-lg border border-[var(--ev-teal)] dark:border-ev-teal-light bg-[var(--ev-bg-light)] dark:bg-ev-navy-card text-sm text-gray-700 dark:text-gray-200">
                    Showing representatives across {localityLabel ? <span className="font-semibold">{localityLabel}</span> : 'this city'}. Enter your full street address for your exact representatives.
                  </div>
                )}

                {/* Loading skeletons */}
                {phase === 'loading' && (
                  <div className="px-6 md:px-12 pt-6">
                    <SkeletonSection />
                    <SkeletonSection />
                    <SkeletonSection />
                  </div>
                )}

                {/* Results */}
                {phase !== 'loading' && (
                    <div className="px-6 md:px-12 pt-6 pb-8">
                      {/* Empty states for tiers with no data — suppressed on error (the error card already explains it) */}
                      {phase !== 'loading' && activeQuery && !error && ['Local', 'School', 'State'].map((tier) => {
                        const tierKey = tier.toLowerCase();
                        const tierStyle = tierColors[tierKey];
                        const hasTier = hier.some(h => h.tier === tier);
                        if (hasTier) return null;

                        const emptyMessage = `No ${TAB_TYPE_DEFAULTS[viewName].toLowerCase()} officials found at the ${tier.toLowerCase()} level.`;

                        return (
                          <div key={`empty-${tier}`} data-tier={tier} className="-mx-6 md:-mx-12 px-6 md:px-12 py-3" style={!isDark ? { backgroundColor: tierStyle?.bg ?? '#FFFFFF' } : undefined}>
                            <p className="mt-4 dark:text-[#8b949e] text-gray-500">{emptyMessage}</p>
                          </div>
                        );
                      })}

                      {hier.map(({ tier, bodies }) => {
                        const tierKey = tier.toLowerCase();
                        const tierStyle = tierColors[tierKey] ?? tierColors['local'];
                        if (!tierStyle) return null;

                        const tierBanner = tier === 'Local'
                          ? <SectionBanner {...buildBannerProps('city', bannerCtx)} />
                          : tier === 'State'
                          ? <SectionBanner {...buildBannerProps('state', bannerCtx)} />
                          : tier === 'Federal'
                          ? <SectionBanner {...buildBannerProps('federal', bannerCtx)} />
                          : null;

                        return (
                          <Fragment key={tier}>
                            {tierBanner}
                          <div data-tier={tier} className="-mx-6 md:-mx-12 px-6 md:px-12 py-3" style={!isDark ? { backgroundColor: tier === 'Federal' ? '#f0f2f5' : tierStyle.bg } : undefined}>
                            {bodies.map((body) => {
                              const isJudicialBody = body.subgroups.some(sg =>
                                sg.pols.some(p => p.district_type === 'JUDICIAL')
                              );
                              // Disambiguate the treasury entity by state so a Utah city never
                              // links to a same-named entity in another state (Salem UT → salem-ma).
                              // Prefer the body's own politicians' state; fall back to the view state.
                              const bodyState = body.subgroups
                                .flatMap((sg) => sg.pols)
                                .find((p) => p?.representing_state)?.representing_state || userState;
                              const treasuryMatch = (tier === 'Local' && !isJudicialBody)
                                ? findMatchingMunicipality(body.title, treasuryCities, bodyState)
                                : null;
                              return (
                                <GovernmentBodySection
                                  key={body.key}
                                  title={body.title}
                                  websiteUrl={body.url || undefined}
                                  tier={tierKey}
                                >
                                  {treasuryMatch && (
                                    <div className="mb-3">
                                      <a
                                        href={`${TREASURY_URL}/?entity=${encodeURIComponent(toTreasurySlug(treasuryMatch))}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-[#00657c] hover:text-[#004d5c] dark:text-[#00c8d7] dark:hover:text-[#7ec8d8] transition-colors"
                                        style={{ fontFamily: "'Manrope', sans-serif" }}
                                      >
                                        Explore {treasuryMatch.name} revenue and expenses
                                        <svg viewBox="0 0 16 16" className="w-3 h-3 ml-1" fill="currentColor" aria-hidden="true">
                                          <path fillRule="evenodd" d="M4.22 11.78a.75.75 0 010-1.06L9.44 5.5H5.75a.75.75 0 010-1.5h5.5a.75.75 0 01.75.75v5.5a.75.75 0 01-1.5 0V6.56l-5.22 5.22a.75.75 0 01-1.06 0z" clipRule="evenodd"/>
                                        </svg>
                                      </a>
                                    </div>
                                  )}
                                  {body.subgroups.map((sg) => {
                                    const maxCols = isWideForThree ? 3 : isWideForVertical ? 2 : 1;
                                    const cols = Math.min(maxCols, sg.pols.length || 1);
                                    const gridCols = `repeat(${cols}, minmax(0, 450px))`;
                                    return (
                                      <SubGroupSection
                                        key={sg.key}
                                        title={body.subgroups.length > 1 ? sg.label : undefined}
                                        websiteUrl={body.subgroups.length > 1 ? (sg.url || undefined) : undefined}
                                        gridTemplateColumns={gridCols}
                                        gap="16px"
                                        justifyContent="start"
                                      >
                                        {sg.pols.map((pol) =>
                                          renderSeatGroup(pol)
                                        )}
                                      </SubGroupSection>
                                    );
                                  })}
                                </GovernmentBodySection>
                              );
                            })}
                          </div>
                          </Fragment>
                        );
                      })}

                      {fallbackListLength === 0 && phase !== 'loading' && activeQuery && !error && (
                        <p className="text-center text-gray-600 dark:text-gray-400 mt-8">
                          No results found for this location.
                        </p>
                      )}

                      {/* Filter-aware empty state — when the per-tab type default yields no results but location has politicians */}
                      {fallbackListLength > 0 && hier.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                          No {TAB_TYPE_DEFAULTS[viewName].toLowerCase()} officials found for this area.
                        </p>
                      )}
                    </div>
                  )}
              </>
            );

            if (effectiveActiveView === 'representatives') {
              return renderPeopleTab(filteredHierarchy, federalFiltered.length, 'representatives');
            }
            if (effectiveActiveView === 'educators') {
              return renderPeopleTab(educatorsFilteredHierarchy, bucketed.educator.length, 'educators');
            }
            if (effectiveActiveView === 'judges') {
              return renderPeopleTab(judgesFilteredHierarchy, bucketed.judge.length, 'judges');
            }
            return null;
          })()}
          {effectiveActiveView === 'elections' && (
            <div className="px-6 md:px-12 pt-6 pb-8">
              {searchMode === 'address' && activeQuery && (
                <VoterResourcesCard
                  voterInfo={voterInfo}
                  loading={voterInfoLoading}
                  stateName={userState ? (STATE_NAMES[userState] || null) : null}
                  stateCode={userState || null}
                />
              )}

              <ElectionsView
                elections={nearestElection}
                loading={electionsLoading}
                compassMode={compassMode}
                isDark={isDark}
                hideWithdrawn={true}
                onCandidateClick={(id) => {
                  track('essentials_candidate_clicked', { candidate_id: id });
                  sessionStorage.setItem('ev:scrollTop', String(window.scrollY));
                  sessionStorage.setItem('ev:fromView', 'elections');
                  navigate(`/candidate/${id}`);
                }}
                buildingImageMap={buildingImageMap}
                featureIconMap={featureIconMap}
                populationMap={populationMap}
                representingCity={representingCity}
                userState={userState}
                stateNames={STATE_NAMES}
              />
            </div>
          )}
        </main>
      </div>

    </div>
    </Layout>
  );
}
