"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";

interface CoverImageCropperProps {
  imageUrl: string;
  fileName: string;
  onCancel: () => void;
  onApply: (file: File) => Promise<boolean>;
}

const OUTPUT_WIDTH = 1500;
const OUTPUT_HEIGHT = 500;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function CoverImageCropper({
  imageUrl,
  fileName,
  onCancel,
  onApply,
}: CoverImageCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      setFrameSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const baseScale = imageSize.width && frameSize.width
    ? Math.max(frameSize.width / imageSize.width, frameSize.height / imageSize.height)
    : 0;
  const displayWidth = imageSize.width * baseScale * zoom;
  const displayHeight = imageSize.height * baseScale * zoom;
  const maxOffsetX = Math.max(0, (displayWidth - frameSize.width) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - frameSize.height) / 2);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isSaving || !imageSize.width) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setOffset({
      x: maxOffsetX ? clamp(drag.offsetX + (event.clientX - drag.x) / maxOffsetX, -1, 1) : 0,
      y: maxOffsetY ? clamp(drag.offsetY + (event.clientY - drag.y) / maxOffsetY, -1, 1) : 0,
    });
  }

  function stopDragging(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  async function saveCrop() {
    const frame = frameRef.current;
    if (!frame || !imageSize.width || !baseScale || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const frameRect = frame.getBoundingClientRect();
      const scale = baseScale * zoom;
      const sourceWidth = frameRect.width / scale;
      const sourceHeight = frameRect.height / scale;
      const sourceX = clamp(
        (imageSize.width - sourceWidth) / 2 - (offset.x * maxOffsetX) / scale,
        0,
        imageSize.width - sourceWidth,
      );
      const sourceY = clamp(
        (imageSize.height - sourceHeight) / 2 - (offset.y * maxOffsetY) / scale,
        0,
        imageSize.height - sourceHeight,
      );

      const image = new window.Image();
      image.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        if (image.complete && image.naturalWidth) {
          resolve();
          return;
        }
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Impossible de lire cette photo."));
      });

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Impossible de préparer le recadrage.");
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT,
      );

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Impossible d’enregistrer le recadrage.");
      const baseName = fileName.replace(/\.[^.]+$/, "") || "couverture";
      const croppedFile = new File([blob], `${baseName}-recadree.jpg`, { type: "image/jpeg" });
      const applied = await onApply(croppedFile);
      if (!applied) setSaveError("L’envoi a échoué. Vérifie ta connexion et réessaie.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Impossible de recadrer cette photo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#071126]/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-crop-title"
        className="w-full max-w-2xl overflow-hidden rounded-3xl border-[2.5px] border-ink bg-[#FFFBF2] shadow-[6px_6px_0_#0F1E3D]"
      >
        <header className="flex items-start justify-between gap-4 border-b-2 border-ink/10 px-5 py-4 sm:px-6">
          <div>
            <h2 id="cover-crop-title" className="font-bricolage text-lg font-black text-ink">Recadrer la couverture</h2>
            <p className="mt-1 text-xs text-muted">Fais glisser la photo et zoome pour choisir la zone visible.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="Fermer le recadrage"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white text-ink transition hover:bg-[#FFEEC2] disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </header>

        <div className="space-y-5 p-5 sm:p-6">
          <div
            ref={frameRef}
            className="relative aspect-[3/1] w-full touch-none cursor-grab overflow-hidden rounded-2xl border-[2.5px] border-ink bg-[#16264D] active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Photo de couverture à recadrer"
              draggable={false}
              onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              className="pointer-events-none absolute max-w-none select-none"
              style={imageSize.width && baseScale ? {
                width: displayWidth,
                height: displayHeight,
                left: `calc(50% + ${offset.x * maxOffsetX}px)`,
                top: `calc(50% + ${offset.y * maxOffsetY}px)`,
                transform: "translate(-50%, -50%)",
              } : { visibility: "hidden" }}
            />
            {!imageSize.width && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                <JaaymaLoader size={32} /> Préparation de la photo…
              </span>
            )}
            <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-[#0F1E3D]/75 px-3 py-1 text-[10px] font-bold text-white">
              Aperçu de la bannière
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut size={18} className="shrink-0 text-ink" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              aria-label="Zoom de la photo de couverture"
              className="h-2 w-full cursor-pointer accent-[#FFC83D]"
            />
            <ZoomIn size={18} className="shrink-0 text-ink" />
            <span className="w-12 text-right text-xs font-black tabular-nums text-ink">{zoom.toFixed(1)}×</span>
          </div>

          {saveError && <p role="alert" className="text-xs font-bold text-hibiscus">{saveError}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); setSaveError(null); }}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-bold text-ink transition hover:bg-black/5 disabled:opacity-50"
            >
              <RotateCcw size={15} /> Réinitialiser
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="flex-1 rounded-full border-2 border-ink bg-white px-5 py-3 text-xs font-bold text-ink transition hover:bg-[#FFEEC2] disabled:opacity-50 sm:flex-none"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={saveCrop}
                disabled={isSaving || !imageSize.width}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-[#FFC83D] px-5 py-3 text-xs font-black text-ink shadow-[2px_2px_0_#0F1E3D] transition hover:bg-[#FFD464] disabled:opacity-60 sm:flex-none"
              >
                {isSaving ? <><JaaymaLoader variant="mini-ink" size={28} /> Envoi…</> : "Utiliser cette photo"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
