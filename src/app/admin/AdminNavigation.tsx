"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Boxes,
  BarChart3,
  CreditCard,
  Ellipsis,
  LayoutDashboard,
  Settings2,
  ShoppingBag,
  Users,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Vue d’ensemble", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Google Analytics", icon: BarChart3 },
  { href: "/admin/boutiques", label: "Boutiques", icon: Boxes },
  { href: "/admin/comptes", label: "Comptes vendeurs", icon: Users },
  { href: "/admin/abonnements", label: "Abonnements Pro", icon: CreditCard },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingBag },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/reglages", label: "Réglages", icon: Settings2 },
];

const mobileLinks = [
  { href: "/admin", label: "Aperçu", icon: LayoutDashboard },
  { href: "/admin/boutiques", label: "Boutiques", icon: Boxes },
  { href: "/admin/comptes", label: "Comptes", icon: Users },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingBag },
];

const moreLinks = links.filter(({ href }) =>
  ["/admin/analytics", "/admin/abonnements", "/admin/notifications", "/admin/reglages"].includes(href),
);

export default function AdminNavigation({ mobile = false, tablet = false }: { mobile?: boolean; tablet?: boolean }) {
  const pathname = usePathname();

  const [moreOpen, setMoreOpen] = useState(false);
  const isItemActive = (href: string) => href === "/admin" ? pathname === href : pathname.startsWith(href);

  if (tablet) {
    return (
      <nav aria-label="Navigation administration" className="grid grid-cols-4 gap-2 rounded-[22px] border-[2.5px] border-ink bg-papier p-2 text-ink shadow-[4px_4px_0_#0F1E3D]">
        {links.map(({ href, label, icon: Icon }) => {
          const active = isItemActive(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-2 py-2 text-center text-xs font-bold transition-colors ${
                active
                  ? "border-ink bg-sun text-ink shadow-[2px_2px_0_#0F1E3D]"
                  : "border-transparent text-muted hover:border-ink/10 hover:bg-white"
              }`}
            >
              <Icon size={17} className="shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  if (mobile) {
    const moreActive = moreLinks.some(({ href }) => isItemActive(href));

    return (
      <div className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 md:hidden">
        <div className="relative">
          {moreOpen && (
            <div className="absolute bottom-[calc(100%+0.75rem)] right-0 w-56 overflow-hidden rounded-[22px] border-[2.5px] border-ink bg-[#FFFBF2] p-2 text-ink shadow-[4px_4px_0_#0F1E3D]">
              <p className="px-3 pb-1 pt-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#8991A4]">
                Administration
              </p>
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const active = isItemActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-sm font-bold transition-colors ${
                      active
                        ? "border-ink bg-sun text-ink shadow-[2px_2px_0_#0F1E3D]"
                        : "border-transparent text-[#3F4B69] hover:bg-white"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <nav
            aria-label="Navigation administration"
            className="flex items-center justify-between rounded-full border-[2.5px] border-ink bg-[#FFFBF2] p-1.5 text-ink shadow-[4px_4px_0_#0F1E3D]"
          >
            {mobileLinks.map(({ href, label, icon: Icon }) => {
              const active = isItemActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center justify-center gap-1 rounded-full transition-colors ${
                    active
                      ? "border-2 border-ink bg-sun px-2 py-2 text-ink"
                      : "p-2.5 text-[#65708A] hover:bg-white hover:text-ink"
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  {active && <span className="whitespace-nowrap font-bricolage text-[9px] font-black leading-none">{label}</span>}
                </Link>
              );
            })}
            <button
              type="button"
              aria-label={moreOpen ? "Fermer le menu administration" : "Plus de pages d’administration"}
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((open) => !open)}
              className={`flex shrink-0 items-center justify-center gap-1 rounded-full transition-colors ${
                moreOpen || moreActive
                  ? "border-2 border-ink bg-sun px-2 py-2 text-ink"
                  : "p-2.5 text-[#65708A] hover:bg-white hover:text-ink"
              }`}
            >
              <Ellipsis size={20} className="shrink-0" />
              {(moreOpen || moreActive) && <span className="whitespace-nowrap font-bricolage text-[9px] font-black leading-none">Plus</span>}
            </button>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Navigation administration" className="space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = isItemActive(href);
        const appearance = active
          ? "bg-ink text-white shadow-[3px_3px_0_#000]"
          : "text-muted hover:bg-ink/5 hover:text-ink";
        return (
          <Link
            key={href}
            href={href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${appearance}`}
          >
            <Icon size={17} className="shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
