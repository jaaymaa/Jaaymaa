import Image from "next/image";
import type { Plan } from "@/lib/plans";

const BADGE_BY_PLAN = {
  pro: "/badges/jaayma-badge-verifie-pro.svg",
  pro_plus: "/badges/jaayma-badge-verifie-pro-plus.svg",
} as const;

export default function ShopVerificationBadge({
  plan,
  size = 26,
  className = "",
}: {
  plan: Plan;
  size?: number;
  className?: string;
}) {
  if (plan === "free") return null;

  const planLabel = plan === "pro_plus" ? "Pro+" : "Pro";

  return (
    <span
      role="img"
      aria-label={`Boutique vérifiée Jaayma ${planLabel}`}
      title={`Boutique vérifiée · ${planLabel}`}
      className={`pointer-events-none absolute bottom-[-2px] right-[-2px] z-10 block leading-none ${className}`.trim()}
    >
      <Image
        src={BADGE_BY_PLAN[plan]}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="block"
      />
    </span>
  );
}
