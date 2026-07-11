"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { FLEET_STATUS, type FleetStatus } from "@/lib/fleetStatus";

export type MapCar = {
  carId: string;
  name: string;
  regNo: string;
  status: FleetStatus;
  lat: number | null;
  lng: number | null;
};

// Teardrop pin with a small car glyph inside, colored by status — reads better
// at a glance across a satellite yard than a plain dot.
function carPinIcon(color: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="41" viewBox="0 0 34 41">
    <path d="M17 0C7.6 0 0 7.6 0 17c0 12.75 17 24 17 24s17-11.25 17-24C34 7.6 26.4 0 17 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <g transform="translate(8.5,10)" fill="#fff">
      <path d="M1.6 8.6h13.8l-1.7-4.9a1.8 1.8 0 0 0-1.7-1.2H5a1.8 1.8 0 0 0-1.7 1.2L1.6 8.6z"/>
      <rect x="0.2" y="8.6" width="16.6" height="3.6" rx="1.4"/>
      <circle cx="4" cy="12.6" r="1.7" fill="${color}" stroke="#fff" stroke-width="1"/>
      <circle cx="13" cy="12.6" r="1.7" fill="${color}" stroke="#fff" stroke-width="1"/>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(30, 36),
    anchor: new google.maps.Point(15, 36),
  };
}

interface FleetMapProps {
  cars: MapCar[];
  selectedId?: string | null;
  onSelect?: (carId: string) => void;
  height?: number | string;
}

// Default center: New Delhi, used only until the fleet reports its first fix.
const FALLBACK_CENTER = { lat: 28.6139, lng: 77.209 };

// Branded roadmap style — warm, desaturated neutrals with a faint amber cast
// on major roads (echoes the brand accent) instead of Google's default blue
// roads / red POI pins. Only applies when someone switches off satellite —
// Hybrid/Satellite imagery itself can't be restyled.
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f2f0ec" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b5e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f2f0ec" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9c6ba" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#f2f0ec" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dde5d2" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#8a9a78" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e3ded2" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fbf9f5" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f0c9a6" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e8a45e" }] },
  { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9dade" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6b6b5e" }] },
];

export function FleetMap({ cars, selectedId, onSelect, height = 320 }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const onSelectRef = useRef(onSelect);
  const bounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      // A Map ID (configured in Google Cloud Console) is the only way to style
      // labels on Hybrid/Satellite imagery — the inline `styles` array below is
      // silently ignored on those two map types and only affects Roadmap/Terrain.
      const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID;
      mapRef.current = new google.maps.Map(containerRef.current, {
        center: FALLBACK_CENTER,
        zoom: 12,
        // Plain Satellite — no road/place label overlay at all, matching the
        // clean look of the reference tracker. Hybrid adds Google's white
        // street-name overlay back in, which is what looked cluttered.
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        ...(mapId ? { mapId } : { styles: MAP_STYLE }),
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: [google.maps.MapTypeId.SATELLITE, google.maps.MapTypeId.HYBRID, google.maps.MapTypeId.ROADMAP],
        },
        streetViewControl: false,
        fullscreenControl: false,
      });
      infoRef.current = new google.maps.InfoWindow();
    });
    return () => { cancelled = true; };
  }, []);

  // Create/update/remove markers whenever the fleet snapshot changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();
    const bounds = new google.maps.LatLngBounds();
    let hasFix = false;

    for (const car of cars) {
      if (car.lat == null || car.lng == null) continue;
      seen.add(car.carId);
      hasFix = true;
      const pos = { lat: car.lat, lng: car.lng };
      bounds.extend(pos);

      let marker = markersRef.current.get(car.carId);
      if (!marker) {
        marker = new google.maps.Marker({ map, position: pos });
        marker.addListener("click", () => {
          onSelectRef.current?.(car.carId);
          infoRef.current?.setContent(
            `<div style="font:600 12px system-ui;padding:2px 4px;color:#0F0F1A">${car.name}<br/><span style="font-weight:400;color:#75758C">${car.regNo}</span></div>`
          );
          infoRef.current?.open({ map, anchor: marker });
        });
        markersRef.current.set(car.carId, marker);
      } else {
        marker.setPosition(pos);
      }
      marker.setIcon(carPinIcon(FLEET_STATUS[car.status]?.solid ?? FLEET_STATUS.offline.solid));
    }

    markersRef.current.forEach((marker, carId) => {
      if (!seen.has(carId)) {
        marker.setMap(null);
        markersRef.current.delete(carId);
      }
    });

    if (hasFix) {
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.setCenter(bounds.getCenter());
        if (map.getZoom()! < 14) map.setZoom(15);
      } else {
        map.fitBounds(bounds, 60);
      }
    }
  }, [cars]);

  // Pan to and briefly bounce the selected car's marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    const pos = marker.getPosition();
    if (pos) map.panTo(pos);
    marker.setZIndex(999);
    marker.setAnimation(google.maps.Animation.BOUNCE);
    if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
    bounceTimeout.current = setTimeout(() => marker.setAnimation(null), 700);
  }, [selectedId]);

  useEffect(() => () => {
    if (bounceTimeout.current) clearTimeout(bounceTimeout.current);
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height }} className="rounded-2xl" />;
}
