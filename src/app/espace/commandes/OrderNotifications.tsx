"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bell, BellRing, CircleCheck, Send } from "lucide-react";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import {
  getPushVapidPublicKey,
  removePushSubscription,
  savePushSubscription,
  sendTestPushNotification,
} from "@/app/actions/notifications";

type SupportState = "checking" | "ready" | "unsupported" | "ios-install";
type Feedback = { kind: "success" | "error"; text: string };

type PushInitialization = {
  support: SupportState;
  permission: NotificationPermission | null;
  publicKey: string | null;
  isConfigured: boolean;
  isEnabled: boolean;
  endpoint: string | null;
  feedback: Feedback | null;
};

let cachedInitialization: { sellerId: string; state: PushInitialization } | null = null;
let pendingInitialization: { sellerId: string; promise: Promise<PushInitialization> } | null = null;

function getCachedInitialization(sellerId: string) {
  return cachedInitialization?.sellerId === sellerId ? cachedInitialization.state : null;
}

function updateCachedInitialization(
  sellerId: string,
  update: (state: PushInitialization) => PushInitialization,
) {
  if (cachedInitialization?.sellerId === sellerId) {
    cachedInitialization = { sellerId, state: update(cachedInitialization.state) };
  }
}

function getPushInitialization(sellerId: string): Promise<PushInitialization> {
  const cached = getCachedInitialization(sellerId);
  if (cached) return Promise.resolve(cached);
  if (pendingInitialization?.sellerId === sellerId) return pendingInitialization.promise;

  const promise = initializePush().then((state) => {
    if (pendingInitialization?.sellerId === sellerId) {
      cachedInitialization = { sellerId, state };
    }
    return state;
  }).finally(() => {
    if (pendingInitialization?.sellerId === sellerId) pendingInitialization = null;
  });
  pendingInitialization = { sellerId, promise };
  return promise;
}

async function initializePush(): Promise<PushInitialization> {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const supportsPush =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  if (isIOS && !isStandalone) {
    return {
      support: "ios-install",
      permission: null,
      publicKey: null,
      isConfigured: false,
      isEnabled: false,
      endpoint: null,
      feedback: null,
    };
  }

  if (!supportsPush) {
    return {
      support: "unsupported",
      permission: null,
      publicKey: null,
      isConfigured: false,
      isEnabled: false,
      endpoint: null,
      feedback: null,
    };
  }

  try {
    const [keyResult, registration] = await Promise.all([
      getPushVapidPublicKey(),
      navigator.serviceWorker.register("/sw.js"),
    ]);
    const currentSubscription = await registration.pushManager.getSubscription();
    const state: PushInitialization = {
      support: "ready",
      permission: Notification.permission,
      publicKey: keyResult.publicKey,
      isConfigured: Boolean(keyResult.publicKey),
      isEnabled: false,
      endpoint: currentSubscription?.endpoint ?? null,
      feedback: null,
    };

    if (currentSubscription) {
      const result = await savePushSubscription(serializeSubscription(currentSubscription));
      if (result.error) {
        state.feedback = { kind: "error", text: result.error };
      } else {
        state.isEnabled = true;
      }
    }

    return state;
  } catch {
    return {
      support: "unsupported",
      permission: null,
      publicKey: null,
      isConfigured: false,
      isEnabled: false,
      endpoint: null,
      feedback: null,
    };
  }
}

