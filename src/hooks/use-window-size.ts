"use client";

import { useEffect, useState } from "react";

type WindowSize = { width: number; height: number };

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({ width: 0, height: 0 });

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}
