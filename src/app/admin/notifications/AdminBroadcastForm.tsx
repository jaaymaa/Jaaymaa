"use client";

import { useActionState, useRef, useState } from "react";
import { Bell, Send, Smartphone } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import ConfirmModal from "@/components/ConfirmModal";
import { sendAdminAnnouncement } from "@/app/actions/admin";

const initialState: { error?: string; success?: boolean; deliveredCount?: number; targetCount?: number; failedCount?: number } = {};

export default function AdminBroadcastForm({ subscriberCount, pushReady }: { subscriberCount: number; pushReady: boolean }) {
  const [state, formAction, pending] = useActionState(sendAdminAnnouncement, initialState);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [destination, setDestination] = useState("/espace/commandes");
  const formRef = useRef<HTMLFormElement>(null);

  function requestSend() {
    if (!formRef.current?.reportValidity()) return;
    setConfirmOpen(true);
  }

  function confirmSend() {
    setConfirmOpen(false);
    formRef.current?.requestSubmit();
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <form ref={formRef} action={formAction} className="rounded-[22px] border-[2.5px] border-ink bg-papier p-4 text-ink shadow-[4px_4px_0_#0F1E3D] sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-sun text-ink"><Bell size={18} /></span><div><h2 className="font-bricolage text-lg font-black">Nouvelle annonce push</h2><p className="mt-1 text-xs leading-5 text-muted">Envoyée aux appareils qui ont activé les notifications Jaaymaa.</p></div></div>
          <label className="mt-5 block"><span className="mb-1.5 flex justify-between text-xs font-bold text-muted"><span>Titre</span><span>{title.length}/60</span></span><input name="title" required minLength={3} maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Nouveautés sur Jaaymaa" className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-sm font-semibold text-ink outline-none placeholder:text-muted focus:border-sun" /></label>
          <label className="mt-4 block"><span className="mb-1.5 flex justify-between text-xs font-bold text-muted"><span>Message</span><span>{body.length}/180</span></span><textarea name="body" required minLength={3} maxLength={180} rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Écrivez un message court et utile pour les vendeurs…" className="w-full resize-y rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none placeholder:text-muted focus:border-sun" /></label>
          <label className="mt-4 block"><span className="mb-1.5 block text-xs font-bold text-muted">À l’ouverture, diriger vers</span><select name="url" value={destination} onChange={(event) => setDestination(event.target.value)} className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-sm font-semibold text-ink outline-none focus:border-sun"><option value="/espace/commandes">Les commandes</option><option value="/espace">L’accueil vendeur</option><option value="/espace/produits">Les produits</option><option value="/espace/boutique">Les réglages boutique</option></select></label>

          {!pushReady && <p className="mt-4 rounded-xl border border-[#F3C65E]/40 bg-[#F3C65E]/15 p-3 text-xs leading-5 text-[#8A5A00]">Les clés VAPID ne sont pas configurées sur le Worker Cloudflare. Ajoutez-les dans ses variables et secrets avant l’envoi.</p>}
          {pushReady && subscriberCount === 0 && <p className="mt-4 rounded-xl border border-ink/10 bg-ink/[0.03] p-3 text-xs leading-5 text-muted">Aucun appareil vendeur n’est abonné. L’envoi sera disponible dès qu’un vendeur activera les alertes.</p>}
          {state.error && <p role="alert" className="mt-4 rounded-xl border border-hibiscus/25 bg-hibiscus/10 p-3 text-xs leading-5 text-[#8C1C41]">{state.error}</p>}
          {state.success && <p role="status" className="mt-4 rounded-xl border border-baobab/25 bg-baobab/[0.08] p-3 text-xs leading-5 text-baobab">Notification envoyée à {state.deliveredCount} appareil{state.deliveredCount === 1 ? "" : "s"} sur {state.targetCount}.{state.failedCount ? ` ${state.failedCount} échec(s).` : ""}</p>}
          <button type="button" onClick={requestSend} disabled={pending || !pushReady || subscriberCount === 0} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-sun px-5 py-3.5 text-sm font-black text-ink shadow-[3px_3px_0_#000] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            {pending ? <><JaaymaLoader variant="mini-ink" size={32} /> Envoi en cours…</> : <><Send size={15} /> Envoyer aux {subscriberCount} appareil{subscriberCount === 1 ? "" : "s"}</>}
          </button>
        </form>

        <section className="rounded-[22px] border-[2.5px] border-ink bg-[#0E1B36] p-4 text-white shadow-[4px_4px_0_#0F1E3D] sm:p-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-ghost"><Smartphone size={14} className="text-sun" /> Aperçu mobile</div>
          <div className="mx-auto mt-5 max-w-sm rounded-[25px] border-[5px] border-[#27395D] bg-[#09142B] p-3 shadow-xl">
            <div className="mb-3 flex items-center justify-between px-1 text-[9px] font-bold text-white/70"><span>Jaaymaa · à l’instant</span><span>●●●</span></div>
            <div className="rounded-2xl border border-white/10 bg-[#182A4D] p-4">
              <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sun text-ink"><Bell size={17} /></span><div className="min-w-0"><p className="truncate text-sm font-black text-white">{title || "Titre de votre annonce"}</p><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-ghost">{body || "Votre message s’affichera ici sur le téléphone de vos vendeurs."}</p></div></div>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-ghost">L’envoi peut prendre quelques instants. Les appareils désactivés ou expirés sont nettoyés automatiquement et comptés comme échec d’envoi.</div>
        </section>
      </div>
      <ConfirmModal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={confirmSend} title="Envoyer cette notification ?" description={`Cette annonce sera envoyée à ${subscriberCount} appareil${subscriberCount === 1 ? "" : "s"} vendeur abonné.`} confirmLabel="Oui, envoyer" cancelLabel="Modifier" variant="primary" icon="warning" isLoading={pending} />
    </>
  );
}
