"use client";

import { useActionState, useEffect, useState } from "react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { createProduct, updateProduct } from "../../actions/product";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/schema";
import ProductImagesUploader from "@/components/ProductImagesUploader";
import ProductOptionsEditor from "@/components/ProductOptionsEditor";
import DeleteProductButton from "./DeleteProductButton";
import ProductDescriptionEditor from "./ProductDescriptionEditor";

const initialState: { error?: string; success?: boolean } = {};

export default function ProductForm({
  product,
  imageKeys = [],
  photoLimit,
}: {
  product?: Product;
  imageKeys?: string[];
  photoLimit: number;
}) {
  const router = useRouter();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const actionToUse = product
    ? updateProduct.bind(null, product.id)
    : createProduct;
    
  const [state, formAction, isPending] = useActionState(actionToUse, initialState);

  useEffect(() => {
    if (state?.success) {
      router.push("/espace/produits");
    }
  }, [state, router]);

  return (
    <div className="mx-auto min-h-screen max-w-xl p-5 pb-24 md:max-w-5xl md:px-8 xl:max-w-[1400px]" style={{ backgroundColor: "#0F1E3D" }}>
      {/*  HEADER  */}
      <div className="flex items-center gap-3 mb-8 mt-2">
        <Link 
          href="/espace/produits"
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border-[2.5px] border-ink active:scale-95 transition-transform"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="font-bricolage font-black leading-none mt-1" style={{ color: "#FFC83D", fontSize: "1.75rem", letterSpacing: "-0.02em" }}>
          {product ? "Modifier le produit" : "Ajouter un produit"}
        </h1>
      </div>

      <form action={formAction} className="space-y-6 md:grid md:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)] md:items-start md:gap-8 md:space-y-0">
        <div className="space-y-6 md:space-y-0">
        <ProductImagesUploader currentKeys={imageKeys} maxImages={photoLimit} onUploadingChange={setIsUploadingImage} />
        </div>

        <div className="space-y-6">
        {/*  INFOS PRODUIT  */}
        <div className="space-y-4 pt-4">
          <div>
            <label htmlFor="name" className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Nom de l'article</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={product?.name || ""}
              placeholder="Ex: Robe Wax"
              className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
              style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Prix de vente (FCFA)</label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="100"
                defaultValue={product?.price ?? ""}
                placeholder="15000"
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
                style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-xs font-bold mb-1.5" style={{ color: "#C3CCE6" }}>Quantité en stock</label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                step="1"
                defaultValue={product?.stock ?? 10}
                placeholder="10"
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-bold outline-none border-[2.5px] border-ink focus:border-sun placeholder:text-[#8D98AF] placeholder:font-normal"
                style={{ backgroundColor: "#FFFBF2", color: "#0F1E3D" }}
              />
            </div>
          </div>

          <ProductDescriptionEditor initialValue={product?.description || ""} />
        </div>

        {/*  OPTIONS & VARIANTES (Shopify style)  */}
        <ProductOptionsEditor initialOptionsJson={product?.optionsJson} />

        {/*  TOGGLE  */}
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-white">Produit visible</span>
            <label className="relative inline-block w-11 h-6">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={product ? product.isActive : true}
                className="peer sr-only"
              />
              <div className="w-11 h-6 rounded-full peer-checked:bg-[#0E7C66] bg-[#3A4A75] transition-colors"></div>
              <div className="absolute left-[4px] top-[4px] w-4 h-4 rounded-full bg-white transition-all peer-checked:left-[22px]"></div>
            </label>
          </div>
        </div>

        {/*  MESSAGES  */}
        {state?.error && (
          <div className="p-4 rounded-xl border-[2px] text-sm font-bold mt-4" style={{ backgroundColor: "rgba(200,38,90,0.1)", borderColor: "#C8265A", color: "#C8265A" }}>
            {state.error}
          </div>
        )}

        {/*  BOUTON  */}
        <div className="pt-8 space-y-3">
          <button
            type="submit"
            disabled={isPending || isUploadingImage}
            className="w-full py-4 rounded-full font-bold text-[15px] border-[2.5px] border-ink flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
            style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "4px 4px 0 #0F1E3D" }}
          >
            {isUploadingImage ? (
              <>
                <JaaymaLoader variant="mini-ink" size={32} />
                <span>Téléversement de la photo...</span>
              </>
            ) : isPending ? (
              <>
                <JaaymaLoader variant="mini-ink" size={32} />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              product ? "Enregistrer les modifications" : "Ajouter au catalogue"
            )}
          </button>

          {product && (
            <div className="pt-2">
              <DeleteProductButton
                id={product.id}
                name={product.name}
                redirectTo="/espace/produits"
                variant="button"
              />
            </div>
          )}
        </div>
        </div>
      </form>
    </div>
  );
}