export default function OrderNotifications({
  sellerId,
  hideWhenEnabled = false,
}: {
  sellerId: string;
  hideWhenEnabled?: boolean;
}) {
  const initialState = getCachedInitialization(sellerId);
  const [support, setSupport] = useState<SupportState>(initialState?.support ?? "checking");
  const [permission, setPermission] = useState<NotificationPermission | null>(initialState?.permission ?? null);
  const [publicKey, setPublicKey] = useState<string | null>(initialState?.publicKey ?? null);
  const [isConfigured, setIsConfigured] = useState(initialState?.isConfigured ?? false);
  const [isEnabled, setIsEnabled] = useState(initialState?.isEnabled ?? false);
  const [endpoint, setEndpoint] = useState<string | null>(initialState?.endpoint ?? null);
  const [busy, setBusy] = useState<"enable" | "disable" | "test" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;
    const hasCachedState = Boolean(getCachedInitialization(sellerId));
    void getPushInitialization(sellerId).then((state) => {
      if (!active) return;
      setSupport(state.support);
      setPermission(state.permission);
      setPublicKey(state.publicKey);
      setIsConfigured(state.isConfigured);
      setIsEnabled(state.isEnabled);
      setEndpoint(state.endpoint);
      setFeedback(hasCachedState ? null : state.feedback);
    });
    return () => {
      active = false;
    };
  }, [sellerId]);

  async function enableNotifications() {
    if (!publicKey) return;
    setBusy("enable");
    setFeedback(null);

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== "granted") {
        const nextFeedback = {
          kind: "error",
          text: "L’autorisation n’a pas été accordée. Vous pourrez la modifier dans les réglages du navigateur.",
        } satisfies Feedback;
        setFeedback(nextFeedback);
        updateCachedInitialization(sellerId, (state) => ({ ...state, permission: permissionResult, feedback: nextFeedback }));
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(publicKey) as BufferSource,
      });
      const result = await savePushSubscription(serializeSubscription(subscription));

      if (result.error) {
        if (!existingSubscription) await subscription.unsubscribe();
        const nextFeedback = { kind: "error", text: result.error } satisfies Feedback;
        setFeedback(nextFeedback);
        updateCachedInitialization(sellerId, (state) => ({ ...state, permission: permissionResult, feedback: nextFeedback }));
        return;
      }

      setEndpoint(subscription.endpoint);
      setIsEnabled(true);
      const nextFeedback = { kind: "success", text: "Les alertes de commande sont activées sur cet appareil." } satisfies Feedback;
      setFeedback(nextFeedback);
      updateCachedInitialization(sellerId, (state) => ({
        ...state,
        permission: permissionResult,
        endpoint: subscription.endpoint,
        isEnabled: true,
        feedback: nextFeedback,
      }));
    } catch (error) {
      const nextFeedback = {
        kind: "error",
        text: error instanceof Error ? error.message : "Impossible d’activer les notifications sur cet appareil.",
      } satisfies Feedback;
      setFeedback(nextFeedback);
      updateCachedInitialization(sellerId, (state) => ({ ...state, feedback: nextFeedback }));
    } finally {
      setBusy(null);
    }
  }

  async function disableNotifications() {
    setBusy("disable");
    setFeedback(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const currentEndpoint = endpoint ?? subscription?.endpoint;

      if (currentEndpoint) {
        const result = await removePushSubscription(currentEndpoint);
        if (result.error) {
          const nextFeedback = { kind: "error", text: result.error } satisfies Feedback;
          setFeedback(nextFeedback);
          updateCachedInitialization(sellerId, (state) => ({ ...state, feedback: nextFeedback }));
          return;
        }
      }

      await subscription?.unsubscribe();
      setEndpoint(null);
      setIsEnabled(false);
      const nextFeedback = { kind: "success", text: "Les alertes sont désactivées sur cet appareil." } satisfies Feedback;
      setFeedback(nextFeedback);
      updateCachedInitialization(sellerId, (state) => ({ ...state, endpoint: null, isEnabled: false, feedback: nextFeedback }));
    } catch {
      const nextFeedback = { kind: "error", text: "Impossible de désactiver les notifications sur cet appareil." } satisfies Feedback;
      setFeedback(nextFeedback);
      updateCachedInitialization(sellerId, (state) => ({ ...state, feedback: nextFeedback }));
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    if (!endpoint) return;
    setBusy("test");
    setFeedback(null);

    const result = await sendTestPushNotification(endpoint);
    const nextFeedback = result.error
      ? { kind: "error", text: result.error } satisfies Feedback
      : { kind: "success", text: "Notification test envoyée. Vérifiez les alertes de votre téléphone." } satisfies Feedback;
    setFeedback(nextFeedback);
    updateCachedInitialization(sellerId, (state) => ({ ...state, feedback: nextFeedback }));
    setBusy(null);
  }

  const unavailableMessage =
    support === "unsupported"
      ? "Ce navigateur ne prend pas en charge les notifications push. Ouvrez Jaaymaa dans Safari sur iPhone ou Chrome sur Android."
      : support === "ios-install"
        ? "Sur iPhone, ajoutez d’abord Jaaymaa à l’écran d’accueil depuis Safari, puis ouvrez l’application installée pour activer les alertes."
        : null;

  // Sur la page Commandes, le panneau sert d’invitation à activer les alertes.
  // Une fois actives, on le masque; Paramètres conserve toujours les contrôles.
  if (hideWhenEnabled && (support === "checking" || isEnabled)) return null;

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#17284B] shadow-[0_16px_40px_rgba(0,0,0,0.2)]" aria-labelledby="order-notifications-title">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sun/30 bg-sun/10 text-sun">
            {isEnabled ? <BellRing size={21} aria-hidden="true" /> : <Bell size={21} aria-hidden="true" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="order-notifications-title" className="font-bricolage text-base font-black text-white">
                Notifications Jaaymaa
              </h2>
              {isEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                  <CircleCheck size={12} aria-hidden="true" /> Activées
                </span>
              )}
            </div>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-[#C3CCE6]">
              Recevez sur ce téléphone les nouvelles commandes et les rappels avant l’échéance de votre abonnement Pro.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 pl-14 sm:pl-0">
          {support === "checking" ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-[#C3CCE6]">
              <JaaymaLoader size={28} /> Vérification…
            </span>
          ) : isEnabled ? (
            <>
              <button
                type="button"
                onClick={sendTest}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "test" ? <JaaymaLoader size={28} /> : <Send size={14} />}
                Tester
              </button>
              <button
                type="button"
                onClick={disableNotifications}
                disabled={busy !== null}
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-[#C3CCE6] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "disable" ? "Désactivation…" : "Désactiver"}
              </button>
            </>
          ) : support === "ios-install" ? (
            <span className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-[#C3CCE6]">
              Installation requise
            </span>
          ) : support === "unsupported" ? (
            <span className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-[#C3CCE6]">
              Non disponible
            </span>
          ) : support === "ready" && permission === "denied" ? (
            <span className="rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 py-2 text-xs font-bold text-amber-100">
              Autorisation bloquée
            </span>
          ) : (
            <button
              type="button"
              onClick={enableNotifications}
              disabled={support !== "ready" || !isConfigured || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-sun px-4 py-2.5 text-xs font-black text-ink shadow-[2px_2px_0_#07132E] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "enable" ? <JaaymaLoader variant="mini-ink" size={28} /> : <Bell size={15} />}
              {isConfigured ? "Activer les alertes" : "Configuration requise"}
            </button>
          )}
        </div>
      </div>

      {(unavailableMessage || (support === "ready" && !isConfigured)) && (
        <div className="border-t border-white/10 bg-black/10 px-4 py-3 text-xs leading-relaxed text-[#C3CCE6] sm:px-5">
          {unavailableMessage ?? "Le service d’alertes est en cours de configuration."}
        </div>
      )}
      {support === "ready" && permission === "denied" && (
        <div className="border-t border-white/10 bg-black/10 px-4 py-3 text-xs leading-relaxed text-[#C3CCE6] sm:px-5">
          Autorisez les notifications dans les réglages de Safari ou de Chrome, puis revenez ici.
        </div>
      )}
      {feedback && (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`flex items-start gap-2 border-t px-4 py-3 text-xs leading-relaxed sm:px-5 ${
            feedback.kind === "error"
              ? "border-rose-200/10 bg-rose-400/10 text-rose-100"
              : "border-emerald-200/10 bg-emerald-400/10 text-emerald-100"
          }`}
        >
          {feedback.kind === "error" && <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />}
          {feedback.text}
        </div>
      )}
    </section>
  );
}

function decodeVapidKey(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

function serializeSubscription(subscription: PushSubscription): Record<string, unknown> {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    expirationTime: json.expirationTime,
    keys: json.keys,
  };
}
