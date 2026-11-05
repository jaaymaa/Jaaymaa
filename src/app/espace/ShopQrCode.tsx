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
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [message, setMessage] = useState("");
  const themeColor = SHOP_THEMES.find(({ value }) => value === selectedThemeColor)?.value ?? DEFAULT_SHOP_THEME;
  const themeForeground = getShopThemeForeground(themeColor);
  const qrColor = getScanSafeColor(themeColor);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(shopUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 420,
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
      downloadBlob(image, getFileName());
      setMessage("QR téléchargé. Tu peux l’imprimer ou l’envoyer à tes clients.");
    } catch {
      setMessage("Le téléchargement du QR a échoué. Réessaie dans un instant.");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    setMessage("");
    try {
      const image = await createShareCard();
      const file = new File([image], getFileName(), { type: "image/png" });

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `QR code de ${shopName}`,
          text: `Scanne ce QR code pour découvrir la boutique ${shopName} sur Jaaymaa.`,
          files: [file],
        });
        setMessage("QR code partagé.");
      } else {
        downloadBlob(image, file.name);
        setMessage("QR téléchargé. Tu peux maintenant le partager sur WhatsApp.");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Le partage du QR a échoué. Tu peux le télécharger et le partager manuellement.");
    } finally {
      setBusy(null);
    }
  }

  function getFileName() {
    const safeName = shopName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return `jaaymaa-qr-${safeName || "boutique"}.png`;
  }

  async function createShareCard(): Promise<Blob> {
    const qr = qrDataUrl ?? (await QRCode.toDataURL(shopUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 420,
      color: { dark: qrColor, light: "#FFFFFF" },
    }));
    const [qrImage, brandImage, shopImage] = await Promise.all([
      loadImage(qr),
      loadImage(JAAYMAA_ICON),
      shopLogoUrl ? loadImage(shopLogoUrl, true).catch(() => null) : Promise.resolve(null),
    ]);
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas indisponible");

    context.fillStyle = BRAND_INK;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = CREAM;
    context.fillRect(12, 12, canvas.width - 24, canvas.height - 24);
    context.fillStyle = themeColor;
    context.fillRect(12, 12, canvas.width - 24, 260);

    // Jaaymaa branding and the merchant's own logo share the header.
    context.drawImage(brandImage, 58, 48, 80, 80);
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillStyle = themeForeground;
    context.font = "900 42px Arial, sans-serif";
    context.fillText("JAAYMAA", 155, 88);
    context.font = "700 22px Arial, sans-serif";
    context.fillText("TA BOUTIQUE EN UN SCAN", 156, 128);

    if (shopImage) {
      context.save();
      context.beginPath();
      context.arc(930, 91, 56, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = "#FFFFFF";
      context.fillRect(874, 35, 112, 112);
      drawImageContain(context, shopImage, 884, 45, 92, 92);
      context.restore();
      context.strokeStyle = themeForeground;
      context.lineWidth = 5;
      context.beginPath();
      context.arc(930, 91, 56, 0, Math.PI * 2);
      context.stroke();
    }

    context.textAlign = "center";
    context.fillStyle = BRAND_INK;
    context.font = "900 54px Arial, sans-serif";
    context.fillText("DÉCOUVREZ NOTRE BOUTIQUE", canvas.width / 2, 330, 930);
    context.fillStyle = themeColor;
    context.font = "900 52px Arial, sans-serif";
    context.fillText(shopName, canvas.width / 2, 412, 900);

    // Keep a broad white quiet zone around the colored QR for reliable scanning.
    context.fillStyle = themeColor;
    context.fillRect(201, 470, 678, 678);
    context.fillStyle = "#FFFFFF";
    context.fillRect(213, 482, 654, 654);
    context.drawImage(qrImage, 251, 520, 578, 578);
    drawBrandBadge(context, canvas.width / 2, 809, 112, brandImage, themeColor);

    context.fillStyle = BRAND_INK;
    context.font = "800 30px Arial, sans-serif";
    context.fillText("Scannez ce code avec votre téléphone", canvas.width / 2, 1190, 950);
    context.font = "600 24px Arial, sans-serif";
    context.fillStyle = "#3F4B69";
    const destination = new URL(shopUrl);
    context.fillText(destination.host + destination.pathname, canvas.width / 2, 1238, 950);

    context.fillStyle = BRAND_INK;
    context.fillRect(12, 1270, canvas.width - 24, 68);
    context.fillStyle = "#FFFBF2";
    context.font = "800 24px Arial, sans-serif";
    context.fillText("Une boutique en ligne avec Jaaymaa", canvas.width / 2, 1304);

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
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border-2 border-ink bg-white px-2 text-[10px] font-black disabled:opacity-50"
        >
          {busy === "download" ? <JaaymaLoader size={28} /> : <Download size={13} />}
          Télécharger
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!qrDataUrl || busy !== null}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border-2 border-ink px-2 text-[10px] font-black disabled:opacity-50"
          style={{ backgroundColor: themeColor, color: themeForeground }}
        >
          {busy === "share" ? <JaaymaLoader variant={themeForeground === BRAND_INK ? "mini-ink" : "mini"} size={28} /> : <Share2 size={13} />}
          Partager
        </button>
      </div>
      {message && <p role="status" className="mt-2 text-[10px] font-semibold leading-4 text-[#3F4B69]">{message}</p>}
    </section>
  );
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
  roundedRect(context, x, y, size, size, 22);
  context.fillStyle = "#FFFFFF";
  context.fill();
  context.strokeStyle = borderColor;
  context.lineWidth = 7;
  context.stroke();
  context.drawImage(brandImage, x + 12, y + 12, size - 24, size - 24);
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
