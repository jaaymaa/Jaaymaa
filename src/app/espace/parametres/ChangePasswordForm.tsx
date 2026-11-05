"use client";

import { useActionState, useEffect, useRef } from "react";
import { KeyRound, LockKeyhole } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { changePassword } from "@/app/actions/account";

const initialState: { error?: string; success?: boolean } = {};

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <section
      className="overflow-hidden rounded-[26px] border-[2.5px] border-ink bg-[#FFFBF2] p-5 text-ink shadow-[4px_4px_0_#0F1E3D] sm:p-6"
      aria-labelledby="change-password-title"
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-[#F6C3D2] text-ink shadow-[2px_2px_0_#0F1E3D]">
          <KeyRound size={21} strokeWidth={2.4} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#C8265A]">Sécurité du compte</p>
          <h2 id="change-password-title" className="mt-0.5 font-bricolage text-lg font-black leading-tight sm:text-xl">
            Modifier le mot de passe
          </h2>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#65708A]">
        Confirmez votre mot de passe actuel pour en choisir un nouveau. Les autres appareils seront déconnectés après la modification.
      </p>

      <form ref={formRef} action={formAction} className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#46536F]">Mot de passe actuel</span>
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-sm font-semibold text-ink outline-none transition-colors placeholder:text-[#8B94A8] focus:border-[#C8265A] focus:ring-2 focus:ring-[#C8265A]/10"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#46536F]">Nouveau mot de passe</span>
          <input
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-sm font-semibold text-ink outline-none transition-colors placeholder:text-[#8B94A8] focus:border-[#C8265A] focus:ring-2 focus:ring-[#C8265A]/10"
          />
          <span className="mt-1.5 block text-[11px] text-[#65708A]">Au moins 6 caractères.</span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#46536F]">Confirmer le nouveau mot de passe</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-sm font-semibold text-ink outline-none transition-colors placeholder:text-[#8B94A8] focus:border-[#C8265A] focus:ring-2 focus:ring-[#C8265A]/10"
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-xl border border-[#C8265A]/25 bg-[#C8265A]/[0.08] p-3 text-xs leading-5 text-[#8C1C41]">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="rounded-xl border border-[#0E7C66]/25 bg-[#0E7C66]/[0.08] p-3 text-xs leading-5 text-[#075F4D]">
            Mot de passe modifié. Les autres appareils ont été déconnectés.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-[#FFC83D] px-5 py-3.5 text-sm font-black text-ink shadow-[3px_3px_0_#0F1E3D] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-65"
        >
          {pending ? <><JaaymaLoader variant="mini-ink" size={30} /> Modification…</> : <><LockKeyhole size={16} strokeWidth={2.4} /> Enregistrer le nouveau mot de passe</>}
        </button>
      </form>
    </section>
  );
}
