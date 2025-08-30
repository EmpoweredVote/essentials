import { useEffect, useState, useMemo } from "react";
import PoliticianGrid from "../components/PoliticianGrid";
import { fetchPoliticians } from "../lib/api";
import {
  classifyCategory,
  STATE_ORDER,
  FEDERAL_ORDER,
  LOCAL_ORDER,
  orderedEntries,
} from "../lib/classify";

function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("All");
  const [data, setData] = useState([]);
  const [zip, setZip] = useState("");

  async function handleSearch() {
    try {
      const result = await fetchPoliticians(zip);
      setData(result);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    handleSearch(zip);
  }, []);

  const filteredPols = useMemo(
    () => data.filter((p) => p?.first_name !== "VACANT"),
    [data]
  );

  const statePols = useMemo(
    () => filteredPols.filter((p) => p?.district_type.includes("STATE")),
    [filteredPols]
  );

  const federalPols = useMemo(
    () => filteredPols.filter((p) => p?.district_type.includes("NATIONAL")),
    [filteredPols]
  );

  const localPols = useMemo(
    () => filteredPols.filter((p) => p?.district_type.includes("LOCAL")),
    [filteredPols]
  );

  const classified = useMemo(() => {
    return filteredPols.map((p) => ({ pol: p, cat: classifyCategory(p) }));
  }, [filteredPols]);

  const byTier = useMemo(() => {
    const map = { Federal: {}, State: {}, Local: {}, Unknown: {} };
    for (const { pol, cat } of classified) {
      const tier = map[cat.tier] ? cat.tier : "Unknown";
      if (!map[tier][cat.group]) map[tier][cat.group] = [];
      map[tier][cat.group].push(pol);
    }
    return map;
  }, [classified]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex flex-row gap-4 justify-center">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter ZIP code"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 cursor-pointer"
        >
          Search
        </button>
      </div>

      <div className="flex flex-row justify-center mt-6">
        <button
          className={`${
            selectedTab == "All" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => {
            setSelectedTab("All");
          }}
        >
          All ({filteredPols.length})
        </button>
        <button
          className={`${
            selectedTab == "Federal" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => {
            setSelectedTab("Federal");
          }}
        >
          Federal ({federalPols.length})
        </button>
        <button
          className={`${
            selectedTab == "State" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => {
            setSelectedTab("State");
          }}
        >
          State ({statePols.length})
        </button>
        <button
          className={`${
            selectedTab == "Local" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => {
            setSelectedTab("Local");
          }}
        >
          Local ({localPols.length})
        </button>
      </div>

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
              {localPols.length == 0 && (
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
            {localPols.length == 0 && (
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
