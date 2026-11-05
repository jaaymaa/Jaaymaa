import { JaaymaLoader } from "@/components/JaaymaLoader";

export default function ShopLoading() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "#FFFBF2" }}
      aria-busy="true"
      aria-label="Ouverture de la boutique"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <JaaymaLoader variant="main" size={144} />

        <div className="flex items-center gap-2 mt-2">
          <p className="font-bricolage font-black text-sm text-[#0F1E3D] tracking-tight">
            Ouverture de la boutique…
          </p>
        </div>
        <p className="text-xs font-semibold text-[#3F4B69]">
          Un instant, nous chargeons la vitrine
        </p>
      </div>
    </main>
  );
}
