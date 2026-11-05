"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type AutoRefreshProps = {
  intervalMs?: number;
  stopAfterMs?: number;
  stopIfFinished?: boolean;
};

export default function AutoRefresh({
  intervalMs = 30000,
  stopAfterMs = 15 * 60 * 1000, // 15 minutes max
  stopIfFinished = false,
}: AutoRefreshProps) {
  const router = useRouter();
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (stopIfFinished) return;

    const tick = () => {
      // Ne rien faire si l'onglet est masqué ou en arrière-plan
      if (document.visibilityState !== "visible") return;

      // Arrêter le rafraîchissement après la durée limite
      if (Date.now() - startTimeRef.current > stopAfterMs) return;

      router.refresh();
    };

    const interval = window.setInterval(tick, intervalMs);

    // Rafraîchir immédiatement quand l'utilisateur revient sur l'onglet
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, intervalMs, stopAfterMs, stopIfFinished]);

  return null;
}
