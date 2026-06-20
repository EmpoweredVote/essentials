# Empowered Essentials

The Essentials tool answers "who represents me?" — a voter enters where they live and sees every official and
race across all levels of government for that location. This glossary fixes the language for how a location is
resolved into representatives.

## Language

**Alpha Community**:
A jurisdiction Essentials has fully ingested and curated (covered cities/areas, currently a fixed set per
state). Coverage is what distinguishes "we can show this" from "not available yet" — many flows branch on it.
_Avoid_: pilot area, supported region.

**Address Search**:
The flow where a voter enters a precise street address; the address is geocoded to a point and matched to the
exact districts that contain it. The most precise way to find representatives.
_Avoid_: lookup, rep finder.

**Browse-by-Location**:
The flow where a voter picks (or is routed to) a place — state → area — and sees every representative whose
jurisdiction overlaps that place, without geocoding a specific parcel. Inherently broader than Address Search.
_Avoid_: explore mode, area search.

**Locality Fallback**:
When a search resolves to a city/town rather than a street address, the automatic routing of that query into
Browse-by-Location for the city, accompanied by a precision banner. See [ADR-0001](docs/adr/0001-city-search-locality-fallback.md).
_Avoid_: city search (that's the user input, not the behaviour).
