"use client";

import React, { useMemo, useState } from "react";
import {
  Download,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
  Flame,
  Receipt,
  Filter,
} from "lucide-react";
import { useBayner } from "@/lib/store";
import { formatSAR, generateFinancialCsv } from "@/lib/pricing";
import { ExpenseCategory } from "@/lib/types";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "مشتريات خامات",
  "تغليف",
  "إعلانات وتسويق",
  "توصيل",
  "هدر وتلف فعلي",
  "تشغيل ومرافق",
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "مشتريات خامات": "bg-indigo-600",
  تغليف: "bg-sky-500",
  "إعلانات وتسويق": "bg-violet-600",
  توصيل: "bg-amber-500",
  "هدر وتلف فعلي": "bg-rose-600",
  "تشغيل ومرافق": "bg-slate-600",
};

export default function FinancePage() {
  const { state, addExpense, deleteExpense } = useBayner();

  const [categoryFilter, setCategoryFilter] = useState<
    "الكل" | ExpenseCategory
  >("الكل");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] =
    useState<ExpenseCategory>("مشتريات خامات");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(100);
  const [note, setNote] = useState("");

  const activeOrders = useMemo(
    () => state.orders.filter((o) => o.status !== "cancelled"),
    [state.orders]
  );

  const totalSales = useMemo(
    () => activeOrders.reduce((s, o) => s + o.totalPrice, 0),
    [activeOrders]
  );

  const ordersRecipeCost = useMemo(
    () =>
      activeOrders.reduce((s, o) => s + o.estimatedCost + o.estimatedWaste, 0),
    [activeOrders]
  );

  const totalExpenses = useMemo(
    () => state.expenses.reduce((s, e) => s + e.amount, 0),
    [state.expenses]
  );

  const actualWasteTotal = useMemo(
    () =>
      state.expenses
        .filter((e) => e.category === "هدر وتلف فعلي")
        .reduce((s, e) => s + e.amount, 0),
    [state.expenses]
  );

  // True Net Cash Profit: Total Sales - Direct Order Recipe Costs & Waste - Extra Operating/Marketing/Actual Spoilage Expenses
  const trueNetCashProfit = totalSales - ordersRecipeCost - totalExpenses;
  const netCashMargin =
    totalSales > 0 ? (trueNetCashProfit / totalSales) * 100 : 0;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    for (const c of EXPENSE_CATEGORIES) map.set(c, 0);
    for (const e of state.expenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      total: map.get(cat) ?? 0,
      percent:
        totalExpenses > 0 ? ((map.get(cat) ?? 0) / totalExpenses) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [state.expenses, totalExpenses]);

  const filteredExpenses = useMemo(() => {
    return state.expenses.filter(
      (e) => categoryFilter === "الكل" || e.category === categoryFilter
    );
  }, [state.expenses, categoryFilter]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;
    addExpense({
      date,
      category,
      description: description.trim(),
      amount: Number(amount),
      note: note.trim() || undefined,
    });
    setDescription("");
    setNote("");
    setAmount(100);
  };

  const handleDownloadCsv = () => {
    const csv = generateFinancialCsv(
      state.orders,
      state.expenses,
      state.store.name
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.store.slug || "bayner"}-financial-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            دفتر المصروفات، الهدر الفعلي، وصافي الربح النقدي
          </h2>
          <p className="text-xs text-slate-500">
            سجّلي فواتير الخامات، الإعلانات، والتلف الفعلي لمعرفة أرباحك الصافية
            بدقة وتصديرها لملف Excel
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
        >
          <Download className="h-4 w-4 text-emerald-400" />
          <span>تصدير التقرير المالي (Excel / CSV)</span>
        </button>
      </div>

      {/* 4 P&L Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              إجمالي مبيعات الطلبات
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
            {formatSAR(totalSales)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            عبر {activeOrders.length} طلبات فعالة
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              تكلفة وصفات الطلبات المقدّرة
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
            {formatSAR(ordersRecipeCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            مقادير وتغليف وهدر محسوب بالوصفات
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              المصروفات المسجلة والهدر الفعلي
            </span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-600 tabular-nums">
            {formatSAR(totalExpenses)}
          </p>
          <p className="mt-1 text-xs text-rose-600 tabular-nums">
            منها {formatSAR(actualWasteTotal)} تلف وهدر فعلي
          </p>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-xs ${
            trueNetCashProfit >= 0
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-rose-200 bg-rose-50/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              صافي الربح النقدي الفعلي
            </span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p
            className={`mt-3 text-2xl font-bold tabular-nums ${
              trueNetCashProfit >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatSAR(trueNetCashProfit)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600 tabular-nums">
            صافي الهامش النقدي: {netCashMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Log Expense Form + Ledger Table (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          <form
            onSubmit={handleAddExpense}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900">
              + تسجيل مصروف أو هدر فعلي جديد
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  التاريخ
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  الفئة
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExpenseCategory)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  الوصف
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة علب تغليف أو تلف كيكة"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-end">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  المبلغ (ر.س)
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  ملاحظة (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="رقم فاتورة أو سبب التلف..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                <span>تسجيل المصروف</span>
              </button>
            </div>
          </form>

          {/* Expense Ledger Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Filter className="h-4 w-4 text-slate-400" />
                <span>سجل المصروفات ({filteredExpenses.length})</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(["الكل", ...EXPENSE_CATEGORIES] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      categoryFilter === cat
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                لا توجد مصروفات مسجلة في هذه الفئة
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="pb-2.5 font-semibold">التاريخ</th>
                      <th className="pb-2.5 font-semibold">الفئة</th>
                      <th className="pb-2.5 font-semibold">الوصف</th>
                      <th className="pb-2.5 font-semibold">المبلغ</th>
                      <th className="pb-2.5 text-left font-semibold">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70">
                        <td className="py-3 text-slate-600 tabular-nums">
                          {exp.date}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                            <span
                              className={`h-2 w-2 rounded-full ${CATEGORY_COLORS[exp.category]}`}
                            />
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-slate-900">
                            {exp.description}
                          </p>
                          {exp.note && (
                            <p className="text-[11px] text-slate-400">
                              {exp.note}
                            </p>
                          )}
                        </td>
                        <td className="py-3 font-bold text-rose-600 tabular-nums">
                          {formatSAR(exp.amount)}
                        </td>
                        <td className="py-3 text-left">
                          <button
                            type="button"
                            onClick={() => deleteExpense(exp.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Category Breakdown Visuals (4 cols) */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                توزيع المصروفات حسب الفئة
              </h3>
              <p className="text-xs text-slate-500">
                اكتشفي أين تذهب ميزانية التشغيل والهدر
              </p>
            </div>

            <div className="space-y-3">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      {item.category}
                    </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatSAR(item.total)} ({item.percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        CATEGORY_COLORS[item.category]
                      }`}
                      style={{ width: `${Math.min(100, item.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
