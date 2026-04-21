import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GovernmentBodySection, SubGroupSection, PoliticianCard, useMediaQuery, tierColors } from '@empoweredvote/ev-ui';
import IconOverlay from '../components/IconOverlay';
import { getBranch } from '../utils/branchType';
import { Layout } from '../components/Layout';
import { getSeatBallotStatus } from '../utils/ballotStatus';
import LocalFilterSidebar from '../components/LocalFilterSidebar';
import SegmentedControl from '../components/SegmentedControl';
import CompassPreview from '../components/CompassPreview';
import { usePoliticianData } from '../hooks/usePoliticianData';
import { groupIntoHierarchy } from '../lib/groupHierarchy';
import { getBuildingImages, parseStateFromAddress } from '../lib/buildingImages';
import { fetchElectionsByAddress, saveMyLocation, browseByArea } from '../lib/api';
import { saveUserAddress } from '../lib/compass';
import { useCompass } from '../contexts/CompassContext';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import LocationBrowser from '../components/LocationBrowser';
import ElectionsView from '../components/ElectionsView';
import { fetchTreasuryCities, findMatchingMunicipality, toTreasurySlug } from '../lib/treasury';

const TREASURY_URL = import.meta.env.VITE_TREASURY_URL || 'https://treasurytracker.empowered.vote';

