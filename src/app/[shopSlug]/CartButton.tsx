"use client";

import { useCartStore } from "@/lib/cart-store";
import { formatFcfa } from "@/lib/money";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartButton({
  shopId,
  shopSlug,
  themeColor = "#FFC83D",
}: {
  shopId: string;
  shopSlug: string;
  themeColor?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { shopId: cartShopId, getCartCount, getCartTotal } = useCartStore();

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const count = getCartCount();
  if (count === 0 || cartShopId !== shopId) return null;
  const themeForeground = themeColor.toUpperCase() === "#FFC83D" ? "#0F1E3D" : "#FFFFFF";

  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-2 pointer-events-none z-40">
      <div className="max-w-xl mx-auto">
        <Link
          href={`/${shopSlug}/checkout`}
          prefetch={true}
          onClick={() => setIsNavigating(true)}
          className="pointer-events-auto w-full flex items-center justify-between gap-4 px-5 py-4 rounded-full border-[2.5px] border-ink bg-ink active:scale-[0.98] transition-transform"
          style={{ boxShadow: "0 12px 40px rgba(15,30,61,0.45)" }}
        >
          {/* Infos panier */}
          <div>
            <p className="text-xs font-medium text-ghost">{count} article{count > 1 ? "s" : ""}</p>
            <p className="font-bricolage font-black text-white text-lg leading-tight">{formatFcfa(getCartTotal())}</p>
          </div>

          {/* CTA */}
          <span className="flex items-center gap-2 rounded-full border-[2px] border-ink px-5 py-2.5 text-sm font-bold" style={{ backgroundColor: themeColor, color: themeForeground }}>
            {isNavigating ? (
              <>
                <JaaymaLoader
                  variant={themeForeground === "#0F1E3D" ? "mini-ink" : "mini"}
                  size={32}
                  label="Ouverture du panier"
                />
                <span aria-live="polite">Ouverture du panier…</span>
              </>
            ) : (
              "Commander"
            )}
          </span>
        </Link>
      </div>
    </div>
  );
}
