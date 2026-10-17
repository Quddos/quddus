"use client";

import { useEffect, useState } from "react";

type XRSystemLike = EventTarget & { isSessionSupported: (m: string) => Promise<boolean> };

// True when this browser can start an immersive VR session (Quest browser, PC VR).
export function useVrSupport() {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: XRSystemLike }).xr;
    if (!xr) return;
    const check = () => xr.isSessionSupported("immersive-vr").then(setSupported).catch(() => setSupported(false));
    check();
    xr.addEventListener("devicechange", check);
    return () => xr.removeEventListener("devicechange", check);
  }, []);
  return supported;
}
