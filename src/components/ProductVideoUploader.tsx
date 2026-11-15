"use client";

import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { X, Video, Play } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { getImageUrl } from "@/lib/images";
import { uploadVideoFile } from "@/lib/upload-client";

export default function ProductVideoUploader({
  currentKey,
  onUploadingChange,
}: {
  currentKey?: string | null;
  onUploadingChange?: (isUploading: boolean) => void;
}) {
  const [videoKey, setVideoKey] = useState<string | null>(currentKey ?? null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Revoke previous local preview
    if (localPreview) URL.revokeObjectURL(localPreview);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setError(null);
    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const result = await uploadVideoFile(file, "products");
      if (result.error || !result.key) {
        setError(result.error || "Erreur lors de l'upload.");
        setLocalPreview(null);
      } else {
        setVideoKey(result.key);
      }
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  }

  function handleRemove() {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setVideoKey(null);
    setLocalPreview(null);
    setError(null);
  }

  const videoSrc = localPreview ?? (videoKey ? getImageUrl(videoKey) : null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold" style={{ color: "#C3CCE6" }}>
          Vidéo du produit{" "}
          <span
            className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black border"
            style={{ backgroundColor: "#1a2f5e", color: "#FFC83D", borderColor: "#FFC83D" }}
          >
            PRO+
          </span>
        </p>
        <span className="text-[11px] font-semibold text-[#8991A4]">
          {videoKey ? "1 vidéo · max 60 Mo" : "MP4 · WebM · MOV · max 60 Mo"}
        </span>
      </div>

      <div className="flex gap-3.5 items-center">
        {/* Vidéo existante ou en cours d'upload */}
        {(videoSrc || isUploading) && (
          <div
            className="relative w-28 h-24 shrink-0 rounded-2xl overflow-hidden border-[2.5px] border-ink shadow-[3px_3px_0_#0F1E3D]"
            style={{ backgroundColor: "#0A1428" }}
          >
            {isUploading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5" style={{ backgroundColor: "#FFC83D" }}>
                <JaaymaLoader size={40} />
                <span className="text-[10px] font-black text-ink">Envoi...</span>
              </div>
            ) : videoSrc ? (
              <>
                <video
                  src={videoSrc.includes("#") ? videoSrc : `${videoSrc}#t=0.001`}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-4 h-4 text-ink fill-ink ml-0.5" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1.5 right-1.5 z-[2] w-6 h-6 rounded-full bg-[#FFFBF2] border-[1.5px] border-ink flex items-center justify-center shadow-sm hover:bg-[#F6C3D2] transition-colors"
                  aria-label="Supprimer la vidéo"
                >
                  <X className="w-3.5 h-3.5 text-hibiscus" strokeWidth={2.5} />
                </button>
              </>
            ) : null}
          </div>
        )}

        {/* Bouton d'ajout (seulement si pas de vidéo) */}
        {!videoSrc && !isUploading && (
          <label
            className="relative w-28 h-24 shrink-0 rounded-2xl flex flex-col items-center justify-center gap-1 border-[2.5px] border-ink cursor-pointer shadow-[3px_3px_0_#0F1E3D] active:scale-95 transition-transform"
            style={{ backgroundColor: "#FFC83D" }}
          >
            <Video className="w-6 h-6 text-ink stroke-[2.4]" />
            <span className="text-[11px] font-black text-ink leading-none">Ajouter</span>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0"
              onChange={handleFileChange}
              aria-label="Ajouter une vidéo produit"
            />
          </label>
        )}

        {/* Changer la vidéo (si déjà une vidéo) */}
        {videoSrc && !isUploading && (
          <label
            className="relative w-20 h-10 shrink-0 rounded-xl flex flex-col items-center justify-center gap-0.5 border-[2px] border-dashed border-white/30 hover:border-sun/70 hover:bg-[#1B2E5C] cursor-pointer transition-all group active:scale-95"
            title="Changer la vidéo"
          >
            <Video className="w-4 h-4 text-[#C3CCE6] group-hover:text-sun transition-colors" />
            <span className="text-[9px] font-bold text-[#C3CCE6] group-hover:text-sun transition-colors">
              Changer
            </span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
              className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0"
              onChange={handleFileChange}
              aria-label="Changer la vidéo produit"
            />
          </label>
        )}
      </div>

      {error && <p className="mt-2 text-sm font-semibold text-hibiscus">{error}</p>}

      {/* Hidden input to pass key to server action */}
      {videoKey && <input type="hidden" name="videoKey" value={videoKey} />}
    </div>
  );
}
