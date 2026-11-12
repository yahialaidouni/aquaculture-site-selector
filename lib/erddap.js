// lib/erddap.js
//
// Client for NOAA ERDDAP servers. We use this for three parameters
// that need real marine observation data: salinity, chlorophyll, and
// surface currents.
//
// Why ERDDAP?
// ----------
//   ERDDAP is a NOAA-designed data server that wraps satellite and
//   model output in a clean, predictable URL pattern. No signup, no
//   API key, no rate limits worth worrying about for development.
//
// URL pattern (griddap):
//   https://{server}/erddap/griddap/{datasetID}.json
//      ?{variable}[(time)][(depth)][(lat)][(lon)]
//
// Example salinity query:
//   https://coastwatch.noaa.gov/erddap/griddap/noaacwSMAPsssDaily.json
//      ?sss[(last)][(0.0)][(35.5)][(-5.8)]
//
// Response shape:
//   { "table": {
//       "columnNames": ["time","altitude","latitude","longitude","sss"],
//       "columnTypes": [...],
//       "columnUnits": [...],
//       "rows":  [ ["2024-..", 0, 35.5, -5.8, 36.42] ]   ← value is last col
//     }
//   }

// 15-second per-request timeout. ERDDAP can be slow on first hit.
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Low-level: hit ERDDAP for a single value at a single point.
 *
 * Returns the numeric value, or null if missing / land / error.
 * Never throws — failing gracefully is critical because we run several
 * of these in parallel and one outage shouldn't break the whole page.
 */
async function fetchPointValue({
  baseUrl,
  datasetId,
  variable,
  lat,
  lon,
  hasAltitude = true,   // most ERDDAP grids include an altitude dim
  time = "last",        // "last" = most recent timestep
}) {
  // Build the dimensional selector: [(time)][(altitude)][(lat)][(lon)]
  const dims = hasAltitude
    ? `[(${time})][(0.0)][(${lat})][(${lon})]`
    : `[(${time})][(${lat})][(${lon})]`;

  const url = `${baseUrl}/griddap/${datasetId}.json?${variable}${dims}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    console.log("ERDDAP URL:", url);
    const res = await fetch(url, { signal: controller.signal });

console.log(
  datasetId,
  "status:",
  res.status,
  res.statusText
);
    if (!res.ok) {
      // 404 typically means "out of dataset bounds" (e.g., on land or
      // outside coverage); we treat that as "no data" not "API error".
      return null;
    }
    const data = await res.json();
    console.log("DATASET:", datasetId);
    console.log(JSON.stringify(data, null, 2));
    const row = data?.table?.rows?.[0];
    if (!row) return null;

    const value = row[row.length - 1];   // value is always last column
    // ERDDAP can return NaN, null, or fillValue for missing pixels
    if (value == null || Number.isNaN(value)) return null;
    return Number(value);
  } catch (err) {
  console.error(
    `ERDDAP ${datasetId}/${variable} failed:`,
    err
  );
  return null;
} finally {
  clearTimeout(timeout);
}
}

// ─── Sea Surface Salinity (SMAP, daily, 0.25°) ───────────────────────
// Dataset: noaacwSMAPsssDaily  on  https://coastwatch.noaa.gov/erddap
// Variable: sss   Units: PSU
//
// Limitation: SMAP is a passive radiometer; near-coast pixels are
// often masked. Daily product has gaps. For consistent values use
// the 8-day composite (noaacwSMAPsss8Day) — same variable name.
export async function fetchSalinity(lat, lon) {
  return fetchPointValue({
    baseUrl:   "https://coastwatch.noaa.gov/erddap",
    datasetId: "noaacwSMAPsssDaily",
    variable:  "sss",
    lat, lon,
    hasAltitude: true,
  });
}

// ─── Chlorophyll-a (VIIRS, daily, 4 km) ──────────────────────────────
// Dataset: nesdisVHNchlaDaily   Variable: chlor_a   Units: mg m⁻³
//
// 4 km resolution, near-real-time. Cloud cover causes daily gaps;
// the weekly version (nesdisVHNchlaWeekly) is more reliable.
export async function fetchChlorophyll(lat, lon) {
  return fetchPointValue({
    baseUrl:   "https://coastwatch.noaa.gov/erddap",
    datasetId: "nesdisVHNchlaDaily",
    variable:  "chlor_a",
    lat, lon,
    hasAltitude: true,
  });
}

// ─── Ocean surface currents (NOAA AOML geostrophic, near real-time) ──
// Dataset: miamicurrents   Variables: u_current, v_current   Units: m/s
//
// Geostrophic currents derived from altimetry. Two variables (eastward
// and northward) get combined into speed + direction below. Coverage
// is global ±64.7° latitude.
export async function fetchCurrents(lat, lon) {
  const base = "https://cwcgom.aoml.noaa.gov/erddap";
  // Fetch both components in parallel
  const [u, v] = await Promise.all([
    fetchPointValue({
      baseUrl:   base,
      datasetId: "miamicurrents",
      variable:  "u_current",
      lat, lon,
      hasAltitude: false,
    }),
    fetchPointValue({
      baseUrl:   base,
      datasetId: "miamicurrents",
      variable:  "v_current",
      lat, lon,
      hasAltitude: false,
    }),
  ]);
  if (u == null || v == null) return null;

  // Convert (east, north) velocity components to speed + compass bearing.
  // Speed = |v|.  Direction = "to which the current flows", 0°=N, 90°=E.
  const speed = Math.sqrt(u * u + v * v);
  const directionTo = (Math.atan2(u, v) * 180 / Math.PI + 360) % 360;
  return { speed, direction: directionTo, u, v };
}
