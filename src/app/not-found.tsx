import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <main
      className="min-h-[70vh] px-5 py-12 flex flex-col items-center justify-center text-center"
      style={{ backgroundColor: "#FFFBF2" }}
    >
      <div className="w-16 h-16 rounded-full flex items-center justify-center border-[2.5px] border-ink mb-4 shadow-[3px_3px_0_#0F1E3D]" style={{ backgroundColor: "#FFC83D" }}>
        <Search size={28} strokeWidth={2.5} className="text-[#0F1E3D]" />
      </div>
      <h1 className="font-bricolage font-black text-ink text-3xl mb-2">Page introuvable</h1>
      <p className="text-sm mb-6 max-w-sm" style={{ color: "#3F4B69" }}>
        La page ou la boutique que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full font-bold border-[2.5px] border-ink"
        style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "3px 3px 0 #0F1E3D" }}
      >
        Retour à l’accueil
      </Link>
    </main>
  );
}
