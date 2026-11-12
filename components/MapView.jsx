"use client";

import { useEffect } from "react";
import {
MapContainer,
TileLayer,
Marker,
useMapEvents,
useMap,
} from "react-leaflet";
import L from "leaflet";

// Fix Leaflet's default marker paths under bundlers
if (typeof window !== "undefined") {
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
iconRetinaUrl:
"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
iconUrl:
"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
shadowUrl:
"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
}

// Marker colors
const TONE_COLORS = {
good: "#34d399",
signal: "#22d3ee",
warm: "#fbbf24",
danger: "#f87171",
mist: "#6b7a96",
};

function makePulseIcon(tone = "mist") {
if (typeof window === "undefined") return null;

const color = TONE_COLORS[tone] ?? TONE_COLORS.mist;

return L.divIcon({
className: "",
html: <div class="marker-pulse" style="color:${color};"></div>,
iconSize: [18, 18],
iconAnchor: [9, 9],
});
}

// Handle map clicks
function ClickHandler({ onClick }) {
useMapEvents({
click(e) {
onClick({
lat: e.latlng.lat,
lon: e.latlng.lng,
});
},
});

return null;
}

// Ensure Leaflet recalculates its dimensions
function MapResizeHandler() {
const map = useMap();

useEffect(() => {
const resize = () => map.invalidateSize();

const timer = setTimeout(resize, 200);
window.addEventListener("resize", resize);

return () => {
  clearTimeout(timer);
  window.removeEventListener("resize", resize);
};

}, [map]);

return null;
}

export default function MapView({
selected,
selectedTone,
onSelect,
}) {
const icon = makePulseIcon(selectedTone);

return (
<MapContainer
center={[35.78, -5.81]}
zoom={6}
minZoom={3}
worldCopyJump
className="h-full w-full"
style={{ height: "100%", width: "100%" }}
>
{/* OpenStreetMap tiles: no CARTO API key required */}
<TileLayer
     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
     url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
     maxZoom={19}
   />

  <MapResizeHandler />

  <ClickHandler onClick={onSelect} />

  {selected && icon && (
    <Marker
      key={`${selected.lat}-${selected.lon}-${selectedTone}`}
      position={[selected.lat, selected.lon]}
      icon={icon}
    />
  )}
</MapContainer>

);
}