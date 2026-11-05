import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentSellerContextStrict, getSessionToken } from "@/lib/auth";
import EspaceNav from "./_components/EspaceNav";
import RefreshOnResume from "./_components/RefreshOnResume";

export default async function EspaceLayout({ children }: { children: ReactNode }) {
  const [sellerContext, token] = await Promise.all([
    getCurrentSellerContextStrict(),
    getSessionToken(),
  ]);

  if (!sellerContext) {
    redirect(token ? "/connexion?session=expired" : "/connexion");
  }

  return (
    <div className="min-h-[100svh] overflow-x-clip bg-[#0F1E3D] text-white">
      <RefreshOnResume />
      <EspaceNav />
      <main className="pb-32 pt-2 md:pb-12 md:pt-4 xl:pl-72">
        {children}
      </main>
    </div>
  );
}
