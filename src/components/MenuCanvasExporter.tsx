"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { useBayner } from "@/lib/store";
import { calculateRecipeFinancials, formatSAR } from "@/lib/pricing";

type PosterTheme = "executive_dark" | "clean_white" | "warm_sand";

const THEMES: Record<
  PosterTheme,
  {
    label: string;
    bg: string;
    card: string;
    border: string;
    title: string;
    subtitle: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  executive_dark: {
    label: "داكن تنفيذي",
    bg: "#0F172A",
    card: "#1E293B",
    border: "#334155",
    title: "#F8FAFC",
    subtitle: "#94A3B8",
    accent: "#10B981",
    badgeBg: "#065F46",
    badgeText: "#ECFDF5",
  },
  clean_white: {
    label: "كلاسيكي أبيض",
    bg: "#F1F5F9",
    card: "#FFFFFF",
    border: "#E2E8F0",
    title: "#0F172A",
    subtitle: "#64748B",
    accent: "#4F46E5",
    badgeBg: "#EEF2FF",
    badgeText: "#3730A3",
  },
  warm_sand: {
    label: "رملي دافئ",
    bg: "#F5F0E8",
    card: "#FFFFFF",
    border: "#E7DFD3",
    title: "#292524",
    subtitle: "#78716C",
    accent: "#B45309",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
  },
};

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

