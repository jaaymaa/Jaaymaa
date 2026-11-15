"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Download, QrCode, Share2 } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { DEFAULT_SHOP_THEME, getShopThemeForeground, SHOP_THEMES } from "@/lib/shop-theme";

const BRAND_INK = "#0F1E3D";
const CREAM = "#FFFBF2";
const JAAYMAA_ICON = "/icons/icon.svg";

export default function ShopQrCode({
  shopName,
  shopUrl,
  themeColor: selectedThemeColor,
  shopLogoUrl,
}: {
  shopName: string;
  shopUrl: string;
  themeColor?: string | null;
  shopLogoUrl?: string | null;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<"download" | "download-qr" | "share" | null>(null);
  const [message, setMessage] = useState("");
  const themeColor = SHOP_THEMES.find(({ value }) => value === selectedThemeColor)?.value ?? DEFAULT_SHOP_THEME;
  const themeForeground = getShopThemeForeground(themeColor);
  const qrColor = getScanSafeColor(themeColor);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(shopUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 480,
      color: { dark: qrColor, light: "#FFFFFF" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setMessage("Impossible de générer le QR code pour le moment.");
      });

    return () => {
      cancelled = true;
    };
  }, [shopUrl, qrColor]);

  async function handleDownload() {
    setBusy("download");
    setMessage("");
    try {
      const image = await createShareCard();
      downloadBlob(image, getFileName("affiche"));
      setMessage("Affiche HD téléchargée (2160x2700). Parfaite pour imprimer ou partager.");
    } catch {
      setMessage("Le téléchargement de l'affiche a échoué. Réessaie dans un instant.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadQrOnly() {
    setBusy("download-qr");
    setMessage("");
    try {
      const image = await createQrOnly();
      downloadBlob(image, getFileName("qr-seul"));
      setMessage("QR code seul téléchargé en haute résolution (PNG).");
    } catch {
      setMessage("Le téléchargement du QR code a échoué. Réessaie dans un instant.");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    setMessage("");
    try {
      const image = await createShareCard();
      const file = new File([image], getFileName("affiche"), { type: "image/png" });

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `QR code de ${shopName}`,
          text: `Scanne ce QR code pour découvrir la boutique ${shopName} sur Jaaymaa.`,
          files: [file],
        });
        setMessage("Affiche partagée.");
      } else {
        downloadBlob(image, file.name);
        setMessage("Affiche téléchargée. Tu peux maintenant la partager sur WhatsApp ou Instagram.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Le partage a échoué. Tu peux télécharger l'affiche et la partager manuellement.");
    } finally {
      setBusy(null);
    }
  }

  function getFileName(suffix: "affiche" | "qr-seul") {
    const safeName = shopName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `jaaymaa-${suffix}-${safeName || "boutique"}.png`;
  }

  async function createQrOnly(): Promise<Blob> {
    const size = 1200;
    const qrHighRes = await QRCode.toDataURL(shopUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: size,
      color: { dark: qrColor, light: "#FFFFFF" },
    });

    const [qrImage, brandImage] = await Promise.all([
      loadImage(qrHighRes),
      loadImage(JAAYMAA_ICON),
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas indisponible");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    context.drawImage(qrImage, 0, 0, size, size);
    drawBrandBadge(context, size / 2, size / 2, Math.round(size * 0.2), brandImage, themeColor);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image indisponible"))), "image/png");
    });
  }

  async function createShareCard(): Promise<Blob> {
    if (typeof document !== "undefined" && document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch {
        // Fallback sans bloquer
      }
    }

    const SCALE = 2; // Rendu Ultra HD (2160x2700) pour une netteté parfaite à l'écran et à l'impression
    const BASE_WIDTH = 1080;
    const BASE_HEIGHT = 1350;

    // Génération du QR code directement à la résolution physique du canvas (1160px) pour éviter tout flou
    const qrPixelSize = 580 * SCALE;
    const qrHighRes = await QRCode.toDataURL(shopUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: qrPixelSize,
      color: { dark: qrColor, light: "#FFFFFF" },
    });

    const [qrImage, brandImage, shopImage] = await Promise.all([
      loadImage(qrHighRes),
      loadImage(JAAYMAA_ICON),
      shopLogoUrl ? loadImage(shopLogoUrl, true).catch(() => null) : Promise.resolve(null),
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = BASE_WIDTH * SCALE;
    canvas.height = BASE_HEIGHT * SCALE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas indisponible");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.scale(SCALE, SCALE);

    // Fond et encadrement
    context.fillStyle = BRAND_INK;
    context.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    context.fillStyle = CREAM;
    context.fillRect(14, 14, BASE_WIDTH - 28, BASE_HEIGHT - 28);

    // En-tête coloré harmonieux
    const headerHeight = 210;
    context.fillStyle = themeColor;
    context.fillRect(14, 14, BASE_WIDTH - 28, headerHeight);

    const headerCenterY = 14 + headerHeight / 2; // 119px

    // Logo Jaaymaa + texte en-tête
    context.drawImage(brandImage, 56, headerCenterY - 38, 76, 76);

    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillStyle = themeForeground;
    context.font = getCanvasFont(900, 42, "title");
    context.fillText("JAAYMAA", 148, headerCenterY - 18);
    context.font = getCanvasFont(700, 20, "body");
    context.fillText("TA BOUTIQUE EN UN SCAN", 150, headerCenterY + 20);

    // Badge Logo boutique (ou initiale du commerçant)
    const logoCenterX = 930;
    const logoCenterY = headerCenterY;
    const logoRadius = 54;

    if (shopImage) {
      context.save();
      context.beginPath();
      context.arc(logoCenterX, logoCenterY, logoRadius, 0, Math.PI * 2);
      context.fillStyle = "#FFFFFF";
      context.fill();

      context.beginPath();
      context.arc(logoCenterX, logoCenterY, logoRadius - 4, 0, Math.PI * 2);
      context.clip();
      drawImageContain(
        context,
        shopImage,
        logoCenterX - (logoRadius - 8),
        logoCenterY - (logoRadius - 8),
        (logoRadius - 8) * 2,
        (logoRadius - 8) * 2
      );
      context.restore();

      // Contour net anti-aliasé
      context.beginPath();
      context.arc(logoCenterX, logoCenterY, logoRadius, 0, Math.PI * 2);
      context.strokeStyle = themeForeground;
      context.lineWidth = 6;
      context.stroke();
    } else {
      context.save();
      context.beginPath();
      context.arc(logoCenterX, logoCenterY, logoRadius, 0, Math.PI * 2);
      context.fillStyle = "#FFFFFF";
      context.fill();
      context.strokeStyle = themeForeground;
      context.lineWidth = 6;
      context.stroke();

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = BRAND_INK;
      context.font = getCanvasFont(900, 38, "title");
      const initial = shopName.trim().charAt(0).toUpperCase() || "B";
      context.fillText(initial, logoCenterX, logoCenterY);
      context.restore();
    }

    // Titres principaux
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = BRAND_INK;
    context.font = getCanvasFont(900, 48, "title");
    context.fillText("DÉCOUVREZ NOTRE BOUTIQUE", BASE_WIDTH / 2, 310, 930);

    const shopTitleColor =
      contrastRatio(parseHexColor(themeColor) ?? [15, 30, 61], [255, 251, 242]) >= 3
        ? themeColor
        : BRAND_INK;
    context.fillStyle = shopTitleColor;
    context.font = getCanvasFont(900, 52, "title");
    context.fillText(shopName, BASE_WIDTH / 2, 385, 900);

    // Zone du QR code encadré aux couleurs de la boutique
    const qrBoxSize = 670;
    const qrBoxX = (BASE_WIDTH - qrBoxSize) / 2; // 205
    const qrBoxY = 450;
    const innerBoxPadding = 12;
    const innerBoxSize = qrBoxSize - innerBoxPadding * 2; // 646

    context.fillStyle = themeColor;
    context.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
    context.fillStyle = "#FFFFFF";
    context.fillRect(qrBoxX + innerBoxPadding, qrBoxY + innerBoxPadding, innerBoxSize, innerBoxSize);

    // QR Code net à l'échelle 1:1 physique
    const qrDisplaySize = 580;
    const qrX = (BASE_WIDTH - qrDisplaySize) / 2; // 250
    const qrY = qrBoxY + (qrBoxSize - qrDisplaySize) / 2; // 495
    context.drawImage(qrImage, qrX, qrY, qrDisplaySize, qrDisplaySize);

    // Badge Jaaymaa central dans le QR code
    const badgeSize = 114;
    drawBrandBadge(context, BASE_WIDTH / 2, qrY + qrDisplaySize / 2, badgeSize, brandImage, themeColor);

    // Instructions et lien
    context.fillStyle = BRAND_INK;
    context.font = getCanvasFont(800, 28, "body");
    context.fillText("Scannez ce code avec votre téléphone", BASE_WIDTH / 2, 1170, 950);

    context.font = getCanvasFont(700, 24, "body");
    context.fillStyle = "#3F4B69";
    try {
      const destination = new URL(shopUrl);
      context.fillText(destination.host + destination.pathname, BASE_WIDTH / 2, 1215, 950);
    } catch {
      context.fillText(shopUrl, BASE_WIDTH / 2, 1215, 950);
    }

    // Pied de page
    const footerY = 1262;
    const footerHeight = 74;
    context.fillStyle = BRAND_INK;
    context.fillRect(14, footerY, BASE_WIDTH - 28, footerHeight);

    context.fillStyle = "#FFFBF2";
    context.font = getCanvasFont(800, 24, "title");
    context.fillText("Une boutique en ligne avec Jaaymaa", BASE_WIDTH / 2, footerY + footerHeight / 2);

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image indisponible"))), "image/png");
    });
  }

  return (
    <section
      className="rounded-2xl border-2 bg-[#F0EDE8] p-3"
      style={{ borderColor: themeColor }}
      aria-label="QR code de la boutique"
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink"
          style={{ backgroundColor: themeColor, color: themeForeground }}
        >
          <QrCode size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black">QR boutique</p>
          <p className="text-[10px] font-semibold text-[#65708A]">Aux couleurs de ta boutique</p>
        </div>
        {shopLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shopLogoUrl} alt={`Logo de ${shopName}`} className="h-8 w-8 rounded-full border-2 border-ink bg-white object-contain" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white text-xs font-black" aria-hidden="true">
            {shopName.trim().charAt(0).toUpperCase() || "B"}
          </span>
        )}
      </div>

      <div
        className="relative mx-auto mt-3 flex aspect-square w-full max-w-[132px] items-center justify-center rounded-xl border-2 bg-white p-2"
        style={{ borderColor: themeColor }}
      >
        {qrDataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={`QR code pour ouvrir la boutique ${shopName}`} className="h-full w-full" />
            <span className="absolute flex h-[25%] w-[25%] items-center justify-center rounded-xl border-2 bg-white p-1 shadow-sm" style={{ borderColor: themeColor }} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={JAAYMAA_ICON} alt="" className="h-full w-full rounded-lg" />
            </span>
          </>
        ) : (
          <JaaymaLoader size={48} label="Génération du QR code" />
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!qrDataUrl || busy !== null}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border-2 border-ink bg-white px-2 text-[10px] font-black transition-colors hover:bg-[#FFFBF2] disabled:opacity-50"
          title="Télécharger l'affiche complète en haute définition (2160x2700)"
        >
          {busy === "download" ? <JaaymaLoader size={28} /> : <Download size={13} />}
          Affiche HD
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!qrDataUrl || busy !== null}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border-2 border-ink px-2 text-[10px] font-black transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: themeColor, color: themeForeground }}
          title="Partager l'affiche sur WhatsApp ou réseaux"
        >
          {busy === "share" ? <JaaymaLoader variant={themeForeground === BRAND_INK ? "mini-ink" : "mini"} size={28} /> : <Share2 size={13} />}
          Partager
        </button>
      </div>

      <button
        type="button"
        onClick={handleDownloadQrOnly}
        disabled={!qrDataUrl || busy !== null}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-center text-[11px] font-bold text-[#65708A] transition-colors hover:text-ink disabled:opacity-50"
        title="Télécharger uniquement le QR code en PNG haute résolution (1200x1200)"
      >
        {busy === "download-qr" ? <JaaymaLoader size={20} /> : <QrCode size={12} />}
        Télécharger le QR seul (HD)
      </button>

      {message && <p role="status" className="mt-2 text-[10px] font-semibold leading-4 text-[#3F4B69]">{message}</p>}
    </section>
  );
}

