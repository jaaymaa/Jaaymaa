const WAX_PATTERNS = [
  {
    bg: "#0E7C66",
    image: "radial-gradient(circle at 50% 50%, #FFC83D 28%, transparent 28%), radial-gradient(circle at 50% 50%, #C8265A 12%, transparent 12%), radial-gradient(circle at 0 0, #0B5E4E 12%, transparent 12%), radial-gradient(circle at 100% 100%, #0B5E4E 12%, transparent 12%)",
    size: "40px 40px",
  },
  {
    bg: "#0F1E3D",
    image: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='24'%3E%3Cpolygon points='18,3 31,12 18,21 5,12' fill='%23FFC83D'/%3E%3C/svg%3E")`,
    size: "36px 24px",
  },
  {
    bg: "#C8265A",
    image: "radial-gradient(circle, transparent 37%, #FFC83D 37%, #FFC83D 55%, transparent 55%), radial-gradient(circle, #0F1E3D 15%, transparent 15%)",
    size: "40px 40px",
  },
  {
    bg: "#FFC83D",
    image: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='24'%3E%3Cpath d='M0 12Q9 0 18 12T36 12' fill='none' stroke='%230F1E3D' stroke-width='4'/%3E%3C/svg%3E")`,
    size: "36px 24px",
  },
] as const;

export type WaxPattern = (typeof WAX_PATTERNS)[number];
export { WAX_PATTERNS };

export default function ProductImageFrame({
  imageUrl,
  alt,
  wax,
  height,
  loading = "lazy",
  fetchPriority = "auto",
}: {
  imageUrl?: string | null;
  alt: string;
  wax: WaxPattern;
  height: number;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        height,
        backgroundColor: wax.bg,
        backgroundImage: wax.image,
        backgroundSize: wax.size,
      }}
    >
      {imageUrl ? (
        <div
          className="absolute overflow-hidden rounded-lg border-[1.5px] border-ink"
          style={{ inset: height >= 160 ? 12 : 7, backgroundColor: "#FFFBF2" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={alt}
            loading={loading}
            fetchPriority={fetchPriority}
            decoding="async"
            className="h-full w-full object-contain p-1.5"
          />
        </div>
      ) : (
        <div
          className="absolute flex flex-col items-center justify-center rounded-lg border-[1.5px] border-ink shadow-[2px_2px_0_#0F1E3D] select-none"
          style={{ inset: height >= 160 ? 12 : 7, backgroundColor: "#FFFBF2" }}
        >
          <span className="font-bricolage font-black text-2xl text-ink leading-none">
            {(alt || "P").charAt(0).toUpperCase()}
          </span>
          <span className="text-[9px] font-black text-[#65708A] mt-1 tracking-wider uppercase">
            Jaaymaa
          </span>
        </div>
      )}
    </div>
  );
}