export function MenuCanvasExporter() {
  const { state } = useBayner();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [theme, setTheme] = useState<PosterTheme>("executive_dark");
  const [badgeText, setBadgeText] = useState("منيو الأسبوع والطلبات الخاصة");
  const [showPrices, setShowPrices] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showCustomCta, setShowCustomCta] = useState(true);
  const [showWhatsapp, setShowWhatsapp] = useState(true);

  const publishedRecipes = state.recipes.filter((r) => r.publishedInMenu);

  useEffect(() => {
    let cancelled = false;

    const renderPoster = async () => {
      if (typeof document !== "undefined" && document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore
        }
      }
      if (cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 1080;
      const H = 1350;
      canvas.width = W;
      canvas.height = H;

      const t = THEMES[theme];

      // Background
      ctx.fillStyle = t.bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle top accent bar
      ctx.fillStyle = t.accent;
      ctx.fillRect(0, 0, W, 14);

      // Header container
      ctx.direction = "rtl";
      ctx.textAlign = "right";

      // Pill badge
      drawRoundRect(ctx, W - 72 - 360, 68, 360, 48, 24);
      ctx.fillStyle = t.badgeBg;
      ctx.fill();
      ctx.fillStyle = t.badgeText;
      ctx.font = "600 24px 'IBM Plex Sans Arabic', sans-serif";
      ctx.fillText(badgeText || "قائمة الأصناف", W - 96, 100);

      // Store Name
      ctx.fillStyle = t.title;
      ctx.font = "700 58px 'IBM Plex Sans Arabic', sans-serif";
      ctx.fillText(state.store.name, W - 72, 182);

      // Store Subtitle
      ctx.fillStyle = t.subtitle;
      ctx.font = "500 28px 'IBM Plex Sans Arabic', sans-serif";
      ctx.fillText(
        `${state.store.city} • طلبات مسبقة • تحضير طازج يومياً`,
        W - 72,
        232
      );

      // Divider
      ctx.strokeStyle = t.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(72, 272);
      ctx.lineTo(W - 72, 272);
      ctx.stroke();

      // Menu Items Cards (up to 5 fit cleanly)
      const itemsToDraw = publishedRecipes.slice(0, 5);
      let curY = 308;
      const cardHeight = showDescriptions ? 148 : 112;
      const gap = 22;

      if (itemsToDraw.length === 0) {
        drawRoundRect(ctx, 72, curY, W - 144, 180, 20);
        ctx.fillStyle = t.card;
        ctx.fill();
        ctx.fillStyle = t.subtitle;
        ctx.font = "600 30px 'IBM Plex Sans Arabic', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("قم بتفعيل صنف واحد على الأقل لعرضه في المنيو", W / 2, curY + 100);
      } else {
        for (const recipe of itemsToDraw) {
          const fin = calculateRecipeFinancials(recipe, state.ingredients);

          drawRoundRect(ctx, 72, curY, W - 144, cardHeight, 20);
          ctx.fillStyle = t.card;
          ctx.fill();
          ctx.strokeStyle = t.border;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Left accent indicator bar inside card
          drawRoundRect(ctx, W - 72 - 10, curY + 22, 10, cardHeight - 44, 5);
          ctx.fillStyle = t.accent;
          ctx.fill();

          // Item Title (Right aligned)
          ctx.textAlign = "right";
          ctx.fillStyle = t.title;
          ctx.font = "700 34px 'IBM Plex Sans Arabic', sans-serif";
          ctx.fillText(recipe.name, W - 108, curY + 54);

          // Category & Servings
          ctx.fillStyle = t.subtitle;
          ctx.font = "500 22px 'IBM Plex Sans Arabic', sans-serif";
          if (showDescriptions) {
            const desc =
              recipe.description.length > 68
                ? `${recipe.description.slice(0, 68)}...`
                : recipe.description;
            ctx.fillText(desc, W - 108, curY + 100);
          } else {
            ctx.fillText(
              `${recipe.category} • يكفي ${recipe.servings} أشخاص`,
              W - 108,
              curY + 90
            );
          }

          // Price Pill (Left aligned)
          if (showPrices) {
            drawRoundRect(ctx, 102, curY + cardHeight / 2 - 28, 175, 56, 14);
            ctx.fillStyle = t.badgeBg;
            ctx.fill();

            ctx.textAlign = "center";
            ctx.fillStyle = t.badgeText;
            ctx.font = "700 30px 'IBM Plex Sans Arabic', sans-serif";
            ctx.fillText(formatSAR(fin.sellingPrice), 102 + 87.5, curY + cardHeight / 2 + 11);
          }

          curY += cardHeight + gap;
        }
      }

      // Custom Cake CTA Box
      if (showCustomCta) {
        const minCustom = state.customCakeConfig.sizes[0]?.priceAdd ?? 115;
        const boxY = Math.max(curY + 8, 1090);
        drawRoundRect(ctx, 72, boxY, W - 144, 112, 20);
        ctx.fillStyle = t.badgeBg;
        ctx.fill();

        ctx.textAlign = "right";
        ctx.fillStyle = t.badgeText;
        ctx.font = "700 30px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText("متوفر تصميم الكيك المخصص حسب مناسبتك", W - 104, boxY + 48);

        ctx.font = "500 24px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText(
          `تبدأ الأسعار من ${formatSAR(minCustom)} • الحجز عبر الرابط في البايو`,
          W - 104,
          boxY + 88
        );
      }

      // Footer
      ctx.textAlign = "right";
      ctx.fillStyle = t.subtitle;
      ctx.font = "600 24px 'IBM Plex Sans Arabic', sans-serif";
      ctx.fillText(state.store.instagramHandle || state.store.name, W - 72, 1285);

      if (showWhatsapp) {
        ctx.textAlign = "left";
        ctx.fillStyle = t.accent;
        ctx.font = "700 24px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText(`WhatsApp: ${state.store.whatsappNumber}`, 72, 1285);
      }
    };

    renderPoster();
    return () => {
      cancelled = true;
    };
  }, [
    theme,
    badgeText,
    showPrices,
    showDescriptions,
    showCustomCta,
    showWhatsapp,
    publishedRecipes,
    state.store,
    state.ingredients,
    state.customCakeConfig,
  ]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${state.store.slug || "bayner"}-menu.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>مصمم صورة المنيو الفورية (PNG)</span>
          </h3>
          <p className="text-xs text-slate-500">
            صورة بدقة عالية جاهزة للستوري وحالة الواتساب — تتحدث تلقائياً من أسعارك
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          <span>تحميل صورة المنيو (PNG)</span>
        </button>
      </div>

      {/* Controls */}
      <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 ml-2">
            الثيم:
          </span>
          {(Object.keys(THEMES) as PosterTheme[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                theme === key
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {THEMES[key].label}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
            عنوان البانر العلوي
          </label>
          <input
            type="text"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <label className="flex cursor-pointer items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={showPrices}
              onChange={(e) => setShowPrices(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            <span>إظهار الأسعار</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={showDescriptions}
              onChange={(e) => setShowDescriptions(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            <span>إظهار وصف الأصناف</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={showCustomCta}
              onChange={(e) => setShowCustomCta(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            <span>تنويه الكيك المخصص</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={showWhatsapp}
              onChange={(e) => setShowWhatsapp(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600"
            />
            <span>إظهار رقم الواتساب</span>
          </label>
        </div>
      </div>

      {/* Live Canvas Preview */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-3 flex justify-center">
        <canvas
          ref={canvasRef}
          className="h-auto w-full max-w-[360px] rounded-lg shadow-md"
        />
      </div>
    </div>
  );
}
