"use client";

import { useState, useMemo } from "react";
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
  { id: "year", label: "Cette année", title: "Année en cours" },
];

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function getDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export default function SalesActivityChart({
  orders,
}: {
  orders: OrderItem[];
}) {
  const [period, setPeriod] = useState<Period>("7d");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { bars, totalRevenue, totalOrdersCount, averageOrderValue } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setUTCHours(0, 0, 0, 0);
    const todayKey = getDateKey(startOfToday);

    const paidOrders = orders.filter(
      (order) => String(order.paymentStatus).toLowerCase() === "paid"
    );

    if (period === "7d") {
      const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(startOfToday);
        date.setUTCDate(date.getUTCDate() - (6 - index));
        return { date, key: getDateKey(date) };
      });

      const dayRevenueMap = new Map<string, { total: number; count: number }>();
      for (const order of paidOrders) {
        const key = getDateKey(toDate(order.createdAt));
        const current = dayRevenueMap.get(key) ?? { total: 0, count: 0 };
        dayRevenueMap.set(key, {
          total: current.total + (order.total || 0),
          count: current.count + 1,
        });
      }

      const barsData = days.map(({ date, key }) => {
        const stat = dayRevenueMap.get(key) ?? { total: 0, count: 0 };
        const dayLabel = new Intl.DateTimeFormat("fr-FR", {
          weekday: "short",
          timeZone: "Africa/Dakar",
        })
          .format(date)
          .replace(".", "");

        const fullLabel = new Intl.DateTimeFormat("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "short",
          timeZone: "Africa/Dakar",
        }).format(date);

        return {
          key,
          amount: stat.total,
          count: stat.count,
          shortLabel: dayLabel,
          fullLabel,
          isCurrent: key === todayKey,
        };
      });

      const total = barsData.reduce((acc, b) => acc + b.amount, 0);
      const count = barsData.reduce((acc, b) => acc + b.count, 0);
      return {
        bars: barsData,
        totalRevenue: total,
        totalOrdersCount: count,
        averageOrderValue: count > 0 ? Math.round(total / count) : 0,
      };
    }

    if (period === "30d") {
      const days = Array.from({ length: 30 }, (_, index) => {
        const date = new Date(startOfToday);
        date.setUTCDate(date.getUTCDate() - (29 - index));
        return { date, key: getDateKey(date) };
      });

      const dayRevenueMap = new Map<string, { total: number; count: number }>();
      for (const order of paidOrders) {
        const key = getDateKey(toDate(order.createdAt));
        const current = dayRevenueMap.get(key) ?? { total: 0, count: 0 };
        dayRevenueMap.set(key, {
          total: current.total + (order.total || 0),
          count: current.count + 1,
        });
      }

      const barsData = days.map(({ date, key }, index) => {
        const stat = dayRevenueMap.get(key) ?? { total: 0, count: 0 };
        const dayOfMonth = date.getUTCDate();
        // Afficher le jour seulement tous les 5 jours ou le premier / dernier
        const shouldShowLabel = index === 0 || index === 29 || dayOfMonth % 5 === 0;

        const fullLabel = new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
          timeZone: "Africa/Dakar",
        }).format(date);

        return {
          key,
          amount: stat.total,
          count: stat.count,
          shortLabel: shouldShowLabel ? String(dayOfMonth) : "",
          fullLabel,
          isCurrent: key === todayKey,
        };
      });

      const total = barsData.reduce((acc, b) => acc + b.amount, 0);
      const count = barsData.reduce((acc, b) => acc + b.count, 0);
      return {
        bars: barsData,
        totalRevenue: total,
        totalOrdersCount: count,
        averageOrderValue: count > 0 ? Math.round(total / count) : 0,
      };
    }

    if (period === "90d") {
      // 12 tranches de 7 jours (12 semaines)
      const weeks = Array.from({ length: 12 }, (_, index) => {
        const end = new Date(startOfToday);
        end.setUTCDate(end.getUTCDate() - (11 - index) * 7);
        const start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 6);
        return { start, end, weekIndex: index + 1 };
      });

      const barsData = weeks.map(({ start, end, weekIndex }) => {
        const startTime = start.getTime();
        const endTime = end.getTime() + 24 * 60 * 60 * 1000 - 1;

        const matchingOrders = paidOrders.filter((order) => {
          const t = toDate(order.createdAt).getTime();
          return t >= startTime && t <= endTime;
        });

        const amount = matchingOrders.reduce((acc, o) => acc + (o.total || 0), 0);
        const count = matchingOrders.length;

        const startFormatted = new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
          timeZone: "Africa/Dakar",
        }).format(start);

        const endFormatted = new Intl.DateTimeFormat("fr-FR", {
          day: "numeric",
          month: "short",
          timeZone: "Africa/Dakar",
        }).format(end);

        return {
          key: `week-${weekIndex}`,
          amount,
          count,
          shortLabel: `S${weekIndex}`,
          fullLabel: `Semaine ${weekIndex} (${startFormatted} - ${endFormatted})`,
          isCurrent: weekIndex === 12,
        };
      });

      const total = barsData.reduce((acc, b) => acc + b.amount, 0);
      const count = barsData.reduce((acc, b) => acc + b.count, 0);
      return {
        bars: barsData,
        totalRevenue: total,
        totalOrdersCount: count,
        averageOrderValue: count > 0 ? Math.round(total / count) : 0,
      };
    }

    // "year" : 12 mois de l'année en cours
    const currentYear = startOfToday.getUTCFullYear();
    const currentMonth = startOfToday.getUTCMonth();

    const monthsData = Array.from({ length: 12 }, (_, monthIndex) => {
      const matchingOrders = paidOrders.filter((order) => {
        const d = toDate(order.createdAt);
        return d.getUTCFullYear() === currentYear && d.getUTCMonth() === monthIndex;
      });

      const amount = matchingOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      const count = matchingOrders.length;

      return {
        key: `month-${monthIndex}`,
        amount,
        count,
        shortLabel: MONTH_NAMES[monthIndex],
        fullLabel: `${MONTH_NAMES[monthIndex]} ${currentYear}`,
        isCurrent: monthIndex === currentMonth,
      };
    });

    const total = monthsData.reduce((acc, b) => acc + b.amount, 0);
    const count = monthsData.reduce((acc, b) => acc + b.count, 0);
    return {
      bars: monthsData,
      totalRevenue: total,
      totalOrdersCount: count,
      averageOrderValue: count > 0 ? Math.round(total / count) : 0,
    };
  }, [orders, period]);

  const maxRevenue = Math.max(1, ...bars.map((b) => b.amount));
  const activeItem = hoveredIndex !== null ? bars[hoveredIndex] : null;

  return (
    <article className="rounded-[22px] border-[2.5px] border-ink bg-[#FFFBF2] text-ink p-5 sm:p-6 shadow-[4px_4px_0_#0F1E3D] flex flex-col justify-between">
      {/* Header : Titre + Sélecteur de période */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#C8265A]">
              <TrendingUp size={14} strokeWidth={2.5} />
              <span>Activité des ventes</span>
            </div>
            <h2 className="mt-1 font-bricolage text-2xl font-black text-ink sm:text-3xl">
              {formatFcfa(totalRevenue)}
            </h2>
          </div>

          {/* Onglets Période */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border-2 border-ink bg-white/70 p-1 shadow-sm" role="tablist" aria-label="Période du graphique">
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

        {/* Détails complémentaires / Info au survol */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3 text-xs">
          {activeItem ? (
            <div className="flex items-center gap-2">
              <span className="font-black text-[#0F1E3D]">{activeItem.fullLabel} :</span>
              <span className="font-bold text-[#C8265A]">{formatFcfa(activeItem.amount)}</span>
              <span className="text-[#65708A]">({activeItem.count} commande{activeItem.count > 1 ? "s" : ""})</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5 text-[#3F4B69] font-medium">
              <span>
                <strong className="text-ink font-black">{totalOrdersCount}</strong> commande{totalOrdersCount > 1 ? "s" : ""} payée{totalOrdersCount > 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span>
                Panier moyen : <strong className="text-ink font-black">{formatFcfa(averageOrderValue)}</strong>
              </span>
            </div>
          )}

          <span className="text-[11px] font-bold text-[#65708A] flex items-center gap-1">
            <Calendar size={12} />
            {PERIODS.find((p) => p.id === period)?.title}
          </span>
        </div>
      </div>

      {/* Graphique à barres interactif */}
      <div className="mt-6">
        <div className="flex h-44 items-end gap-1 sm:gap-2">
          {bars.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const height = item.amount > 0 ? Math.max(8, (item.amount / maxRevenue) * 100) : 4;

            return (
              <div
                key={item.key}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
                className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2 cursor-pointer select-none"
              >
                {/* Barre de progression */}
                <div className="flex w-full flex-1 items-end overflow-hidden rounded-t-lg bg-[#F0EDE8]">
                  <div
                    className={`w-full rounded-t-lg border-x border-t border-ink transition-all duration-200 ${
                      isHovered
                        ? "bg-[#C8265A]"
                        : item.isCurrent
                          ? "bg-[#FFC83D]"
                          : item.amount > 0
                            ? "bg-[#CFEFE6]"
                            : "bg-[#D8D5D0]"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>

                {/* Étiquette sous la barre */}
                <span
                  className={`text-[10px] font-black uppercase transition-colors sm:text-xs truncate max-w-full ${
                    isHovered
                      ? "text-[#C8265A]"
                      : item.isCurrent
                        ? "text-[#C8265A]"
                        : "text-[#65708A]"
                  }`}
                >
                  {item.shortLabel}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-4 border-t border-ink/15 pt-3 text-[11px] font-medium text-[#65708A]">
          Montants calculés sur les commandes marquées comme payées en Franc CFA (XOF).
        </p>
      </div>
    </article>
  );
}
