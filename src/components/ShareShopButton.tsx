"use client";

import { MessageCircle, Share2, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { waLink, shopShareMessage } from "@/lib/whatsapp";

export default function ShareShopButton({
  shopName,
  shopSlug,
  tagline,
  whatsapp,
}: {
  shopName: string;
  shopSlug: string;
  tagline?: string | null;
  whatsapp?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://jaayma.sn");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const shopUrl = `${origin}/${shopSlug}`;

  const message = shopShareMessage({ shopName, shopUrl, tagline: tagline ?? undefined });
  const waUrl = waLink(whatsapp || "221700000000", message);

  async function copyLink() {
    await navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-papier border-[2.5px] border-ink rounded-2xl p-5 shadow-[4px_4px_0_#0F1E3D]">
      <h3 className="font-bricolage font-bold text-ink mb-4 flex items-center gap-2">
        <Share2 className="w-5 h-5 text-hibiscus" />
        Partager ma boutique
      </h3>

      <div className="flex items-center gap-2 bg-white border-[2px] border-ink rounded-xl px-3 py-2.5 mb-4">
        <span className="min-w-0 flex-1 break-all text-sm text-ink">{shopUrl}</span>
        <button
          onClick={copyLink}
          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
            copied ? "bg-baobab/10 text-baobab" : "bg-sun/20 hover:bg-sun/40 text-ink"
          }`}
          title="Copier le lien"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 bg-baobab text-white font-bold py-3 px-4 rounded-full border-[2.5px] border-ink shadow-[3px_3px_0_#0F1E3D] hover:-translate-y-0.5 transition-transform w-full"
      >
        <MessageCircle className="w-5 h-5" />
        Partager sur WhatsApp
      </a>

      {copied && (
        <p className="text-xs text-center text-baobab mt-3 font-bold">
           Lien copié dans le presse-papier !
        </p>
      )}
    </div>
  );
}
