import { JaaymaLoader } from "@/components/JaaymaLoader";

export default function CheckoutLoading() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
      style={{ backgroundColor: "#0A1530" }}
      aria-busy="true"
      aria-label="Préparation de ta commande"
    >
      <JaaymaLoader variant="main" size={128} label="Préparation de ta commande" />
      <div>
        <p className="font-bricolage text-sm font-black tracking-tight text-white">
          Préparation de ton panier…
        </p>
        <p className="mt-1 text-xs font-semibold text-[#C3CCE6]">
          On prépare les détails de ta commande.
        </p>
      </div>
    </main>
  );
}
