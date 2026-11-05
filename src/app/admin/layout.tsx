import Image from "next/image";
import Link from "next/link";
import { AlertOctagon, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { checkIsAdmin } from "@/app/actions/admin";
import { logoutAndRedirectToLogin } from "@/app/actions/auth";
import AdminNavigation from "./AdminNavigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await checkIsAdmin();

  if (!access.isAdmin) {
    // Do not tell an ordinary seller that the admin panel exists. Send them
    // back to their normal workspace; API authorization remains enforced too.
    if (access.denialReason === "not-admin") redirect("/espace");

    const needsLogin = access.error?.includes("Reconnectez") || access.error?.includes("Connectez-vous");
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-nuit p-5 text-center text-white">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-hibiscus/50 bg-hibiscus/10 text-hibiscus"><AlertOctagon className="h-8 w-8" /></div>
        <h1 className="mb-2 font-bricolage text-2xl font-black">Accès réservé</h1>
        <p className="mb-6 max-w-sm text-sm leading-6 text-ghost">{access.error || "Votre compte n’est pas autorisé à accéder au panneau d’administration."}{access.phone ? <span className="mt-1 block font-mono text-xs">Compte : {access.phone}</span> : null}</p>
        {needsLogin ? (
          <form action={logoutAndRedirectToLogin}><button className="rounded-full border-2 border-ink bg-sun px-5 py-3 text-sm font-black text-ink shadow-[3px_3px_0_#000]">Se déconnecter et se reconnecter</button></form>
        ) : (
          <Link href="/espace" className="rounded-full border-2 border-ink bg-sun px-5 py-3 text-sm font-black text-ink shadow-[3px_3px_0_#000]">Retour à mon espace</Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nuit text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/espace" aria-label="Retour à l’espace vendeur" className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-ghost transition-colors hover:bg-white/10"><ArrowLeft className="h-4 w-4" /></Link>
            <div className="flex min-w-0 items-center gap-2.5">
              <Image src="/logo-sombre.svg" alt="Jaaymaa" width={112} height={30} className="h-7 w-auto" priority />
              <span className="rounded-md border border-sun/30 bg-sun/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-sun">Admin</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-right sm:block">
            <p className="text-xs font-bold text-white">{access.phone}</p>
            <p className="text-[10px] text-ghost">Compte administrateur</p>
          </div>
        </div>
      </header>

      <div className="sticky top-[56px] z-20 mx-auto hidden max-w-[1800px] bg-nuit/95 px-4 pb-3 pt-4 backdrop-blur md:block xl:hidden sm:px-6 lg:px-8">
        <AdminNavigation tablet />
      </div>

      <div className="mx-auto flex max-w-[1800px] items-start gap-6 px-4 py-5 sm:px-6 sm:py-7 lg:gap-8 lg:px-8">
        <aside className="sticky top-[92px] hidden w-[230px] shrink-0 rounded-[22px] border-[2.5px] border-ink bg-papier p-3 text-ink shadow-[4px_4px_0_#0F1E3D] xl:block">
          <p className="mb-3 px-3 pt-2 text-[10px] font-black uppercase tracking-[0.15em] text-hibiscus">Gestion de Jaaymaa</p>
          <AdminNavigation />
          <div className="mt-4 border-t border-ink/10 px-3 pt-4 text-[11px] leading-5 text-muted">Données privées · accès réservé</div>
        </aside>
        <main className="min-w-0 flex-1 pb-28 text-ink md:pb-10">
          <div className="rounded-[26px] border-[2.5px] border-ink bg-[#F0EDE8] p-4 shadow-[5px_5px_0_#0F1E3D] sm:p-6 lg:p-7">{children}</div>
        </main>
      </div>
      <AdminNavigation mobile />
    </div>
  );
}
