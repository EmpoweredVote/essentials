import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function getInitials(name) {
  const parts = (name || "").split(" ").filter(Boolean);
  const initials =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0]?.[0] || "?";
  return initials.toUpperCase();
}

function PoliticianCard({ image, imageSrc, name, title, level, id }) {
  const navigate = useNavigate();
  const src = imageSrc || image;
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [src]);

  return (
    <div className="h-full mt-4">
      <div
        className="flex h-full w-full flex-col gap-2 rounded-lg bg-white p-4 text-center shadow-lg cursor-pointer"
        onClick={() => navigate(`/politician/${id}`)}
      >
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-zinc-100">
          {src && !imgError ? (
            <img
              src={src}
              alt={`${name} portrait`}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#00657c] text-white text-2xl font-bold">
              {getInitials(name)}
            </div>
          )}
        </div>
        <h1 className="text-sky-950 font-bold text-lg">{name}</h1>
        <div>
          {/* Eventually add party logo here */}
          <p className="text-sky-900 leading-snug line-clamp-2 min-h-[2.5rem]">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}
export default PoliticianCard;
