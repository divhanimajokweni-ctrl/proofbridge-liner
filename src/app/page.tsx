'use client';

import { useEffect } from 'react';

/**
 * VVU — Landing redirects to the 3D GIS Bench
 * The 3D rendering IS the landing page.
 * The GIS Bench has a glass nav bar with links to all other tools.
 */
export default function Home() {
  useEffect(() => {
    window.location.replace('/vvu-gis-bench.html');
  }, []);
  return null;
}
