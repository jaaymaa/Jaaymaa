import { JaaymaScreenLoader } from "@/components/JaaymaLoader";

export default function ProductFormLoading({ mode }: { mode: "create" | "edit" }) {
  const label = mode === "edit"
    ? "Chargement du produit à modifier"
    : "Chargement du formulaire produit";

  return <JaaymaScreenLoader label={label} />;
}
