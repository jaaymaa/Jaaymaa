"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const SUBSCRIPTION_PATH = "/espace/abonnement";
const REFRESH_INTERVAL_MS = 30_000;
const REFRESH_DEBOUNCE_MS = 3_000;

export default function RefreshSubscriptionPrice() {
  const pathname = usePathname();
  const router = useRouter();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    if (pathname !== SUBSCRIPTION_PATH) return;

    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastRefreshAt.current < REFRESH_DEBOUNCE_MS) return;

      lastRefreshAt.current = now;
      router.refresh();
    };

    // Also refresh when navigating back to a route restored from the client cache.
    refreshIfVisible();

    const interval = window.setInterval(refreshIfVisible, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("pageshow", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("pageshow", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [pathname, router]);

  return null;
}
