"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export default function ShareShopButton({
  shopName,
  shopUrl,
}: {
  shopName: string;
  shopUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function shareShop() {
    const shareData = {
      title: shopName,
      text: `Découvre ma boutique ${shopName} sur Jaaymaa :`,
      url: shopUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          window.open(
            `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shopUrl}`)}`,
            "_blank",
            "noopener,noreferrer"
          );
        }
      }
      return;
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shopUrl}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyShopUrl() {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copie le lien de ta boutique :", shopUrl);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={shareShop}
        className="inline-flex items-center justify-center gap-2 rounded-full border-[2.5px] border-ink bg-[#FFC83D] px-4 py-3 text-sm font-black shadow-[3px_3px_0_#0F1E3D] transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <Share2 size={16} /> Partager
      </button>
      <button
        type="button"
        onClick={copyShopUrl}
        aria-label={copied ? "Lien copié" : "Copier le lien de la boutique"}
        title={copied ? "Lien copié" : "Copier le lien"}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-ink bg-white shadow-[3px_3px_0_#0F1E3D] transition-transform hover:-translate-y-0.5 active:translate-y-0"
      >
        {copied ? <Check size={17} className="text-[#0E7C66]" /> : <Copy size={17} />}
      </button>
    </div>
  );
}
