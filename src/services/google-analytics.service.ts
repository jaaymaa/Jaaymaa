import "server-only";

import type { AdminAnalyticsDashboard, AdminAnalyticsRealtime } from "@/types/analytics";

type ServiceAccount = {
  client_email?: string;
  private_key?: string;
};

type ReportRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type ReportResponse = { rows?: ReportRow[] };
type BatchReportResponse = { reports?: ReportResponse[] };

type GoogleConfig = {
  propertyId: string;
  account: ServiceAccount;
};

let cachedAccessToken: { value: string; expiresAt: number } | null = null;
let pendingAccessToken: Promise<string> | null = null;
const dashboardCache = new Map<string, { expiresAt: number; value: AdminAnalyticsDashboard }>();
const pendingDashboards = new Map<string, Promise<AdminAnalyticsDashboard>>();

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function encodeBase64Url(value: string | Uint8Array): string {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value.replace(/-----[^-]+-----/g, "").replace(/\s/g, ""));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function getGoogleConfig(): { config: GoogleConfig | null; missing: string[] } {
  const propertyId = (process.env.GA_PROPERTY_ID || "").trim();
  const serviceAccountJson = process.env.GA_SERVICE_ACCOUNT_JSON || "";
  const missing = [
    ...(!/^\d+$/.test(propertyId) ? ["GA_PROPERTY_ID"] : []),
    ...(!serviceAccountJson ? ["GA_SERVICE_ACCOUNT_JSON"] : []),
  ];
  if (missing.length) return { config: null, missing };

  try {
    const account = JSON.parse(serviceAccountJson) as ServiceAccount;
    if (!account.client_email || !account.private_key) {
      return { config: null, missing: ["GA_SERVICE_ACCOUNT_JSON"] };
    }
    return { config: { propertyId, account }, missing: [] };
  } catch {
    return { config: null, missing: ["GA_SERVICE_ACCOUNT_JSON"] };
  }
}

async function requestAccessToken(account: ServiceAccount): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

  if (!account.client_email || !account.private_key) throw new Error("Google Analytics credentials are incomplete.");
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = encodeBase64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${claims}`;
  const pkcs8 = decodeBase64(account.private_key.replace(/\\n/g, "\n"));
  const signingKey = await crypto.subtle.importKey(
    "pkcs8",
    toArrayBuffer(pkcs8),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signingKey,
    toArrayBuffer(new TextEncoder().encode(unsignedToken))
  );
  const assertion = `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json() as { access_token?: string; expires_in?: number };
  if (!response.ok || !body.access_token) throw new Error("Google Analytics authentication failed.");

  const expiresIn = Math.max(60, Number(body.expires_in) || 3600);
  cachedAccessToken = { value: body.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  return body.access_token;
}

async function getAccessToken(account: ServiceAccount): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }
  if (!pendingAccessToken) {
    pendingAccessToken = requestAccessToken(account).finally(() => {
      pendingAccessToken = null;
    });
  }
  return pendingAccessToken;
}

async function runBatchReports(
  config: GoogleConfig,
  requests: Record<string, unknown>[]
): Promise<ReportResponse[]> {
  const accessToken = await getAccessToken(config.account);
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:batchRunReports`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: requests.map((request) => ({ currencyCode: "XOF", ...request })),
      }),
    }
  );
  if (!response.ok) throw new Error("Google Analytics report request failed.");
  const body = await response.json() as BatchReportResponse;
  if (!body.reports || body.reports.length !== requests.length) {
    throw new Error("Google Analytics returned an incomplete report batch.");
  }
  return body.reports;
}

async function runRealtimeReport(config: GoogleConfig): Promise<ReportResponse> {
  const accessToken = await getAccessToken(config.account);
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dimensions: [{ name: "unifiedScreenName" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        limit: "10",
      }),
    }
  );
  if (!response.ok) throw new Error("Google Analytics realtime request failed.");
  return await response.json() as ReportResponse;
}

function dimension(row: ReportRow | undefined, index: number): string {
  return row?.dimensionValues?.[index]?.value || "";
}

function metric(row: ReportRow | undefined, index: number): number {
  const value = Number(row?.metricValues?.[index]?.value || 0);
  return Number.isFinite(value) ? value : 0;
}

function mapSummary(row: ReportRow | undefined) {
  return {
    activeUsers: metric(row, 0),
    newUsers: metric(row, 1),
    sessions: metric(row, 2),
    pageViews: metric(row, 3),
    engagedSessions: metric(row, 4),
    engagementRate: metric(row, 5),
    averageSessionDuration: metric(row, 6),
    eventCount: metric(row, 7),
    purchases: metric(row, 8),
    revenue: metric(row, 9),
  };
}

function currentRange(days: number) {
  return [{ startDate: `${days}daysAgo`, endDate: "yesterday" }];
}

function previousRange(days: number) {
  return [{ startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` }];
}

