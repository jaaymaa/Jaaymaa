"use server";

import { getCurrentSellerContext, getSessionToken } from "@/lib/auth";
import { changeUserPassword } from "@/services/auth.service";
import { getDb } from "@/db";

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
};

export async function changePassword(
  _previousState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string" ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    return { error: "Renseignez les trois champs du formulaire." };
  }

  if (newPassword.length < 6) {
    return { error: "Le nouveau mot de passe doit contenir au moins 6 caractères." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Les deux nouveaux mots de passe ne correspondent pas." };
  }

  if (newPassword === currentPassword) {
    return { error: "Choisissez un mot de passe différent de l’actuel." };
  }

  const context = await getCurrentSellerContext();
  const sessionToken = await getSessionToken();
  if (!context || !sessionToken) {
    return { error: "Votre session a expiré. Reconnectez-vous puis réessayez." };
  }

  try {
    const db = await getDb();
    const changed = await changeUserPassword(
      db,
      context.sellerId,
      currentPassword,
      newPassword,
      sessionToken
    );

    if (!changed) {
      return { error: "Le mot de passe actuel est incorrect." };
    }

    return { success: true };
  } catch {
    return { error: "Le changement de mot de passe a échoué. Réessayez dans un instant." };
  }
}
