"use client";

import React, { useState } from "react";
import { formatSAR } from "@/lib/pricing";

interface DonutSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface CostBreakdownDonutProps {
  ingredientsCost: number;
  packagingCost: number;
  wasteCost: number;
  laborCost: number;
  overheadCost: number;
  platformFeeCost: number;
  netProfit: number;
  sellingPrice: number;
}

export function CostBreakdownDonut({
  ingredientsCost,
  packagingCost,
  wasteCost,
  laborCost,
  overheadCost,
  platformFeeCost,
  netProfit,
  sellingPrice,
}: CostBreakdownDonutProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const segments: DonutSegment[] = [
    {
      key: "profit",
      label: "صافي الربح",
      value: Math.max(0, netProfit),
      color: "#059669",
    },
    {
      key: "ingredients",
      label: "المقادير",
      value: Math.max(0, ingredientsCost),
      color: "#4F46E5",
    },
    {
      key: "packaging",
      label: "التغليف",
      value: Math.max(0, packagingCost),
      color: "#0284C7",
    },
    {
      key: "labor",
      label: "الجهد والعمل",
      value: Math.max(0, laborCost),
      color: "#D97706",
    },
    {
      key: "waste",
      label: "الهدر والفاقد",
      value: Math.max(0, wasteCost),
      color: "#E11D48",
    },
    {
      key: "overhead",
      label: "التشغيل والعمولات",
      value: Math.max(0, overheadCost + platformFeeCost),
      color: "#64748B",
    },
  ].filter((s) => s.value > 0.01);

  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const arcs = segments.map((seg) => {
    const fraction = seg.value / total;
    const strokeLength = fraction * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += strokeLength;
    return { ...seg, strokeLength, offset, fraction };
  });

  const activeSegment = arcs.find((a) => a.key === hoveredKey) ?? null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-48 w-48 items-center justify-center">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth="22"
          />
          {arcs.map((arc) => {
            const isHovered = hoveredKey === arc.key;
            return (
              <circle
                key={arc.key}
                cx="90"
                cy="90"
                r={radius}
                fill="transparent"
                stroke={arc.color}
                strokeWidth={isHovered ? 26 : 22}
                strokeDasharray={`${arc.strokeLength} ${circumference}`}
                strokeDashoffset={-arc.offset}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredKey(arc.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {activeSegment ? (
            <>
              <span className="text-[11px] font-medium text-slate-500">
                {activeSegment.label}
              </span>
              <span className="text-base font-bold text-slate-900 tabular-nums">
                {formatSAR(activeSegment.value, 1)}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 tabular-nums">
                {((activeSegment.value / (sellingPrice || 1)) * 100).toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[11px] font-medium text-slate-500">
                {netProfit >= 0 ? "صافي الربح" : "عجز تسعير"}
              </span>
              <span
                className={`text-lg font-bold tabular-nums ${
                  netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatSAR(netProfit, 0)}
              </span>
              <span className="text-[11px] text-slate-400 tabular-nums">
                من {formatSAR(sellingPrice, 0)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 grid w-full grid-cols-2 gap-2">
        {arcs.map((seg) => (
          <div
            key={seg.key}
            onMouseEnter={() => setHoveredKey(seg.key)}
            onMouseLeave={() => setHoveredKey(null)}
            className={`flex cursor-pointer items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition ${
              hoveredKey === seg.key
                ? "border-slate-300 bg-slate-50"
                : "border-slate-100 bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="truncate text-slate-600">{seg.label}</span>
            </div>
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatSAR(seg.value, 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BarItem {
  label: string;
  sales: number;
  cost: number;
  profit: number;
}

export function RevenueProfitBars({ items }: { items: BarItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const maxVal = Math.max(
    100,
    ...items.map((item) => Math.max(item.sales, item.cost, item.profit))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-900" />
            المبيعات
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            التكلفة والهدر
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
            صافي الربح
          </span>
        </div>

        {activeIndex !== null && items[activeIndex] && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 tabular-nums">
            {items[activeIndex].label}: مبيعات{" "}
            {formatSAR(items[activeIndex].sales)} | ربح{" "}
            <span className="font-bold text-emerald-700">
              {formatSAR(items[activeIndex].profit)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {items.map((item, idx) => {
          const salesPct = Math.min(100, (item.sales / maxVal) * 100);
          const costPct = Math.min(100, (item.cost / maxVal) * 100);
          const profitPct = Math.min(100, (Math.max(0, item.profit) / maxVal) * 100);

          return (
            <div
              key={item.label}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`rounded-xl border p-3 transition ${
                activeIndex === idx
                  ? "border-indigo-200 bg-indigo-50/30"
                  : "border-slate-100 bg-slate-50/50"
              }`}
            >
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{item.label}</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  ربح: {formatSAR(item.profit)}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all duration-300"
                      style={{ width: `${salesPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-left text-[11px] font-medium text-slate-600 tabular-nums">
                    {formatSAR(item.sales)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${costPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-left text-[11px] font-medium text-rose-600 tabular-nums">
                    {formatSAR(item.cost)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${profitPct}%` }}
                    />
                  </div>
                  <span className="w-16 text-left text-[11px] font-semibold text-emerald-700 tabular-nums">
                    {formatSAR(item.profit)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
