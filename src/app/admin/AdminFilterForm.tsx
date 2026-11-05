"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, FormEvent, ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { JaaymaLoader } from "@/components/JaaymaLoader";
import { useTransition } from "react";

export default function AdminFilterForm({
  action,
  className,
  children,
}: {
  action: string;
  className: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const sawPendingTransition = useRef(false);
  const currentSearch = searchParams.toString();

  useEffect(() => {
    submitLock.current = false;
    setIsSubmitting(false);
  }, [pathname, currentSearch]);

  useEffect(() => {
    if (isPending) {
      sawPendingTransition.current = true;
    } else if (sawPendingTransition.current && isSubmitting) {
      sawPendingTransition.current = false;
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }, [isPending, isSubmitting]);

  function navigateWithFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;

    const search = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, key) => {
      if (typeof value === "string" && value.trim()) search.append(key, value.trim());
    });
    const query = search.toString();
    const target = query ? `${action}?${query}` : action;
    const current = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;
    if (target === current) return;

    submitLock.current = true;
    setIsSubmitting(true);
    startTransition(() => router.push(target, { scroll: false }));
  }

  const loading = isPending || isSubmitting;
  const formChildren = Children.map(children, (child) => {
    if (!isValidElement<ButtonHTMLAttributes<HTMLButtonElement>>(child) || child.type !== "button") {
      return child;
    }

    return cloneElement(child, {
      type: "submit",
      disabled: loading || child.props.disabled,
      "aria-busy": loading,
      className: `${child.props.className || ""} ${loading ? "cursor-wait opacity-80" : ""}`.trim(),
      children: loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <JaaymaLoader size={28} />
          Chargement…
        </span>
      ) : child.props.children,
    });
  });

  return (
    <form action={action} className={className} onSubmit={navigateWithFilters} aria-busy={loading}>
      {formChildren}
      <span className="sr-only" aria-live="polite">{loading ? "Chargement des résultats des filtres." : ""}</span>
    </form>
  );
}
