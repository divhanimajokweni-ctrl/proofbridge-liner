'use client';

import { useEffect } from 'react';

/**
 * VVU — Landing redirects to the 3D GIS Traffic Sim.
 * This is the live 3D rendering with Leaflet map, YOLO tracks, and analytics.
 */
export default function Home() {
  useEffect(() => {
    const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const target = gmapsKey
      ? `/vvu-3d-gis-traffic.html?gmaps_key=${encodeURIComponent(gmapsKey)}`
      : '/vvu-3d-gis-traffic.html';
    window.location.replace(target);
  }, []);
  return null;
}
