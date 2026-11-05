"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RefreshOnResume() {
  const router = useRouter();

  useEffect(() => {
    let wasAway = false;

    const markAway = () => {
      wasAway = true;
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!wasAway) return;
      wasAway = false;
      router.refresh();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshWhenVisible();
      else markAway();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", markAway);
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("pagehide", markAway);
    window.addEventListener("pageshow", refreshWhenVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", markAway);
      window.removeEventListener("focus", refreshWhenVisible);
      window.removeEventListener("pagehide", markAway);
      window.removeEventListener("pageshow", refreshWhenVisible);
    };
  }, [router]);

  return null;
}