/** Stable key that identifies a specific seat (office + district). */
function seatKey(pol) {
  return `${pol.office_title}||${pol.district_type}||${pol.district_id || ''}`;
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

/** Loading skeleton for a single politician card row */
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 py-2 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/** Loading skeleton for a tier section with header + cards */
function SkeletonSection() {
  return (
    <div className="mb-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
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
 * Qualify a generic local title with the jurisdiction name.
 * e.g. "Mayor" → "Paramount Mayor", "Sheriff" → "Los Angeles County Sheriff"
 * Only used when a card is NOT inside a government_body_name section.
 */
function qualifyLocalTitle(baseTitle, pol) {
  if (!pol.government_name || !baseTitle) return baseTitle;

  const dt = pol.district_type || '';
  if (!dt.startsWith('LOCAL') && dt !== 'COUNTY') return baseTitle;

  const gov = pol.government_name.split(',')[0].trim();
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


export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryFromUrl = searchParams.get('q') || '';
  const activeView = searchParams.get('view') || 'representatives';

  // Search mode: 'address' or 'browse'
  const [searchMode, setSearchMode] = useState('address');
  // Browse results injected directly into the list
  const [browseResults, setBrowseResults] = useState(null);
  const [browseLoading, setBrowseLoading] = useState(false);

  // Address bar state
  const [addressInput, setAddressInput] = useState(
    queryFromUrl ? decodeURIComponent(queryFromUrl) : ''
  );
  // Search counter — incrementing this forces usePoliticianData to re-fetch
  // even when the query text hasn't changed (re-search same location edge case)
  const [searchKey, setSearchKey] = useState(0);

  const mainRef = useRef(null);

  // Detect desktop breakpoint for two-panel layout
  const isDesktop = useMediaQuery('(min-width: 769px)');

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
  // Scroll-spy tier tracking for building image swap
  const [scrollActiveTier, setScrollActiveTier] = useState('Local');

  // Elections tab data
  const [electionsData, setElectionsData] = useState(null);
  const [electionsLoading, setElectionsLoading] = useState(false);

  // Treasury CTA — one-shot fetch of available municipalities on mount
  const [treasuryCities, setTreasuryCities] = useState([]);
  useEffect(() => { fetchTreasuryCities().then(setTreasuryCities); }, []);

  // Compass integration — context provides politician IDs with stances + user data
  const { isLoggedIn, politicianIdsWithStances, allTopics, userAnswers, selectedTopics, userJurisdiction, myRepresentatives, myRepresentativesAddress, compassLoading } = useCompass();

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
  const [previewPol, setPreviewPol] = useState(null);

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
      if (isDesktop && mainRef.current) {
        mainRef.current.scrollTop = scrollTop;
      } else {
        window.scrollTo(0, scrollTop);
      }
    });
  }, [cachedResult, isDesktop]);

  // Eager-fetch elections when address search completes (not lazily on tab click)
  useEffect(() => {
    if (!activeQuery) return;
    if (electionsData !== null) return; // already loaded for this query

    let cancelled = false;
    setElectionsLoading(true);

    fetchElectionsByAddress(decodeURIComponent(activeQuery)).then((data) => {
      if (!cancelled) {
        setElectionsData(data.elections || []);
        setElectionsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [activeQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset elections data when address changes
  useEffect(() => {
    setElectionsData(null);
  }, [activeQuery]);

  // Handle ?mode=browse from Landing page "Browse by location" link (per D-05)
  useEffect(() => {
    if (searchParams.get('mode') === 'browse') {
      setSearchMode('browse');
    }
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
    if (label) setAddressInput(decodeURIComponent(label));

    browseByArea(geoId, mtfcc).then(({ data, error }) => {
      if (error) console.error('browse shortcut error:', error);
      let filtered = data;
      if (cityFilter || schoolFilter) {
        const cityLower = cityFilter?.toLowerCase();
        const schoolLower = schoolFilter?.toLowerCase();
        filtered = data.filter((pol) => {
          const dt = pol.district_type || '';
          const govLower = (pol.government_name || '').toLowerCase();
          if (dt === 'LOCAL' || dt === 'LOCAL_EXEC') {
            return cityLower ? govLower.includes(cityLower) : true;
          }
          if (dt === 'SCHOOL') {
            return schoolLower ? govLower.includes(schoolLower) : true;
          }
          return true;
        });
      }
      setBrowseResults(filtered);
      setBrowseLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const switchView = (view) => {
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
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('q', addr);
      return next;
    });
  };

  const addressInputRef = useRef(null);
  useGooglePlacesAutocomplete(addressInputRef, {
    onPlaceSelected: (addr) => {
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
  const filteredPols = useMemo(() => list, [list]);

  // Derive representing city for building image selection
  const representingCity = useMemo(() => {
    for (const p of filteredPols) {
      if (p.representing_city) return p.representing_city;
    }
    // Fallback: extract city name from local politicians' chamber_name
    for (const p of filteredPols) {
      const dt = p?.district_type || '';
      if (dt === 'LOCAL' && p.chamber_name) {
        const match = p.chamber_name.match(/^(\w[\w\s]+?)\s+City\b/);
        if (match) return match[1];
      }
    }
    return null;
  }, [filteredPols]);

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

  const electionsLabelSuffix = useMemo(() => {
    if (!electionsData || electionsData.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = electionsData
      .filter((e) => {
        if (!e.election_date) return false;
        const d = new Date(e.election_date + 'T12:00:00');
        return d >= today;
      })
      .sort((a, b) => new Date(a.election_date) - new Date(b.election_date));

    if (upcoming.length === 0) return null;
    const next = upcoming[0];

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

  // Location label
  const locationLabel = useMemo(() => {
    if (!filteredPols.length) return null;
    const sample = filteredPols[0];
    const city = sample.representing_city;
    const state = sample.representing_state;

    if (selectedFilter === 'State') {
      return state ? `${state}, USA` : null;
    }
    return city && state ? `${city}, ${state}` : null;
  }, [filteredPols, selectedFilter]);

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
        root: isDesktop ? mainRef.current : null,
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
    const scrollTop = isDesktop
      ? mainRef.current?.scrollTop ?? 0
      : window.scrollY;
    sessionStorage.setItem('ev:scrollTop', String(scrollTop));
    sessionStorage.setItem('ev:fromView', 'representatives');
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
      // SCHOOL: prepend school district name (e.g. "Los Angeles Unified Board of Education")
      if (pol.district_type === 'SCHOOL' && pol.government_name) {
        const schoolName = pol.government_name.split(',')[0];
        const raw = cleanChamber ? `${schoolName} ${cleanChamber}` : schoolName;
        return pol.government_body_name ? simplifyForBody(raw, pol) : raw;
      }
      // Executive/officer positions: prefer office_title (e.g. "Mayor", "Governor", "Sheriff")
      if (/(_EXEC)$/.test(pol.district_type) || pol.district_type === 'COUNTY')
        return qualify(cleanTitle || cleanChamber, pol);
      // LOCAL admin officers (clerk, treasurer, auditor, recorder, assessor): use office_title
      // so the card shows "City Clerk" rather than the chamber name they share with council members
      if (pol.district_type === 'LOCAL' && /\b(clerk|treasurer|auditor|recorder|assessor)\b/i.test(cleanTitle))
        return qualify(cleanTitle, pol);
      // Default: prefer chamber_name (e.g. "City Council", "State Senate")
      return qualify(cleanChamber || cleanTitle, pol);
    })();

    const subtitle = (() => {
      let base;
      if (dashIdx > 0) base = normalizeDistrictSubtitle(cleanTitle.slice(dashIdx + 3));
      // NATIONAL_JUDICIAL: show role (e.g. "Chief Justice", "Associate Justice")
      else if (pol.district_type === 'NATIONAL_JUDICIAL') base = cleanTitle;
      else if (pol.district_id && /^[1-9]\d*$/.test(pol.district_id))
        base = `District ${pol.district_id}`;
      else if (pol.district_id === '0' && !/(_EXEC)$/.test(pol.district_type))
        base = 'At-Large';
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
    return (
      <div key={pol.id} data-pol-id={pol.id} style={{ height: '100%' }}>
        <PoliticianCard
          id={pol.id}
          imageSrc={imgData.url}
          name={`${pol.first_name} ${pol.last_name}`}
          title={cardTitle}
          subtitle={subtitle}
          imageFocalPoint={imgData.focalPoint || 'center 20%'}
          style={isCandidate ? { borderLeft: '4px solid #fed12e', backgroundColor: '#fffef5' } : {}}
          onClick={() => {
            if (isCandidate) {
              const scrollTop = isDesktop ? mainRef.current?.scrollTop ?? 0 : window.scrollY;
              sessionStorage.setItem('ev:scrollTop', String(scrollTop));
              navigate(`/candidate/${pol.id}`);
            } else {
              handlePoliticianClick(pol.id);
            }
          }}
          variant="horizontal"
          footer={
            <IconOverlay
              ballot={ballot}
              hasStances={hasStances}
              branch={branch}
              onCompassClick={hasStances ? (e) => {
                setPreviewPol({
                  id: pol.id,
                  name: `${pol.first_name} ${pol.last_name}`,
                  shortTitle: formatLegendName(pol),
                  anchorEl: e.currentTarget,
                });
              } : undefined}
            />
          }
        />
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
    <div className="min-h-screen bg-[var(--ev-bg-light)]">

      {/* Page body: two-panel layout filling viewport below SiteHeader */}
      <div
        style={{ height: 'calc(100vh - 75px)' }}
        className={isDesktop ? 'flex overflow-hidden' : 'flex flex-col'}
      >
        {/* Filter Sidebar — desktop only */}
        {isDesktop && (
          <LocalFilterSidebar
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            appointedFilter={appointedFilter}
            onAppointedFilterChange={setAppointedFilter}
            locationLabel={locationLabel}
            buildingImageSrc={activeBuildingImage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {/* Main Content — independently scrollable on desktop */}
        <main
          ref={mainRef}
          className="flex-1"
          style={isDesktop ? { overflowY: 'auto', minWidth: 0 } : { overflowY: 'auto' }}
        >
          {/* Search Mode Toggle + Search Bar */}
          <div className="px-4 sm:px-8 py-3 border-t border-gray-200 bg-[var(--ev-bg-light)]">
            {/* Mode toggle */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setSearchMode('address'); setBrowseResults(null); }}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  searchMode === 'address'
                    ? 'bg-[var(--ev-teal)] text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Search by Address
              </button>
              <button
                onClick={() => setSearchMode('browse')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  searchMode === 'browse'
                    ? 'bg-[var(--ev-teal)] text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                Browse by Location
              </button>
            </div>

            {searchMode === 'address' ? (
              <>
                <div className="flex gap-3">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                    placeholder="Enter your full street address"
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]"
                  />
                  <button
                    onClick={handleAddressSearch}
                    disabled={!addressInput.trim()}
                    className="px-6 py-2 font-bold text-white bg-[var(--ev-teal)] rounded-lg
                               hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </>
            ) : (
              <LocationBrowser
                onResults={(data, areaName, state) => {
                  setBrowseResults(data);
                  if (areaName) {
                    setAddressInput(`${areaName}, ${state}`);
                  }
                }}
                onLoading={setBrowseLoading}
              />
            )}
          </div>

          {/* Tab toggle — Representatives / Elections */}
          {activeQuery && (
            <div className="flex border-b border-[#E2EBEF] px-4 sm:px-8">
              <button
                className={`px-4 py-3 text-sm min-h-[44px] transition-colors ${
                  activeView === 'representatives'
                    ? 'text-[#00657C] font-semibold border-b-2 border-[#00657C]'
                    : 'text-[#718096] font-normal hover:text-[#4A5568]'
                }`}
                onClick={() => switchView('representatives')}
              >
                Representatives
              </button>
              <button
                className={`px-4 py-3 text-sm min-h-[44px] transition-colors flex items-center gap-1 ${
                  activeView === 'elections'
                    ? 'text-[#00657C] font-semibold border-b-2 border-[#00657C]'
                    : 'text-[#718096] font-normal hover:text-[#4A5568]'
                }`}
                onClick={() => switchView('elections')}
              >
                <span className="sm:hidden">Elections</span>
                <span className="hidden sm:inline">
                  {electionsLabelSuffix ? `Elections - ${electionsLabelSuffix}` : 'Elections'}
                </span>
                {electionsData && electionsData.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#FED12E] ml-1 animate-pulse" />
                )}
              </button>
            </div>
          )}

          {activeView === 'representatives' ? (
          <>
          {/* Area label — shown when we have a backend-validated formatted address */}
          {formattedAddress && phase === 'fresh' && list.length > 0 && (
            <div className="px-4 sm:px-8 pb-2">
              <p className="text-sm text-gray-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Showing representatives for <span className="font-semibold text-gray-700">{toAddressTitleCase(formattedAddress)}</span>
              </p>
            </div>
          )}

          {/* Mobile filter controls — shown only on mobile */}
          {!isDesktop && (
            <div className="px-4 py-3 bg-white border-b border-gray-200">
              {/* Tier filter pills */}
              <div className="flex gap-2 mb-3">
                {['All', 'Local', 'State', 'Federal'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedFilter === filter
                        ? 'bg-[#00657c] text-white border-[#00657c]'
                        : 'bg-white text-gray-600 border-gray-300'
                    }`}
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              {/* Type filter — elected/appointed (per D-02) */}
              <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                <SegmentedControl
                  options={[
                    { value: 'All', label: 'All' },
                    { value: 'Elected', label: 'Elected' },
                    { value: 'Appointed', label: 'Appointed' },
                  ]}
                  value={appointedFilter}
                  onChange={setAppointedFilter}
                  ariaLabel="Filter by type"
                  minHeight="44px"
                />
              </div>

              {/* Name search */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]"
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                />
              </div>
            </div>
          )}

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
            <div className="px-4 md:px-8 pt-6">
              <SkeletonSection />
              <SkeletonSection />
              <SkeletonSection />
            </div>
          )}

          {/* Results */}
          {phase !== 'loading' && (
              <div className="px-4 md:px-8 pt-6 pb-8">
                {/* Empty states for tiers with no data */}
                {phase !== 'loading' && activeQuery && ['Local', 'State'].map((tier) => {
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
                    <div key={`empty-${tier}`} data-tier={tier} className="-mx-4 md:-mx-8 px-4 md:px-8 py-3" style={{ backgroundColor: tierStyle?.bg ?? '#FFFFFF' }}>
                      {selectedFilter === 'All' && (
                        <div className="mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tierStyle?.text }}>{tier}</span>
                        </div>
                      )}
                      <p className="mt-4 text-gray-500">{emptyMessage}</p>
                    </div>
                  );
                })}

                {filteredHierarchy.map(({ tier, bodies }) => {
                  const tierKey = tier.toLowerCase();
                  const tierStyle = tierColors[tierKey];
                  if (!tierStyle) return null;

                  return (
                    <div key={tier} data-tier={tier} className="-mx-4 md:-mx-8 px-4 md:px-8 py-3" style={{ backgroundColor: tierStyle.bg }}>
                      {selectedFilter === 'All' && (
                        <div className="mb-3">
                          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: tierStyle.text }}>{tier}</span>
                        </div>
                      )}
                      {bodies.map((body) => {
                        const treasuryMatch = tier === 'Local'
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
                            {body.subgroups.map((sg) => (
                              <SubGroupSection
                                key={sg.key}
                                title={body.subgroups.length > 1 ? sg.label : undefined}
                                websiteUrl={body.subgroups.length > 1 ? (sg.url || undefined) : undefined}
                              >
                                {sg.pols.map((pol) =>
                                  renderSeatGroup(pol)
                                )}
                              </SubGroupSection>
                            ))}
                          </GovernmentBodySection>
                        );
                      })}
                    </div>
                  );
                })}

                {federalFiltered.length === 0 && phase !== 'loading' && activeQuery && (
                  <p className="text-center text-gray-600 mt-8">
                    No results found for this location.
                  </p>
                )}

                {/* Filter-aware empty state — when appointed filter yields no results but location has politicians */}
                {federalFiltered.length > 0 && appointedFilter !== 'All' &&
                  filteredHierarchy.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No {appointedFilter.toLowerCase()} officials found for this area.
                  </p>
                )}
              </div>
            )}
          </>
          ) : (
            <div className="px-4 md:px-8 pt-6 pb-8">
              {formattedAddress && electionsData && electionsData.length > 0 && (
                <div className="pb-2">
                  <p className="text-sm text-gray-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    Showing elections for <span className="font-semibold text-gray-700">{toAddressTitleCase(formattedAddress)}</span>
                  </p>
                </div>
              )}
              <ElectionsView
                elections={electionsData}
                loading={electionsLoading}
                tierFilter={selectedFilter}
                onCandidateClick={(id) => {
                  const scrollTop = isDesktop
                    ? mainRef.current?.scrollTop ?? 0
                    : window.scrollY;
                  sessionStorage.setItem('ev:scrollTop', String(scrollTop));
                  sessionStorage.setItem('ev:fromView', 'elections');
                  navigate(`/candidate/${id}`);
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Compass popover — rendered at body level via portal */}
      {previewPol && (
        <CompassPreview
          politicianId={previewPol.id}
          politicianName={previewPol.name}
          legendName={previewPol.shortTitle}
          allTopics={allTopics}
          userAnswers={userAnswers}
          selectedTopics={selectedTopics}
          anchorRef={{ current: previewPol.anchorEl }}
          onClose={() => setPreviewPol(null)}
        />
      )}
    </div>
    </Layout>
  );
}
