type JaaymaLoaderVariant = "main" | "mini" | "mini-ink";

type JaaymaLoaderProps = {
  variant?: JaaymaLoaderVariant;
  size?: number;
  label?: string;
  className?: string;
};

const loaderSources: Record<JaaymaLoaderVariant, string> = {
  main: "/loaders/jaayma-loader.svg",
  mini: "/loaders/jaayma-loader-mini.svg",
  "mini-ink": "/loaders/jaayma-loader-mini-encre.svg",
};

export function JaaymaLoader({
  variant = "mini",
  size = variant === "main" ? 144 : 32,
  label,
  className = "",
}: JaaymaLoaderProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-flex shrink-0 items-center justify-center ${className}`.trim()}
    >
      {/* SVG files keep their own animation when loaded as images. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={loaderSources[variant]}
        alt=""
        width={size}
        height={variant === "main" ? size : Math.round(size * 0.375)}
        style={{ width: size, height: "auto" }}
      />
    </span>
  );
}

export function JaaymaScreenLoader({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={`flex min-h-[70vh] w-full items-center justify-center p-6 ${className}`.trim()}
    >
      <JaaymaLoader variant="main" size={144} />
    </div>
  );
}
