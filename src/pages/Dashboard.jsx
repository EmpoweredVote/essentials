import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PoliticianGrid from "../components/PoliticianGrid";
import { usePoliticianData } from "../hooks/usePoliticianData";
import {
  classifyCategory,
  STATE_ORDER,
  FEDERAL_ORDER,
  LOCAL_ORDER,
  orderedEntries,
} from "../lib/classify";

function Spinner() {
  return (
    <div className="flex items-center justify-center gap-2 text-zinc-600 mt-4">
      <div className="h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
      <span>Loading results…</span>
    </div>
  );
}

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const zipFromUrl = searchParams.get("zip") || "";
  const queryFromUrl = searchParams.get("q") || "";

  const [zip, setZip] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  // Use the hook for data fetching
  const { data: list, phase, error, formattedAddress } = usePoliticianData(activeQuery);

  useEffect(() => {
    const initial = zipFromUrl || queryFromUrl || "";
    if (initial) {
      setZip(initial);
      setActiveQuery(initial);
    }
  }, [zipFromUrl, queryFromUrl]);

  const onSearchClick = () => {
    const normalized = (zip || "").trim();
    if (!normalized) return;
    setSearchParams({ q: normalized });
    setActiveQuery(normalized);
  };

  // Filter + classify the current list (which may be partial)
  const filteredPols = useMemo(
    () => list.filter((p) => p?.first_name !== "VACANT"),
    [list]
  );

  // Helper to check district type tier
  const isLocalType = (dt) => {
    if (!dt) return false;
    return dt.includes("LOCAL") || dt === "COUNTY" || dt === "SCHOOL" || dt === "JUDICIAL";
  };

  const isStateType = (dt) => {
    if (!dt) return false;
    // JUDICIAL can be state-level for supreme/appellate courts
    return dt.includes("STATE");
  };

  const isFederalType = (dt) => {
    if (!dt) return false;
    return dt.includes("NATIONAL");
  };

  const statePols = useMemo(
    () => filteredPols.filter((p) => isStateType(p?.district_type)),
    [filteredPols]
  );
  const localPols = useMemo(
    () => filteredPols.filter((p) => isLocalType(p?.district_type)),
    [filteredPols]
  );

  // Determine user's state from state-level or local politicians
  const userState = useMemo(() => {
    // Try state politicians first
    for (const p of statePols) {
      if (p.representing_state) return p.representing_state.toUpperCase();
    }
    // Fall back to local politicians
    for (const p of localPols) {
      if (p.representing_state) return p.representing_state.toUpperCase();
    }
    return null;
  }, [statePols, localPols]);

  // Filter federal politicians: only show senators/reps from user's state
  const federalPols = useMemo(() => {
    const allFederal = filteredPols.filter((p) => isFederalType(p?.district_type));
    if (!userState) return allFederal;

    return allFederal.filter((p) => {
      const dt = p?.district_type;
      // NATIONAL_EXEC (President, VP, Cabinet) - show all
      if (dt === "NATIONAL_EXEC") return true;
      // NATIONAL_UPPER (Senate) and NATIONAL_LOWER (House) - only user's state
      if (dt === "NATIONAL_UPPER" || dt === "NATIONAL_LOWER") {
        return p.representing_state?.toUpperCase() === userState;
      }
      // Other federal (if any) - show all
      return true;
    });
  }, [filteredPols, userState]);

  const classified = useMemo(
    () => filteredPols.map((p) => ({ pol: p, cat: classifyCategory(p) })),
    [filteredPols]
  );

  const byTier = useMemo(() => {
    const map = { Federal: {}, State: {}, Local: {}, Unknown: {} };
    for (const { pol, cat } of classified) {
      const tier = map[cat.tier] ? cat.tier : "Unknown";
      if (!map[tier][cat.group]) map[tier][cat.group] = [];
      map[tier][cat.group].push(pol);
    }
    return map;
  }, [classified]);

  const [selectedTab, setSelectedTab] = useState("All");

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex flex-row gap-4 justify-center px-4 sm:px-0">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearchClick();
          }}
          placeholder="Enter your address"
          className="border p-2 mr-2 min-w-0 flex-1 sm:flex-none"
        />
        <button
          onClick={onSearchClick}
          className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 cursor-pointer whitespace-nowrap"
        >
          Search
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded p-4 mt-4 mx-auto max-w-2xl">
          {error}
        </div>
      )}

      {formattedAddress && (
        <p className="text-center text-sm text-zinc-500 mt-2">
          Showing results for <span className="font-medium text-zinc-700">{formattedAddress}</span>
        </p>
      )}

      <div className="flex flex-row justify-center mt-6 border-b-4 border-ev-yellow overflow-x-auto">
        <button
          className={`${
            selectedTab == "All" ? "bg-sky-950 text-white" : ""
          }  px-3 sm:px-6 py-2 text-sm sm:text-base border border-transparent border-b-sky-950 cursor-pointer whitespace-nowrap`}
          onClick={() => setSelectedTab("All")}
        >
          All ({filteredPols.length})
        </button>
        <button
          className={`${
            selectedTab == "Federal" ? "bg-sky-950 text-white" : ""
          }  px-3 sm:px-6 py-2 text-sm sm:text-base border border-transparent border-b-sky-950 cursor-pointer whitespace-nowrap`}
          onClick={() => setSelectedTab("Federal")}
        >
          Federal ({federalPols.length})
        </button>
        <button
          className={`${
            selectedTab == "State" ? "bg-sky-950 text-white" : ""
          }  px-3 sm:px-6 py-2 text-sm sm:text-base border border-transparent border-b-sky-950 cursor-pointer whitespace-nowrap`}
          onClick={() => setSelectedTab("State")}
        >
          State ({statePols.length})
        </button>
        <button
          className={`${
            selectedTab == "Local" ? "bg-sky-950 text-white" : ""
          }  px-3 sm:px-6 py-2 text-sm sm:text-base border border-transparent border-b-sky-950 cursor-pointer whitespace-nowrap`}
          onClick={() => setSelectedTab("Local")}
        >
          Local ({localPols.length})
        </button>
      </div>

      {/* Spinner while warming or loading */}
      {(phase === "warming" || phase === "loading") && <Spinner />}

      <div className="mt-8 px-4 sm:px-8 lg:px-[10%]">
        {selectedTab == "All" && (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Local</span>
              <hr className="flex-1 border-zinc-200" />
            </div>
            <div>
              <PoliticianGrid
                gridTitle={"Local Politicians"}
                polList={localPols}
              />
              {localPols.length === 0 && phase !== "loading" && phase !== "warming" && activeQuery && (
                <p className="mt-4 text-zinc-500">
                  Local representative data is not yet available for this area.
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 mt-10 mb-4">
              <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">State</span>
              <hr className="flex-1 border-zinc-200" />
            </div>
            <PoliticianGrid
              gridTitle={"State Politicians"}
              polList={statePols}
            />
            <div className="flex items-center gap-4 mt-10 mb-4">
              <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Federal</span>
              <hr className="flex-1 border-zinc-200" />
            </div>
            <PoliticianGrid
              gridTitle={"Federal Politicians"}
              polList={federalPols}
            />
          </div>
        )}

        {selectedTab == "Federal" && (
          <div>
            {orderedEntries(byTier.Federal, FEDERAL_ORDER).map(
              ([category, polList]) => (
                <PoliticianGrid
                  key={category}
                  gridTitle={category}
                  polList={polList}
                />
              )
            )}
          </div>
        )}

        {selectedTab == "State" && (
          <div>
            {orderedEntries(byTier.State, STATE_ORDER).map(
              ([category, polList]) => (
                <PoliticianGrid
                  key={category}
                  gridTitle={category}
                  polList={polList}
                />
              )
            )}
          </div>
        )}

        {selectedTab == "Local" && (
          <div>
            {localPols.length === 0 && phase !== "loading" && phase !== "warming" && activeQuery && (
              <p className="mt-4 text-zinc-500">
                Local representative data is not yet available for this area.
              </p>
            )}
            {orderedEntries(byTier.Local, LOCAL_ORDER).map(
              ([category, polList]) => (
                <PoliticianGrid
                  key={category}
                  gridTitle={category}
                  polList={polList}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
