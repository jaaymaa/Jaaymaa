"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { setExplorerEnabled } from "@/app/actions/admin";

export default function ExplorerVisibilityControl({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleExplorer() {
    if (isPending) return;
    setIsPending(true);
    setError(null);

    const nextEnabled = !enabled;
    const result = await setExplorerEnabled(nextEnabled);
    if (result.success) {
      setEnabled(nextEnabled);
    } else {
      setError(result.error || "Impossible de modifier ce réglage.");
    }
    setIsPending(false);
  }

  return (
    <section className="mb-5 flex flex-col gap-4 rounded-[22px] border-[2.5px] border-ink bg-papier p-5 text-ink shadow-[4px_4px_0_#0F1E3D] sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink/10 ${enabled ? "bg-baobab/10 text-baobab" : "bg-ink/5 text-muted"}`}>
          {enabled ? <Eye size={18} /> : <EyeOff size={18} />}
        </span>
        <div>
          <h2 className="font-bricolage text-lg font-black">Explorer les boutiques</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            {enabled
              ? "Explorer est visible sur l’accueil et accessible aux visiteurs."
              : "Explorer est masqué sur l’accueil. Son adresse redirige les visiteurs vers l’accueil."}
          </p>
          {error && <p role="alert" className="mt-2 text-xs font-bold text-hibiscus">{error}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <span className={`text-xs font-black ${enabled ? "text-baobab" : "text-muted"}`}>
          {isPending ? "Enregistrement…" : enabled ? "Activé" : "Masqué"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? "Masquer Explorer" : "Activer Explorer"}
          onClick={toggleExplorer}
          disabled={isPending}
          className={`relative flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-ink p-1 transition-colors disabled:cursor-wait disabled:opacity-70 ${enabled ? "bg-baobab" : "bg-[#B8C0CF]"}`}
        >
          <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-white shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`}>
            {isPending && <JaaymaLoader size={18} />}
          </span>
        </button>
      </div>
    </section>
  );
}
