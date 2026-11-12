// lib/copernicus.js
//
// Copernicus Marine Service client for pH and dissolved oxygen.
//
// HONEST PREAMBLE — read this before editing:
// --------------------------------------------
// Copernicus Marine Service is the right scientific source for marine
// biogeochemistry (pH, dissolved oxygen, etc.) at global, near-real-
// time, gridded resolution. Their officially supported programmatic
// access path is the Python `copernicusmarine` toolbox. Direct point
// queries from Node.js are POSSIBLE but involve:
//
//   • Authenticating against auth.marine.copernicus.eu
//   • Submitting a subset request that returns a NetCDF file
//   • Parsing NetCDF (binary format) in JavaScript
//
// That's a lot of moving parts for one variable. So this V3 module
// implements the CORRECT ARCHITECTURE — credentials handling, env-var
// gating, graceful null returns — but leaves the actual network call
// as a clearly marked extension point. Three options to fill it in:
//
//   1. Run a small Python sidecar that uses the `copernicusmarine`
//      toolbox and exposes pH/DO over localhost. Easiest.
//   2. Implement a NetCDF subset client here. Most "pure Node.js"
//      but ~200 lines and a NetCDF parsing dependency.
//   3. Use Copernicus WMS GetFeatureInfo (their visualization service)
//      for point queries. Works for some products, not all.
//
// Either way, the rest of the app (route.js, suitability.js, the UI)
// already handles null gracefully — fill this in when you're ready
// and everything else lights up automatically.

// ─── Credentials ─────────────────────────────────────────────────────
// Reads from .env.local (server-side only, never exposed to browser).
function getCredentials() {
  const user = process.env.CMEMS_USER;
  const pass = process.env.CMEMS_PASSWORD;
  if (!user || !pass) return null;
  return { user, pass };
}

export function isCopernicusConfigured() {
  return getCredentials() !== null;
}

// ─── pH (Copernicus GLOBAL_ANALYSISFORECAST_BGC_001_028) ─────────────
// Variable: ph    Depth: surface (0 m)    Units: pH units
//
// Real implementation goes inside the `if (creds)` branch.
// See the preamble above for the three implementation options.
export async function fetchPH(lat, lon) {
  const creds = getCredentials();
  if (!creds) {
    // Credentials not set — let the UI prompt the user.
    return null;
  }

  // ╭─────────────────────────────────────────────────────────────╮
  // │  IMPLEMENT YOUR COPERNICUS CALL HERE.                       │
  // │                                                              │
  // │  Recommended for beginners: run a Python sidecar like        │
  // │     cmems_sidecar.py  --port 8765                            │
  // │  using the copernicusmarine toolbox, then:                   │
  // │                                                              │
  // │  const r = await fetch(                                      │
  // │    `http://localhost:8765/ph?lat=${lat}&lon=${lon}`          │
  // │  );                                                          │
  // │  const { value } = await r.json();                           │
  // │  return value ?? null;                                       │
  // │                                                              │
  // │  Dataset id:  cmems_mod_glo_bgc-car_anfc_0.25_P1D-m          │
  // │  Variable:    ph                                             │
  // ╰─────────────────────────────────────────────────────────────╯
  return null;
}

// ─── Dissolved oxygen (Copernicus GLOBAL_ANALYSISFORECAST_BGC_001_028) ─
// Variable: o2   Depth: surface (0 m)   Units: mmol m⁻³
// We convert to mg/L for display (multiply by 0.032).
export async function fetchDissolvedOxygen(lat, lon) {
  const creds = getCredentials();
  if (!creds) return null;

  // ╭─────────────────────────────────────────────────────────────╮
  // │  IMPLEMENT YOUR COPERNICUS CALL HERE.                       │
  // │                                                              │
  // │  Dataset id:  cmems_mod_glo_bgc-bio_anfc_0.25_P1D-m          │
  // │  Variable:    o2                                             │
  // │  Convert mmol/m³ → mg/L by multiplying by 0.032.             │
  // │                                                              │
  // │  Same sidecar pattern as fetchPH above is recommended.       │
  // ╰─────────────────────────────────────────────────────────────╯
  return null;
}
