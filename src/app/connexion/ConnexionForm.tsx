"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { loginSeller } from "../actions/auth";

function JaymaLogo() {
  return (
    <svg width="30" height="30" viewBox="0 0 120 120" fill="none">
      <path d="M38 4H82A34 34 0 0 1 116 38V82A34 34 0 0 1 82 116H10A6 6 0 0 1 4 110V38A34 34 0 0 1 38 4Z" fill="#FFC83D" />
      <path d="M64 46V76C64 90 57 97 44 97" stroke="#0F1E3D" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="64" cy="28" r="7.5" fill="#C8265A" />
    </svg>
  );
}

export default function ConnexionForm({ sessionNotice = false }: { sessionNotice?: boolean }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isLoading = isSubmitting || isPending;

  // Prefetch /espace as soon as page mounts for instant redirection
  useEffect(() => {
    router.prefetch("/espace");
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("password", password);

    try {
      const res = await loginSeller(null, formData);
      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      if (res?.success) {
        // Keep isSubmitting = true so inputs stay filled and spinner stays active until page transition completes
        startTransition(() => {
          router.push("/espace");
          router.refresh();
        });
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setError("Une erreur inattendue est survenue lors de la connexion.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#C8265A" }}>
      {/*  HEADER  */}
      <div className="px-5 pt-6 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 rounded-full bg-white border-[2px] border-ink flex items-center justify-center active:scale-90 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0F1E3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
      </div>

      {/*  LOGO + TITRE  */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-2 mb-8">
          <JaymaLogo />
        </div>
        <h1 className="font-bricolage font-black leading-tight mb-1" style={{ fontSize: "clamp(2.5rem, 10vw, 3.5rem)", color: "#fff", letterSpacing: "-0.02em" }}>
          Content de
        </h1>
        <h1 className="font-bricolage font-black leading-tight" style={{ fontSize: "clamp(2.5rem, 10vw, 3.5rem)", color: "#FFC83D", letterSpacing: "-0.02em" }}>
          te revoir.
        </h1>
      </div>

      {/*  FORMULAIRE  */}
      <div className="flex-1 px-5">
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-3xl border-[2.5px] border-ink p-5 space-y-4 mb-5"
            style={{ backgroundColor: "#FFFBF2", boxShadow: "5px 5px 0 #0F1E3D" }}
          >
            {sessionNotice && (
              <div
                role="status"
                className="rounded-2xl border-2 px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: "#FEF3D6", borderColor: "#D9A928", color: "#3F4B69" }}
              >
                Ta session a expiré. Reconnecte-toi pour retrouver ton espace vendeur.
              </div>
            )}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#3F4B69" }}>Numéro de téléphone</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: "#3F4B69" }}>+221</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  placeholder="77 123 45 67"
                  className="w-full pl-14 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none border-[2.5px] border-ink focus:border-sun disabled:opacity-80"
                  style={{ backgroundColor: "#fff", color: "#0F1E3D" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "#3F4B69" }}>Mot de passe</label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none border-[2.5px] border-ink focus:border-sun disabled:opacity-80"
                style={{ backgroundColor: "#fff", color: "#0F1E3D" }}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl border-[2px] text-sm font-medium" style={{ backgroundColor: "rgba(200,38,90,0.1)", borderColor: "#C8265A", color: "#C8265A" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-full font-bold text-sm border-[2.5px] border-ink flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-80"
              style={{ backgroundColor: "#FFC83D", color: "#0F1E3D", boxShadow: "4px 4px 0 #0F1E3D" }}
            >
              {isLoading ? (
                <>
                  <JaaymaLoader variant="mini-ink" size={32} />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-sm font-medium" style={{ color: "#FFE3EC" }}>
          Mot de passe oublié ? Écris-nous sur WhatsApp, on t'aide.
        </p>

        <div className="mt-6 text-center">
          <Link href="/inscription" className="text-sm font-bold underline underline-offset-2" style={{ color: "#fff" }}>
            Pas encore inscrit(e) ? Créer ma boutique 
          </Link>
        </div>
      </div>
    </div>
  );
}
