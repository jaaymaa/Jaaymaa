"use server";

import { getCurrentSellerContext, getCurrentSellerId } from "@/lib/auth";
import { revalidatePath, updateTag } from "next/cache";
import { parseFcfa } from "@/lib/money";
import { parseImageKeys } from "@/lib/product-images";
import { getProductDescriptionCharacterCount } from "@/lib/product-description";
import { getShopByOwner } from "@/services/shop.service";
import {
  createProduct as createProductService,
  updateProduct as updateProductService,
  deleteProduct as deleteProductService,
} from "@/services/product.service";

export async function createProduct(
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) return { error: "Non autorisé." };

  const name = formData.get("name") as string;
  const rawDescription = formData.get("description");
  const description = typeof rawDescription === "string" ? rawDescription : "";
  const rawPrice = formData.get("price") as string;
  const rawStock = formData.get("stock") as string;
  const isActive = formData.get("isActive") === "on";

  if (!name || !rawPrice) {
    return { error: "Le nom et le prix sont obligatoires." };
  }
  if (getProductDescriptionCharacterCount(description) > 3000) {
    return { error: "La description ne peut pas dépasser 3 000 caractères." };
  }

  const price = parseFcfa(rawPrice);
  if (price === null) {
    return { error: "Le prix n'est pas valide." };
  }

  const stock = rawStock ? parseInt(rawStock, 10) : 0;
  if (isNaN(stock) || stock < 0) {
    return { error: "La quantité en stock doit être un nombre positif ou nul." };
  }

  try {
    const ctx = await getCurrentSellerContext();
    const shop = ctx?.shop ?? (await getShopByOwner(sellerId));
    if (!shop) {
      return { error: "Vous devez d'abord configurer votre boutique." };
    }

    const imageKeys = parseImageKeys(formData);
    const images = imageKeys.map((key, idx) => ({
      url: key,
      alt: name,
      position: idx,
    }));

    const optionsJson = (formData.get("optionsJson") as string) || null;

    await createProductService(
      shop.id,
      {
        name,
        description: description || "",
        price,
        stock,
        status: isActive ? "ACTIVE" : "DRAFT",
        optionsJson,
        images,
      },
      sellerId
    );

    updateTag("products");
    revalidatePath("/espace", "layout");
    revalidatePath("/espace/produits");
    revalidatePath("/explorer");
    revalidatePath(`/${shop.slug}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la création.";
    return { error: msg };
  }
}

export async function updateProduct(
  id: string,
  _prevState: unknown,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) return { error: "Non autorisé." };

  const name = formData.get("name") as string;
  const rawDescription = formData.get("description");
  const description = typeof rawDescription === "string" ? rawDescription : "";
  const rawPrice = formData.get("price") as string;
  const rawStock = formData.get("stock") as string;
  const isActive = formData.get("isActive") === "on";

  if (!name || !rawPrice) {
    return { error: "Le nom et le prix sont obligatoires." };
  }
  if (getProductDescriptionCharacterCount(description) > 3000) {
    return { error: "La description ne peut pas dépasser 3 000 caractères." };
  }

  const price = parseFcfa(rawPrice);
  if (price === null) {
    return { error: "Le prix n'est pas valide." };
  }

  const stock = rawStock !== undefined && rawStock !== "" ? parseInt(rawStock, 10) : undefined;
  if (stock !== undefined && (isNaN(stock) || stock < 0)) {
    return { error: "La quantité en stock doit être un nombre positif ou nul." };
  }

  try {
    const ctx = await getCurrentSellerContext();
    const shop = ctx?.shop ?? (await getShopByOwner(sellerId));
    if (!shop) return { error: "Boutique introuvable." };

    const imageKeys = parseImageKeys(formData);
    const images = imageKeys.map((key, idx) => ({
      url: key,
      alt: name,
      position: idx,
    }));

    const optionsJson = (formData.get("optionsJson") as string) || null;

    await updateProductService(
      id,
      {
        name,
        description: description || "",
        price,
        ...(stock !== undefined ? { stock } : {}),
        status: isActive ? "ACTIVE" : "DRAFT",
        optionsJson,
        images, // Toujours passer images pour permettre la suppression de toutes les photos
      },
      sellerId
    );

    updateTag("products");
    revalidatePath("/espace", "layout");
    revalidatePath("/espace/produits");
    revalidatePath("/explorer");
    revalidatePath(`/${shop.slug}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la modification.";
    return { error: msg };
  }
}

export async function deleteProduct(id: string) {
  const sellerId = await getCurrentSellerId();
  if (!sellerId) return { error: "Non autorisé." };

  try {
    const ctx = await getCurrentSellerContext();
    const shop = ctx?.shop ?? (await getShopByOwner(sellerId));

    await deleteProductService(id, sellerId);

    updateTag("products");
    revalidatePath("/espace", "layout");
    revalidatePath("/espace/produits");
    revalidatePath("/explorer");
    if (shop?.slug) revalidatePath(`/${shop.slug}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur lors de la suppression.";
    return { error: msg };
  }
}
