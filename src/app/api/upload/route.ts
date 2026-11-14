import { NextRequest, NextResponse } from "next/server";
import { getCurrentSellerId } from "@/lib/auth";
import { getMediaBucket } from "@/db";
import { ulid } from "ulid";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "heic", "heif"]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
]);
const ALLOWED_VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "avi"]);

const ALLOWED_FOLDERS = new Set(["logos", "covers", "products", "misc"]);
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_SIZE_BYTES = 60 * 1024 * 1024; // 60 MB

function resolveImageType(file: File): { mimeType: string; extension: string } {
  const mimeType = file.type?.toLowerCase() || "";
  const lowerName = file.name?.toLowerCase() || "";
  const extension = lowerName.includes(".") ? lowerName.split(".").pop() || "" : "";

  if (mimeType && ALLOWED_IMAGE_TYPES.has(mimeType)) {
    const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") || extension;
    return { mimeType, extension: ext || "jpg" };
  }

  if (extension && ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    const normalizedMime =
      extension === "jpg" || extension === "jpeg"
        ? "image/jpeg"
        : extension === "heic"
          ? "image/heic"
          : extension === "heif"
            ? "image/heif"
            : `image/${extension}`;

    return { mimeType: normalizedMime, extension };
  }

  throw new Error("Type de fichier non supporté.");
}

function resolveVideoType(file: File): { mimeType: string; extension: string } {
  const mimeType = file.type?.toLowerCase() || "";
  const lowerName = file.name?.toLowerCase() || "";
  const extension = lowerName.includes(".") ? lowerName.split(".").pop() || "" : "";

  if (mimeType && ALLOWED_VIDEO_TYPES.has(mimeType)) {
    const ext =
      mimeType === "video/quicktime" ? "mov" : mimeType.split("/")[1] || extension || "mp4";
    return { mimeType, extension: ext };
  }

  if (extension && ALLOWED_VIDEO_EXTENSIONS.has(extension)) {
    const normalizedMime =
      extension === "mov"
        ? "video/quicktime"
        : extension === "webm"
          ? "video/webm"
          : "video/mp4";
    return { mimeType: normalizedMime, extension };
  }

  throw new Error("Type de vidéo non supporté.");
}

export async function POST(request: NextRequest) {
  try {
    const sellerId = await getCurrentSellerId();
    if (!sellerId) {
      return NextResponse.json({ error: "Non autorisé. Connectez-vous." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "misc";
    const folder = ALLOWED_FOLDERS.has(rawFolder) ? rawFolder : "misc";
    const fileType = (formData.get("fileType") as string) || "image"; // "image" | "video"

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (fileType === "video") {
      let videoMeta: { mimeType: string; extension: string };
      try {
        videoMeta = resolveVideoType(file);
      } catch {
        return NextResponse.json(
          { error: "Type de vidéo non supporté. Utilisez MP4, WebM ou MOV." },
          { status: 400 }
        );
      }

      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        return NextResponse.json(
          { error: "La vidéo est trop grande (max 60 MB)." },
          { status: 400 }
        );
      }

      const mediaBucket = await getMediaBucket();
      const key = `${folder}/${ulid()}.${videoMeta.extension}`;

      const arrayBuffer = await file.arrayBuffer();
      await mediaBucket.put(key, arrayBuffer, {
        httpMetadata: {
          contentType: videoMeta.mimeType,
          cacheControl: "public, max-age=31536000, immutable",
        },
        customMetadata: {
          uploadedBy: sellerId,
          originalName: file.name || "video",
        },
      });

      return NextResponse.json({ key });
    }

    // --- Image upload (default) ---
    let imageMeta: { mimeType: string; extension: string };
    try {
      imageMeta = resolveImageType(file);
    } catch {
      return NextResponse.json(
        { error: "Type de fichier non supporté. Utilisez JPEG, PNG, WebP, AVIF, HEIC ou HEIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Le fichier est trop grand (max 8 MB)." },
        { status: 400 }
      );
    }

    const mediaBucket = await getMediaBucket();
    const key = `${folder}/${ulid()}.${imageMeta.extension}`;

    const arrayBuffer = await file.arrayBuffer();
    await mediaBucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: imageMeta.mimeType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        uploadedBy: sellerId,
        originalName: file.name || "image",
      },
    });

    return NextResponse.json({ key });
  } catch (error) {
    console.error("Erreur lors de l'envoi du fichier sur R2:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du fichier." },
      { status: 500 }
    );
  }
}
