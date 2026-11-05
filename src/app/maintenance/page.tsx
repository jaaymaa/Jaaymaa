import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPublicFeatures } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Maintenance en cours",
  description: "Jaaymaa sera de retour très bientôt. Merci pour votre patience.",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  const features = await getPublicFeatures().catch(() => ({
    explorerEnabled: true,
    maintenanceEnabled: true,
  }));
  if (!features.maintenanceEnabled) redirect("/");

  return (
    <main className="relative isolate flex min-h-[100svh] w-full touch-pan-y items-center justify-center overflow-x-clip bg-[#F3F5FA] px-4 py-8 text-[#0F1E3D] sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#0E7C66]/10 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute -bottom-24 -right-20 h-60 w-60 rounded-full bg-[#FFC83D]/20 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <section className="relative z-10 w-full min-w-0 max-w-xl rounded-[24px] border-[2.5px] border-[#0F1E3D] bg-white px-5 py-7 text-center shadow-[5px_5px_0_#0F1E3D] sm:rounded-[28px] sm:px-12 sm:py-12 sm:shadow-[7px_7px_0_#0F1E3D]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#0F1E3D] bg-[#FFC83D] shadow-[3px_3px_0_#0F1E3D] sm:h-16 sm:w-16">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 8v4l2.5 2.5" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.15em] text-[#0E7C66] sm:mt-7 sm:text-xs sm:tracking-[0.2em]">Jaaymaa · Intervention en cours</p>
        <h1 className="mt-3 font-bricolage text-[clamp(1.75rem,8vw,2.5rem)] font-black leading-tight">Nous revenons très bientôt.</h1>
        <p className="mx-auto mt-4 max-w-md break-words text-sm leading-6 text-[#526079] sm:text-base">
          Notre site fait l’objet d’une courte maintenance afin de vous offrir un service fiable et sécurisé.
          Veuillez nous excuser pour cette interruption et merci de votre patience.
        </p>
        <div className="mx-auto mt-6 flex max-w-sm items-start justify-center gap-2 rounded-2xl border border-[#0E7C66]/15 bg-[#0E7C66]/[0.05] px-3 py-3 text-left text-xs font-bold leading-5 text-[#0E7C66] sm:mt-7 sm:items-center sm:px-4">
          <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#0E7C66] sm:mt-0" aria-hidden="true" />
          <span>Nos équipes travaillent au rétablissement du service.</span>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#0F1E3D] bg-[#FFC83D] px-6 py-3 text-sm font-black shadow-[3px_3px_0_#0F1E3D] transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          Réessayer
        </Link>
      </section>
    </main>
  );
}
