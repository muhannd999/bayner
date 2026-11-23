"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  Package,
  Calculator,
  Check,
  Search,
  Pencil,
  X,
} from "lucide-react";
import { useBayner } from "@/lib/store";
import {
  calculateIngredientUnitCost,
  calculateRecipeFinancials,
  formatSAR,
} from "@/lib/pricing";
import {
  Ingredient,
  IngredientCategory,
  IngredientUnit,
  RecipeCategory,
  RecipeProduct,
} from "@/lib/types";
import { CostBreakdownDonut } from "@/components/Charts";

function createBlankRecipe(): RecipeProduct {
  return {
    id: `rec-${Date.now()}`,
    name: "وصفة جديدة",
    category: "كيك مناسبات",
    description: "وصف مختصر يظهر للعميلة في المنيو",
    servings: 10,
    items: [],
    laborHours: 1.5,
    hourlyRate: 35,
    overheadPercent: 8,
    wastePercent: 7,
    platformFeePercent: 0,
    targetMarginPercent: 50,
    publishedInMenu: true,
    accentColor: "#4F46E5",
  };
}

export default function PantryAndCalculatorPage() {
  const {
    state,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    saveRecipe,
    deleteRecipe,
  } = useBayner();

  const [activeTab, setActiveTab] = useState<"calculator" | "pantry">(
    "calculator"
  );

  // Calculator editor state
  const [draft, setDraft] = useState<RecipeProduct>(
    () => state.recipes[0] ?? createBlankRecipe()
  );
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>(
    () => state.ingredients[0]?.id ?? ""
  );
  const [addQty, setAddQty] = useState<number>(100);
  const [saveBanner, setSaveBanner] = useState(false);

  // Pantry state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"الكل" | IngredientCategory>("الكل");
  const [newIngName, setNewIngName] = useState("");
  const [newIngCategory, setNewIngCategory] =
    useState<IngredientCategory>("مقادير");
  const [newIngPrice, setNewIngPrice] = useState<number>(25);
  const [newIngQty, setNewIngQty] = useState<number>(1000);
  const [newIngUnit, setNewIngUnit] = useState<IngredientUnit>("جم");
  const [editingIngId, setEditingIngId] = useState<string | null>(null);
  const [editIngForm, setEditIngForm] = useState<Ingredient | null>(null);
  const [pantryUpdateBanner, setPantryUpdateBanner] = useState<string | null>(
    null
  );

  const financials = useMemo(
    () => calculateRecipeFinancials(draft, state.ingredients),
    [draft, state.ingredients]
  );

  const selectExistingRecipe = (rec: RecipeProduct) => {
    setDraft(JSON.parse(JSON.stringify(rec)) as RecipeProduct);
  };

  const handleNewRecipe = () => {
    setDraft(createBlankRecipe());
  };

  const handleAddItemToRecipe = () => {
    if (!selectedIngredientId || addQty <= 0) return;
    setDraft((prev) => {
      const existing = prev.items.find(
        (i) => i.ingredientId === selectedIngredientId
      );
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.ingredientId === selectedIngredientId
              ? { ...i, quantity: i.quantity + addQty }
              : i
          ),
        };
      }
      return {
        ...prev,
        items: [...prev.items, { ingredientId: selectedIngredientId, quantity: addQty }],
      };
    });
  };

  const handleUpdateItemQty = (ingredientId: string, qty: number) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.ingredientId === ingredientId ? { ...i, quantity: Math.max(0, qty) } : i
      ),
    }));
  };

  const handleRemoveItem = (ingredientId: string) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.ingredientId !== ingredientId),
    }));
  };

  const handleSaveDraft = () => {
    saveRecipe(draft);
    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 2500);
  };

  const handleDeleteCurrent = () => {
    deleteRecipe(draft.id);
    const remaining = state.recipes.filter((r) => r.id !== draft.id);
    setDraft(remaining[0] ?? createBlankRecipe());
  };

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim() || newIngQty <= 0) return;
    addIngredient({
      name: newIngName.trim(),
      category: newIngCategory,
      packPrice: Number(newIngPrice) || 0,
      packQuantity: Number(newIngQty) || 1,
      unit: newIngUnit,
    });
    setNewIngName("");
  };

  const handleStartEditIngredient = (ing: Ingredient) => {
    setEditingIngId(ing.id);
    setEditIngForm({ ...ing });
  };

  const handleSaveEditIngredient = () => {
    if (!editIngForm || !editIngForm.name.trim() || editIngForm.packQuantity <= 0)
      return;
    updateIngredient(editIngForm);
    const affectedCount = state.recipes.filter((r) =>
      r.items.some((it) => it.ingredientId === editIngForm.id)
    ).length;
    setEditingIngId(null);
    setEditIngForm(null);
    setPantryUpdateBanner(
      `تم تحديث السعر وإعادة حساب تكلفة ${affectedCount} وصفات مرتبطة تلقائياً!`
    );
    setTimeout(() => setPantryUpdateBanner(null), 3500);
  };

  const filteredIngredients = state.ingredients.filter((ing) => {
    const matchesCat =
      categoryFilter === "الكل" || ing.category === categoryFilter;
    const matchesSearch = ing.name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    return matchesCat && matchesSearch;
  });

  const isSavedRecipe = state.recipes.some((r) => r.id === draft.id);

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "calculator"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>حاسبة التسعير والهدر والربح</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pantry")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "pantry"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>مكتبة المقادير والتغليف ({state.ingredients.length})</span>
          </button>
        </div>

        {saveBanner && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            تم حفظ الوصفة وتحديث الأسعار في المنيو
          </span>
        )}
      </div>

      {activeTab === "calculator" ? (
        <div className="space-y-5">
          {/* Recipe Selector Strip */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
            <span className="px-2 text-xs font-semibold text-slate-500">
              الوصفات المحفوظة:
            </span>
            {state.recipes.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => selectExistingRecipe(rec)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  draft.id === rec.id
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {rec.name}
              </button>
            ))}
            <button
              type="button"
              onClick={handleNewRecipe}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>وصفة جديدة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Workspace (7 cols) */}
            <div className="space-y-6 lg:col-span-7">
              {/* Basic Recipe Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  1. بيانات الصنف الأساسية
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      اسم الكيكة أو الصنف
                    </label>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      التصنيف
                    </label>
                    <select
                      value={draft.category}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          category: e.target.value as RecipeCategory,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="كيك مناسبات">كيك مناسبات</option>
                      <option value="حلى وبوكسات">حلى وبوكسات</option>
                      <option value="ميني كيك">ميني كيك</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      الوصف التسويقي في المنيو
                    </label>
                    <input
                      type="text"
                      value={draft.description}
                      onChange={(e) =>
                        setDraft({ ...draft, description: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      عدد الحصص / الأشخاص
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={draft.servings}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          servings: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Recipe Ingredients Table */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    2. المقادير والتغليف المستخدمة في الوصفة
                  </h3>
                  <span className="text-xs font-semibold text-indigo-700 tabular-nums">
                    المجموع:{" "}
                    {formatSAR(
                      financials.ingredientsCost + financials.packagingCost,
                      2
                    )}
                  </span>
                </div>

                {/* Add Ingredient Row */}
                <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      اختر من المخزن
                    </label>
                    <select
                      value={selectedIngredientId}
                      onChange={(e) => setSelectedIngredientId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      {state.ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                      الكمية
                    </label>
                    <input
                      type="number"
                      min={0.1}
                      step="any"
                      value={addQty}
                      onChange={(e) => setAddQty(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToRecipe}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>إضافة</span>
                  </button>
                </div>

                {financials.itemizedCosts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                    أضيفي المكونات والتغليف من القائمة أعلاه لحساب التكلفة الدقيقة
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="pb-2 font-semibold">المكون / التغليف</th>
                          <th className="pb-2 font-semibold">الكمية</th>
                          <th className="pb-2 font-semibold">التكلفة</th>
                          <th className="pb-2 text-left font-semibold">حذف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {financials.itemizedCosts.map(
                          ({ ingredient, quantity, lineCost }) => (
                            <tr key={ingredient.id}>
                              <td className="py-2.5">
                                <p className="font-semibold text-slate-900">
                                  {ingredient.name}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {ingredient.category}
                                </span>
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={quantity}
                                    onChange={(e) =>
                                      handleUpdateItemQty(
                                        ingredient.id,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                                  />
                                  <span className="text-slate-500">
                                    {ingredient.unit}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 font-semibold text-slate-800 tabular-nums">
                                {formatSAR(lineCost, 2)}
                              </td>
                              <td className="py-2.5 text-left">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(ingredient.id)}
                                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Waste, Labor, Overhead & Margin Sliders */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
                <h3 className="text-sm font-bold text-slate-900">
                  3. حساب الهدر، الجهد الشخصي، والتشغيل
                </h3>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        نسبة الهدر والفاقد
                      </span>
                      <span className="font-bold text-rose-600 tabular-nums">
                        {draft.wastePercent}% ({formatSAR(financials.wasteCost, 1)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={25}
                      step={1}
                      value={draft.wastePercent}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          wastePercent: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        التشغيل (كهرباء/غاز/تنظيف)
                      </span>
                      <span className="font-bold text-slate-700 tabular-nums">
                        {draft.overheadPercent}% (
                        {formatSAR(financials.overheadCost, 1)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={25}
                      step={1}
                      value={draft.overheadPercent}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          overheadPercent: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        ساعات العمل والتحضير
                      </span>
                      <span className="font-bold text-amber-600 tabular-nums">
                        {draft.laborHours} ساعة ({formatSAR(financials.laborCost, 0)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={10}
                      step={0.25}
                      value={draft.laborHours}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          laborHours: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      أجر ساعة العمل (ر.س / ساعة)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draft.hourlyRate}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          hourlyRate: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        عمولة المنصة / بوابة الدفع
                      </span>
                      <span className="font-bold text-slate-700 tabular-nums">
                        {draft.platformFeePercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={1}
                      value={draft.platformFeePercent}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          platformFeePercent: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        الربح الإضافي المستهدف (Markup)
                      </span>
                      <span className="font-bold text-emerald-700 tabular-nums">
                        {draft.targetMarginPercent}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={150}
                      step={5}
                      value={draft.targetMarginPercent}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          targetMarginPercent: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Manual Selling Price Override */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        تعديل سعر البيع يدوياً (اختياري)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        اتركيه فارغاً لاعتماد السعر المقترح تلقائياً (
                        {formatSAR(financials.suggestedSellingPrice)})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        placeholder={String(financials.suggestedSellingPrice)}
                        value={draft.customSellingPrice ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraft({
                            ...draft,
                            customSellingPrice:
                              val === "" ? undefined : Number(val),
                          });
                        }}
                        className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold tabular-nums focus:border-indigo-500 focus:outline-none"
                      />
                      {draft.customSellingPrice !== undefined && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({ ...draft, customSellingPrice: undefined })
                          }
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          إعادة للمقترح
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sticky Financial Summary (5 cols) */}
            <div className="lg:col-span-5">
              <div className="sticky top-20 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      النتيجة المالية الفورية
                    </h3>
                    <p className="text-xs text-slate-500">{draft.name}</p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={draft.publishedInMenu}
                      onChange={(e) =>
                        setDraft({ ...draft, publishedInMenu: e.target.checked })
                      }
                      className="rounded border-slate-300 text-indigo-600"
                    />
                    <span>ظاهر بالمنيو</span>
                  </label>
                </div>

                {/* Risk Warning Alert */}
                {financials.isLoss && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="font-bold">تنبيه خسارة!</p>
                      <p>
                        السعر الحالي أقل من التكلفة والهدر، مما يعني خسارة{" "}
                        {formatSAR(Math.abs(financials.netProfit), 1)} في كل طلب.
                      </p>
                    </div>
                  </div>
                )}

                {financials.isLowMargin && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">هامش ربح منخفض (أقل من 20%)</p>
                      <p>ينصح برفع السعر لحماية مشروعك من تقلب أسعار المكونات.</p>
                    </div>
                  </div>
                )}

                {/* Highlight KPI Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-900 p-3.5 text-white">
                    <p className="text-[11px] text-slate-300">سعر البيع المعتمد</p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {formatSAR(financials.sellingPrice)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400 tabular-nums">
                      المقترح: {formatSAR(financials.suggestedSellingPrice)}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl p-3.5 border ${
                      financials.netProfit >= 0
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-rose-200 bg-rose-50 text-rose-900"
                    }`}
                  >
                    <p className="text-[11px] opacity-80">صافي الربح للقطعة</p>
                    <p className="mt-1 text-xl font-bold tabular-nums">
                      {formatSAR(financials.netProfit, 1)}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold tabular-nums">
                      الهامش الفعلي:{" "}
                      {financials.actualProfitMarginPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Live Donut Chart */}
                <CostBreakdownDonut
                  ingredientsCost={financials.ingredientsCost}
                  packagingCost={financials.packagingCost}
                  wasteCost={financials.wasteCost}
                  laborCost={financials.laborCost}
                  overheadCost={financials.overheadCost}
                  platformFeeCost={financials.platformFeeCost}
                  netProfit={financials.netProfit}
                  sellingPrice={financials.sellingPrice}
                />

                {/* Quick Summary Table */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>التكلفة المباشرة الإجمالية</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatSAR(financials.totalDirectCost, 2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>تكلفة الحصة الواحدة ({draft.servings} حصص)</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatSAR(financials.costPerServing, 2)}
                    </span>
                  </div>
                </div>

                {/* Save / Delete Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Save className="h-4 w-4" />
                    <span>حفظ الوصفة وتحديث المنيو</span>
                  </button>

                  {isSavedRecipe && state.recipes.length > 1 && (
                    <button
                      type="button"
                      onClick={handleDeleteCurrent}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 hover:bg-rose-100"
                      title="حذف الوصفة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Pantry & Packaging Inventory */
        <div className="space-y-6">
          {/* Add Ingredient Form */}
          <form
            onSubmit={handleAddIngredient}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">
              إضافة خامة أو تغليف جديد للمخزن
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  اسم المادة / العلبة
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كريمة فستق 1 كجم"
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  التصنيف
                </label>
                <select
                  value={newIngCategory}
                  onChange={(e) =>
                    setNewIngCategory(e.target.value as IngredientCategory)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="مقادير">مقادير</option>
                  <option value="تغليف">تغليف</option>
                  <option value="إضافات">إضافات</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  سعر العبوة (ر.س)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={newIngPrice}
                  onChange={(e) => setNewIngPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  الكمية بالعبوة
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={newIngQty}
                  onChange={(e) => setNewIngQty(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  الوحدة
                </label>
                <div className="flex gap-2">
                  <select
                    value={newIngUnit}
                    onChange={(e) =>
                      setNewIngUnit(e.target.value as IngredientUnit)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="جم">جم</option>
                    <option value="مل">مل</option>
                    <option value="حبة">حبة</option>
                  </select>
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    إضافة
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Pantry Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            {pantryUpdateBanner && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{pantryUpdateBanner}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحثي عن خامة أو تغليف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pr-9 pl-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(["الكل", "مقادير", "تغليف", "إضافات"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      categoryFilter === cat
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-2.5 font-semibold">المادة</th>
                    <th className="pb-2.5 font-semibold">الفئة</th>
                    <th className="pb-2.5 font-semibold">سعر العبوة</th>
                    <th className="pb-2.5 font-semibold">محتوى العبوة</th>
                    <th className="pb-2.5 font-semibold">تكلفة الوحدة الواحدة</th>
                    <th className="pb-2.5 text-left font-semibold">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIngredients.map((ing) => {
                    const isEditing = editingIngId === ing.id && editIngForm;
                    const unitCost = calculateIngredientUnitCost(
                      isEditing ? editIngForm : ing
                    );
                    return (
                      <tr key={ing.id} className="hover:bg-slate-50/70">
                        <td className="py-3 font-semibold text-slate-900">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editIngForm.name}
                              onChange={(e) =>
                                setEditIngForm({
                                  ...editIngForm,
                                  name: e.target.value,
                                })
                              }
                              className="w-full min-w-[160px] rounded-md border border-indigo-300 px-2 py-1 text-xs focus:outline-none"
                            />
                          ) : (
                            ing.name
                          )}
                        </td>
                        <td className="py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                            {ing.category}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-slate-700 tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={editIngForm.packPrice}
                              onChange={(e) =>
                                setEditIngForm({
                                  ...editIngForm,
                                  packPrice: Number(e.target.value),
                                })
                              }
                              className="w-20 rounded-md border border-indigo-300 px-2 py-1 text-xs tabular-nums focus:outline-none"
                            />
                          ) : (
                            formatSAR(ing.packPrice, 2)
                          )}
                        </td>
                        <td className="py-3 text-slate-600 tabular-nums">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                step="any"
                                value={editIngForm.packQuantity}
                                onChange={(e) =>
                                  setEditIngForm({
                                    ...editIngForm,
                                    packQuantity: Number(e.target.value),
                                  })
                                }
                                className="w-20 rounded-md border border-indigo-300 px-2 py-1 text-xs tabular-nums focus:outline-none"
                              />
                              <span>{ing.unit}</span>
                            </div>
                          ) : (
                            `${ing.packQuantity} ${ing.unit}`
                          )}
                        </td>
                        <td className="py-3 font-bold text-indigo-700 tabular-nums">
                          {unitCost.toFixed(4)} ر.س / {ing.unit}
                        </td>
                        <td className="py-3 text-left">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={handleSaveEditIngredient}
                                className="rounded bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                                title="حفظ السعر"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIngId(null);
                                  setEditIngForm(null);
                                }}
                                className="rounded bg-slate-200 p-1.5 text-slate-700 hover:bg-slate-300"
                                title="إلغاء"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditIngredient(ing)}
                                className="rounded p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                                title="تعديل السعر والكمية"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteIngredient(ing.id)}
                                className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                title="حذف من المخزن"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
