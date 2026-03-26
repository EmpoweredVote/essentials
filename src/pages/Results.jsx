import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CategorySection, PoliticianCard, useMediaQuery } from '@chrisandrewsedu/ev-ui';
import { Layout } from '../components/Layout';
import { getSeatBallotStatus } from '../utils/ballotStatus';
import useGooglePlacesAutocomplete from '../hooks/useGooglePlacesAutocomplete';
import LocalFilterSidebar from '../components/LocalFilterSidebar';
import CompassPreview from '../components/CompassPreview';
import { usePoliticianData } from '../hooks/usePoliticianData';
import {
  classifyCategory,
  STATE_ORDER,
  FEDERAL_ORDER,
  LOCAL_ORDER,
  orderedEntries,
  getDisplayName,
} from '../lib/classify';
import { GROUP_SORT_OPTIONS, chainComparators } from '../utils/sorters';
import { getBuildingImages, parseStateFromAddress } from '../lib/buildingImages';
import { fetchCandidates, fetchMyRepresentatives } from '../lib/api';
import { useCompass } from '../contexts/CompassContext';
import LocationBrowser from '../components/LocationBrowser';

/** Sort a polList using all sort options for its category, chained as tie-breakers */
function defaultSort(category, polList) {
  const opts = GROUP_SORT_OPTIONS[category];
  if (!opts || opts.length === 0) return polList;
  const chained = chainComparators(...opts.map((o) => o.cmp('asc')));
  return [...polList].sort(chained);
}

/** Stable key that identifies a specific seat (office + district). */
function seatKey(pol) {
  return `${pol.office_title}||${pol.district_type}||${pol.district_id || ''}`;
}

function getImageUrl(pol) {
  if (pol.images && pol.images.length > 0) {
    const defaultImg = pol.images.find((img) => img.type === 'default');
    return defaultImg ? defaultImg.url : pol.images[0].url;
  }
  return pol.photo_origin_url;
}

function formatElectionDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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


/**
 * Sub-groups a polList by government_body_name.
 * Returns an array of { title, websiteUrl, pols } objects:
 * - Named sub-groups (sorted alphabetically by body name) come first.
 * - Politicians without a government_body_name fall into an unnamed bucket
 *   using getDisplayName(category) as the title.
 */
function splitByBodyName(category, polList) {
  // Don't split judiciary by body name — group all circuit/superior court judges together
  if (category === 'Local Judiciary') {
    return [{ title: getDisplayName(category), websiteUrl: undefined, pols: polList }];
  }

  const named = {};
  const unnamed = [];

  for (const pol of polList) {
    if (pol.government_body_name) {
      if (!named[pol.government_body_name]) {
        named[pol.government_body_name] = [];
      }
      named[pol.government_body_name].push(pol);
    } else {
      unnamed.push(pol);
    }
  }

  const result = Object.keys(named)
    .sort()
    .map((bodyName) => ({
      title: bodyName,
      websiteUrl: named[bodyName][0]?.government_body_url || undefined,
      pols: named[bodyName],
    }));

  if (unnamed.length > 0) {
    result.push({
      title: getDisplayName(category),
      websiteUrl: undefined,
      pols: unnamed,
    });
  }

  return result;
}

