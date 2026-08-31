'use client';

import { useEffect } from 'react';

/**
 * VVU — Landing redirects to the Synthesized Spatial Intelligence command center.
 * Passes the Google Maps API key from env to the static HTML via URL param.
 * The HTML reads ?gmaps_key=AIzaSy... and uses it for the map overlays.
 */
export default function Home() {
  useEffect(() => {
    // Read the Google Maps API key from the Next.js public env
    const gmapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const target = gmapsKey
      ? `/vvu-spatial-intelligence.html?gmaps_key=${encodeURIComponent(gmapsKey)}`
      : '/vvu-spatial-intelligence.html';
    window.location.replace(target);
  }, []);
  return null;
}
