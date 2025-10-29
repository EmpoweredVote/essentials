import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PoliticianGrid from "../components/PoliticianGrid";
import { fetchPoliticians } from "../lib/api";
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

  const [zip, setZip] = useState("");
  const [list, setList] = useState([]);
  const [phase, setPhase] = useState("idle"); // "idle" | "loading" | "partial" | "fresh"
  const [statusHdr, setStatusHdr] = useState(""); // for debugging UI

  const handleSearch = useCallback(async (zipcode) => {
    if (!zipcode || !/^\d{5}$/.test(zipcode)) return;
    try {
      setPhase("loading");
      const { status, data } = await fetchPoliticians(zipcode);
      setList(Array.isArray(data) ? data : []);
      setStatusHdr(status);

      const s = (status || "").toLowerCase();
      if (s === "fresh") {
        setPhase("fresh");
      } else if (s === "stale" || s === "warmed") {
        // Partial or stale-but-present data—render immediately
        setPhase("partial");
      } else {
        // unknown header → treat as loaded
        setPhase("fresh");
      }
    } catch (err) {
      console.error(err);
      setPhase("idle");
    }
  }, []);

  useEffect(() => {
    const initial = zipFromUrl || "";
    if (initial) {
      setZip(initial);
      if (!zipFromUrl) setSearchParams({ zip: initial }, { replace: true });
      handleSearch(initial);
    }
  }, []);

  const onSearchClick = () => {
    const normalized = (zip || "").trim();
    if (!/^\d{5}$/.test(normalized)) return;
    setSearchParams({ zip: normalized });
    handleSearch(normalized);
  };

  // Filter + classify the current list (which may be partial)
  const filteredPols = useMemo(
    () => list.filter((p) => p?.first_name !== "VACANT"),
    [list]
  );

  const statePols = useMemo(
    () => filteredPols.filter((p) => p?.district_type?.includes("STATE")),
    [filteredPols]
  );
  const federalPols = useMemo(
    () => filteredPols.filter((p) => p?.district_type?.includes("NATIONAL")),
    [filteredPols]
  );
  const localPols = useMemo(
    () => filteredPols.filter((p) => p?.district_type?.includes("LOCAL")),
    [filteredPols]
  );

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
      <div className="flex flex-row gap-4 justify-center">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearchClick();
          }}
          placeholder="Enter ZIP code"
          className="border p-2 mr-2"
          inputMode="numeric"
          maxLength={5}
        />
        <button
          onClick={onSearchClick}
          className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Optional tiny debug hint for you */}
      {statusHdr && (
        <div className="text-center text-sm text-zinc-500 mt-2">
          X-Data-Status: {statusHdr} — Phase: {phase}
        </div>
      )}

      <div className="flex flex-row justify-center mt-6">
        <button
          className={`${
            selectedTab == "All" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => setSelectedTab("All")}
        >
          All ({filteredPols.length})
        </button>
        <button
          className={`${
            selectedTab == "Federal" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => setSelectedTab("Federal")}
        >
          Federal ({federalPols.length})
        </button>
        <button
          className={`${
            selectedTab == "State" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => setSelectedTab("State")}
        >
          State ({statePols.length})
        </button>
        <button
          className={`${
            selectedTab == "Local" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => setSelectedTab("Local")}
        >
          Local ({localPols.length})
        </button>
      </div>

      {/* Spinner while loading or (optionally) while partial */}
      {(phase === "loading" || phase === "partial") && <Spinner />}

      <div className="mt-8 px-[10%]">
        {selectedTab == "All" && (
          <div>
            <PoliticianGrid
              gridTitle={"Federal Politicians"}
              polList={federalPols}
            />
            <PoliticianGrid
              gridTitle={"State Politicians"}
              polList={statePols}
            />
            <div>
              <PoliticianGrid
                gridTitle={"Local Politicians"}
                polList={localPols}
              />
              {localPols.length == 0 && phase !== "loading" && (
                <p className="mt-4">
                  Sorry, we don't have data on local politicians for{" "}
                  {zip.length == 5 ? zip : "your zip code"}.
                </p>
              )}
            </div>
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
            {localPols.length == 0 && phase !== "loading" && (
              <p className="mt-4">
                Sorry, we don't have data on local politicians for{" "}
                {zip.length == 5 ? zip : "your zip code"}.
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
