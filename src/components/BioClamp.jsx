// src/components/BioClamp.jsx
import React from "react";

/**
 * Presentational bio block that uses height clamping.
 * Expects the "hook" object returned from useHeightClamp.
 */
export default function BioClamp({ text, hook, className = "" }) {
  const { bioRef, expanded, setExpanded, isClamped, bioMax } = hook;

  // Show the button only if we computed a clamp and either overflow exists or we're expanded
  const showToggle = bioMax != null && (isClamped || expanded);

  return (
    <div
      ref={bioRef}
      className={[
        "relative text-sky-900 whitespace-pre-line",
        "transition-[max-height] duration-300 ease-out",
        isClamped && !expanded
          ? "overflow-hidden after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-10 after:bg-gradient-to-t after:from-white after:to-transparent"
          : "",
        className,
      ].join(" ")}
      style={
        {
          // note: max-height is controlled inline by the hook effect for smoother transitions
        }
      }
    >
      {text}

      {showToggle && (
        <div className="absolute right-0 bottom-0 translate-y-full md:translate-y-0 md:bottom-0 md:right-4">
          <button
            onClick={() => {
              setExpanded((v) => !v);
              if (
                typeof requestAnimationFrame !== "undefined" &&
                hook?.remeasure
              ) {
                requestAnimationFrame(() => hook.remeasure());
              }
            }}
            aria-expanded={expanded}
            className="mt-2 md:mt-0 rounded bg-white/80 px-2 py-1 text-sm font-semibold text-sky-700 hover:underline"
          >
            {expanded ? "See less" : "See more"}
          </button>
        </div>
      )}
    </div>
  );
}
