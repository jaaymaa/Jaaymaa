import Link from "next/link";
import { getCurrentSellerId } from "@/lib/auth";
import { getPublicFeatures } from "@/services/admin.service";

export const metadata = {
  title: "Jaaymaa — Ta boutique en ligne, en un lien",
  description:
    "Crée ta boutique en ligne en 2 minutes, partage-la sur WhatsApp et reçois des commandes facilement. La solution e-commerce pensée pour les vendeurs sénégalais.",
  openGraph: {
    title: "Jaaymaa — Ta boutique en ligne, en un lien",
    description: "Crée ta boutique en ligne en 2 minutes et vends sur WhatsApp.",
    locale: "fr_SN",
    type: "website",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Jaaymaa" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/icons/icon-512.png"],
  },
};

/*  SVG Logo mark (j)  */
function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <path d="M38 4H82A34 34 0 0 1 116 38V82A34 34 0 0 1 82 116H10A6 6 0 0 1 4 110V38A34 34 0 0 1 38 4Z" fill="#FFC83D" />
      <path d="M64 46V76C64 90 57 97 44 97" stroke="#0F1E3D" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="64" cy="28" r="7.5" fill="#C8265A" />
    </svg>
  );
}

/*  SVG Wordmark "jaaymaa"  */
function Wordmark({ color = "#0F1E3D", size = 1 }: { color?: string; size?: number }) {
  return (
    <svg width={Math.round(440 * size)} height={Math.round(88 * size)} viewBox="0 0 440 88" fill="none">
      <g stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 20V64C22 78 16 84 8 84" />
        <circle cx="66" cy="40" r="20" />
        <path d="M86 20V60" />
        <circle cx="130" cy="40" r="20" />
        <path d="M150 20V60" />
        <path d="M174 20V40A18 18 0 0 0 210 40M210 20V64C210 78 204 84 196 84" />
        <path d="M234 20V60M234 33A13 13 0 0 1 260 33V60M260 33A13 13 0 0 1 286 33V60" />
        <circle cx="330" cy="40" r="20" />
        <path d="M350 20V60" />
        <circle cx="390" cy="40" r="20" />
        <path d="M410 20V60" />
      </g>
      <circle cx="22" cy="4" r="6.5" fill="#C8265A" />
    </svg>
  );
}

