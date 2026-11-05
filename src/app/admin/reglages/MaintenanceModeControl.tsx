"use client";

import { useState } from "react";
import { Globe2, ShieldAlert } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import ConfirmModal from "@/components/ConfirmModal";
import { setMaintenanceEnabled } from "@/app/actions/admin";

export default function MaintenanceModeControl({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, setIsPending] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveMaintenance(nextEnabled: boolean) {
    if (isPending) return;

    setIsPending(true);
    setError(null);
    try {
      const result = await setMaintenanceEnabled(nextEnabled);
      if (result.success) {
        setEnabled(nextEnabled);
        setIsConfirmOpen(false);
      } else {
        setError(result.error || "Impossible de modifier le mode maintenance.");
        if (nextEnabled) setIsConfirmOpen(false);
      }
    } catch {
      setError("Impossible de modifier le mode maintenance. Réessayez.");
      if (nextEnabled) setIsConfirmOpen(false);
    } finally {
      setIsPending(false);
    }
  }

  function handleToggle() {
    if (isPending) return;
    setError(null);
    if (!enabled) {
      setIsConfirmOpen(true);
      return;
    }
    void saveMaintenance(false);
  }

  return (
    <>
      <section className={`mb-5 flex min-w-0 flex-col gap-4 rounded-[22px] border-[2.5px] border-ink p-4 text-ink shadow-[4px_4px_0_#0F1E3D] sm:flex-row sm:items-center sm:justify-between sm:p-6 ${enabled ? "bg-[#FFF2F2]" : "bg-papier"}`}>
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/10 ${enabled ? "bg-hibiscus/10 text-hibiscus" : "bg-baobab/10 text-baobab"}`}>
            {enabled ? <ShieldAlert size={18} /> : <Globe2 size={18} />}
          </span>
          <div className="min-w-0">
            <h2 className="font-bricolage text-lg font-black">Mode maintenance</h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
              {enabled
                ? "Le site public affiche une page de maintenance. L’administration reste accessible pour rétablir le service."
                : "Le site est ouvert aux visiteurs. Activez ce mode en cas d’intervention ou d’incident."}
            </p>
            {error && <p role="alert" className="mt-2 break-words text-xs font-bold text-hibiscus">{error}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <span className={`text-xs font-black ${enabled ? "text-hibiscus" : "text-baobab"}`}>
            {isPending ? "Enregistrement…" : enabled ? "Maintenance active" : "Site ouvert"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={enabled ? "Rétablir le site" : "Activer la maintenance"}
            onClick={handleToggle}
            disabled={isPending}
            className={`inline-flex min-h-11 max-w-full shrink-0 items-center justify-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-xs font-black shadow-[2px_2px_0_#0F1E3D] transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-70 ${enabled ? "bg-baobab text-white" : "bg-hibiscus text-white"}`}
          >
            {isPending ? <JaaymaLoader size={28} /> : enabled ? <Globe2 size={15} /> : <ShieldAlert size={15} />}
            {enabled ? "Rétablir le site" : "Activer la maintenance"}
          </button>
        </div>
      </section>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          if (!isPending) setIsConfirmOpen(false);
        }}
        onConfirm={() => saveMaintenance(true)}
        title="Activer la maintenance ?"
        description="Les visiteurs ne pourront plus accéder au site public jusqu’à ce que vous rétablissiez le service. L’administration restera accessible."
        confirmLabel="Oui, fermer le site"
        cancelLabel="Annuler"
        variant="warning"
        icon="warning"
        isLoading={isPending}
      />
    </>
  );
}
