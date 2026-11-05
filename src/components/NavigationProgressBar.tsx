"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  // When route changes, complete the loading bar immediately
  useEffect(() => {
    if (loading) {
      clearAllTimers();
      setProgress(100);
      const t = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
      timersRef.current.push(t);
    }
  }, [pathname, searchParams, loading]);

  // Listen to clicks on internal navigation links
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        targetAttr === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) {
          // If it's the exact same URL + hash, skip
          if (url.pathname === window.location.pathname && url.search === window.location.search) {
            return;
          }

          clearAllTimers();
          setLoading(true);
          setProgress(35);

          // Simulated progress increment for immediate tactile feedback
          const t1 = setTimeout(() => setProgress((p) => (p < 75 ? 75 : p)), 120);
          const t2 = setTimeout(() => setProgress((p) => (p < 92 ? 92 : p)), 350);
          // Safety timeout
          const t3 = setTimeout(() => {
            setLoading(false);
            setProgress(0);
          }, 8000);

          timersRef.current.push(t1, t2, t3);
        }
      } catch {
        // invalid URL, ignore
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      clearAllTimers();
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3.5px] bg-transparent"
    >
      <div
        className="h-full transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(90deg, #FFC83D 0%, #FF9B21 50%, #C8265A 100%)",
          boxShadow: "0 0 12px rgba(255, 200, 61, 0.9), 0 0 6px rgba(200, 38, 90, 0.6)",
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
