import { JaaymaLoader } from "@/components/JaaymaLoader";

export default function Loading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#FFFBF2] p-6"
      aria-busy="true"
      aria-label="Chargement de Jaayma"
    >
      <JaaymaLoader variant="main" size={144} />
    </main>
  );
}
