'use client';
import { useEffect } from 'react';
export default function Home() {
  useEffect(() => {
    window.location.replace('/vvu-gis-bench.html');
  }, []);
  return null;
}
