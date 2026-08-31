'use client';

import { useEffect } from 'react';

/**
 * VVU — Landing redirects to the 3D GIS Bench v2.5
 * Passes the Google Maps API key from env to the static HTML via URL param.
 * The HTML reads ?gmaps_key=AIzaSy... and uses it for the 2D map overlay.
 */
export default function Home() {
  useEffect(() => {
    // Read the Google Maps API key from the Next.js public env
    const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const target = gmapsKey
      ? `/vvu-3d-gis-bench.html?gmaps_key=${encodeURIComponent(gmapsKey)}`
      : '/vvu-3d-gis-bench.html';
    window.location.replace(target);
  }, []);
  return null;
}
