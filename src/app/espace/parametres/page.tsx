import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BellRing, Phone, Settings2, Store, UserRound } from "lucide-react";
import { getCurrentSellerContext } from "@/lib/auth";
import OrderNotifications from "../commandes/OrderNotifications";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata = {
  title: "Paramètres - Espace Vendeur",
};

export default async function ParametresPage() {
  const sellerContext = await getCurrentSellerContext();
  if (!sellerContext) redirect("/connexion");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5 sm:px-6 sm:py-7 md:px-8">
      <header className="relative isolate overflow-hidden rounded-[26px] border-[2.5px] border-ink bg-[#FFC83D] shadow-[5px_5px_0_#0F1E3D]">
        <div className="relative z-10 flex items-center justify-between gap-4 p-5 sm:p-7 lg:p-8">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border-2 border-ink bg-[#FFFBF2] px-3 py-1 text-[10px] font-black uppercase tracking-[0.13em] text-ink">
              Espace vendeur
            </span>
            <h1 className="mt-3 font-bricolage text-3xl font-black leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
              Paramètres
            </h1>
            <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-[#273756] sm:text-base">
              Votre compte et vos alertes, réunis au même endroit.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border-[2.5px] border-ink bg-[#0F1E3D] text-[#FFC83D] shadow-[3px_3px_0_#0F1E3D] sm:h-[68px] sm:w-[68px] sm:rounded-[24px]">
            <Settings2 size={29} strokeWidth={2.2} aria-hidden="true" />
          </div>
        </div>
        <svg aria-hidden="true" viewBox="0 0 180 130" className="pointer-events-none absolute -right-5 -top-5 h-32 w-44 opacity-25 sm:right-4 sm:h-40 sm:w-52">
          <path d="M93 -15 154 46 93 107 32 46 93 -15Z" fill="#C8265A" />
          <path d="M145 22 196 73 145 124 94 73 145 22Z" fill="#0E7C66" />
          <path d="M89 45 132 88 89 131 46 88 89 45Z" fill="#FFFBF2" />
        </svg>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-[#C8265A] via-[#FFFBF2] to-[#0E7C66]" />
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-[26px] border-[2.5px] border-ink bg-[#FFFBF2] p-5 text-ink shadow-[4px_4px_0_#0F1E3D] sm:p-6" aria-labelledby="seller-account-title">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-[#FFC83D] text-ink shadow-[2px_2px_0_#0F1E3D]">
                <UserRound size={22} strokeWidth={2.4} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#C8265A]">Profil</p>
                <h2 id="seller-account-title" className="mt-0.5 truncate font-bricolage text-lg font-black leading-tight sm:text-xl">
                  {sellerContext.name || "Compte vendeur"}
                </h2>
              </div>
              <span className="shrink-0 rounded-full border border-[#0E7C66]/20 bg-[#D9F1E9] px-2.5 py-1 text-[10px] font-black text-[#075F4D]">
                Connecté
              </span>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-ink/10 bg-[#F3EFE5] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F1E3D] text-[#FFC83D]">
                <Phone size={16} strokeWidth={2.4} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#65708A]">Téléphone de connexion</p>
                <p className="mt-0.5 break-all text-sm font-black text-ink">{sellerContext.phone}</p>
              </div>
            </div>
            <p className="mt-3 px-1 text-xs leading-relaxed text-[#65708A]">
              Ce numéro est utilisé pour accéder à votre espace vendeur.
            </p>
          </section>

          <ChangePasswordForm />

          <Link
            href="/espace/boutique#profile-settings"
            className="group block rounded-[26px] border-[2.5px] border-ink bg-[#FFFBF2] p-5 text-ink shadow-[4px_4px_0_#0F1E3D] transition-transform hover:-translate-y-0.5 sm:p-6"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-[#F6C3D2] text-ink shadow-[2px_2px_0_#0F1E3D]">
                <Store size={21} strokeWidth={2.3} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#C8265A]">Espace séparé</p>
                <h2 className="mt-0.5 font-bricolage text-lg font-black leading-tight">Paramètres boutique</h2>
                <p className="mt-1 text-xs leading-relaxed text-[#65708A]">
                  Profil, paiements et publication de votre boutique.
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-[#FFC83D] transition-transform group-hover:translate-x-0.5">
                <ArrowUpRight size={17} strokeWidth={2.5} aria-hidden="true" />
              </span>
            </div>
          </Link>
        </div>

        <section aria-labelledby="account-notifications-title">
          <div className="mb-3 flex items-center gap-2 px-1">
            <BellRing size={15} className="text-[#FFC83D]" aria-hidden="true" />
            <h2 id="account-notifications-title" className="text-[11px] font-black uppercase tracking-[0.14em] text-[#C3CCE6]">
              Alertes sur cet appareil
            </h2>
          </div>
          <OrderNotifications sellerId={sellerContext.sellerId} />
        </section>
      </div>
    </div>
  );
}
