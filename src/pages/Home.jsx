// import { useState } from "react";
// import { usePoliticianData } from "../hooks/usePoliticianData";
// import { useNavigate } from "react-router-dom";

// function Home() {
//   const [zip, setZip] = useState("");
//   const { data, phase, error } = usePoliticianData(zip);

//   // Hook automatically fetches when zip changes
//   // No manual handleSearch needed

//   return (
//     <div>
//       <div className="p-4">
//         <input
//           value={zip}
//           onChange={(e) => setZip(e.target.value)}
//           placeholder="Enter ZIP code"
//           className="border p-2 mr-2"
//         />
//         {phase === "checking" && <span>Checking cache...</span>}
//         {phase === "warming" && <span>Warming cache...</span>}
//         {phase === "loading" && <span>Loading...</span>}
//         {error && <span className="text-red-500">{error}</span>}

//         {data && (
//           <pre className="mt-4 bg-gray-100 p-4">
//             {JSON.stringify(data, null, 2)}
//           </pre>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Home;
