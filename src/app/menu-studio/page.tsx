"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import { useBayner } from "@/lib/store";
import { calculateRecipeFinancials, formatSAR } from "@/lib/pricing";
import { MenuCanvasExporter } from "@/components/MenuCanvasExporter";
import { CustomCakeOption } from "@/lib/types";

export default function MenuStudioPage() {
  const {
    state,
    toggleRecipeMenu,
    saveRecipe,
    updateCustomCakeConfig,
  } = useBayner();

  const [copiedLink, setCopiedLink] = useState(false);
  const [configTab, setConfigTab] = useState<"sizes" | "flavors" | "fillings">(
    "sizes"
  );
  const [newOptLabel, setNewOptLabel] = useState("");
  const [newOptPrice, setNewOptPrice] = useState<number>(0);

  const handleCopyStoreLink = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/store`
        : "/store";
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptLabel.trim()) return;
    const opt: CustomCakeOption = {
      id: `opt-${Date.now()}`,
      label: newOptLabel.trim(),
      priceAdd: Number(newOptPrice) || 0,
    };
    updateCustomCakeConfig({
      ...state.customCakeConfig,
      [configTab]: [...state.customCakeConfig[configTab], opt],
    });
    setNewOptLabel("");
    setNewOptPrice(0);
  };

  const handleDeleteOption = (id: string) => {
    updateCustomCakeConfig({
      ...state.customCakeConfig,
      [configTab]: state.customCakeConfig[configTab].filter((o) => o.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Share Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            رابط منيو وطلبات متجرك الجاهز للبايو والواتساب
          </p>
          <p className="mt-0.5 text-sm font-bold text-indigo-700" dir="ltr">
            /store ({state.store.slug})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyStoreLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>تم نسخ الرابط</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>نسخ رابط المتجر</span>
              </>
            )}
          </button>

          <Link
            href="/store"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <ExternalLink className="h-4 w-4" />
            <span>فتح واجهة العميلة</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Menu Visibility & Custom Cake Config (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Published Menu Items */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  أصناف المنيو الجاهز
                </h3>
                <p className="text-xs text-slate-500">
                  فعّلي أو أخفي أي صنف وعدّلي سعره الظاهر مع مراقبة هامش الربح
                </p>
              </div>
              <Link
                href="/pantry"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                + إضافة من الحاسبة
              </Link>
            </div>

            <div className="space-y-3">
              {state.recipes.map((recipe) => {
                const fin = calculateRecipeFinancials(
                  recipe,
                  state.ingredients
                );

                return (
                  <div
                    key={recipe.id}
                    className={`rounded-xl border p-4 transition ${
                      recipe.publishedInMenu
                        ? "border-slate-200 bg-white"
                        : "border-slate-200 bg-slate-50/70 opacity-75"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {recipe.name}
                          </h4>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {recipe.category}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                              fin.isLoss
                                ? "bg-rose-50 text-rose-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            هامش {fin.actualProfitMarginPercent.toFixed(0)}%
                          </span>
                        </div>

                        <input
                          type="text"
                          value={recipe.description}
                          onChange={(e) =>
                            saveRecipe({ ...recipe, description: e.target.value })
                          }
                          className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-600 hover:border-slate-200 focus:border-indigo-400 focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-left">
                          <span className="block text-[10px] text-slate-400">
                            السعر (ر.س)
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={
                              recipe.customSellingPrice ??
                              fin.suggestedSellingPrice
                            }
                            onChange={(e) =>
                              saveRecipe({
                                ...recipe,
                                customSellingPrice:
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value),
                              })
                            }
                            className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs font-bold text-slate-900 tabular-nums focus:border-indigo-500 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleRecipeMenu(recipe.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                            recipe.publishedInMenu
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {recipe.publishedInMenu ? (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>منشور</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Cake Builder Options */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  إعدادات خيارات الكيك المخصص (Custom Cake)
                </h3>
                <p className="text-xs text-slate-500">
                  تظهر هذه المقاسات والنكهات والحشوات للعميلة في صفحة الطلب
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              {(
                [
                  { key: "sizes", label: "المقاسات الأساسية" },
                  { key: "flavors", label: "النكهات" },
                  { key: "fillings", label: "الحشوات" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setConfigTab(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    configTab === tab.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {state.customCakeConfig[configTab].map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs"
                >
                  <span className="font-semibold text-slate-800">
                    {opt.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-700 tabular-nums">
                      {configTab === "sizes"
                        ? formatSAR(opt.priceAdd)
                        : opt.priceAdd > 0
                        ? `+ ${formatSAR(opt.priceAdd)}`
                        : "مشمول مجاناً"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteOption(opt.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddOption}
              className="flex flex-wrap items-end gap-2 pt-2"
            >
              <div className="flex-1 min-w-[180px]">
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  اسم الخيار الجديد
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 10 إنش أو نكهة لوتس"
                  value={newOptLabel}
                  onChange={(e) => setNewOptLabel(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="w-32">
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  {configTab === "sizes" ? "السعر الأساسي" : "الزيادة (ر.س)"}
                </label>
                <input
                  type="number"
                  min={0}
                  value={newOptPrice}
                  onChange={(e) => setNewOptPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Live Canvas Poster Exporter (5 cols) */}
        <div className="lg:col-span-5">
          <MenuCanvasExporter />
        </div>
      </div>
    </div>
  );
}
