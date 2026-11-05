"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { Upload, X, ImageIcon, Store, Crop } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { getImageUrl } from "@/lib/images";
import { uploadImageFile } from "@/lib/upload-client";
import CoverImageCropper from "@/components/CoverImageCropper";

interface ImageUploaderProps {
  currentKey?: string | null;
  inputName: string;
  folder: string;
  label?: string;
  aspectRatio?: "square" | "wide";
  variant?: "card" | "avatar";
  tone?: "light" | "dark";
  onUploadingChange?: (isUploading: boolean) => void;
}

const FILE_ACCEPT = "image/*";

export default function ImageUploader({
  currentKey,
  inputName,
  folder,
  label = "Photo",
  aspectRatio = "square",
  variant = "card",
  tone = "light",
  onUploadingChange,
}: ImageUploaderProps) {
  const isWide = aspectRatio === "wide";
  const [previewUrl, setPreviewUrl] = useState<string | null>(getImageUrl(currentKey));
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<{ file: File; url: string } | null>(null);
  const previewObjectUrl = useRef<string | null>(null);

  useEffect(() => {
    setPreviewUrl(getImageUrl(currentKey));
    setNewKey(null);
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }
  }, [currentKey]);

  useEffect(() => {
    if (!cropSource) return;
    const url = cropSource.url;
    return () => URL.revokeObjectURL(url);
  }, [cropSource]);

  useEffect(() => () => {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
  }, []);

  const labelClass =
    tone === "dark"
      ? "block text-xs font-bold mb-1.5"
      : "block text-xs font-bold text-muted mb-2";
  const labelStyle = tone === "dark" ? { color: "#C3CCE6" } : undefined;

  async function uploadFile(file: File, localUrl: string) {
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = localUrl;
    setPreviewUrl(localUrl);
    setError(null);
    setIsUploading(true);
    onUploadingChange?.(true);

    try {
      const result = await uploadImageFile(file, folder);

      if (result.error || !result.key) {
        setError(result.error || "Erreur lors de l'upload.");
        if (previewObjectUrl.current === localUrl) {
          URL.revokeObjectURL(localUrl);
          previewObjectUrl.current = null;
        }
        setPreviewUrl(getImageUrl(currentKey));
        setNewKey(null);
        return false;
      }

      setNewKey(result.key);
      return true;
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Erreur lors de l'upload.");
      if (previewObjectUrl.current === localUrl) {
        URL.revokeObjectURL(localUrl);
        previewObjectUrl.current = null;
      }
      setPreviewUrl(getImageUrl(currentKey));
      setNewKey(null);
      return false;
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    if (isWide) {
      setError(null);
      setCropSource({ file, url: localUrl });
    } else {
      await uploadFile(file, localUrl);
    }
  }

  function handleRemove(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = null;
    }
    setPreviewUrl(null);
    setNewKey("");
  }

  async function handleRecrop() {
    if (!previewUrl) return;
    setIsPreparingCrop(true);
    setError(null);
    try {
      const response = await fetch(previewUrl);
      if (!response.ok) throw new Error("Impossible de charger cette photo pour la recadrer.");
      const blob = await response.blob();
      const file = new File([blob], "couverture.jpg", { type: blob.type || "image/jpeg" });
      setCropSource({ file, url: URL.createObjectURL(blob) });
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : "Impossible de charger cette photo pour la recadrer.");
    } finally {
      setIsPreparingCrop(false);
    }
  }

  async function handleCropApply(file: File) {
    const localUrl = URL.createObjectURL(file);
    const uploaded = await uploadFile(file, localUrl);
    if (uploaded) setCropSource(null);
    return uploaded;
  }

  const hiddenKey = (
    <input type="hidden" name={inputName} value={newKey !== null ? newKey : (currentKey ?? "")} />
  );

  const fileInput = (
    <input
      type="file"
      accept={FILE_ACCEPT}
      className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0"
      onChange={handleFileChange}
      aria-label={label || "Ajouter une photo"}
    />
  );

  if (variant === "avatar") {
    return (
      <div className="relative w-20 h-20 shrink-0">
        <label className="relative block w-20 h-20 rounded-full overflow-hidden cursor-pointer border-[3px] border-ink shadow-[3px_3px_0_#0F1E3D] bg-gradient-to-br from-[#FFF8E7] to-[#FFEEC2] group">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Logo" className="w-full h-full object-cover bg-white" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#FFFBF2] to-[#FFE8A3]">
              <Store className="w-8 h-8 text-[#0F1E3D] stroke-[2.2] group-hover:scale-110 transition-transform" />
            </span>
          )}
          {isUploading && (
            <span className="absolute inset-0 bg-[#0F1E3D]/70 flex items-center justify-center rounded-full">
              <JaaymaLoader size={40} />
            </span>
          )}
          {fileInput}
        </label>
        <span className="pointer-events-none absolute -bottom-1 -right-1 z-[2] w-7 h-7 rounded-full border-[2px] border-ink bg-[#FFC83D] flex items-center justify-center shadow-[1px_1px_0_#0F1E3D]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </span>
        {previewUrl && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -left-1 z-[3] w-6 h-6 rounded-full bg-[#FFFBF2] text-hibiscus flex items-center justify-center border-[2px] border-ink shadow-sm hover:bg-[#F6C3D2] transition-colors"
            aria-label="Supprimer le logo"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        )}
        {error && <p className="absolute left-24 top-0 w-48 text-xs text-hibiscus font-semibold">{error}</p>}
        {hiddenKey}
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <p className={labelClass} style={labelStyle}>
          {label}
        </p>
      )}

      <label
        className={`relative block ${isWide ? "w-full aspect-[3/1]" : "w-full max-w-xs aspect-square"} rounded-[22px] overflow-hidden cursor-pointer transition-all duration-200 group border-[2.5px] border-ink ${
          previewUrl
            ? "bg-white shadow-[3px_3px_0_#0F1E3D]"
            : tone === "dark"
              ? "bg-[#16264D]/90 hover:bg-[#1A2E5C] border-dashed border-white/25 hover:border-[#FFC83D] shadow-[3px_3px_0_rgba(0,0,0,0.3)]"
              : "bg-[#FFFBF2] hover:bg-[#FFF8E7] border-dashed border-ink/35 hover:border-sun shadow-[3px_3px_0_#0F1E3D]"
        }`}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover" />
            {isUploading && (
              <span className="absolute inset-0 bg-[#0F1E3D]/70 flex flex-col items-center justify-center gap-2">
                <JaaymaLoader size={48} />
                <span className="text-xs font-black text-white">Téléversement...</span>
              </span>
            )}
            {!isUploading && (
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 rounded-full bg-[#0F1E3D] text-[#FFC83D] border-[2px] border-ink font-bricolage text-xs font-black flex items-center gap-2 shadow-[2px_2px_0_#0F1E3D]">
                  <Upload className="w-3.5 h-3.5" /> Changer la photo
                </span>
              </span>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            {/* Badge icône stylisé */}
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-[2px] border-ink bg-[#FFC83D] text-[#0F1E3D] shadow-[2px_2px_0_#0F1E3D] mb-2.5 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6 stroke-[2.3]" />
            </div>

            <p className="font-bricolage font-black text-sm text-white leading-tight">
              {isWide ? "Ajouter une bannière de couverture" : "Ajouter une photo"}
            </p>
            <p className="text-[11px] font-medium text-[#C3CCE6] mt-1 max-w-xs">
              {isWide
                ? "Ajuste le cadrage et le zoom après avoir choisi ta photo"
                : "PNG, JPG ou WebP • Touchez pour choisir"}
            </p>

            <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border border-white/20 bg-white/10 text-[#FFC83D] group-hover:bg-[#FFC83D] group-hover:text-[#0F1E3D] group-hover:border-ink transition-colors">
              <Upload className="w-3 h-3" /> Parcourir
            </span>
          </div>
        )}
        {fileInput}
      </label>

      {previewUrl && !isUploading && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
          {isWide && (
            <button
              type="button"
              onClick={handleRecrop}
              disabled={isPreparingCrop}
              className="text-xs font-bold text-[#FFC83D] hover:text-white disabled:opacity-60 flex items-center gap-1.5 transition-colors"
            >
              {isPreparingCrop ? <JaaymaLoader size={24} /> : <Crop className="h-3.5 w-3.5" />}
              {isPreparingCrop ? "Préparation…" : "Recadrer / zoomer"}
            </button>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-hibiscus hover:text-[#e03a6f] font-bold flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} /> Supprimer cette photo
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-bold text-hibiscus">{error}</p>}
      {hiddenKey}
      {isWide && cropSource && (
        <CoverImageCropper
          imageUrl={cropSource.url}
          fileName={cropSource.file.name}
          onCancel={() => setCropSource(null)}
          onApply={handleCropApply}
        />
      )}
    </div>
  );
}