function getCanvasFont(weight: number | string, size: number, type: "title" | "body" = "title"): string {
  let family =
    type === "title"
      ? '"Bricolage Grotesque", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      : '"Instrument Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const cssVar = type === "title" ? "--font-bricolage" : "--font-instrument";
    const computed =
      getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() ||
      getComputedStyle(document.body).getPropertyValue(cssVar).trim();
    if (computed) {
      family = `${computed}, ${family}`;
    }
  }

  return `${weight} ${size}px ${family}`;
}

function getScanSafeColor(color: string) {
  const target = parseHexColor(color);
  const ink: [number, number, number] = parseHexColor(BRAND_INK) ?? [15, 30, 61];
  if (!target || contrastRatio(target, [255, 255, 255]) >= 4.5) return color;

  // The Soleil theme is intentionally bright; deepen only the QR modules so they scan on white.
  for (let amount = 0.05; amount <= 1; amount += 0.05) {
    const darker = target.map((channel, index) => Math.round(channel * (1 - amount) + ink[index] * amount)) as [number, number, number];
    if (contrastRatio(darker, [255, 255, 255]) >= 4.5) {
      return `#${darker.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
    }
  }
  return BRAND_INK;
}

function parseHexColor(color: string): [number, number, number] | null {
  const match = /^#([\da-f]{6})$/i.exec(color);
  if (!match) return null;
  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
  ];
}

function contrastRatio(first: [number, number, number], second: [number, number, number]) {
  const luminance = (rgb: [number, number, number]) => {
    const channels = rgb.map((channel) => channel / 255).map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    );
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function drawBrandBadge(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  size: number,
  brandImage: HTMLImageElement,
  borderColor: string,
) {
  const x = centerX - size / 2;
  const y = centerY - size / 2;
  const radius = Math.round(size * 0.2);

  // Fond blanc du badge
  roundedRect(context, x, y, size, size, radius);
  context.fillStyle = "#FFFFFF";
  context.fill();

  // Bordure avec la couleur du thème
  context.strokeStyle = borderColor;
  context.lineWidth = 6;
  context.stroke();

  // Dessin de l'icône Jaaymaa avec coins arrondis
  const innerPad = Math.round(size * 0.11);
  const innerSize = size - innerPad * 2;
  context.save();
  roundedRect(context, x + innerPad, y + innerPad, innerSize, innerSize, Math.max(4, radius - 4));
  context.clip();
  context.drawImage(brandImage, x + innerPad, y + innerPad, innerSize, innerSize);
  context.restore();

  // Re-contour net
  roundedRect(context, x, y, size, size, radius);
  context.strokeStyle = borderColor;
  context.lineWidth = 6;
  context.stroke();
}

function drawImageContain(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function loadImage(source: string, anonymousCrossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (anonymousCrossOrigin) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image indisponible"));
    image.src = source;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
