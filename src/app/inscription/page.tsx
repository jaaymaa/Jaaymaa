"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { registerSeller } from "../actions/auth";
import { trackAnalyticsEvent } from "@/lib/analytics";

export default function InscriptionPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const signupTracked = useRef(false);

  const isLoading = isSubmitting || isPending;

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
      const res = await registerSeller(null, formData);
      if (res?.error) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      if (res?.success) {
        if (!signupTracked.current) {
          signupTracked.current = true;
          trackAnalyticsEvent("sign_up", { method: "phone" });
        }
        startTransition(() => {
          router.push("/espace");
          router.refresh();
        });
      } else {
        setIsSubmitting(false);
      }
    } catch {
      setError("Une erreur inattendue est survenue lors de l'inscription.");
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-2xl text-sm font-medium outline-none border-[2.5px] border-ink focus:border-sun disabled:opacity-80";
  const inputStyle = { backgroundColor: "#fff", color: "#0F1E3D" };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: "#FFC83D" }}>
      {/*  HEADER  */}
      <div className="px-5 pt-6 flex items-center gap-3">
        <Link href="/" className="w-9 h-9 rounded-full bg-ink border-[2px] border-ink flex items-center justify-center active:scale-90 transition-transform">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFC83D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
      </div>

      {/*  TITRE  */}
      <div className="px-5 pt-8 pb-6">
        <h1 className="font-bricolage font-black leading-none" style={{ fontSize: "clamp(2.2rem, 9vw, 3rem)", color: "#0F1E3D", letterSpacing: "-0.02em" }}>
          Crée ton compte
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: "rgba(15,30,61,0.6)" }}>
          Crée ton compte, puis configure ta boutique depuis ton espace vendeur.
        </p>
      </div>

      {/*  FORMULAIRE  */}
      <div className="px-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#5A4200" }}>Numéro de téléphone</label>
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
                className={`${inputClass} pl-14`}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "#5A4200" }}>Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className={inputClass}
              style={inputStyle}
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
            className="w-full py-4 rounded-full font-bold text-sm border-[2.5px] border-ink flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-80 mt-2"
            style={{ backgroundColor: "#0F1E3D", color: "#FFC83D", boxShadow: "4px 4px 0 #0F1E3D" }}
          >
            {isLoading ? (
              <>
                <JaaymaLoader size={32} />
                <span>Création en cours...</span>
              </>
            ) : (
              "Créer mon compte"
            )}
          </button>
        </form>

        <p className="text-center text-sm font-bold mt-6 text-ink">
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="underline underline-offset-2">
            Connecte-toi
          </Link>
        </p>
      </div>
    </div>
  );
}
