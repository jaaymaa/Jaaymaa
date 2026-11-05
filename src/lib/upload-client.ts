import { compressImageFile } from "@/lib/compress-image";

export async function uploadImageFile(
  file: File,
  folder: string
): Promise<{ key?: string; error?: string }> {
  const ready = await compressImageFile(file);
  const formData = new FormData();
  formData.append("file", ready);
  formData.append("folder", folder);

  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as { error?: string; key?: string };

    if (!res.ok || data.error) {
      return { error: data.error || "Erreur lors de l'upload." };
    }

    return { key: data.key as string };
  } catch {
    return { error: "Erreur réseau lors de l'upload." };
  }
}