/*  Ticket card (bords en dents de scie bas)  */
function TicketCard({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative ${className}`} style={style}>
      {children}
      {/* dents de scie SVG collées en bas */}
      <svg
        className="absolute bottom-0 left-0 right-0 translate-y-full"
        viewBox="0 0 344 18"
        preserveAspectRatio="none"
        style={{ width: "100%", height: 18 }}
      >
        <path
          d="M0 0H344V18L334.6 9L325.1 18L315.7 9L306.3 18L296.9 9L287.4 18L278.0 9L268.6 18L259.1 9L249.7 18L240.3 9L230.9 18L221.4 9L212.0 18L202.6 9L193.1 18L183.7 9L174.3 18L164.9 9L155.4 18L146.0 9L136.6 18L127.1 9L117.7 18L108.3 9L98.9 18L89.4 9L80.0 18L70.6 9L61.1 18L51.7 9L42.3 18L32.9 9L23.4 18L14.0 9L4.6 18L0 9Z"
          fill="#FFFBF2"
          stroke="#0F1E3D"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/*  Wax swatch  */
const WAX_STYLES = [
  { bg: "#0E7C66", inner: "radial-gradient(circle, #FFC83D 28%, transparent 28%), radial-gradient(circle, #C8265A 12%, transparent 12%)" },
  { bg: "#0F1E3D", inner: "none", losange: true },
  { bg: "#C8265A", inner: "radial-gradient(circle, transparent 37%, #FFC83D 37%, #FFC83D 55%, transparent 55%)" },
];

export default async function LandingPage() {
  const [sellerId, explorerEnabled] = await Promise.all([
    getCurrentSellerId(),
    getPublicFeatures().then(({ explorerEnabled }) => explorerEnabled).catch(() => true),
  ]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "#0E7C66" }}>
      <header className="flex min-h-screen flex-col" style={{ backgroundColor: "#0E7C66", minHeight: "100dvh" }}>
        {/*  NAVBAR  */}
        <nav
          className="w-full px-5 pb-2 flex items-center justify-between max-w-2xl mx-auto"
          style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <Wordmark color="#fff" size={0.28} />
          </div>

          {sellerId ? (
            <Link
              href="/espace"
              className="shrink-0 whitespace-nowrap rounded-full border-[2.5px] border-ink px-3 py-2.5 text-xs font-bold min-[360px]:px-5 min-[360px]:text-sm"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "3px 3px 0 #0F1E3D" }}
            >
              Mon Espace
            </Link>
          ) : (
            <Link
              href="/connexion"
              className="shrink-0 whitespace-nowrap rounded-full border-[2.5px] border-ink px-3 py-2.5 text-xs font-bold min-[360px]:px-5 min-[360px]:text-sm"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "3px 3px 0 #0F1E3D" }}
            >
              Connexion
            </Link>
          )}
        </nav>

        {/*  HERO  */}
        <section
          className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 pt-7"
          style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
        <h1 className="font-bricolage font-black text-white leading-none mb-1" style={{ fontSize: "clamp(2.8rem, 12vw, 4.5rem)", letterSpacing: "-0.02em" }}>
          Ta boutique,
        </h1>
        <h1 className="font-bricolage font-black leading-none mb-4" style={{ fontSize: "clamp(2.8rem, 12vw, 4.5rem)", letterSpacing: "-0.02em", color: "#FFC83D" }}>
          en un lien.
        </h1>
        <p className="text-sm font-medium mb-8" style={{ color: "#CFEFE6" }}>
          Montre tes produits, reçois les commandes<br />et suis chaque livraison.
        </p>

        {/*  Boutique preview card (ticket, légèrement incliné)  */}
        <div style={{ transform: "rotate(-4deg)", transformOrigin: "center" }} className="mb-8">
          <TicketCard className="rounded-2xl overflow-hidden border-[2.5px] border-ink pb-1" style={{ backgroundColor: "#FFFBF2" }}>
            <div className="px-5 pt-4 pb-1">
              <p className="font-bricolage font-black text-ink text-lg leading-tight">Awa Couture</p>
              <p className="text-sm font-bold" style={{ color: "#0E7C66" }}>awa-couture.jaayma.sn</p>
            </div>
            <div className="flex gap-3 px-5 pb-6 pt-2">
              {WAX_STYLES.map((w, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-xl border-2 border-ink flex-shrink-0"
                  style={{
                    backgroundColor: w.bg,
                    backgroundImage: w.losange
                      ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='24'%3E%3Cpolygon points='18,3 31,12 18,21 5,12' fill='%23FFC83D'/%3E%3C/svg%3E\")"
                      : w.inner,
                    backgroundSize: w.losange ? "36px 24px" : "40px 40px",
                  }}
                />
              ))}
            </div>
          </TicketCard>
        </div>

        {/*  Feature chips  */}
        <div className="flex flex-wrap gap-3 mb-6" style={{ transform: "rotate(0deg)" }}>
          {[
            { label: "Wave et Orange Money", bg: "#FFC83D", color: "#0F1E3D" },
            { label: "Suivi livraison", bg: "#C8265A", color: "#fff" },
            { label: "Gratuit pour démarrer", bg: "#FFFBF2", color: "#0F1E3D" },
          ].map((chip) => (
            <span
              key={chip.label}
              className="text-xs font-bold px-4 py-2 rounded-full border-[2.5px] border-ink"
              style={{ backgroundColor: chip.bg, color: chip.color, boxShadow: "3px 3px 0 #0F1E3D" }}
            >
              {chip.label}
            </span>
          ))}
        </div>

        {/*  CTA principale  */}
        {sellerId ? (
          <Link
            href="/espace"
            className="block w-full text-center font-bold text-base py-4 rounded-full border-[2.5px] border-ink mb-4 transition-transform active:scale-95"
            style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "4px 4px 0 #0F1E3D" }}
          >
            Mon espace vendeur 
          </Link>
        ) : (
          <>
            <Link
              href="/inscription"
              className="block w-full text-center font-bold text-base py-4 rounded-full border-[2.5px] border-ink mb-4 transition-transform active:scale-95"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "4px 4px 0 #0F1E3D" }}
            >
              Créer ma boutique
            </Link>
            <p className="text-center text-sm font-semibold text-white mb-2">
              Déjà un compte ?{" "}
              <Link href="/connexion" className="underline underline-offset-2" style={{ color: "#FFC83D" }}>
                Connecte-toi
              </Link>
            </p>
          </>
        )}
        </section>
      </header>

      {/*  EXPLORER section  */}
      {explorerEnabled && (
        <section className="bg-white py-14 px-5">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#C8265A" }}>
              Pour les acheteurs
            </p>
            <h2 className="font-bricolage font-black leading-tight mb-4" style={{ fontSize: "clamp(1.8rem, 6vw, 2.5rem)", color: "#0F1E3D", letterSpacing: "-0.02em" }}>
              Ce que tu veux,<br />livré chez toi.
            </h2>
            <p className="text-sm mb-6" style={{ color: "#3F4B69" }}>
              Découvre des boutiques sénégalaises  mode, beauté, maison  et commande en quelques secondes.
            </p>
            <Link
              href="/explorer"
              prefetch={true}
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full border-[2.5px] border-ink transition-transform active:scale-95"
              style={{ backgroundColor: "#0F1E3D", color: "#FFC83D", boxShadow: "4px 4px 0 #FFC83D" }}
            >
              Explorer les boutiques
            </Link>
          </div>
        </section>
      )}

      {/*  FONCTIONNALITÉS  */}
      <section style={{ backgroundColor: "#0F1E3D" }} className="py-14 px-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#FFC83D" }}>
            Pour les vendeurs
          </p>
          <h2 className="font-bricolage font-black text-white leading-tight mb-8" style={{ fontSize: "clamp(1.8rem, 6vw, 2.5rem)", letterSpacing: "-0.02em" }}>
            Simple, puissant,<br />sénégalais.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { num: "01", title: "Prêt en 2 minutes", desc: "Nom, produits, lien. Aucune compétence technique requise.", accent: false },
              { num: "02", title: "Pensé pour mobile", desc: "Partage ton lien sur WhatsApp. Tes clients commandent depuis leur téléphone.", accent: false },
              { num: "03", title: "Paiement à ta façon", desc: "Wave, Orange Money, espèces. Tu choisis ce qui marche pour toi.", accent: true },
              { num: "04", title: "Suivi en temps réel", desc: "Chaque commande arrive instantanément. Gère tout depuis un écran.", accent: false },
            ].map((f) => (
              <div
                key={f.num}
                className="p-6 rounded-2xl border-2 border-ink relative overflow-hidden"
                style={{ backgroundColor: f.accent ? "#FFC83D" : "rgba(255,255,255,0.06)" }}
              >
                <span
                  className="font-bricolage font-black text-6xl absolute -top-2 -right-2 select-none"
                  style={{ color: f.accent ? "rgba(15,30,61,0.08)" : "rgba(255,255,255,0.06)" }}
                >
                  {f.num}
                </span>
                <h3 className="font-bricolage font-bold text-base mb-2" style={{ color: f.accent ? "#0F1E3D" : "#fff" }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: f.accent ? "rgba(15,30,61,0.65)" : "rgba(255,255,255,0.5)" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  CTA FINAL  */}
      <section className="py-14 px-5" style={{ backgroundColor: "#FFC83D" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-bricolage font-black leading-tight mb-4" style={{ fontSize: "clamp(2rem, 8vw, 3rem)", color: "#0F1E3D", letterSpacing: "-0.02em" }}>
            Prêt(e) à vendre<br />en ligne ?
          </h2>
          <p className="text-sm font-medium mb-8" style={{ color: "rgba(15,30,61,0.65)" }}>
            Crée ta boutique en ligne au Sénégal.<br />C'est gratuit pour démarrer.
          </p>
          {sellerId ? (
            <Link
              href="/espace"
              className="inline-block font-bold text-base px-8 py-4 rounded-full border-[2.5px] border-ink"
              style={{ backgroundColor: "#0F1E3D", color: "#FFC83D", boxShadow: "4px 4px 0 #0F1E3D" }}
            >
              Mon espace vendeur 
            </Link>
          ) : (
            <Link
              href="/inscription"
              className="inline-block font-bold text-base px-8 py-4 rounded-full border-[2.5px] border-ink"
              style={{ backgroundColor: "#0F1E3D", color: "#FFC83D", boxShadow: "4px 4px 0 #0F1E3D" }}
            >
              Créer ma boutique  C'est gratuit
            </Link>
          )}
        </div>
      </section>

      {/*  FOOTER  */}
      <footer style={{ backgroundColor: "#0F1E3D" }}>
        <div className="max-w-2xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <LogoMark size={24} />
            <Wordmark color="#fff" size={0.22} />
          </div>
          <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
            © 2026 Jaaymaa. Fait au Sénégal.
          </p>
          <div className="flex gap-5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>
            {sellerId ? (
              <Link href="/espace" className="hover:text-white transition-colors">Mon Espace</Link>
            ) : (
              <>
                <Link href="/connexion" className="hover:text-white transition-colors">Connexion</Link>
                <Link href="/inscription" className="hover:text-white transition-colors">Inscription</Link>
              </>
            )}
          {explorerEnabled && <Link href="/explorer" prefetch={true} className="hover:text-white transition-colors">Explorer</Link>}
          </div>
        </div>
      </footer>
    </div>
  );
}
