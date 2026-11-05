const MAX_EDGE = 1600;
const TARGET_BYTES = 200 * 1024;
const MIN_QUALITY = 0.5;

function canCompressInBrowser(): boolean {
  return typeof document !== "undefined" && typeof createImageBitmap === "function";
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mimeType, quality);
  });
  if (!blob) {
    throw new Error("Impossible de compresser l'image.");
  }
  return blob;
}

/**
 * Resizes phone photos and converts them to WebP (or JPEG when WebP is unavailable)
 * before upload, keeping large camera files lightweight on mobile connections.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!canCompressInBrowser()) return file;
  if (file.size <= TARGET_BYTES && /image\/(jpeg|jpg|png|webp)/i.test(file.type)) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let outputType = "image/webp";
  let quality = 0.82;
  let blob = await canvasToBlob(canvas, outputType, quality);
  // Older browsers may silently return PNG when WebP encoding is unavailable.
  if (blob.type !== outputType) {
    outputType = "image/jpeg";
    blob = await canvasToBlob(canvas, outputType, quality);
  }
  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality -= 0.12;
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  const extension = outputType === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${name}.${extension}`, { type: outputType });
}