function dateLabel(value: string): string {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

const SUMMARY_METRICS = [
  "activeUsers",
  "newUsers",
  "sessions",
  "screenPageViews",
  "engagedSessions",
  "engagementRate",
  "averageSessionDuration",
  "eventCount",
  "ecommercePurchases",
  "purchaseRevenue",
].map((name) => ({ name }));

async function loadGoogleAnalyticsDashboard(days: 7 | 28 | 90 | 365): Promise<AdminAnalyticsDashboard> {
  const { config, missing } = getGoogleConfig();
  if (!config) return { status: "setup_required", propertyId: null, missing, rangeDays: days };

  try {
    const requests = [
      { dateRanges: currentRange(days), metrics: SUMMARY_METRICS },
      { dateRanges: previousRange(days), metrics: SUMMARY_METRICS },
      {
        dateRanges: currentRange(days),
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: "400",
      },
      {
        dateRanges: currentRange(days),
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: "8",
      },
      {
        dateRanges: currentRange(days),
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "8",
      },
      {
        dateRanges: currentRange(days),
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "8",
      },
      {
        dateRanges: currentRange(days),
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "5",
      },
      {
        dateRanges: currentRange(days),
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "8",
      },
      {
        dateRanges: currentRange(days),
        dimensions: [{ name: "landingPagePlusQueryString" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "8",
      },
      {
        dateRanges: currentRange(days),
        dimensions: [{ name: "itemName" }],
        metrics: [{ name: "itemsViewed" }, { name: "itemsAddedToCart" }, { name: "itemsPurchased" }, { name: "itemRevenue" }],
        orderBys: [{ metric: { metricName: "itemsViewed" }, desc: true }],
        limit: "8",
      },
    ];
    const reportBatches = await Promise.all([
      runBatchReports(config, requests.slice(0, 5)),
      runBatchReports(config, requests.slice(5)),
    ]);
    const [
      currentReport,
      previousReport,
      trendReport,
      pagesReport,
      channelsReport,
      countriesReport,
      devicesReport,
      eventsReport,
      landingPagesReport,
      productsReport,
    ] = reportBatches.flat();

    const rows = (report: ReportResponse) => report.rows || [];
    return {
      status: "ready",
      propertyId: config.propertyId,
      rangeDays: days,
      generatedAt: new Date().toISOString(),
      current: mapSummary(rows(currentReport)[0]),
      previous: mapSummary(rows(previousReport)[0]),
      trend: rows(trendReport).map((row) => ({
        date: dateLabel(dimension(row, 0)),
        activeUsers: metric(row, 0),
        sessions: metric(row, 1),
      })),
      topPages: rows(pagesReport).map((row) => ({
        path: dimension(row, 0),
        title: dimension(row, 1),
        views: metric(row, 0),
        users: metric(row, 1),
      })),
      channels: rows(channelsReport).map((row) => ({ name: dimension(row, 0), sessions: metric(row, 0), users: metric(row, 1) })),
      countries: rows(countriesReport).map((row) => ({ name: dimension(row, 0), users: metric(row, 0), sessions: metric(row, 1) })),
      devices: rows(devicesReport).map((row) => ({ name: dimension(row, 0), users: metric(row, 0), sessions: metric(row, 1) })),
      events: rows(eventsReport).map((row) => ({ name: dimension(row, 0), count: metric(row, 0), users: metric(row, 1) })),
      landingPages: rows(landingPagesReport).map((row) => ({ path: dimension(row, 0), sessions: metric(row, 0), users: metric(row, 1) })),
      products: rows(productsReport).map((row) => ({
        name: dimension(row, 0),
        views: metric(row, 0),
        addedToCart: metric(row, 1),
        purchases: metric(row, 2),
        revenue: metric(row, 3),
      })),
    };
  } catch {
    return {
      status: "connection_error",
      propertyId: config.propertyId,
      rangeDays: days,
      message: "Google Analytics n’a pas répondu. Vérifie l’accès lecteur du compte de service et l’activation de l’API Analytics Data.",
    };
  }
}

export function getGoogleAnalyticsDashboard(days: 7 | 28 | 90 | 365): Promise<AdminAnalyticsDashboard> {
  const { config } = getGoogleConfig();
  if (!config) return loadGoogleAnalyticsDashboard(days);

  const key = `${config.propertyId}:${days}`;
  const cached = dashboardCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);

  const pending = pendingDashboards.get(key);
  if (pending) return pending;

  const request = loadGoogleAnalyticsDashboard(days)
    .then((value) => {
      const ttl = value.status === "ready" ? 90_000 : 10_000;
      dashboardCache.set(key, { value, expiresAt: Date.now() + ttl });
      while (dashboardCache.size > 8) {
        const oldestKey = dashboardCache.keys().next().value;
        if (!oldestKey) break;
        dashboardCache.delete(oldestKey);
      }
      return value;
    })
    .finally(() => pendingDashboards.delete(key));
  pendingDashboards.set(key, request);
  return request;
}

export async function getGoogleAnalyticsRealtime(): Promise<AdminAnalyticsRealtime> {
  const { config } = getGoogleConfig();
  if (!config) {
    return { status: "connection_error", message: "La connexion Google Analytics n’est pas encore configurée côté Cloudflare." };
  }

  try {
    const report = await runRealtimeReport(config);
    const rows = report.rows || [];
    return {
      status: "ready",
      generatedAt: new Date().toISOString(),
      activeUsers: rows.reduce((total, row) => total + metric(row, 0), 0),
      views: rows.reduce((total, row) => total + metric(row, 1), 0),
      pages: rows.map((row) => ({ title: dimension(row, 0), users: metric(row, 0), views: metric(row, 1) })),
    };
  } catch {
    return { status: "connection_error", message: "Impossible d’actualiser les données en temps réel." };
  }
}
