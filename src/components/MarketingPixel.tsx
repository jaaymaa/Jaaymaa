"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    TiktokAnalyticsObject?: string;
  }
}

export type PixelEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export interface PixelEventData {
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  order_id?: string;
  [key: string]: unknown;
}

export function trackPixelEvent(
  event: PixelEvent,
  data?: PixelEventData
) {
  if (typeof window === "undefined") return;

  const payload = {
    currency: "XOF",
    ...data,
  };

  // Meta (Facebook & Instagram)
  if (window.fbq) {
    try {
      window.fbq("track", event, payload);
    } catch (e) {
      console.warn("[Meta Pixel track error]", e);
    }
  }

  // TikTok
  if (window.ttq) {
    try {
      const tiktokEventMap: Record<PixelEvent, string> = {
        PageView: "Pageview",
        ViewContent: "ViewContent",
        AddToCart: "AddToCart",
        InitiateCheckout: "InitiateCheckout",
        Purchase: "PlaceAnOrder",
      };
      const ttEvent = tiktokEventMap[event] || event;
      window.ttq.track(ttEvent, payload);
    } catch (e) {
      console.warn("[TikTok Pixel track error]", e);
    }
  }
}

interface MarketingPixelProps {
  facebookPixelId?: string | null;
  tiktokPixelId?: string | null;
  event?: PixelEvent;
  eventData?: PixelEventData;
}

export default function MarketingPixel({
  facebookPixelId,
  tiktokPixelId,
  event = "PageView",
  eventData,
}: MarketingPixelProps) {
  const serializedEventData = JSON.stringify(eventData || {});

  useEffect(() => {
    // ─── 1. META PIXEL (FACEBOOK / INSTAGRAM) ───
    if (facebookPixelId && typeof window !== "undefined") {
      const cleanFbId = facebookPixelId.trim();
      if (cleanFbId) {
        if (!window.fbq) {
          const f = window;
          const b = document;
          const e = "script";
          const v = "https://connect.facebook.net/en_US/fbevents.js";
          const n: any = (f.fbq = function (...args: unknown[]) {
            if (n.callMethod) {
              n.callMethod(...args);
            } else {
              n.queue.push(args);
            }
          });
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = true;
          n.version = "2.0";
          n.queue = [];
          const t = b.createElement(e) as HTMLScriptElement;
          t.async = true;
          t.src = v;
          const s = b.getElementsByTagName(e)[0];
          s?.parentNode?.insertBefore(t, s);

          window.fbq("init", cleanFbId);
        }

        trackPixelEvent(event, eventData);
      }
    }

    // ─── 2. TIKTOK PIXEL ───
    if (tiktokPixelId && typeof window !== "undefined") {
      const cleanTtId = tiktokPixelId.trim();
      if (cleanTtId) {
        if (!window.ttq) {
          (function (w: any, d: any, t: any) {
            w.TiktokAnalyticsObject = t;
            const ttq = (w[t] = w[t] || []);
            ttq.methods = [
              "page",
              "track",
              "identify",
              "instances",
              "debug",
              "on",
              "off",
              "once",
              "ready",
              "alias",
              "group",
              "enableCookie",
              "disableCookie",
            ];
            ttq.setAndDefer = function (target: any, method: any) {
              target[method] = function (...args: unknown[]) {
                target.push([method, ...args]);
              };
            };
            for (let i = 0; i < ttq.methods.length; i++) {
              ttq.setAndDefer(ttq, ttq.methods[i]);
            }
            ttq.instance = function (target: any) {
              const instance = ttq._i[target] || [];
              for (let i = 0; i < ttq.methods.length; i++) {
                ttq.setAndDefer(instance, ttq.methods[i]);
              }
              return instance;
            };
            ttq.load = function (e: any, n: any) {
              const r = "https://analytics.tiktok.com/i18n/pixel/events.js";
              ttq._i = ttq._i || {};
              ttq._i[e] = [];
              ttq._i[e]._u = r;
              ttq._t = ttq._t || {};
              ttq._t[e] = +new Date();
              ttq._o = ttq._o || {};
              ttq._o[e] = n || {};
              const a = d.createElement("script");
              a.type = "text/javascript";
              a.async = true;
              a.src = r + "?sdkid=" + e + "&lib=" + t;
              const c = d.getElementsByTagName("script")[0];
              c?.parentNode?.insertBefore(a, c);
            };

            ttq.load(cleanTtId);
          })(window, document, "ttq");
        }

        trackPixelEvent(event, eventData);
      }
    }
  }, [facebookPixelId, tiktokPixelId, event, serializedEventData, eventData]);

  return null;
}
