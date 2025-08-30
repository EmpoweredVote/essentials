import { useState } from "react";
import { fetchPoliticians } from "../lib/api";
import { useNavigate } from "react-router";

function Home() {
  const [zip, setZip] = useState("");
  const [data, setData] = useState(null);

  async function handleSearch() {
    try {
      const result = await fetchPoliticians(zip);
      setData(result);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="p-4">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter ZIP code"
          className="border p-2 mr-2"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2"
        >
          Search
        </button>

        {data && (
          <pre className="mt-4 bg-gray-100 p-4">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default Home;
