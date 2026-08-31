'use client';

import { useEffect } from 'react';

/**
 * VVU — Landing redirects to the 3D GIS Bench v2.5
 * The 3D rendering IS the landing page.
 * Geolocation centers on device GPS, analytics sidebar slides in from right.
 */
export default function Home() {
  useEffect(() => {
    window.location.replace('/vvu-3d-gis-bench.html');
  }, []);
  return null;
}
