"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main
      role="alert"
      className="min-h-[70vh] px-5 py-12 flex flex-col items-center justify-center text-center"
      style={{ backgroundColor: "#FFFBF2" }}
    >
      <h1 className="font-bricolage font-black text-ink text-2xl mb-2">La page n’a pas pu charger</h1>
      <p className="text-sm mb-6 max-w-sm" style={{ color: "#3F4B69" }}>
        La connexion a peut-être été interrompue. Réessaie dans un instant.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 rounded-full font-bold border-[2.5px] border-ink"
        style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "3px 3px 0 #0F1E3D" }}
      >
        Réessayer
      </button>
    </main>
  );
}
