import type { Metadata } from "next";
import { getSessionToken } from "@/lib/auth";
import { getAdminAnalytics } from "@/services/admin.service";
import { AdminError } from "../AdminUI";
import AnalyticsDashboard from "./AnalyticsDashboard";

export const metadata: Metadata = { title: "Google Analytics · Administration Jaaymaa" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const [{ days: rawDays }, token] = await Promise.all([searchParams, getSessionToken()]);
  if (!token) return <AdminError message="Votre session a expiré. Reconnectez-vous." />;

  const requestedDays = Number(rawDays);
  const days = ([7, 28, 90, 365].includes(requestedDays) ? requestedDays : 28) as 7 | 28 | 90 | 365;

  try {
    const data = await getAdminAnalytics(days);
    const measurementId = (process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();
    const measurementConfigured = /^G-[A-Z0-9]+$/i.test(measurementId);
    return <AnalyticsDashboard data={data} measurementConfigured={measurementConfigured} />;
  } catch (error) {
    return <AdminError message={error instanceof Error ? error.message : "Impossible de charger Google Analytics."} />;
  }
}
