"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { deleteProduct } from "../../actions/product";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeleteProductButton({
  id,
  name,
  redirectTo,
  variant = "icon",
}: {
  id: string;
  name: string;
  redirectTo?: string;
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const res = await deleteProduct(id);
      if (res.error) {
        setErrorMsg(res.error);
        setIsDeleting(false);
      } else {
        setIsModalOpen(false);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      }
    } catch {
      setErrorMsg("Une erreur est survenue lors de la suppression.");
      setIsDeleting(false);
    }
  }

  return (
    <>
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isDeleting}
          className="w-full py-3.5 rounded-full font-bold text-sm border-[2px] border-[#C8265A]/40 text-[#C8265A] bg-[#C8265A]/10 hover:bg-[#C8265A]/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {isDeleting ? (
            <JaaymaLoader size={28} />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span>Supprimer ce produit</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          disabled={isDeleting}
          className="p-2 text-[#7A87A5] hover:text-[#C8265A] hover:bg-[#C8265A]/10 rounded-xl transition-colors disabled:opacity-50"
          title="Supprimer l'article"
          aria-label={`Supprimer ${name}`}
        >
          {isDeleting ? (
            <JaaymaLoader size={28} />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isDeleting) setIsModalOpen(false);
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer cet article ?"
        description={
          errorMsg ||
          `Êtes-vous sûr de vouloir supprimer "${name}" ? Il sera retiré de votre vitrine. S'il est lié à des commandes, il sera archivé pour préserver leur historique.`
        }
        confirmLabel="Oui, supprimer"
        cancelLabel="Garder l'article"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
      />
    </>
  );
}
