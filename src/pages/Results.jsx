import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GovernmentBodySection, SubGroupSection, PoliticianCard, CompassCardVertical, useMediaQuery, tierColors, useEvContextPromotion } from '@empoweredvote/ev-ui';
import { computeVariant } from '../lib/classify';
import { fetchPoliticianAnswers, computeStanceSpokes, LOCAL_LENS_TOPICS } from '../lib/compass';
import IconOverlay from '../components/IconOverlay';
import { getBranch } from '../utils/branchType';
import { Layout } from '../components/Layout';
import { getSeatBallotStatus } from '../utils/ballotStatus';
import LocalFilterSidebar from '../components/LocalFilterSidebar';
import FilterBar, { StickyCompassKey } from '../components/FilterBar';
import SegmentedControl from '../components/SegmentedControl';
import { usePoliticianData } from '../hooks/usePoliticianData';
import { groupIntoHierarchy } from '../lib/groupHierarchy';
import { getBuildingImages, parseStateFromAddress } from '../lib/buildingImages';
import { fetchElectionsByAddress, fetchElectionsByArea, fetchElectionsByGovernmentList, fetchMyElections, saveMyLocation, browseByArea, browseByGovernmentList, fetchVoterInfo } from '../lib/api';
import { saveUserAddress, loadUserAddressFromContext } from '../lib/compass';
import { apiFetch } from '../lib/auth';
import { useCompass } from '../contexts/CompassContext';
import { useTheme } from '../hooks/useTheme';
import MiniCompass from '../components/MiniCompass';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import LocationBrowser from '../components/LocationBrowser';
import ElectionsView from '../components/ElectionsView';
import VoterResourcesCard from '../components/VoterResourcesCard';
import CompassControlsBar from '../components/CompassControlsBar';
import { fetchTreasuryCities, findMatchingMunicipality, toTreasurySlug } from '../lib/treasury';

const TREASURY_URL = import.meta.env.VITE_TREASURY_URL || 'https://treasurytracker.empowered.vote';

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


const SHORTCUTS = [];

