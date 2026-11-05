import { Bell, Smartphone } from "lucide-react";
import { getSessionToken } from "@/lib/auth";
import { getAdminSettings, getAdminNotificationHistory } from "@/services/admin.service";
import { AdminError, AdminPageTitle, AdminPagination, adminPanelClass } from "../AdminUI";
import AdminBroadcastForm from "./AdminBroadcastForm";

export const metadata = { title: "Notifications · Administration Jaaymaa" };
type SearchParams = Promise<{ page?: string }>;

export default async function AdminNotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const token = await getSessionToken();
  if (!token) return <AdminError message="Votre session a expiré. Reconnectez-vous." />;
  const page = Math.max(1, Number.parseInt(params.page || "1", 10) || 1);
  try {
    const [settings, history] = await Promise.all([
      getAdminSettings(),
      getAdminNotificationHistory(page),
    ]);
    const hrefForPage = (nextPage: number) => `/admin/notifications?page=${nextPage}`;
    return (
      <>
        <AdminPageTitle eyebrow="Communication vendeurs" title="Notifications push" description="Préparez une annonce, vérifiez son rendu sur téléphone, puis envoyez-la aux vendeurs qui ont activé les notifications." action={<span className="rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-xs font-bold text-muted"><Smartphone size={14} className="mr-1.5 inline text-[#9A6500]" />{settings.pushSubscriptions} appareil{settings.pushSubscriptions !== 1 ? "s" : ""} abonné{settings.pushSubscriptions !== 1 ? "s" : ""}</span>} />
        <AdminBroadcastForm subscriberCount={settings.pushSubscriptions} pushReady={settings.push.configured} />

        <section className={`${adminPanelClass()} mt-6 overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-4 sm:px-5"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9A6500]">Historique d’envoi</p><h2 className="mt-1 font-bricolage text-lg font-black">Annonces envoyées</h2></div><span className="text-xs text-muted">{history.total} au total</span></div>
          {history.items.length === 0 ? <div className="px-4 py-10 text-center"><Bell className="mx-auto h-7 w-7 text-muted/60" /><p className="mt-3 text-sm font-bold">Pas encore d’annonce</p><p className="mt-1 text-xs text-muted">Les envois terminés apparaîtront ici avec leur taux de livraison.</p></div> : (
            <div className="divide-y divide-white/10">
              {history.items.map((item) => (
                <article key={item.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black">{item.title}</h3><span className="rounded-full border border-ink/10 bg-ink/5 px-2 py-0.5 text-[9px] font-bold text-muted">{item.url}</span></div><p className="mt-1 text-xs leading-5 text-muted">{item.body}</p><p className="mt-1 text-[10px] text-muted/60">{formatDate(item.createdAt)} · par {item.sentByPhone || "administrateur"}</p></div>
                  <div className="flex shrink-0 gap-2 text-center"><DeliveryStat value={item.deliveredCount} label="Envoyées" tone="good" /><DeliveryStat value={item.failedCount} label="Échecs" tone="bad" /><DeliveryStat value={item.targetCount} label="Cibles" tone="neutral" /></div>
                </article>
              ))}
            </div>
          )}
          <AdminPagination page={history.page} totalPages={history.totalPages} total={history.total} pageSize={history.pageSize} noun="annonces" hrefForPage={hrefForPage} />
        </section>
      </>
    );
  } catch (error) {
    return <AdminError message={error instanceof Error ? error.message : "Impossible de charger les notifications."} />;
  }
}

function DeliveryStat({ value, label, tone }: { value: number; label: string; tone: "good" | "bad" | "neutral" }) {
  const colors = { good: "text-baobab", bad: "text-[#A51F49]", neutral: "text-ink" };
  return <div className="min-w-[56px] rounded-lg border border-ink/10 bg-ink/[0.03] px-2 py-1.5"><p className={`font-bricolage text-sm font-black ${colors[tone]}`}>{value}</p><p className="text-[9px] text-muted">{label}</p></div>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Dakar" }).format(new Date(value));
}
