import { JaaymaLoader } from "@/components/JaaymaLoader";

export default function ExplorerLoading() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "#FFC83D" }}
      aria-busy="true"
      aria-label="Ouverture d’Explorer"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <JaaymaLoader variant="main" size={144} />
        <div className="flex items-center gap-2 mt-2">
          <p className="font-bricolage font-black text-sm text-ink tracking-tight">
            Chargement des pépites…
          </p>
        </div>
      </div>
    </main>
  );
}
