"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Clock3, Globe2, MousePointerClick, RefreshCw, Smartphone, Users } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import type { AdminAnalyticsDashboard, AdminAnalyticsRealtime } from "@/types/analytics";
import { adminPanelClass, AdminPageTitle } from "../AdminUI";

const RANGES = [
  { days: 7, label: "7 jours" },
  { days: 28, label: "28 jours" },
  { days: 90, label: "90 jours" },
  { days: 365, label: "12 mois" },
] as const;

export default function AnalyticsDashboard({
  data,
  measurementConfigured,
}: {
  data: AdminAnalyticsDashboard;
  measurementConfigured: boolean;
}) {
  const router = useRouter();

  return (
    <>
      <AdminPageTitle
        eyebrow="Audience · acquisition · conversion"
        title="Google Analytics"
        description="Comprends comment les visiteurs découvrent Jaaymaa, explorent les boutiques et passent commande."
      />

      {!measurementConfigured && (
        <div className={`${adminPanelClass()} mb-5 flex items-start gap-3 border-[#9A6500] bg-[#FFF8E3] p-4 text-[#6F4A00]`}>
          <Activity size={19} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-5"><strong>Le tag de mesure n’est pas encore actif.</strong> Configurez <code>GA_MEASUREMENT_ID</code> côté Cloudflare pour commencer à collecter les nouvelles visites.</p>
        </div>
      )}

      {data.status !== "ready" ? (
        <SetupGuide status={data} measurementConfigured={measurementConfigured} />
      ) : (
        <>
          <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Période du rapport" className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border-2 border-ink bg-papier p-1.5 shadow-[3px_3px_0_#0F1E3D]">
              {RANGES.map(({ days, label }) => (
                <Link
                  key={days}
                  href={`/admin/analytics?days=${days}`}
                  aria-current={data.rangeDays === days ? "page" : undefined}
                  className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition-colors ${data.rangeDays === days ? "border border-ink bg-sun text-ink" : "text-muted hover:bg-ink/5 hover:text-ink"}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <button type="button" onClick={() => router.refresh()} className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-ink/15 bg-papier px-3 py-2 text-xs font-bold text-ink hover:bg-white sm:self-auto">
              <RefreshCw size={14} /> Actualiser
            </button>
          </section>

          <RealtimePanel />

          <p className="mb-4 text-[11px] text-muted">Du {formatDate(data.trend[0]?.date)} au {formatDate(data.trend.at(-1)?.date)} · comparé aux {data.rangeDays} jours précédents · mis à jour le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Dakar" }).format(new Date(data.generatedAt))}</p>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-5" aria-label="Indicateurs Google Analytics">
            <MetricCard label="Visiteurs" value={data.current.activeUsers} previous={data.previous.activeUsers} icon={<Users size={17} />} tone="sun" />
            <MetricCard label="Nouveaux visiteurs" value={data.current.newUsers} previous={data.previous.newUsers} icon={<ArrowRight size={17} />} tone="pink" />
            <MetricCard label="Sessions" value={data.current.sessions} previous={data.previous.sessions} icon={<Activity size={17} />} tone="mint" />
            <MetricCard label="Pages vues" value={data.current.pageViews} previous={data.previous.pageViews} icon={<BarChart3 size={17} />} tone="blue" />
            <MetricCard label="Commandes GA4" value={data.current.purchases} previous={data.previous.purchases} icon={<MousePointerClick size={17} />} tone="sun" />
          </section>

          <section className={`${adminPanelClass()} mt-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5`} aria-label="Qualité des visites">
            <QuickMetric label="Taux d’engagement" value={percent(data.current.engagementRate)} note={`${number(data.current.engagedSessions)} sessions engagées`} />
            <QuickMetric label="Durée moyenne" value={duration(data.current.averageSessionDuration)} note="par session" />
            <QuickMetric label="Événements" value={number(data.current.eventCount)} note="interactions mesurées" />
            <QuickMetric label="Revenu e-commerce" value={money(data.current.revenue)} note={`${number(data.current.purchases)} achats suivis`} />
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
            <TrendChart data={data} />
            <section className={`${adminPanelClass()} p-4 sm:p-5`}>
              <Heading icon={<MousePointerClick size={17} />} eyebrow="Parcours d’achat" title="Du produit à la commande" />
              <div className="mt-6 space-y-5">
                <FunnelStep label="Fiches produit consultées" value={sum(data.products, "views")} maximum={sum(data.products, "views")} color="bg-[#0E7C66]" />
                <FunnelStep label="Ajouts au panier" value={sum(data.products, "addedToCart")} maximum={sum(data.products, "views")} color="bg-[#C8265A]" />
                <FunnelStep label="Achats confirmés" value={data.current.purchases} maximum={sum(data.products, "views")} color="bg-[#9A6500]" />
              </div>
              <div className="mt-6 rounded-xl border border-ink/10 bg-ink/[0.03] p-3 text-xs leading-5 text-muted">
                Taux achat / session : <strong className="text-ink">{data.current.sessions ? percent(data.current.purchases / data.current.sessions) : "0 %"}</strong>
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <RankedPanel title="Pages les plus consultées" eyebrow="Contenu" icon={<BarChart3 size={17} />} rows={data.topPages.map((row) => ({ label: row.title || row.path, detail: row.path, value: row.views, suffix: "vues", note: `${number(row.users)} visiteurs` }))} />
            <RankedPanel title="Canaux d’acquisition" eyebrow="Origine des visites" icon={<ArrowRight size={17} />} rows={data.channels.map((row) => ({ label: channelName(row.name), value: row.sessions, suffix: "sessions", note: `${number(row.users)} visiteurs` }))} />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-3">
            <RankedPanel title="Pages d’entrée" eyebrow="Première page visitée" icon={<ArrowRight size={17} />} rows={data.landingPages.map((row) => ({ label: row.path || "Page d’accueil", value: row.sessions, suffix: "sessions", note: `${number(row.users)} visiteurs` }))} compact />
            <RankedPanel title="Pays des visiteurs" eyebrow="Géographie" icon={<Globe2 size={17} />} rows={data.countries.map((row) => ({ label: row.name, value: row.users, suffix: "visiteurs", note: `${number(row.sessions)} sessions` }))} compact />
            <DevicePanel rows={data.devices} />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <ProductPanel rows={data.products} />
            <RankedPanel title="Événements mesurés" eyebrow="Interactions" icon={<Activity size={17} />} rows={data.events.map((row) => ({ label: eventName(row.name), detail: row.name, value: row.count, suffix: "événements", note: `${number(row.users)} visiteurs` }))} compact />
          </div>

          <div className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-3 text-[10px] leading-5 text-muted">
            Les rapports GA4 peuvent arriver avec un délai. Les commandes suivies dans Analytics mesurent les achats terminés sur le site; les ventes et paiements réels restent consultables dans les indicateurs Jaaymaa. Identifiant de propriété : <code className="font-bold text-ink">{data.propertyId}</code>.
          </div>
        </>
      )}
    </>
  );
}

function RealtimePanel() {
  const [data, setData] = useState<AdminAnalyticsRealtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/admin/analytics/realtime", { cache: "no-store" });
      const result = (await response.json()) as AdminAnalyticsRealtime;
      setData(result);
    } catch {
      setData({ status: "connection_error", message: "Impossible d’actualiser les données en temps réel." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const ready = data?.status === "ready" ? data : null;

  return (
    <section className={`${adminPanelClass()} mb-5 overflow-hidden`} aria-label="Audience en temps réel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:px-5">
        <Heading icon={<Activity size={17} />} eyebrow="Audience · actualisation automatique" title="En temps réel" />
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F5EF] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#087B5C]">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-baobab opacity-50" /><span className="relative h-2 w-2 rounded-full bg-baobab" /></span>
            30 dernières minutes
          </span>
          <button type="button" onClick={() => void refresh()} disabled={refreshing} aria-label="Actualiser les données en temps réel" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 bg-white text-muted hover:text-ink disabled:opacity-50">
            {refreshing ? <JaaymaLoader size={24} /> : <RefreshCw size={15} />}
          </button>
        </div>
      </div>

      {ready ? (
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">Visiteurs actifs</p>
              <p className="mt-2 font-bricolage text-3xl font-black">{number(ready.activeUsers)}</p>
              <p className="mt-1 text-[10px] text-muted">sur les 30 dernières minutes</p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">Pages vues</p>
              <p className="mt-2 font-bricolage text-3xl font-black">{number(ready.views)}</p>
              <p className="mt-1 text-[10px] text-muted">sur les 30 dernières minutes</p>
            </div>
            <p className="col-span-2 text-[10px] text-muted">
              Dernière actualisation : {new Intl.DateTimeFormat("fr-FR", { timeStyle: "medium", timeZone: "Africa/Dakar" }).format(new Date(ready.generatedAt))} · mise à jour automatique toutes les 30 secondes.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white">
            <div className="border-b border-ink/[0.07] px-4 py-3">
              <h3 className="text-xs font-black">Pages actuellement consultées</h3>
            </div>
            {ready.pages.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-muted">Aucune page consultée dans les 30 dernières minutes.</p>
            ) : (
              <div className="divide-y divide-ink/[0.07]">
                {ready.pages.map((page, index) => (
                  <div key={`${page.title}-${index}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="min-w-0 truncate text-xs font-bold">{page.title || "Page sans titre"}</p>
                    <p className="shrink-0 text-[10px] text-muted">{number(page.views)} vue{page.views === 1 ? "" : "s"} · {number(page.users)} actif{page.users === 1 ? "" : "s"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-xs text-muted sm:px-5">
          {loading ? "Chargement des données en temps réel…" : data?.status === "connection_error" ? data.message : "Les données en temps réel sont indisponibles."}
        </div>
      )}
    </section>
  );
}

function SetupGuide({ status, measurementConfigured }: { status: Exclude<AdminAnalyticsDashboard, { status: "ready" }>; measurementConfigured: boolean }) {
  const connectionError = status.status === "connection_error" ? status.message : null;
  return (
    <section className={`${adminPanelClass()} overflow-hidden`}>
      <div className="border-b border-ink/10 bg-[#FFF8E3] p-5 sm:p-7">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8C1C41]">Configuration Google · une seule fois</p>
        <h2 className="mt-1 font-bricolage text-2xl font-black">Relier votre propriété GA4</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#526079]">
          {connectionError || "Le tableau est prêt. Reliez votre flux web et autorisez l’API de rapports Google Analytics pour afficher les données ici."}
        </p>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="space-y-5 p-5 sm:p-7">
          <SetupStep number="01" title="Créer ou choisir la propriété GA4" description="Dans Google Analytics, créez une propriété Google Analytics 4, choisissez le franc CFA (XOF) comme devise, puis ajoutez un flux Web pour jaayma.sn. Copiez l’ID de mesure G-… et l’ID numérique de la propriété." />
          <SetupStep number="02" title="Activer la mesure du site" description="Ajoutez la variable GA_MEASUREMENT_ID dans les variables Cloudflare de Jaaymaa avec l’ID de mesure G-… Les parcours produit, panier et achat seront ensuite envoyés automatiquement." />
          <SetupStep number="03" title="Autoriser les rapports" description="Dans Google Cloud, activez Google Analytics Data API v1 et créez un compte de service. Dans l’accès à la propriété GA4, ajoutez son adresse e-mail avec le rôle Lecteur." />
          <SetupStep number="04" title="Brancher les identifiants serveur" description="Dans Cloudflare, ajoutez GA_PROPERTY_ID comme variable et GA_SERVICE_ACCOUNT_JSON comme secret du Worker jaayma-sn. Le secret est lu uniquement côté serveur." />
        </div>

        <div className="space-y-3 border-t border-ink/10 bg-ink/[0.025] p-5 sm:p-7 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A6500]">État de la connexion</p>
          <StatusRow label="Tag du site · Cloudflare" ready={measurementConfigured} value={measurementConfigured ? "Installé" : "GA_MEASUREMENT_ID à ajouter"} />
          <StatusRow label="Propriété Analytics · Cloudflare" ready={false} value={status.propertyId ? `Propriété ${status.propertyId}` : "GA_PROPERTY_ID à ajouter"} />
          {status.status === "setup_required" && status.missing.map((name) => <StatusRow key={name} label="Identifiant serveur manquant" ready={false} value={name} />)}
          <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-4">
            <p className="text-xs font-black text-ink">Variables nécessaires</p>
            <div className="mt-3 space-y-2 font-mono text-[11px] text-[#3F4B69]">
              <p><span className="text-[#9A6500]">Cloudflare</span> · GA_MEASUREMENT_ID</p>
              <p><span className="text-[#9A6500]">Cloudflare · variable</span> · GA_PROPERTY_ID</p>
              <p><span className="text-[#9A6500]">Cloudflare · secret</span> · GA_SERVICE_ACCOUNT_JSON</p>
            </div>
          </div>
          <p className="text-[11px] leading-5 text-muted">Le tableau exclut les pages de connexion, commande et espace vendeur. Aucun nom, téléphone ou adresse client n’est envoyé à Google.</p>
          <p className="text-[11px] leading-5 text-muted">La mesure manuelle des pages évite le double comptage : désactivez dans GA4 la mesure automatique des changements d’historique des pages.</p>
        </div>
      </div>
    </section>
  );
}

function SetupStep({ number: step, title, description }: { number: string; title: string; description: string }) {
  return <div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-sun text-xs font-black shadow-[2px_2px_0_#0F1E3D]">{step}</span><div><h3 className="text-sm font-black">{title}</h3><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div></div>;
}

function StatusRow({ label, ready, value }: { label: string; ready: boolean; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white p-3"><span><span className="block text-[10px] text-muted">{label}</span><strong className="mt-0.5 block text-xs">{value}</strong></span><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ready ? "bg-baobab" : "bg-[#D59B28]"}`} /></div>;
}

function MetricCard({ label, value, previous, icon, tone }: { label: string; value: number; previous: number; icon: React.ReactNode; tone: "sun" | "pink" | "mint" | "blue" }) {
  const change = previous === 0 ? null : ((value - previous) / previous) * 100;
  const tones = { sun: "bg-sun", pink: "bg-[#F6C3D2]", mint: "bg-[#CFEFE6]", blue: "bg-[#DCE5FF]" };
  return (
    <article className="flex min-h-[140px] flex-col justify-between rounded-[20px] border-2 border-ink bg-papier p-4 text-ink shadow-[4px_4px_0_#0F1E3D] sm:p-5">
      <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">{label}</p><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-ink ${tones[tone]}`}>{icon}</span></div>
      <p className="mt-3 break-words font-bricolage text-2xl font-black leading-none tracking-tight sm:text-3xl">{number(value)}</p>
      <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-muted">
        {change === null ? <span className="text-[#9A6500]">Période précédente : {number(previous)}</span> : <><DeltaIcon value={change} /><span className={change > 0 ? "text-baobab" : change < 0 ? "text-hibiscus" : "text-muted"}>{Math.abs(change).toFixed(1)} %</span><span>vs période précédente</span></>}
      </p>
    </article>
  );
}

function DeltaIcon({ value }: { value: number }) {
  if (value > 0) return <ArrowUpRight size={13} />;
  if (value < 0) return <ArrowDownRight size={13} />;
  return <ArrowRight size={13} />;
}

function QuickMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-muted">{label}</p><p className="mt-1 truncate font-bricolage text-xl font-black sm:text-2xl">{value}</p><p className="mt-1 truncate text-[10px] text-muted">{note}</p></div>;
}

function TrendChart({ data }: { data: Extract<AdminAnalyticsDashboard, { status: "ready" }> }) {
  const width = 760;
  const height = 220;
  const left = 12;
  const right = 12;
  const top = 18;
  const bottom = 28;
  const values = data.trend.length ? data.trend : [{ date: "", activeUsers: 0, sessions: 0 }];
  const maxValue = Math.max(1, ...values.flatMap((row) => [row.activeUsers, row.sessions]));
  const x = (index: number) => left + (values.length <= 1 ? 0 : index * (width - left - right) / (values.length - 1));
  const y = (value: number) => height - bottom - (value / maxValue) * (height - top - bottom);
  const path = (key: "activeUsers" | "sessions") => values.map((row, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(row[key]).toFixed(1)}`).join(" ");
  const labelStep = Math.max(1, Math.ceil(values.length / 7));

  return (
    <section className={`${adminPanelClass()} p-4 sm:p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3"><Heading icon={<Activity size={17} />} eyebrow="Tendance quotidienne" title="Audience et sessions" /><div className="flex gap-3 pt-1 text-[10px] font-bold text-muted"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#0E7C66]" /> Visiteurs</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#C8265A]" /> Sessions</span></div></div>
      <div className="mt-5 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`Évolution quotidienne des visiteurs et des sessions sur ${data.rangeDays} jours`}>
          {[0, 1, 2, 3].map((line) => {
            const yy = top + line * (height - top - bottom) / 3;
            return <line key={line} x1={left} x2={width - right} y1={yy} y2={yy} stroke="#0F1E3D" strokeOpacity="0.08" strokeDasharray="4 5" />;
          })}
          <path d={path("sessions")} fill="none" stroke="#C8265A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path("activeUsers")} fill="none" stroke="#0E7C66" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {values.map((row, index) => index % labelStep === 0 || index === values.length - 1 ? <text key={`${row.date}-${index}`} x={x(index)} y={height - 5} textAnchor={index === 0 ? "start" : index === values.length - 1 ? "end" : "middle"} fill="#65708A" fontSize="10">{shortDate(row.date)}</text> : null)}
        </svg>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted"><Clock3 size={12} /> Les données du jour en cours sont exclues pour comparer des journées complètes.</div>
    </section>
  );
}

function Heading({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
  return <div className="flex items-start gap-2.5"><span className="mt-0.5 text-[#9A6500]">{icon}</span><div><p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9A6500]">{eyebrow}</p><h2 className="mt-0.5 font-bricolage text-base font-black sm:text-lg">{title}</h2></div></div>;
}

function FunnelStep({ label, value, maximum, color }: { label: string; value: number; maximum: number; color: string }) {
  const width = maximum > 0 ? Math.max(value > 0 ? 4 : 0, value / maximum * 100) : 0;
  return <div><div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="font-bold">{label}</span><strong>{number(value)}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-ink/10"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div></div>;
}

type RankedRow = { label: string; detail?: string; value: number; suffix: string; note?: string };

function RankedPanel({ title, eyebrow, icon, rows, compact = false }: { title: string; eyebrow: string; icon: React.ReactNode; rows: RankedRow[]; compact?: boolean }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section className={`${adminPanelClass()} overflow-hidden`}>
      <div className="border-b border-ink/10 px-4 py-4 sm:px-5"><Heading icon={icon} eyebrow={eyebrow} title={title} /></div>
      {rows.length === 0 ? <EmptyRows /> : <div className={`divide-y divide-ink/[0.07] ${compact ? "max-h-[420px] overflow-y-auto" : ""}`}>
        {rows.map((row, index) => <div key={`${row.label}-${index}`} className="px-4 py-3 sm:px-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-black">{row.label}</p>{row.detail && row.detail !== row.label && <p className="mt-0.5 truncate font-mono text-[10px] text-muted">{row.detail}</p>}<p className="mt-0.5 text-[10px] text-muted">{row.note}</p></div><div className="shrink-0 text-right"><p className="text-xs font-black">{number(row.value)}</p><p className="text-[9px] text-muted">{row.suffix}</p></div></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-baobab" style={{ width: `${Math.max(row.value ? 3 : 0, row.value / max * 100)}%` }} /></div></div>)}
      </div>}
    </section>
  );
}

function DevicePanel({ rows }: { rows: Array<{ name: string; users: number; sessions: number }> }) {
  const max = Math.max(1, ...rows.map(({ users }) => users));
  return <section className={`${adminPanelClass()} overflow-hidden`}><div className="border-b border-ink/10 px-4 py-4 sm:px-5"><Heading icon={<Smartphone size={17} />} eyebrow="Technologie" title="Appareils" /></div>{rows.length === 0 ? <EmptyRows /> : <div className="divide-y divide-ink/[0.07]">{rows.map((row) => <div key={row.name} className="flex items-center gap-3 px-4 py-3 sm:px-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.06] text-muted"><Smartphone size={16} /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-2 text-xs"><span className="font-black capitalize">{row.name}</span><strong>{number(row.users)} visiteurs</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-[#9A6500]" style={{ width: `${Math.max(row.users ? 3 : 0, row.users / max * 100)}%` }} /></div></div></div>)}</div>}</section>;
}

function ProductPanel({ rows }: { rows: Array<{ name: string; views: number; addedToCart: number; purchases: number; revenue: number }> }) {
  return <section className={`${adminPanelClass()} overflow-hidden`}><div className="border-b border-ink/10 px-4 py-4 sm:px-5"><Heading icon={<MousePointerClick size={17} />} eyebrow="E-commerce" title="Produits les plus consultés" /></div>{rows.length === 0 ? <div className="p-5"><EmptyRows message="Les statistiques produits apparaîtront après les premières vues de fiches produit." /></div> : <div className="divide-y divide-ink/[0.07]">{rows.map((row) => <div key={row.name} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"><div className="min-w-0"><p className="truncate text-xs font-black">{row.name}</p><p className="mt-1 text-[10px] text-muted">{number(row.views)} vues · {number(row.addedToCart)} ajouts panier · {number(row.purchases)} achats</p></div><strong className="shrink-0 text-xs">{money(row.revenue)}</strong></div>)}</div>}</section>;
}

function EmptyRows({ message = "Aucune donnée pour cette période." }: { message?: string }) {
  return <div className="flex min-h-24 items-center justify-center px-5 py-7 text-center text-xs text-muted">{message}</div>;
}

function sum<T, K extends keyof T>(rows: T[], key: K) {
  return rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
}

function number(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function money(value: number) {
  return `${number(value)} F CFA`;
}

function percent(value: number) {
  return `${(value * 100).toFixed(1).replace(".", ",")} %`;
}

function duration(value: number) {
  const total = Math.max(0, Math.round(value));
  return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, "0")} s`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function shortDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function channelName(name: string) {
  const labels: Record<string, string> = { "Direct": "Accès direct", "Organic Search": "Recherche naturelle", "Organic Social": "Réseaux sociaux naturels", "Paid Search": "Publicité · recherche", "Paid Social": "Publicité · réseaux sociaux", "Referral": "Sites référents", "Email": "E-mail", "Unassigned": "Non attribué" };
  return labels[name] || name;
}

function eventName(name: string) {
  const labels: Record<string, string> = { page_view: "Pages vues", view_item: "Fiche produit consultée", add_to_cart: "Ajout au panier", begin_checkout: "Commande commencée", purchase: "Achat confirmé", sign_up: "Inscription vendeur", generate_lead: "Contact WhatsApp", session_start: "Début de session", first_visit: "Première visite", user_engagement: "Visite engagée" };
  return labels[name] || name.replaceAll("_", " ");
}
