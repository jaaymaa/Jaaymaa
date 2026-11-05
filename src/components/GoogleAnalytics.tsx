"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackAnalyticsEvent } from "@/lib/analytics";

const PRIVATE_PATHS = ["/admin", "/espace", "/connexion", "/inscription", "/maintenance"];

function isPrivatePage(pathname: string) {
  if (PRIVATE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  return /^\/[^/]+\/(checkout|commande)(\/|$)/.test(pathname);
}

function getSafeInitialReferrer() {
  if (!document.referrer) return undefined;
  try {
    const referrer = new URL(document.referrer);
    if (isPrivatePage(referrer.pathname)) return undefined;
    return `${referrer.origin}${referrer.pathname}`;
  } catch {
    return undefined;
  }
}

export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const previousPublicPath = useRef<string | null | undefined>(undefined);
  const isConfigured = /^G-[A-Z0-9]+$/i.test(measurementId);

  useEffect(() => {
    if (!isConfigured || window.gtag) return;

    window.dataLayer = window.dataLayer || [];
    // Google Tag expects the original arguments object in each dataLayer entry.
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { send_page_view: false });

    const scriptId = "jaayma-google-analytics";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }
  }, [isConfigured, measurementId]);

  useEffect(() => {
    if (!isConfigured || !pathname) return;
    if (isPrivatePage(pathname)) {
      previousPublicPath.current = null;
      return;
    }

    window.gtag?.("event", "page_view", {
      page_title: document.title,
      page_location: `${window.location.origin}${pathname}`,
      page_path: pathname,
      ...(previousPublicPath.current === undefined
        ? { page_referrer: getSafeInitialReferrer() }
        : previousPublicPath.current
          ? { page_referrer: `${window.location.origin}${previousPublicPath.current}` }
          : {}),
    });
    previousPublicPath.current = pathname;
  }, [isConfigured, measurementId, pathname]);

  useEffect(() => {
    if (!isConfigured) return;

    const handleTrackedLink = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLElement>('[data-ga-event="generate_lead"]');
      if (!link) return;
      trackAnalyticsEvent("generate_lead", {
        method: link.dataset.gaMethod || "contact",
        shop_slug: link.dataset.gaShop || "",
      });
    };

    document.addEventListener("click", handleTrackedLink);
    return () => document.removeEventListener("click", handleTrackedLink);
  }, [isConfigured]);

  return null;
}
