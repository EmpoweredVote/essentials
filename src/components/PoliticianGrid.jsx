import { useState, useMemo, useRef, useEffect } from "react";
import PoliticianCard from "./PoliticianCard";
import {
  GROUP_SORT_OPTIONS,
  makeComparator,
  lastNameKey,
} from "../utils/sorters";

function getImageUrl(pol) {
  if (pol.images && pol.images.length > 0) {
    const defaultImg = pol.images.find((img) => img.type === "default");
    return defaultImg ? defaultImg.url : pol.images[0].url;
  }
  return pol.photo_origin_url;
}

function PoliticianGrid({ gridTitle, polList }) {
  const options = GROUP_SORT_OPTIONS[gridTitle] || [
    {
      id: "name",
      label: "Name",
      cmp: (dir) => makeComparator(lastNameKey, dir),
    },
  ];

  const [openMenu, setOpenMenu] = useState(false);
  const [sortKey, setSortKey] = useState(options[0].id);
  const [dir, setDir] = useState("asc");
  const active = options.find((o) => o.id === sortKey) || options[0];

  const sorted = useMemo(() => {
    const arr = [...polList];
    return arr.sort(active.cmp(dir));
  }, [polList, active, dir]);

  // Close menu on click out/scroll
  const menuRef = useRef(null);
  useEffect(() => {
    if (!openMenu) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpenMenu(false);
    };
    const onScroll = () => setOpenMenu(false);
    window.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onScroll);
    };
  }, [openMenu]);

  return (
    <div className="mt-12">
      <div className="flex flex-row items-center">
        <h1 className="text-sky-900 mr-4 shrink-0 font-bold text-xl">
          {gridTitle}
        </h1>
        <div className="flex-grow h-px bg-gray-500"></div>
        <div
          className="relative isolate flex flex-row items-center gap-4 ml-4 shrink-0 w-34 text-sky-900 z-10"
          ref={menuRef}
        >
          {/* Sort Menu */}
          <button
            onClick={() => setOpenMenu((v) => !v)}
            aria-label="Sort options"
            className="cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
              />
            </svg>
          </button>
          {openMenu && (
            <div className="absolute right-0 top-full mt-2 z-50 rounded-lg bg-white shadow p-2 w-56">
              <div className="text-xs text-gray-500 px-2 py-1">Sort by</div>
              {options.map((o) => (
                <button
                  key={o.id}
                  onClick={() => {
                    setSortKey(o.id);
                    setOpenMenu(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${
                    o.id === sortKey ? "font-semibold" : ""
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {/* Asc/Desc button */}
          <button
            onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
            aria-label="Toggle ascending/descending"
            className="cursor-pointer"
          >
            {dir == "asc" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
                />
              </svg>
            )}
          </button>

          {/* TODO: Search button */}
          <button className="cursor-pointer" aria-label="Filter">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-1 text-xs text-gray-500">
        Sorted by{" "}
        <span className="font-medium">
          {options.find((o) => o.id === sortKey)?.label}
        </span>{" "}
        ({dir})
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((pol) => (
          <PoliticianCard
            key={pol.id}
            id={pol.id}
            imageSrc={getImageUrl(pol)}
            name={`${pol.first_name} ${pol.last_name}`}
            title={
              pol.chamber_name_formal || pol.chamber_name || pol.office_title
            }
          />
        ))}
      </div>
    </div>
  );
}

export default PoliticianGrid;
