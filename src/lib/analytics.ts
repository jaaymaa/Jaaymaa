export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
};

type AnalyticsValue = string | number | boolean | AnalyticsItem[] | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackAnalyticsEvent(name: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}
