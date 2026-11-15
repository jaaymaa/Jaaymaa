"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { formatFcfa } from "@/lib/money";
import { TrendingUp, Calendar } from "lucide-react";

type OrderItem = {
  id: string;
  createdAt: string | number | Date;
  total: number;
  paymentStatus?: string | null;
};

type Period = "7d" | "30d" | "90d" | "year";

const PERIODS: { id: Period; label: string; title: string }[] = [
  { id: "7d", label: "7 jours", title: "7 derniers jours" },
  { id: "30d", label: "30 jours", title: "30 derniers jours" },
  { id: "90d", label: "90 jours", title: "3 derniers mois" },
  { id: "year", label: "Année", title: "Année en cours" },
];

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function getDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

type BarItem = {
  key: string;
  amount: number;
  count: number;
  shortLabel: string;
  showLabel: boolean;
  fullLabel: string;
  isCurrent: boolean;
};

export default function SalesActivityChart({ orders }: { orders: OrderItem[] }) {
  const [period, setPeriod] = useState<Period>("7d");
  // hoveredIndex = souris; pinnedIndex = tap mobile fixé
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const pointerTypeRef = useRef<string>("mouse");

  const { bars, totalRevenue, totalOrdersCount, averageOrderValue } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const todayKey = getDateKey(startOfToday);

    const paidOrders = orders.filter(
      (order) => String(order.paymentStatus).toLowerCase() === "paid"
    );

    // ── 7 jours ──────────────────────────────────────────────
    if (period === "7d") {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfToday);
        date.setUTCDate(date.getUTCDate() - (6 - i));
        return { date, key: getDateKey(date) };
      });

      const map = new Map<string, { total: number; count: number }>();
      for (const o of paidOrders) {
        const key = getDateKey(toDate(o.createdAt));
        const cur = map.get(key) ?? { total: 0, count: 0 };
        map.set(key, { total: cur.total + (o.total || 0), count: cur.count + 1 });
      }

      const barsData: BarItem[] = days.map(({ date, key }) => {
        const stat = map.get(key) ?? { total: 0, count: 0 };
        const dayLabel = new Intl.DateTimeFormat("fr-FR", {
          weekday: "short",
          timeZone: "Africa/Dakar",
        }).format(date).replace(".", "");

        const fullLabel = new Intl.DateTimeFormat("fr-FR", {
          weekday: "long", day: "numeric", month: "short",
          timeZone: "Africa/Dakar",
        }).format(date);

        return { key, amount: stat.total, count: stat.count, shortLabel: dayLabel, showLabel: true, fullLabel, isCurrent: key === todayKey };
      });

      const total = barsData.reduce((a, b) => a + b.amount, 0);
      const count = barsData.reduce((a, b) => a + b.count, 0);
      return { bars: barsData, totalRevenue: total, totalOrdersCount: count, averageOrderValue: count > 0 ? Math.round(total / count) : 0 };
    }

    // ── 30 jours ─────────────────────────────────────────────
    if (period === "30d") {
      const days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(startOfToday);
        date.setUTCDate(date.getUTCDate() - (29 - i));
        return { date, key: getDateKey(date) };
      });

      const map = new Map<string, { total: number; count: number }>();
      for (const o of paidOrders) {
        const key = getDateKey(toDate(o.createdAt));
        const cur = map.get(key) ?? { total: 0, count: 0 };
        map.set(key, { total: cur.total + (o.total || 0), count: cur.count + 1 });
      }

      const barsData: BarItem[] = days.map(({ date, key }, index) => {
        const stat = map.get(key) ?? { total: 0, count: 0 };
        const dayOfMonth = date.getUTCDate();
        // Label visible tous les 5 jours + premier + dernier → jamais de layout shift
        const showLabel = index === 0 || index === 29 || dayOfMonth % 5 === 0;

        const fullLabel = new Intl.DateTimeFormat("fr-FR", {
          day: "numeric", month: "short",
          timeZone: "Africa/Dakar",
        }).format(date);

        return { key, amount: stat.total, count: stat.count, shortLabel: String(dayOfMonth), showLabel, fullLabel, isCurrent: key === todayKey };
      });

      const total = barsData.reduce((a, b) => a + b.amount, 0);
      const count = barsData.reduce((a, b) => a + b.count, 0);
      return { bars: barsData, totalRevenue: total, totalOrdersCount: count, averageOrderValue: count > 0 ? Math.round(total / count) : 0 };
    }

    // ── 90 jours (12 semaines) ────────────────────────────────
    if (period === "90d") {
      const weeks = Array.from({ length: 12 }, (_, i) => {
        const end = new Date(startOfToday);
        end.setUTCDate(end.getUTCDate() - (11 - i) * 7);
        const start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 6);
        return { start, end, weekIndex: i + 1 };
      });

      const barsData: BarItem[] = weeks.map(({ start, end, weekIndex }) => {
        const startTime = start.getTime();
        const endTime = end.getTime() + 24 * 60 * 60 * 1000 - 1;

        const matching = paidOrders.filter((o) => {
          const t = toDate(o.createdAt).getTime();
          return t >= startTime && t <= endTime;
        });

        const amount = matching.reduce((a, o) => a + (o.total || 0), 0);
        const count = matching.length;

        const fmt = (d: Date) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Africa/Dakar" }).format(d);

        return {
          key: `week-${weekIndex}`,
          amount, count,
          shortLabel: `S${weekIndex}`,
          showLabel: true,
          fullLabel: `Sem. ${weekIndex} (${fmt(start)} – ${fmt(end)})`,
          isCurrent: weekIndex === 12,
        };
      });

      const total = barsData.reduce((a, b) => a + b.amount, 0);
      const count = barsData.reduce((a, b) => a + b.count, 0);
      return { bars: barsData, totalRevenue: total, totalOrdersCount: count, averageOrderValue: count > 0 ? Math.round(total / count) : 0 };
    }

    // ── Année ─────────────────────────────────────────────────
    const currentYear = startOfToday.getUTCFullYear();
    const currentMonth = startOfToday.getUTCMonth();

    const barsData: BarItem[] = Array.from({ length: 12 }, (_, mi) => {
      const matching = paidOrders.filter((o) => {
        const d = toDate(o.createdAt);
        return d.getUTCFullYear() === currentYear && d.getUTCMonth() === mi;
      });
      const amount = matching.reduce((a, o) => a + (o.total || 0), 0);
      const count = matching.length;
      return {
        key: `month-${mi}`,
        amount, count,
        shortLabel: MONTH_NAMES[mi],
        showLabel: true,
        fullLabel: `${MONTH_NAMES[mi]} ${currentYear}`,
        isCurrent: mi === currentMonth,
      };
    });

    const total = barsData.reduce((a, b) => a + b.amount, 0);
    const count = barsData.reduce((a, b) => a + b.count, 0);
    return { bars: barsData, totalRevenue: total, totalOrdersCount: count, averageOrderValue: count > 0 ? Math.round(total / count) : 0 };
  }, [orders, period]);

  const maxRevenue = Math.max(1, ...bars.map((b) => b.amount));

  // Index actif = pinned (mobile) OU hovered (souris)
  const activeIndex = pinnedIndex ?? hoveredIndex;
  const activeItem = activeIndex !== null ? bars[activeIndex] : null;

  const handlePointerEnter = useCallback((index: number, e: React.PointerEvent) => {
    pointerTypeRef.current = e.pointerType;
    if (e.pointerType !== "touch") {
      setHoveredIndex(index);
    }
  }, []);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") {
      setHoveredIndex(null);
    }
  }, []);

  const handleClick = useCallback((index: number, e: React.PointerEvent) => {
    if (pointerTypeRef.current === "touch" || e.pointerType === "touch") {
      // Mobile : toggle pin
      setPinnedIndex((prev) => (prev === index ? null : index));
    }
  }, []);

  return (
    <article className="rounded-[22px] border-[2.5px] border-ink bg-[#FFFBF2] text-ink p-5 sm:p-6 shadow-[4px_4px_0_#0F1E3D] flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#C8265A]">
              <TrendingUp size={14} strokeWidth={2.5} />
              <span>Activité des ventes</span>
            </div>
            <h2 className="mt-1 font-bricolage text-2xl font-black text-ink sm:text-3xl tabular-nums">
              {formatFcfa(totalRevenue)}
            </h2>
          </div>

          {/* Onglets Période */}
          <div
            className="flex flex-wrap items-center gap-1 rounded-2xl border-2 border-ink bg-white/70 p-1 shadow-sm"
            role="tablist"
            aria-label="Période du graphique"
          >
            {PERIODS.map((p) => {
              const isSelected = period === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setPeriod(p.id);
                    setHoveredIndex(null);
                    setPinnedIndex(null);
                  }}
                  className={`rounded-xl px-2.5 py-1 text-xs font-black transition-all ${
                    isSelected
                      ? "bg-[#0F1E3D] text-[#FFC83D] shadow-sm"
                      : "text-[#3F4B69] hover:bg-black/5"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bande d'info sous le titre */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3 text-xs min-h-[28px]">
          {activeItem ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-150">
              <span className="font-black text-[#0F1E3D]">{activeItem.fullLabel} :</span>
              <span className="font-bold text-[#C8265A]">{formatFcfa(activeItem.amount)}</span>
              <span className="text-[#65708A]">
                ({activeItem.count} commande{activeItem.count > 1 ? "s" : ""})
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5 text-[#3F4B69] font-medium">
              <span>
                <strong className="text-ink font-black">{totalOrdersCount}</strong>{" "}
                commande{totalOrdersCount > 1 ? "s" : ""} payée{totalOrdersCount > 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span>
                Panier moyen :{" "}
                <strong className="text-ink font-black">{formatFcfa(averageOrderValue)}</strong>
              </span>
            </div>
          )}

          <span className="text-[11px] font-bold text-[#65708A] flex items-center gap-1 shrink-0">
            <Calendar size={12} />
            {PERIODS.find((p) => p.id === period)?.title}
          </span>
        </div>
      </div>

      {/* Graphique */}
      <div className="mt-5">
        {/* Zone des barres — hauteur fixe pour éviter les sauts */}
        <div className="flex h-40 items-end" style={{ gap: period === "30d" ? "2px" : "6px" }}>
          {bars.map((item, index) => {
            const isActive = activeIndex === index;
            const heightPct = item.amount > 0 ? Math.max(6, (item.amount / maxRevenue) * 100) : 3;

            const barColor = isActive
              ? "#C8265A"
              : item.isCurrent
                ? "#FFC83D"
                : item.amount > 0
                  ? "#CFEFE6"
                  : "#E8E4DF";

            return (
              <div
                key={item.key}
                role="button"
                tabIndex={0}
                aria-label={`${item.fullLabel} : ${formatFcfa(item.amount)}`}
                onPointerEnter={(e) => handlePointerEnter(index, e)}
                onPointerLeave={(e) => handlePointerLeave(e)}
                onPointerUp={(e) => handleClick(index, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setPinnedIndex((prev) => (prev === index ? null : index));
                  }
                }}
                className="group relative flex h-full flex-1 flex-col items-center justify-end cursor-pointer select-none outline-none"
              >
                {/* Tooltip flottant au-dessus de la barre active */}
                {isActive && item.amount > 0 && (
                  <div
                    className="absolute bottom-[calc(100%-8px)] z-10 mb-1 whitespace-nowrap rounded-lg border border-ink bg-[#0F1E3D] px-2 py-1 text-[10px] font-black text-[#FFC83D] shadow-[2px_2px_0_rgba(0,0,0,0.3)] pointer-events-none"
                    style={{ bottom: `calc(${heightPct}% + 10px)` }}
                  >
                    {formatFcfa(item.amount)}
                    <span className="ml-1 font-normal text-white/70">
                      ×{item.count}
                    </span>
                  </div>
                )}

                {/* Conteneur barre — fond grisé toujours présent */}
                <div className="flex w-full flex-1 items-end overflow-hidden rounded-t-md bg-[#EDE9E3]">
                  <div
                    className="w-full rounded-t-md border-x border-t border-ink/20"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: barColor,
                      transition: "height 180ms ease-out, background-color 120ms ease",
                      willChange: "height",
                    }}
                  />
                </div>

                {/* Étiquette — hauteur FIXE (visibility toggle, pas display) */}
                <span
                  className={`mt-1 block text-[9px] font-black uppercase sm:text-[10px] tabular-nums transition-colors duration-100 ${
                    isActive
                      ? "text-[#C8265A]"
                      : item.isCurrent
                        ? "text-[#C8265A]"
                        : "text-[#8A93A8]"
                  }`}
                  style={{
                    visibility: item.showLabel ? "visible" : "hidden",
                    height: "14px",
                    lineHeight: "14px",
                    overflow: "hidden",
                  }}
                >
                  {item.shortLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* État vide */}
        {totalRevenue === 0 && (
          <p className="mt-3 text-center text-xs font-medium text-[#8A93A8]">
            Aucune vente enregistrée sur cette période.
          </p>
        )}

        <p className="mt-4 border-t border-ink/10 pt-3 text-[11px] font-medium text-[#8A93A8]">
          Montants calculés sur les commandes marquées comme payées · FCFA (XOF)
        </p>
      </div>
    </article>
  );
}
