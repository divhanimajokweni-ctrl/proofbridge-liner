'use client';

import { useEffect } from 'react';

/**
 * VVU — Landing redirects to the 3D GIS Traffic Sim.
 * This is the live 3D rendering with Leaflet map, YOLO tracks, and analytics.
 */
export default function Home() {
  useEffect(() => {
    window.location.replace('/vvu-3d-gis-traffic.html');
  }, []);
  return null;
}
