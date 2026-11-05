"use client";

import { useEffect } from "react";
import { recordShopVisit } from "@/app/actions/visit";

export default function TrackVisit({ shopId }: { shopId: string }) {
  useEffect(() => {
    recordShopVisit(shopId);
  }, [shopId]);

  return null;
}
