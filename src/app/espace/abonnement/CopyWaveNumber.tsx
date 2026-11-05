"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyWaveNumber({ number }: { number: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-papier hover:bg-sun/20 text-ink border-[2px] border-ink rounded-full transition-colors"
      title="Copier le numéro"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-baobab" />
          <span className="text-baobab">Copié !</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-muted" />
          <span>Copier</span>
        </>
      )}
    </button>
  );
}
