"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Clock,
  ArrowUpLeft,
  Calculator,
  CalendarClock,
  MessageSquareText,
  CheckCircle2,
} from "lucide-react";
import { useBayner } from "@/lib/store";
import {
  calculateRecipeFinancials,
  formatSAR,
  getNextAvailableDates,
  getOrderStatusLabel,
} from "@/lib/pricing";
import { RevenueProfitBars } from "@/components/Charts";

export default function DashboardPage() {
  const { state, toggleDepositPaid } = useBayner();

  const activeOrders = state.orders.filter((o) => o.status !== "cancelled");

  const totalSales = activeOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalCost = activeOrders.reduce((sum, o) => sum + o.estimatedCost, 0);
  const totalWaste = activeOrders.reduce((sum, o) => sum + o.estimatedWaste, 0);
  const totalCostAndWaste = totalCost + totalWaste;
  const totalNetProfit = totalSales - totalCostAndWaste;
  const overallMargin = totalSales > 0 ? (totalNetProfit / totalSales) * 100 : 0;

  const pendingDepositOrders = activeOrders.filter((o) => !o.depositPaid);
  const pendingDepositsSum = pendingDepositOrders.reduce(
    (sum, o) => sum + o.depositAmount,
    0
  );

  const recipeRankings = state.recipes
    .map((recipe) => ({
      recipe,
      fin: calculateRecipeFinancials(recipe, state.ingredients),
    }))
    .sort((a, b) => b.fin.actualProfitMarginPercent - a.fin.actualProfitMarginPercent);

  const chartItems = recipeRankings.slice(0, 5).map(({ recipe, fin }) => ({
    label: recipe.name,
    sales: fin.sellingPrice,
    cost: Math.round(fin.totalDirectCost + fin.platformFeeCost),
    profit: Math.round(fin.netProfit),
  }));

  const upcomingOrders = activeOrders
    .filter((o) => o.status !== "completed")
    .slice()
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
    .slice(0, 5);

  const openDates = getNextAvailableDates(state, 10);

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            مرحباً {state.store.ownerName}
          </span>
          <h2 className="mt-1.5 text-lg font-bold text-slate-900">
            ملخص الأداء المالي والتشغيلي — {state.store.name}
          </h2>
          <p className="text-xs text-slate-500">
            متابعة فورية للمبيعات، تكلفة الهدر والمقادير، هوامش ربح الوصفات، وحالة العربون
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/pantry"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Calculator className="h-4 w-4 text-indigo-600" />
            <span>تسعير وصفة جديدة</span>
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <CalendarClock className="h-4 w-4 text-emerald-400" />
            <span>إدارة الطلبات والتقويم</span>
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              إجمالي المبيعات المسجلة
            </span>
            <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
            {formatSAR(totalSales)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            من إجمالي {activeOrders.length} طلبات فعّالة
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              تكلفة المقادير والهدر
            </span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900 tabular-nums">
            {formatSAR(totalCostAndWaste)}
          </p>
          <p className="mt-1 text-xs text-rose-600 tabular-nums">
            تشمل {formatSAR(totalWaste)} تقدير هدر وفاقد
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">
              صافي الربح الحقيقي
            </span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-700 tabular-nums">
            {formatSAR(totalNetProfit)}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-700 tabular-nums">
            هامش ربح صافي: {overallMargin.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              عربون قيد الانتظار
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-600 tabular-nums">
            {formatSAR(pendingDepositsSum)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {pendingDepositOrders.length} طلبات بانتظار تأكيد التحويل
          </p>
        </div>
      </div>

      {/* Main Analytics + Upcoming Orders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Chart & Recipe Profitability Ranking */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  تحليل المبيعات مقابل التكلفة وصافي الربح للقطعة
                </h3>
                <p className="text-xs text-slate-500">
                  مقارنة مباشرة لربحية كل صنف بعد احتساب الهدر والجهد والتغليف
                </p>
              </div>
              <Link
                href="/pantry"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <span>تعديل التسعير</span>
                <ArrowUpLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
            <RevenueProfitBars items={chartItems} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                ترتيب الوصفات حسب هامش الربح
              </h3>
              <span className="text-xs text-slate-500 tabular-nums">
                {recipeRankings.length} وصفات مسعرة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="pb-2.5 font-semibold">الصنف</th>
                    <th className="pb-2.5 font-semibold">التكلفة والهدر</th>
                    <th className="pb-2.5 font-semibold">سعر البيع</th>
                    <th className="pb-2.5 font-semibold">صافي الربح</th>
                    <th className="pb-2.5 font-semibold">الهامش</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recipeRankings.map(({ recipe, fin }) => (
                    <tr key={recipe.id} className="hover:bg-slate-50/70">
                      <td className="py-3 font-semibold text-slate-900">
                        <div>{recipe.name}</div>
                        <span className="text-[10px] font-normal text-slate-500">
                          {recipe.publishedInMenu ? "منشور بالمنيو" : "مسودة داخلية"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 tabular-nums">
                        {formatSAR(fin.totalDirectCost, 0)}
                      </td>
                      <td className="py-3 font-bold text-slate-900 tabular-nums">
                        {formatSAR(fin.sellingPrice, 0)}
                      </td>
                      <td className="py-3 font-bold text-emerald-700 tabular-nums">
                        {formatSAR(fin.netProfit, 0)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                            fin.isLoss
                              ? "bg-rose-50 text-rose-700"
                              : fin.isLowMargin
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {fin.actualProfitMarginPercent.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Upcoming Orders & WhatsApp Status */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  الطلبات القادمة وتأكيد العربون
                </h3>
                <p className="text-xs text-slate-500">
                  إجراءات سريعة للطلبات النشطة قبل موعد التسليم
                </p>
              </div>
              <Link
                href="/orders"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                عرض الكل
              </Link>
            </div>

            {upcomingOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                لا توجد طلبات نشطة حالياً
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {order.customerName}
                          </span>
                          <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 tabular-nums">
                            #{order.orderNumber}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {order.productName}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        {formatSAR(order.totalPrice)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2.5 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-500 tabular-nums">
                        <span>📅 {order.deliveryDate}</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-700">
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleDepositPaid(order.id)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                          order.depositPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {order.depositPaid
                          ? "العربون مدفوع"
                          : `تأكيد عربون (${formatSAR(order.depositAmount)})`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp & Calendar Status Widget */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <MessageSquareText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    مساعد الواتساب والتقويم
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {state.whatsappRules.filter((r) => r.enabled).length} قواعد
                    رد آلي مفعلة
                  </p>
                </div>
              </div>
              <Link
                href="/whatsapp"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                فتح المركز
              </Link>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">أقرب الأيام المتاحة للطلب:</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {openDates[0] ?? "لا يوجد"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">الأيام المقفلة يدوياً:</span>
                <span className="font-semibold text-rose-600 tabular-nums">
                  {state.blockedDates.length} أيام
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">الأصناف المنشورة بالمنيو:</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {state.recipes.filter((r) => r.publishedInMenu).length} أصناف
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
