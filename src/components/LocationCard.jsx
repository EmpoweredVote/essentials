import { useState } from "react";

function LocationCard({ zip }) {
  console.log(zip);
  return (
    <div className="flex max-w-64 h-auto flex-col gap-2 rounded-lg bg-white text-center shadow-lg">
      <img
        src="https://www.wanderbig.com/wp-content/uploads/2021/07/wb-bainbridge-island.jpg.webp"
        // className="absolute inset-0 h-full w-full object-cover"
      />
      {zip.length == 5 ? (
        <div className="p-2">
          <h1 className="text-sky-950 font-bold text-lg">Your Zip Code:</h1>
          <h1>{zip}</h1>
        </div>
      ) : (
        <h1 className="p-2">Enter a zip code to continue</h1>
      )}
    </div>
  );
}

export default LocationCard;
