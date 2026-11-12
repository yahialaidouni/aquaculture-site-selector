# Aquaculture Site Selector — V3

Interactive map evaluating marine sites across nine environmental
factors, combining weather, satellite oceanography, and (optionally)
Copernicus Marine biogeochemistry.

## Quick start (works immediately)

```bash
npm install
npm run dev
```

Open http://localhost:3000. Click anywhere on the map. You'll get:
- Air weather (Open-Meteo)
- Sea surface temperature + waves (Open-Meteo Marine)
- Salinity, chlorophyll, surface currents (NOAA ERDDAP)
- An aquaculture suitability score (0–100, four-band classification)

**No API keys needed for any of the above.**

## Optional: add pH and dissolved oxygen

These come from Copernicus Marine Service. Free, but requires registration.

### 1. Register

1. Go to https://marine.copernicus.eu/
2. Click **Register** (top-right corner)
3. Fill the form, confirm via email
4. Wait for account activation (usually under an hour)

### 2. Configure credentials

```bash
cp .env.local.example .env.local
```

Then edit `.env.local`:

```
CMEMS_USER=your_username_here
CMEMS_PASSWORD=your_password_here
```

Restart the dev server (`npm run dev`). Credentials live only on the
server — they're never sent to the browser. `.env.local` is gitignored.

### 3. Fill in the integration

Open `lib/copernicus.js`. The structure is in place, but the actual
network call is left as an extension point because Copernicus Marine's
officially supported access is the Python `copernicusmarine` toolbox.

Three paths to choose from (each documented inline in `copernicus.js`):

1. **Python sidecar** (easiest): a tiny Python service using the
   official toolbox, exposed on localhost.
2. **NetCDF subset client** (pure Node.js): authenticate, request a
   subset, parse the NetCDF with `netcdfjs`.
3. **WMS GetFeatureInfo**: works for some Copernicus products.

Until you implement one, pH and dissolved oxygen will show
"Configure Copernicus" in the UI — the rest of the app continues to
function normally with seven other factors.

## Stack

- Next.js 14 (App Router)
- React 18, Tailwind CSS, Leaflet + react-leaflet
- Open-Meteo Weather & Marine APIs (free, no key)
- NOAA ERDDAP servers (free, no key) — SMAP salinity, VIIRS chlorophyll, AOML geostrophic currents
- Copernicus Marine Service (optional, free with registration) — pH, O₂

## Project layout

```
app/
  api/environment/route.js   Backend: combines all sources, scores, returns JSON
  layout.js                  Root layout, fonts, metadata
  page.js                    Main page (map + panel)
  globals.css                Tailwind + design tokens + Leaflet overrides
components/
  MapView.jsx                Leaflet map + click handler (client-only)
  StatsPanel.jsx             Right-side data readout
  MetricCard.jsx             Single-metric tile
  ReasoningList.jsx          Per-factor "why" breakdown
  SuitabilityGauge.jsx       Circular 0–100 gauge
lib/
  openMeteo.js               Open-Meteo client
  erddap.js                  NOAA ERDDAP client (salinity, chl, currents)
  copernicus.js              Copernicus Marine client (pH, O₂) — gated on creds
  suitability.js             Scoring + reasoning engine (9 factors)
```

## Tuning for other species

The scoring engine reads from a single `CRITERIA` object in
`lib/suitability.js`. To retune (e.g. for salmon, tilapia, shellfish):

1. Adjust the `range` object for each criterion (ideal vs. hard limits).
2. Adjust `weight` if a factor matters more or less for your species.
3. Toggle `critical` to let a factor veto the overall verdict.

Nothing else needs to change — the API, UI, and gauge all read from
this config.

## Known limitations

- **ERDDAP latency**: first hit can take 5–15 seconds. The UI shows a
  loading state with a heads-up note.
- **Daily satellite products have gaps**: SMAP and VIIRS miss pixels
  daily due to swath geometry and clouds. If salinity or chlorophyll
  return `null`, switch the dataset IDs in `lib/erddap.js` to the
  8-day or weekly composites for better coverage.
- **Geostrophic currents have ±64.7° latitude coverage** — polar
  regions won't return current data.
- **Copernicus access from Node.js is non-trivial** — see the
  optional setup section above.