export default function Results() {
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const queryFromUrl = searchParams.get('q') || '';
  const activeView = searchParams.get('view') || 'representatives';

  // Search mode: 'address' or 'browse'
  const [searchMode, setSearchMode] = useState('address');
  const [editingSearch, setEditingSearch] = useState(false);
  // Browse results injected directly into the list
  const [browseResults, setBrowseResults] = useState(null);
  const [browseLoading, setBrowseLoading] = useState(false);
  // Currently-browsed area (geo_id + mtfcc), captured from URL shortcut params
  // OR from the LocationBrowser callback. Used to drive elections-by-area fetch.
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

  // Derive actual data and phase from cache, hook, or browse results
  const list = searchMode === 'browse' && browseResults
    ? browseResults
    : (cachedResult ? cachedResult.list : hookData);
  const phase = searchMode === 'browse'
    ? (browseLoading ? 'loading' : (browseResults ? 'fresh' : 'idle'))
    : (cachedResult ? 'fresh' : hookPhase);

  // Initialize selectedFilter from cache if available
  const [selectedFilter, setSelectedFilter] = useState(
    cachedResult?.filter || 'All'
  );

  // Initialize appointedFilter from cache if available (defaults to 'All' per FILT-03)
  const [appointedFilter, setAppointedFilter] = useState(
    cachedResult?.appointedFilter || 'All'
  );

  const [searchQuery, setSearchQuery] = useState('');

  // Client-side name filter — applied only to the grid (not to non-display logic like locationLabel)
  const trimmedSearch = (searchQuery || '').trim().toLowerCase();
  const visibleList = trimmedSearch && Array.isArray(list)
    ? list.filter((p) => {
        const name = (p?.full_name || '').toLowerCase();
        const first = (p?.first_name || '').toLowerCase();
        const last = (p?.last_name || '').toLowerCase();
        return name.includes(trimmedSearch)
            || first.includes(trimmedSearch)
            || last.includes(trimmedSearch);
      })
    : list;

  // Compass mode toggle — persisted across sessions; off by default for dense view
  const [compassMode, setCompassMode] = useState(() => {
    try { return localStorage.getItem('ev:compassMode') === 'true'; } catch { return false; }
  });
  const handleCompassModeChange = (val) => {
    posthog?.capture('compass_mode_toggled', { enabled: val });
    setCompassMode(val);
    try { localStorage.setItem('ev:compassMode', val ? 'true' : 'false'); } catch {}
    if (val) enableCompass();
  };
  // Scroll-spy tier tracking for building image swap
  const [scrollActiveTier, setScrollActiveTier] = useState('Local');

  // Elections tab data
  const [electionsData, setElectionsData] = useState(null);
  const [electionsLoading, setElectionsLoading] = useState(false);
  const [voterInfo, setVoterInfo] = useState(null);
  const [voterInfoLoading, setVoterInfoLoading] = useState(false);

  // Treasury CTA — one-shot fetch of available municipalities on mount
  const [treasuryCities, setTreasuryCities] = useState([]);
  useEffect(() => { fetchTreasuryCities().then(setTreasuryCities); }, []);

  // Compass integration — context provides politician IDs with stances + user data
  const { isLoggedIn, userId, politicianIdsWithStances, allTopics, userAnswers: rawUserAnswers, selectedTopics, userJurisdiction, myRepresentatives, myRepresentativesAddress, compassLoading, suggestedSaveAddress, dismissSuggestedSaveAddress, invertedSpokes, batchInvertSpokes, lensOverride, setLocalLens, getEffectiveLens, enableCompass } = useCompass();

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

  // Local Lens toggle state. Default (lensOverride === null) is the smart per-office
  // behavior: local offices use the lens, state/federal show the full compass — so
  // every compass renders. The visible toggle reads as ON here and flips to a full
  // compass everywhere (false) when turned off. It never forces the local lens onto
  // state/federal races, which would filter out their topics and hide the compass.
  const lensActive = lensOverride !== false;
  const handleToggleLens = () => setLocalLens(lensActive ? false : null);

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
    posthog?.capture('stance_alignment_set', { alignment: 'max' });
    const newMap = computeStanceSpokes('max', rawUserAnswers, allTopics, invertedSpokes || {});
    batchInvertSpokes(newMap);
  };

  const handleStanceMin = () => {
    if (!rawUserAnswers || !allTopics) return;
    posthog?.capture('stance_alignment_set', { alignment: 'min' });
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
    if (!isLoggedIn || !formattedAddress || phase !== 'fresh' || searchMode === 'browse') return;
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
          filter: selectedFilter,
          appointedFilter: appointedFilter,
          timestamp: Date.now(),
        }));
      }
    }
  }, [list, phase, selectedFilter, appointedFilter, queryFromUrl]);

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

    setSearchMode('browse');
    setBrowseLoading(true);
    if (label) setAddressInput(decodeURIComponent(label));

    browseByGovernmentList(ids, browseState, { countyGeoId: browseCountyGeoId }).then(({ data, error }) => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchView = (view) => {
    posthog?.capture('tab_switched', { from: activeView, to: view });
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

  const handleAddressSearch = (overrideAddress) => {
    const addr = (typeof overrideAddress === 'string' ? overrideAddress : addressInput).trim();
    if (!addr) return;
    setCachedResult(null);
    sessionStorage.removeItem('ev:results');
    setSearchKey(k => k + 1);
    // Switching to address search clears any prior browse-by-area state so the
    // URL doesn't end up with both ?browse_geo_id=... and ?q=...
    setBrowseResults(null);
    setSearchMode('address');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('q', addr);
      next.delete('browse_geo_id');
      next.delete('browse_mtfcc');
      next.delete('browse_label');
      next.delete('browse_city_filter');
      next.delete('browse_school_filter');
      return next;
    });
  };

  const addressInputRef = useRef(null);
  useGooglePlacesAutocomplete(addressInputRef, {
    onPlaceSelected: (addr) => {
      posthog?.capture('address_searched', { method: 'autocomplete' });
      setAddressInput(addr);
      handleAddressSearch(addr);
    },
  });

  // Resolution logic per CONTEXT D-05: politician.is_appointed overrides office-level
  function resolveIsAppointed(pol) {
    // politician.is_appointed=true is an individual override (e.g. interim appointment)
    if (pol.is_appointed === true) return true;
    // Otherwise fall back to office-level: is_elected derives from !is_appointed_position
    return !pol.is_elected;
  }

  // Filter logic per CONTEXT D-06
  function matchesAppointedFilter(pol, filter) {
    if (filter === 'All') return true;
    const resolved = resolveIsAppointed(pol);
    if (filter === 'Elected') {
      return !resolved || pol.faces_retention_vote === true;
    }
    if (filter === 'Appointed') {
      return resolved === true;
    }
    return true;
  }

  // Filter and classify (no longer filtering VACANT names — vacant offices come via is_vacant flag)
  // Uses visibleList (name-filtered) so the grid narrows when user types in FilterBar search.
  const filteredPols = useMemo(() => visibleList, [visibleList]); // eslint-disable-line react-hooks/exhaustive-deps

  // Per-politician stances cache for CompassCardVertical comparison overlay (compass mode only)
  const [stancesByPolId, setStancesByPolId] = useState({});
  useEffect(() => {
    if (!compassMode) return;
    if (!filteredPols || filteredPols.length === 0 || allTopics.length === 0) return;
    const topicById = new Map(allTopics.map(t => [t.id, t]));
    const targets = filteredPols.filter(p => politicianIdsWithStances.has(String(p.id)) && !stancesByPolId[p.id]);
    if (targets.length === 0) return;
    let cancelled = false;
    Promise.all(
      targets.map(p =>
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
    ).then(pairs => {
      if (cancelled) return;
      setStancesByPolId(prev => {
        const next = { ...prev };
        for (const [id, m] of pairs) next[id] = m;
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [compassMode, filteredPols, allTopics, politicianIdsWithStances]); // eslint-disable-line react-hooks/exhaustive-deps

  const COMPASS_URL = import.meta.env.VITE_COMPASS_URL || 'https://compass.empowered.vote';
  const handleBuildCompass = () => {
    const returnUrl = window.location.href;
    window.open(`${COMPASS_URL}/?return=${encodeURIComponent(returnUrl)}`, '_blank');
  };

  // Derive representing city for building image selection — uses unfiltered list
  // so the building image doesn't disappear when search filter narrows the grid.
  const representingCity = useMemo(() => {
    const src = Array.isArray(list) ? list : [];
    for (const p of src) {
      if (p.representing_city) return p.representing_city;
    }
    // Fallback: extract city name from local politicians' chamber_name
    for (const p of src) {
      const dt = p?.district_type || '';
      if (dt === 'LOCAL' && p.chamber_name) {
        const match = p.chamber_name.match(/^(\w[\w\s]+?)\s+City\b/);
        if (match) return match[1];
      }
    }
    return null;
  }, [list]);

  // Extract state abbreviation from the address string
  // Handles "Orem, UT 84057" and "South Dakota, USA"
  const userState = useMemo(
    () => parseStateFromAddress(addressInput),
    [addressInput]
  );

  const buildingImageMap = useMemo(
    () => getBuildingImages(representingCity, userState),
    [representingCity, userState]
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

  const hierarchy = useMemo(
    () => groupIntoHierarchy(deduped),
    [deduped]
  );

  const filteredHierarchy = useMemo(() => {
    if (appointedFilter === 'All' && selectedFilter === 'All') return hierarchy;

    return hierarchy
      .filter(({ tier }) => selectedFilter === 'All' || tier === selectedFilter)
      .map(({ tier, bodies }) => ({
        tier,
        bodies: bodies.map((body) => ({
          ...body,
          subgroups: body.subgroups.map((sg) => ({
            ...sg,
            pols: appointedFilter === 'All'
              ? sg.pols
              : sg.pols.filter((pol) => matchesAppointedFilter(pol, appointedFilter)),
          })).filter((sg) => sg.pols.length > 0),
        })).filter((body) => body.subgroups.length > 0),
      }))
      .filter(({ bodies }) => bodies.length > 0);
  }, [hierarchy, appointedFilter, selectedFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Location label — uses unfiltered list so the label stays stable while user searches.
  const locationLabel = useMemo(() => {
    const src = Array.isArray(list) ? list : [];
    if (!src.length) return null;
    const sample = src[0];
    const city = sample.representing_city;
    const state = sample.representing_state;

    if (selectedFilter === 'State') {
      return state ? `${state}, USA` : null;
    }
    return city && state ? `${city}, ${state}` : null;
  }, [list, selectedFilter]);

  // Derive active building image based on filter or scroll-spy
  const activeBuildingImage =
    selectedFilter === 'All'
      ? buildingImageMap[scrollActiveTier] || buildingImageMap.Local
      : buildingImageMap[selectedFilter] || buildingImageMap.Federal;

  // Scroll-spy: swap building image as user scrolls between tier sections
  useEffect(() => {
    if (selectedFilter !== 'All') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setScrollActiveTier(entry.target.dataset.tier);
          }
        }
      },
      {
        root: null,
        rootMargin: '-40% 0px -60% 0px',
        threshold: 0,
      }
    );

    const sections = document.querySelectorAll('[data-tier]');
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selectedFilter, isDesktop, mainRef.current]);

  const handlePoliticianClick = (id) => {
    // Save scroll position before navigating to profile
    sessionStorage.setItem('ev:scrollTop', String(window.scrollY));
    sessionStorage.setItem('ev:fromView', 'representatives');
    const pol = filteredPols?.find((p) => p.id === id);
    if (pol) {
      const dt = pol.district_type || '';
      const level = dt.startsWith('NATIONAL') ? 'federal' : dt.startsWith('STATE') ? 'state' : 'local';
      posthog?.capture('politician_viewed', {
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
    // Local offices default to the Local Lens; others to the user's regular compass.
    const polLensActive = getEffectiveLens(isLocalDistrict(pol.district_type) ? 'local' : 'state');
    // Lens ON → local-scoped topics; lens OFF → full compass (no tier lock), matching CompassCard.
    const scopedTopicsForPol = polLensActive
      ? allTopics.filter((t) => t.applies_local !== false)
      : allTopics;

    // Pre-check: only show the overlay when MiniCompass will actually draw ≥3 spokes.
    // Mirrors computeDisplaySpokes exactly: the chosen topic set is the Local Lens (on)
    // or the user's selected compass (off); a spoke needs both sides answered + in scope.
    const userAnsweredIds = new Set((rawUserAnswers || []).map((a) => String(a.topic_id)));
    const polAnsweredIds = new Set((polAnswersForMini || []).filter((a) => a.value > 0).map((a) => String(a.topic_id)));
    const scopedIdsForPol = new Set((scopedTopicsForPol || []).map((t) => String(t.id)));
    const preferredForPol = polLensActive ? LOCAL_LENS_TOPICS : (selectedTopics || []);
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

    const compassOverlayWidth = 190;
    const compassBg = isDark ? '#1a2235' : isCandidate ? '#fffef5' : '#fff';
    const wrapperBorderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2EBEF';
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
        }}
        onClick={handleCardClick}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
      >
        <PoliticianCard
          id={pol.id}
          imageSrc={imgData.url}
          name={`${pol.first_name} ${pol.last_name}`}
          title={cardTitle}
          subtitle={subtitle}
          imageFocalPoint={imgData.focalPoint || 'center 20%'}
          style={{
            ...(isCandidate ? { borderLeft: '4px solid #fed12e', backgroundColor: '#fffef5' } : isDark ? { backgroundColor: '#1a2235', borderColor: '#2d3f5a' } : {}),
            border: 'none',
            borderRadius: 0,
            cursor: 'pointer',
          }}
          contentStyle={showCompassOverlay ? { marginRight: compassOverlayWidth } : undefined}
          onClick={null}
          variant="horizontal"
          imageWidth="95px"
          footer={<IconOverlay ballot={ballot} hasStances={hasStances} branch={branch} />}
        />
        {showCompassOverlay && (
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
              localLensActive={polLensActive}
              isDark={isDark}
              size={190}
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
          {/* Search Bar — collapsed chip when address is set, full input otherwise. */}
          <div className="px-6 sm:px-12 py-3 bg-[var(--ev-bg-light)] dark:bg-ev-navy">
            {/* Collapsed chip — shown when we have a result and not actively editing */}
            {(formattedAddress || (searchMode === 'browse' && browseResults)) && !editingSearch && (
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#00657c' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {formattedAddress ? toAddressTitleCase(formattedAddress) : addressInput}
                </span>
                {/* SCHEMA-03 (Phase 133 D-09): tribal_land badge in ev-coral.
                    Renders only when API response.tribal_land.on_reservation === true.
                    Non-jurisdictional — federal/state/local officials still render normally. */}
                {tribalLand?.on_reservation && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                    style={{ backgroundColor: '#ff5740', color: '#fff', fontFamily: "'Manrope', sans-serif" }}
                    title={`On tribal land: ${tribalLand.name || 'Reservation'}`}
                  >
                    Tribal Land — {tribalLand.name || 'Reservation'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditingSearch(true)}
                  aria-label="Edit search"
                  className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                  style={{ color: '#00657c' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </button>
                {/* Sticky CompassKey is positioned floating at top of <main>;
                    it visually overlaps this row at scroll = 0, then pins as the user scrolls. */}
              </div>
            )}

            {/* Full search form — always in the DOM so the autocomplete ref stays attached.
                Hidden via CSS when the chip is visible to preserve the Google Places binding. */}
            <div className={(formattedAddress || (searchMode === 'browse' && browseResults)) && !editingSearch ? 'hidden' : ''}>
              {/* Mode toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => { setSearchMode('address'); setBrowseResults(null); }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    searchMode === 'address'
                      ? 'bg-[var(--ev-teal)] text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Search by Address
                </button>
                <button
                  onClick={() => setSearchMode('browse')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    searchMode === 'browse'
                      ? 'bg-[var(--ev-teal)] text-white'
                      : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Browse by Location
                </button>
              </div>

              {/* Address input — always in the DOM so the Google Places autocomplete ref
                  stays attached regardless of which mode is active. Hidden via CSS in browse mode. */}
              <div className={searchMode !== 'address' ? 'hidden' : 'flex gap-3'}>
                <input
                  ref={addressInputRef}
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (handleAddressSearch(), setEditingSearch(false))}
                  placeholder="Enter your full street address"
                  className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]
                             bg-white dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                />
                <button
                  onClick={() => { handleAddressSearch(); setEditingSearch(false); }}
                  disabled={!addressInput.trim()}
                  className="px-6 py-2 font-bold text-white bg-[var(--ev-teal)] rounded-lg
                             hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 transition-colors"
                >
                  Search
                </button>
                {(formattedAddress || (searchMode === 'browse' && browseResults)) && (
                  <button
                    type="button"
                    onClick={() => setEditingSearch(false)}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Quick-access shortcuts for anonymous users */}
              {searchMode === 'address' && SHORTCUTS.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {SHORTCUTS.map((sc) => (
                    <button
                      key={sc.label}
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams({
                          browse_government_list: sc.browseGovernmentList,
                          browse_label: sc.browseLabel,
                        });
                        if (sc.browseState) params.set('browse_state', sc.browseState);
                        navigate(`/results?${params}`);
                      }}
                      className="border border-[var(--ev-teal)] dark:border-ev-teal-light text-[var(--ev-teal)] dark:text-ev-teal-light px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-60"
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              )}

              {searchMode !== 'address' && (
                <LocationBrowser
                  onResults={(data, areaName, state, area) => {
                    setBrowseResults(data);
                    if (area && area.geo_id && area.mtfcc) {
                      setBrowseArea({ geo_id: area.geo_id, mtfcc: area.mtfcc });
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.set('browse_geo_id', area.geo_id);
                        next.set('browse_mtfcc', area.mtfcc);
                        if (areaName) next.set('browse_label', areaName);
                        else next.delete('browse_label');
                        next.delete('browse_city_filter');
                        next.delete('browse_school_filter');
                        next.set('mode', 'browse');
                        return next;
                      }, { replace: true });
                    }
                    if (areaName) setAddressInput(`${areaName}, ${state}`);
                    setEditingSearch(false);
                  }}
                  onLoading={setBrowseLoading}
                />
              )}
            </div>
          </div>

          {/* Tab toggle + inline filters — tabs left, filters right */}
          {(activeQuery || browseResults) && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-2 border-b border-[#E2EBEF] dark:border-gray-800 px-6 sm:px-12">
              <div className="flex">
                <button
                  className={`px-4 py-3 text-sm min-h-[44px] transition-colors ${
                    activeView === 'representatives'
                      ? 'text-[#00657C] dark:text-ev-teal-light font-semibold border-b-2 border-[#00657C] dark:border-ev-teal-light'
                      : 'text-[#718096] dark:text-gray-500 font-normal hover:text-[#4A5568] dark:hover:text-gray-300'
                  }`}
                  onClick={() => switchView('representatives')}
                >
                  Representatives
                </button>
                <button
                  className={`px-4 py-3 text-sm min-h-[44px] transition-colors flex items-center gap-1 ${
                    activeView === 'elections'
                      ? 'text-[#00657C] dark:text-ev-teal-light font-semibold border-b-2 border-[#00657C] dark:border-ev-teal-light'
                      : 'text-[#718096] dark:text-gray-500 font-normal hover:text-[#4A5568] dark:hover:text-gray-300'
                  }`}
                  onClick={() => switchView('elections')}
                >
                  <span className="sm:hidden">Elections</span>
                  <span className="hidden sm:inline">
                    {electionsLabelSuffix ? `Elections - ${electionsLabelSuffix}` : 'Elections'}
                  </span>
                  {electionsDaysAway && (
                    <span
                      className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: '#FED12E', color: '#1a1a1a' }}
                    >
                      {electionsDaysAway}
                    </span>
                  )}
                </button>
              </div>
              <div className="min-w-0 py-2 w-full sm:flex sm:flex-1 sm:justify-end sm:pl-4 sm:w-auto">
                <FilterBar
                  selectedFilter={selectedFilter}
                  onFilterChange={(v) => { posthog?.capture('filter_changed', { filter_type: 'tier', value: v }); setSelectedFilter(v); }}
                  appointedFilter={appointedFilter}
                  onAppointedFilterChange={(v) => { posthog?.capture('filter_changed', { filter_type: 'appointed', value: v }); setAppointedFilter(v); }}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  compassMode={compassMode}
                  onCompassModeChange={handleCompassModeChange}
                  isDark={isDark}
                />
              </div>
            </div>
          )}

          {/* Sticky controls bar — only shown when compass mode is active */}
          {compassMode && (activeQuery || browseResults) && (
            <CompassControlsBar
              userAnswers={rawUserAnswers}
              lensActive={lensActive}
              onToggleLens={handleToggleLens}
              onStanceMin={handleStanceMin}
              onStanceMax={handleStanceMax}
              isDesktop={isDesktop}
            />
          )}

          {activeView === 'representatives' ? (
          <>

          {/* Error message */}
          {error && (
            <div className="mx-8 mt-4 mb-4 text-center text-red-600 bg-red-50 border border-red-200 rounded p-4">
              {error === 'address_not_found'
                ? 'We couldn\'t find that address. Please enter a full street address (e.g. "123 Main St, Los Angeles, CA").'
                : error}
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
                {/* Empty states for tiers with no data */}
                {phase !== 'loading' && activeQuery && ['Local', 'School', 'State'].map((tier) => {
                  const tierKey = tier.toLowerCase();
                  const tierStyle = tierColors[tierKey];
                  const hasTier = filteredHierarchy.some(h => h.tier === tier);
                  if (hasTier) return null;
                  // Only show if filtering to All or this specific tier
                  if (selectedFilter !== 'All' && selectedFilter !== tier) return null;

                  const emptyMessage = appointedFilter !== 'All'
                    ? `No ${appointedFilter.toLowerCase()} officials found at the ${tier.toLowerCase()} level.`
                    : `${tier} representative data is not yet available for this area.`;

                  return (
                    <div key={`empty-${tier}`} data-tier={tier} className="-mx-6 md:-mx-12 px-6 md:px-12 py-3" style={!isDark ? { backgroundColor: tierStyle?.bg ?? '#FFFFFF' } : undefined}>
                      {selectedFilter === 'All' && (
                        <div className="mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tierStyle?.text }}>{tier}</span>
                        </div>
                      )}
                      <p className="mt-4 text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                    </div>
                  );
                })}

                {/* Name-search no-matches state */}
                {trimmedSearch && Array.isArray(visibleList) && visibleList.length === 0 && Array.isArray(list) && list.length > 0 && (
                  <p className="mt-4 text-gray-500 dark:text-gray-400 text-center">
                    No matches for &ldquo;{searchQuery}&rdquo;. Clear the search box to see all results.
                  </p>
                )}

                {filteredHierarchy.map(({ tier, bodies }) => {
                  const tierKey = tier.toLowerCase();
                  const tierStyle = tierColors[tierKey] ?? tierColors['local'];
                  if (!tierStyle) return null;

                  return (
                    <div key={tier} data-tier={tier} className="-mx-6 md:-mx-12 px-6 md:px-12 py-3" style={!isDark ? { backgroundColor: tier === 'Federal' ? '#f0f2f5' : tierStyle.bg } : undefined}>
                      {selectedFilter === 'All' && (
                        <div className="mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tierStyle.text }}>{tier}</span>
                        </div>
                      )}
                      {bodies.map((body) => {
                        const isJudicialBody = body.subgroups.some(sg =>
                          sg.pols.some(p => p.district_type === 'JUDICIAL')
                        );
                        const treasuryMatch = (tier === 'Local' && !isJudicialBody)
                          ? findMatchingMunicipality(body.title, treasuryCities)
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
                                  href={`${TREASURY_URL}/?entity=${toTreasurySlug(treasuryMatch)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-[#59b0c4] hover:text-[#00657c] transition-colors"
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
                  );
                })}

                {federalFiltered.length === 0 && phase !== 'loading' && activeQuery && (
                  <p className="text-center text-gray-600 dark:text-gray-400 mt-8">
                    No results found for this location.
                  </p>
                )}

                {/* Filter-aware empty state — when appointed filter yields no results but location has politicians */}
                {federalFiltered.length > 0 && appointedFilter !== 'All' &&
                  filteredHierarchy.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No {appointedFilter.toLowerCase()} officials found for this area.
                  </p>
                )}
              </div>
            )}
          </>
          ) : (
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
                tierFilter={selectedFilter}
                compassMode={compassMode}
                isDark={isDark}
                onCandidateClick={(id) => {
                  posthog?.capture('candidate_clicked', { candidate_id: id });
                  sessionStorage.setItem('ev:scrollTop', String(window.scrollY));
                  sessionStorage.setItem('ev:fromView', 'elections');
                  navigate(`/candidate/${id}`);
                }}
              />
            </div>
          )}
        </main>
      </div>

    </div>
    </Layout>
  );
}
