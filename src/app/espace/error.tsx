"use client";

export default function EspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section
      role="alert"
      className="min-h-[60vh] px-5 py-12 flex flex-col items-center justify-center text-center"
      style={{ backgroundColor: "#0F1E3D" }}
    >
      <h1 className="font-bricolage font-black text-white text-2xl mb-2">L’espace n’a pas pu charger</h1>
      <p className="text-sm mb-6 max-w-sm" style={{ color: "#C3CCE6" }}>
        La connexion a peut-être été interrompue. Réessaie dans un instant.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 rounded-full font-bold border-[2.5px] border-ink"
        style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "3px 3px 0 #0F1E3D" }}
      >
        Réessayer
      </button>
    </section>
  );
}
