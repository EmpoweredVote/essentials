import { useEffect, useState, useMemo } from "react";
import PoliticianGrid from "../components/PoliticianGrid";
import { fetchPoliticians } from "../lib/api";

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

  const statePols = useMemo(
    () => data.filter((p) => p?.district_type === "STATE_EXEC"),
    [data]
  );

  const filteredPols = useMemo(
    () => data.filter((p) => p?.first_name !== "VACANT"),
    [data]
  );

  useEffect(() => {
    console.log(statePols);
  }, [statePols]);

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
      {data && <h1 className="m-4">Data loaded: {data.length}</h1>}
      <div className="flex flex-row justify-center">
        <button
          className={`${
            selectedTab == "All" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => setSelectedTab("All")}
        >
          All
        </button>
        <button
          className={`${
            selectedTab == "Federal" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => setSelectedTab("Federal")}
        >
          Federal
        </button>
        <button
          className={`${
            selectedTab == "State" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => setSelectedTab("State")}
        >
          State
        </button>
        <button
          className={`${
            selectedTab == "Local" ? "bg-sky-950 text-white" : ""
          }  px-16 py-2 border border-transparent border-b-sky-950 cursor-pointer`}
          onClick={() => setSelectedTab("Local")}
        >
          Local
        </button>
      </div>

      <div className="mt-8 px-[10%]">
        {selectedTab == "All" && (
          <PoliticianGrid
            gridTitle={"All Politicians"}
            polList={filteredPols}
          />
        )}

        {selectedTab == "State" && (
          <PoliticianGrid
            gridTitle={"State Executive Cabinet"}
            polList={statePols}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
