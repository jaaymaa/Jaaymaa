import { CheckCircle2, CircleAlert, Database, KeyRound, Mail, Smartphone, Users } from "lucide-react";
import { getSessionToken } from "@/lib/auth";
import { getAdminSettings } from "@/services/admin.service";
import { AdminError, AdminPageTitle, adminPanelClass } from "../AdminUI";
import ExplorerVisibilityControl from "./ExplorerVisibilityControl";
import MaintenanceModeControl from "./MaintenanceModeControl";
import ProPriceControl from "./ProPriceControl";

export const metadata = { title: "Réglages · Administration Jaaymaa" };

export default async function AdminSettingsPage() {
  const token = await getSessionToken();
  if (!token) return <AdminError message="Votre session a expiré. Reconnectez-vous." />;
  try {
    const settings = await getAdminSettings();
    const checks = [
      { title: "Base de données Cloudflare D1", detail: "La base de données du Worker a répondu avec succès.", ready: settings.databaseConnected, icon: <Database size={18} /> },
      { title: "Web Push / VAPID", detail: settings.push.configured ? `Clés présentes · ${settings.push.subject || "Sujet non défini"}` : "Clés VAPID absentes sur le Worker Cloudflare.", ready: settings.push.configured, icon: <Smartphone size={18} /> },
      { title: "Comptes administrateurs", detail: `${settings.admins.length} numéro${settings.admins.length === 1 ? "" : "s"} autorisé${settings.admins.length === 1 ? "" : "s"} sur le Worker.`, ready: settings.admins.length > 0, icon: <Users size={18} /> },
    ];
    return (
      <>
        <AdminPageTitle eyebrow="Configuration de la plateforme" title="Réglages" description="Vérifiez l’état des services essentiels et les comptes autorisés. Les clés secrètes restent protégées et ne sont jamais affichées dans le navigateur." />

        <ExplorerVisibilityControl initialEnabled={settings.explorerEnabled} />
        <MaintenanceModeControl initialEnabled={settings.maintenanceEnabled} />
        <ProPriceControl
          initialPrice={settings.proPriceXof}
          initialProPlusPrice={settings.proPlusPriceXof ?? 10000}
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => (
            <article key={check.title} className={`${adminPanelClass()} p-4 sm:p-5`}>
              <div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 bg-ink/5 text-[#9A6500]">{check.icon}</span>{check.ready ? <CheckCircle2 size={18} className="text-baobab" /> : <CircleAlert size={18} className="text-[#8A5A00]" />}</div>
              <h2 className="mt-4 font-bricolage text-base font-black">{check.title}</h2>
              <p className="mt-1 text-xs leading-5 text-muted">{check.detail}</p>
            </article>
          ))}
          <article className={`${adminPanelClass()} p-4 sm:p-5`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 bg-ink/5 text-[#9A6500]"><Mail size={18} /></span>
            <h2 className="mt-4 font-bricolage text-base font-black">Appareils abonnés</h2>
            <p className="mt-1 font-bricolage text-3xl font-black text-[#9A6500]">{settings.pushSubscriptions}</p>
            <p className="mt-1 text-xs leading-5 text-muted">Appareils de vendeurs ayant activé les alertes Jaaymaa.</p>
          </article>
        </section>

        <section className={`${adminPanelClass()} mt-5 p-5 sm:p-6`}>
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sun/25 bg-sun/10 text-[#9A6500]"><KeyRound size={18} /></span><div><h2 className="font-bricolage text-lg font-black">Accès administrateur</h2><p className="mt-1 text-xs leading-5 text-muted">Cette liste est lue depuis la variable <code className="rounded bg-ink/10 px-1.5 py-0.5 text-[#9A6500]">ADMIN_PHONES</code> du Worker jaayma-sn. Gérez les numéros autorisés dans ses variables Cloudflare.</p></div></div>
          {settings.admins.length ? <div className="mt-5 flex flex-wrap gap-2">{settings.admins.map((phone) => <span key={phone} className="rounded-full border border-ink/10 bg-ink/5 px-3 py-2 font-mono text-xs font-bold text-ink">{phone}</span>)}</div> : <div className="mt-5 rounded-xl border border-[#F3C65E]/20 bg-[#F3C65E]/[0.06] p-3 text-xs text-[#8A5A00]">Aucun administrateur configuré. L’accès est fermé tant que la variable ADMIN_PHONES reste vide.</div>}
        </section>

        <section className={`${adminPanelClass()} mt-5 p-5 sm:p-6`}>
          <h2 className="font-bricolage text-lg font-black">Variables utilisées par l’admin</h2>
          <p className="mt-1 text-xs leading-5 text-muted">Dans Cloudflare → Workers & Pages → jaayma-sn → Settings → Variables and Secrets, configurez les valeurs ci-dessous. Les secrets sont lus uniquement côté serveur.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <EnvItem name="ADMIN_PHONES" description="Numéros administrateurs, séparés par des virgules" />
            <EnvItem name="GA_PROPERTY_ID / GA_MEASUREMENT_ID" description="Propriété GA4 et balise de mesure du site" />
            <EnvItem name="GA_SERVICE_ACCOUNT_JSON" description="Secret JSON du compte de service en lecture seule Analytics" />
            <EnvItem name="VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY" description="Clés du service de notifications push · clé privée à stocker comme secret" />
            <EnvItem name="VAPID_SUBJECT" description="Contact technique au format mailto:" />
          </div>
        </section>
      </>
    );
  } catch (error) {
    return <AdminError message={error instanceof Error ? error.message : "Impossible de lire la configuration de l’API."} />;
  }
}

function EnvItem({ name, description }: { name: string; description: string }) {
  return <div className="rounded-xl border border-ink/10 bg-ink/[0.03] p-3"><code className="text-xs font-black text-[#9A6500]">{name}</code><p className="mt-1 text-[11px] leading-5 text-muted">{description}</p></div>;
}
