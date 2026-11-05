export default function PriceDisplay({
  amount,
  className = "",
}: {
  amount: number;
  className?: string;
}) {
  const formattedAmount = amount.toLocaleString("fr-FR").replace(/\s/g, " ");

  return (
    <span className={`inline-flex max-w-full min-w-0 flex-wrap items-baseline gap-x-1 ${className}`}>
      <span className="font-bricolage font-black" style={{ overflowWrap: "anywhere" }}>
        {formattedAmount}
      </span>
      <span className="whitespace-nowrap text-[0.55em] font-bold">FCFA</span>
    </span>
  );
}