export default function Results() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryFromUrl = searchParams.get('q') || '';

  // Search mode: 'address' or 'browse'
  const [searchMode, setSearchMode] = useState('address');
  // Browse results injected directly into the list
  const [browseResults, setBrowseResults] = useState(null);
  const [browseLoading, setBrowseLoading] = useState(false);

  // Address bar state
  const [addressInput, setAddressInput] = useState(
    queryFromUrl ? decodeURIComponent(queryFromUrl) : ''
  );
  const [hasValidSelection, setHasValidSelection] = useState(!!queryFromUrl);
  const [showSelectionHint, setShowSelectionHint] = useState(false);

  // Search counter — incrementing this forces usePoliticianData to re-fetch
  // even when the query text hasn't changed (re-search same location edge case)
  const [searchKey, setSearchKey] = useState(0);

  const addressInputRef = useRef(null);
  const mainRef = useRef(null);

  // Detect desktop breakpoint for two-panel layout
  const isDesktop = useMediaQuery('(min-width: 769px)');

  const { loadError } = useGooglePlacesAutocomplete(addressInputRef, {
    onPlaceSelected: (formattedAddress) => {
      setAddressInput(formattedAddress);
      setHasValidSelection(true);
      setShowSelectionHint(false);
      // Do NOT clear cache or navigate — user must click Search.
      // Cache clearing happens in handleAddressSearch when the user
      // actually submits. Clearing here would flip `enabled` in the
      // data hook while the URL still points at the *old* query,
      // causing a spurious re-fetch of the previous results.
    },
  });

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

  // Sync backend-validated formatted address into address bar
  useEffect(() => {
    if (formattedAddress) {
      setAddressInput(formattedAddress);
      setHasValidSelection(true);
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

  const [searchQuery, setSearchQuery] = useState('');

  // Scroll-spy tier tracking for building image swap
  const [scrollActiveTier, setScrollActiveTier] = useState('Local');

  // Candidate toggle state
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidateData, setCandidateData] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Compass integration — context provides politician IDs with stances + user data
  const { politicianIdsWithStances, allTopics, userAnswers, selectedTopics, userJurisdiction, compassLoading } = useCompass();

  // Prefilled mode: Connected user with jurisdiction — fetch their reps directly (no geocoding)
  const isPrefilled = searchParams.get('prefilled') === 'true';
  useEffect(() => {
    if (!isPrefilled || compassLoading) return;
    setSearchMode('browse');
    setBrowseLoading(true);
    fetchMyRepresentatives().then(({ data, error }) => {
      if (!error) {
        setBrowseResults(data);
        // Show the user's county (or district) name in the address bar
        const label = userJurisdiction?.county_name || userJurisdiction?.congressional_district_name || 'Your area';
        setAddressInput(label);
        setHasValidSelection(true);
      }
      setBrowseLoading(false);
    });
  }, [isPrefilled, compassLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
          timestamp: Date.now(),
        }));
      }
    }
  }, [list, phase, selectedFilter, queryFromUrl]);

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

  // Fetch candidates only when toggle is on
  useEffect(() => {
    if (!showCandidates || !activeQuery) {
      setCandidateData([]);
      return;
    }

    let cancelled = false;
    setCandidatesLoading(true);

    fetchCandidates(activeQuery).then((data) => {
      if (!cancelled) {
        setCandidateData(data || []);
        setCandidatesLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [showCandidates, activeQuery]);

  // Address bar handlers
  const handleInputChange = (e) => {
    setAddressInput(e.target.value);
    setHasValidSelection(false);
    setShowSelectionHint(false);
  };

  const handleAddressSearch = () => {
    if (!hasValidSelection) {
      setShowSelectionHint(true);
      return;
    }
    setCachedResult(null);
    sessionStorage.removeItem('ev:results');
    setSearchKey(k => k + 1);
    setSearchParams({ q: addressInput });
  };

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

  const classified = useMemo(
    () => federalFiltered.map((p) => ({ pol: p, cat: classifyCategory(p) })),
    [federalFiltered]
  );

  // Classify candidates (only when toggle is on)
  const classifiedCandidates = useMemo(() => {
    if (!showCandidates || candidateData.length === 0) return [];
    return candidateData.map((c) => ({
      pol: { ...c },
      cat: classifyCategory(c),
    }));
  }, [showCandidates, candidateData]);

  // Map seatKey → [candidates] so renderSeatGroup can look up challengers per incumbent
  const candidateBySeat = useMemo(() => {
    const map = new Map();
    for (const c of candidateData) {
      const key = seatKey(c);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    return map;
  }, [candidateData]);

  const byTier = useMemo(() => {
    const map = { Local: {}, State: {}, Federal: {}, Unknown: {} };
    const seen = new Set();
    const incumbentSeats = new Set();

    for (const { pol, cat } of classified) {
      // Deduplicate by name + office to handle same person with different external IDs.
      // Include is_vacant in key to prevent vacant/filled collisions on the same seat.
      const key = `${pol.first_name}-${pol.last_name}-${pol.office_title}-${cat.group}-${pol.is_vacant || false}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const tier = map[cat.tier] ? cat.tier : 'Unknown';
      if (!map[tier][cat.group]) map[tier][cat.group] = [];
      map[tier][cat.group].push(pol);
      incumbentSeats.add(seatKey(pol));
    }

    // Only add orphaned challengers: open seats where no incumbent appears in the
    // main results. Challengers whose seat has a known incumbent are rendered inline
    // by renderSeatGroup so we skip them here to avoid duplication.
    for (const { pol, cat } of classifiedCandidates) {
      if (pol.is_incumbent) continue; // already in map as a sitting rep
      if (incumbentSeats.has(seatKey(pol))) continue; // rendered inline via renderSeatGroup
      const key = `${pol.first_name}-${pol.last_name}-${pol.office_title}-${cat.group}-${pol.is_vacant || false}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const tier = map[cat.tier] ? cat.tier : 'Unknown';
      if (!map[tier][cat.group]) map[tier][cat.group] = [];
      map[tier][cat.group].push(pol);
    }

    return map;
  }, [classified, classifiedCandidates]);

  // Filter by selected level
  const displayedPoliticians = useMemo(() => {
    if (selectedFilter === 'All') {
      return byTier;
    }
    return {
      [selectedFilter]: byTier[selectedFilter] || {},
    };
  }, [byTier, selectedFilter]);

  // Search filter
  const searchFilteredPoliticians = useMemo(() => {
    if (!searchQuery.trim()) return displayedPoliticians;

    const query = searchQuery.toLowerCase();
    const result = {};

    Object.entries(displayedPoliticians).forEach(([tier, groups]) => {
      result[tier] = {};
      Object.entries(groups).forEach(([group, pols]) => {
        const filtered = pols.filter(
          (p) =>
            p.first_name?.toLowerCase().includes(query) ||
            p.last_name?.toLowerCase().includes(query) ||
            p.office_title?.toLowerCase().includes(query)
        );
        if (filtered.length > 0) {
          result[tier][group] = filtered;
        }
      });
    });

    return result;
  }, [displayedPoliticians, searchQuery]);

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
      // SCHOOL: prepend school district name (e.g. "Los Angeles Unified Board of Education")
      if (pol.district_type === 'SCHOOL' && pol.government_name) {
        const schoolName = pol.government_name.split(',')[0];
        const raw = cleanChamber ? `${schoolName} ${cleanChamber}` : schoolName;
        return pol.government_body_name ? simplifyForBody(raw, pol) : raw;
      }
      // Executive/officer positions: prefer office_title (e.g. "Mayor", "Governor", "Sheriff")
      if (/(_EXEC)$/.test(pol.district_type) || pol.district_type === 'COUNTY')
        return qualify(cleanTitle || cleanChamber, pol);
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
        <div key={pol.id || `vacant-${pol.office_title}`} style={{ opacity: 0.55 }}>
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
    const ballot = !isCandidate && getSeatBallotStatus(pol.term_end, pol.term_date_precision);

    return (
      <div key={pol.id} data-pol-id={pol.id}>
        <PoliticianCard
          id={pol.id}
          imageSrc={getImageUrl(pol)}
          name={`${pol.first_name} ${pol.last_name}`}
          title={cardTitle}
          subtitle={subtitle}
          badge={ballot ? "On Ballot" : undefined}
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
          onCompassClick={hasStances ? () => {
            const cardEl = document.querySelector(`[data-pol-id="${pol.id}"] .ev-compass-button`);
            setPreviewPol({
              id: pol.id,
              name: `${pol.first_name} ${pol.last_name}`,
              shortTitle: formatLegendName(pol),
              anchorEl: cardEl,
            });
          } : undefined}
          variant="horizontal"
        />
      </div>
    );
  };

  /**
   * Renders a seat group: the incumbent card plus any challengers immediately
   * after it (animated in). If the incumbent is not running for re-election
   * (no challenger carries is_incumbent: true), the incumbent is hidden and
   * only challengers are shown.
   */
  const renderSeatGroup = (pol) => {
    const sk = seatKey(pol);
    const seatCandidates = showCandidates ? (candidateBySeat.get(sk) || []) : [];
    const challengers = seatCandidates.filter((c) => !c.is_incumbent);
    // incumbentRunning: true when no challengers (uncontested) or when the
    // candidates list includes this same person as is_incumbent: true.
    const incumbentRunning =
      challengers.length === 0 || seatCandidates.some((c) => c.is_incumbent);

    return (
      <Fragment key={pol.id ?? `seat-${sk}`}>
        {incumbentRunning && renderPoliticianCard(pol)}
        {challengers.map((c, i) => (
          <div
            key={c.id}
            className="ev-candidate-enter"
            style={{ '--delay': `${i * 60}ms` }}
          >
            {renderPoliticianCard(c)}
          </div>
        ))}
      </Fragment>
    );
  };

  const candidateCount = candidateData.length;

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
            locationLabel={locationLabel}
            buildingImageSrc={activeBuildingImage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showCandidates={showCandidates}
            onShowCandidatesChange={setShowCandidates}
            candidatesLoading={candidatesLoading}
            candidateCount={candidateCount}
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
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    disabled={loadError}
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)]
                               disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleAddressSearch}
                    disabled={!addressInput.trim() || loadError}
                    className="px-6 py-2 font-bold text-white bg-[var(--ev-teal)] rounded-lg
                               hover:bg-[var(--ev-teal-dark)] disabled:opacity-50 transition-colors"
                  >
                    Search
                  </button>
                </div>
                {loadError && (
                  <p className="mt-1 text-sm text-red-600">
                    Address search is temporarily unavailable. Please try again later.
                  </p>
                )}
                {showSelectionHint && !loadError && (
                  <p className="mt-1 text-sm text-amber-700">
                    Please select an address from the suggestions.
                  </p>
                )}
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

          {/* Area label — shown when we have a backend-validated formatted address */}
          {formattedAddress && phase === 'fresh' && list.length > 0 && (
            <div className="px-4 sm:px-8 pb-2">
              <p className="text-sm text-gray-500" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Showing representatives for <span className="font-semibold text-gray-700">{formattedAddress}</span>
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
              {/* Name search + Candidates toggle row */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
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
                <button
                  onClick={() => setShowCandidates((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-full border-2 transition-all whitespace-nowrap font-medium ${
                    showCandidates
                      ? 'bg-amber-50 border-amber-400 text-amber-800'
                      : 'bg-white border-gray-300 text-gray-600'
                  }`}
                  style={{ fontFamily: "'Manrope', sans-serif" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Candidates
                  {candidatesLoading && (
                    <span style={{ fontSize: '11px', color: '#a0aec0' }}>…</span>
                  )}
                  {showCandidates && candidateCount > 0 && !candidatesLoading && (
                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {candidateCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mx-8 mt-4 mb-4 text-center text-red-600 bg-red-50 border border-red-200 rounded p-4">
              {error}
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
                {Object.entries(searchFilteredPoliticians).map(([tier, groups]) => {
                  const hasGroups = Object.keys(groups).length > 0;

                  // Empty-state for Local/State: when no data but search is active
                  if (!hasGroups && (tier === 'Local' || tier === 'State') && activeQuery) {
                    const isFirst = tier === 'Local';
                    return (
                      <div key={tier} data-tier={tier}>
                        {selectedFilter === 'All' && (
                          <div className={`flex items-center gap-4 ${isFirst ? 'mb-4' : 'mt-10 mb-4'}`}>
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{tier}</span>
                            <hr className="flex-1 border-gray-200" />
                          </div>
                        )}
                        <p className="mt-4 text-gray-500">
                          {tier} representative data is not yet available for this area.
                        </p>
                      </div>
                    );
                  }

                  if (!hasGroups) return null;

                  return (
                    <div key={tier}>
                      {tier === 'Local' && (
                        <div data-tier="Local">
                          {selectedFilter === 'All' && (
                            <div className="flex items-center gap-4 mb-4">
                              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Local</span>
                              <hr className="flex-1 border-gray-200" />
                            </div>
                          )}
                          {orderedEntries(groups, LOCAL_ORDER).map(([category, polList]) =>
                            splitByBodyName(category, polList).map(({ title, websiteUrl, pols }, idx) => (
                              <CategorySection
                                key={`${category}-${title}-${idx}`}
                                title={title}
                                websiteUrl={websiteUrl}
                              >
                                {defaultSort(category, pols).map((pol) =>
                                  renderSeatGroup(pol)
                                )}
                              </CategorySection>
                            ))
                          )}
                        </div>
                      )}

                      {tier === 'State' && (
                        <div data-tier="State">
                          {selectedFilter === 'All' && (
                            <div className="flex items-center gap-4 mt-10 mb-4">
                              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">State</span>
                              <hr className="flex-1 border-gray-200" />
                            </div>
                          )}
                          {orderedEntries(groups, STATE_ORDER).map(([category, polList]) => {
                            // State legislative groups: use government_name to qualify
                            // e.g., "State Senate" → "Indiana State Senate"
                            const stateName = polList[0]?.government_name?.split(',')[0]?.replace(/^State of /, '') || '';
                            const qualifiedTitle = stateName
                              ? `${stateName} ${category.replace('State ', '').replace('State House/Assembly', 'House of Representatives')}`
                              : category;
                            return (
                              <CategorySection
                                key={category}
                                title={qualifiedTitle}
                              >
                                {defaultSort(category, polList).map((pol) =>
                                  renderSeatGroup(pol)
                                )}
                              </CategorySection>
                            );
                          })}
                        </div>
                      )}

                      {tier === 'Federal' && (
                        <div data-tier="Federal">
                          {selectedFilter === 'All' && (
                            <div className="flex items-center gap-4 mt-10 mb-4">
                              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Federal</span>
                              <hr className="flex-1 border-gray-200" />
                            </div>
                          )}
                          {orderedEntries(groups, FEDERAL_ORDER).map(([category, polList]) => {
                            // Federal groups: qualify with state for House reps
                            // e.g., "U.S. House" → "U.S. House of Representatives - Indiana"
                            let qualifiedTitle = category;
                            if (category === 'U.S. House' && polList[0]?.representing_state) {
                              const stateNames = { IN: 'Indiana', CA: 'California' };
                              const stateFull = stateNames[polList[0].representing_state] || polList[0].representing_state;
                              qualifiedTitle = `U.S. House of Representatives - ${stateFull}`;
                            }
                            return (
                              <CategorySection
                                key={category}
                                title={qualifiedTitle}
                              >
                                {defaultSort(category, polList).map((pol) =>
                                  renderSeatGroup(pol)
                                )}
                              </CategorySection>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {federalFiltered.length === 0 && phase !== 'loading' && activeQuery && (
                  <p className="text-center text-gray-600 mt-8">
                    No results found for this location.
                  </p>
                )}
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
