import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jaaymaa — Ta boutique en ligne, en un lien",
    template: "%s | Jaaymaa",
  },
  description:
    "Crée ta boutique en ligne en 2 minutes, partage-la sur WhatsApp et reçois des commandes facilement. La solution e-commerce pensée pour les vendeurs sénégalais.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://jaayma.sn"),
  openGraph: {
    title: "Jaaymaa — Ta boutique en ligne, en un lien",
    description: "Crée ta boutique en ligne en 2 minutes. Partage sur WhatsApp. Gère tes commandes facilement.",
    siteName: "Jaaymaa",
    locale: "fr_SN",
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Jaaymaa" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F1E3D",
};

import { Suspense } from "react";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import RefreshSubscriptionPrice from "@/components/RefreshSubscriptionPrice";
import NavigationProgressBar from "@/components/NavigationProgressBar";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${bricolage.variable} ${instrument.variable} font-sans antialiased`}
      >
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <ServiceWorkerRegister />
        <RefreshSubscriptionPrice />
        <GoogleAnalytics measurementId={process.env.GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""} />
        {children}
      </body>
    </html>
  );
}
