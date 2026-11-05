import { JaaymaLoader } from "@/components/JaaymaLoader";

export default function OrderTrackingLoading() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
      style={{ backgroundColor: "#FFC83D" }}
      aria-busy="true"
      aria-label="Chargement du suivi de commande"
    >
      <JaaymaLoader variant="main" size={128} label="Chargement du suivi de commande" />
      <div>
        <p className="font-bricolage text-sm font-black tracking-tight text-ink">
          Ouverture du suivi de commande…
        </p>
        <p className="mt-1 text-xs font-semibold text-ink/70">
          Nous récupérons les dernières informations.
        </p>
      </div>
    </main>
  );
}
