import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jaaymaa — Ta boutique en ligne, en un lien",
    short_name: "Jaaymaa",
    description:
      "Crée ta boutique en ligne en 2 minutes, partage-la sur WhatsApp et gère tes commandes simplement.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3F5FA",
    theme_color: "#0F1E3D",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
