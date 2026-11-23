"use client";

import React, { useMemo, useState } from "react";
import {
  FileText,
  MessageCircle,
  Calendar as CalendarIcon,
  ListChecks,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  ShoppingBasket,
} from "lucide-react";
import { useBayner } from "@/lib/store";
import {
  buildWhatsAppLink,
  calculateShoppingPrepList,
  formatSAR,
  getOrderStatusLabel,
} from "@/lib/pricing";
import { DeliveryType, Order, OrderStatus } from "@/lib/types";
import { InvoiceModal } from "@/components/InvoiceModal";

const STATUS_TABS: Array<{ key: "all" | OrderStatus; label: string }> = [
  { key: "all", label: "الكل" },
  { key: "new", label: "جديد" },
  { key: "awaiting_deposit", label: "بانتظار العربون" },
  { key: "preparing", label: "قيد التحضير" },
  { key: "ready", label: "جاهز للاستلام" },
  { key: "completed", label: "مكتمل" },
  { key: "cancelled", label: "ملغي" },
];

const ARABIC_WEEKDAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function toISODate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export default function OrdersAndCalendarPage() {
  const {
    state,
    addOrder,
    updateOrderStatus,
    toggleDepositPaid,
    toggleBlockedDate,
  } = useBayner();

  const [viewTab, setViewTab] = useState<"orders" | "calendar" | "prep">(
    "orders"
  );
  const [checkedPrepIds, setCheckedPrepIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(
    null
  );
  const [newOrderOpen, setNewOrderOpen] = useState(false);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDayISO, setSelectedDayISO] = useState(
    now.toISOString().split("T")[0]
  );

  // New Manual Order Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("05");
  const [productName, setProductName] = useState(
    state.recipes[0]?.name ?? "كيكة مناسبات مخصصة"
  );
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("استلام");
  const [totalPrice, setTotalPrice] = useState<number>(240);
  const [estimatedCost, setEstimatedCost] = useState<number>(135);
  const [depositPaidNow, setDepositPaidNow] = useState(false);

  const filteredOrders = useMemo(() => {
    return state.orders.filter((order) => {
      const matchStatus =
        statusFilter === "all" || order.status === statusFilter;
      const q = searchTerm.trim().toLowerCase();
      const matchQuery =
        !q ||
        order.customerName.toLowerCase().includes(q) ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.productName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q);
      return matchStatus && matchQuery;
    });
  }, [state.orders, statusFilter, searchTerm]);

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || totalPrice <= 0) return;
    const depositAmount = Math.round(
      totalPrice * (state.store.defaultDepositPercent / 100)
    );
    addOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryDate,
      deliveryType,
      productName,
      isCustomCake: false,
      totalPrice,
      estimatedCost,
      estimatedWaste: Math.round(estimatedCost * 0.08),
      depositAmount,
      depositPaid: depositPaidNow,
      status: depositPaidNow ? "preparing" : "awaiting_deposit",
    });
    setCustomerName("");
    setNewOrderOpen(false);
  };

  // Build month grid
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const ordersCountByDate = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of state.orders) {
      if (o.status === "cancelled") continue;
      const arr = map.get(o.deliveryDate) ?? [];
      arr.push(o);
      map.set(o.deliveryDate, arr);
    }
    return map;
  }, [state.orders]);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const selectedDayOrders = ordersCountByDate.get(selectedDayISO) ?? [];
  const isSelectedDayBlocked = state.blockedDates.includes(selectedDayISO);

  const prepResult = useMemo(
    () =>
      calculateShoppingPrepList(
        state.orders,
        state.recipes,
        state.ingredients
      ),
    [state.orders, state.recipes, state.ingredients]
  );

  const togglePrepCheck = (ingId: string) => {
    setCheckedPrepIds((prev) =>
      prev.includes(ingId) ? prev.filter((id) => id !== ingId) : [...prev, ingId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Switch Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewTab("orders")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewTab === "orders"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ListChecks className="h-4 w-4" />
            <span>سجل الطلبات والفواتير ({state.orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab("calendar")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewTab === "calendar"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>تقويم الأيام وقفل الحجوزات</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab("prep")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              viewTab === "prep"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShoppingBasket className="h-4 w-4" />
            <span>قائمة المشتريات والتجهيز ({prepResult.items.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setNewOrderOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة طلب يدوي</span>
        </button>
      </div>

      {viewTab === "orders" && (
        <div className="space-y-4">
          {/* Status Pills & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_TABS.map((tab) => {
                const count =
                  tab.key === "all"
                    ? state.orders.length
                    : state.orders.filter((o) => o.status === tab.key).length;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusFilter(tab.key)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition tabular-nums ${
                      statusFilter === tab.key
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {tab.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم، الرقم، الصنف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pr-9 pl-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              لا توجد طلبات مطابقة لهذا التصفية حالياً
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredOrders.map((order) => {
                const statusWaMsg =
                  order.status === "ready"
                    ? `مرحباً ${order.customerName} 🎂\nطلبك #${order.orderNumber} (${order.productName}) أصبح جاهزاً للاستلام من ${state.store.name}!\n${state.store.pickupAddress}`
                    : `مرحباً ${order.customerName} 🤍\nتحديث طلبك #${order.orderNumber} (${order.productName}):\nالحالة الحالية: ${getOrderStatusLabel(order.status)}\nموعد التسليم: ${order.deliveryDate}`;

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
                            #{order.orderNumber}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {order.customerName}
                          </h4>
                          <span
                            className="text-xs text-slate-500 tabular-nums"
                            dir="ltr"
                          >
                            {order.customerPhone}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                            {order.deliveryType} • {order.deliveryDate}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-indigo-700">
                          {order.productName}
                        </p>

                        {order.isCustomCake && (
                          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                            {order.cakeSize && (
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                                المقاس: {order.cakeSize}
                              </span>
                            )}
                            {order.cakeFlavor && (
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                                النكهة: {order.cakeFlavor}
                              </span>
                            )}
                            {order.cakeFilling && (
                              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
                                الحشوة: {order.cakeFilling}
                              </span>
                            )}
                            {order.cakeText && (
                              <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800">
                                العبارة: &quot;{order.cakeText}&quot;
                              </span>
                            )}
                          </div>
                        )}
                        {order.referenceImageDataUrl && (
                          <div className="pt-1.5 flex items-center gap-2">
                            <img
                              src={order.referenceImageDataUrl}
                              alt="صورة التصميم المرجعية"
                              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                            />
                            <span className="text-[11px] text-slate-500">
                              مرفق صورة إلهام من العميلة
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Financial & Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left">
                          <span className="block text-[10px] text-slate-500">
                            الإجمالي (الربح المتوقع{" "}
                            {formatSAR(
                              order.totalPrice -
                                order.estimatedCost -
                                order.estimatedWaste
                            )}
                            )
                          </span>
                          <span className="text-base font-bold text-slate-900 tabular-nums">
                            {formatSAR(order.totalPrice)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleDepositPaid(order.id)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition tabular-nums ${
                            order.depositPaid
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            {order.depositPaid
                              ? `عربون مدفوع (${formatSAR(order.depositAmount)})`
                              : `بانتظار عربون (${formatSAR(order.depositAmount)})`}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500">
                          حالة الطلب:
                        </span>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(
                              order.id,
                              e.target.value as OrderStatus
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="new">طلب جديد</option>
                          <option value="awaiting_deposit">بانتظار العربون</option>
                          <option value="preparing">قيد التحضير</option>
                          <option value="ready">جاهز للاستلام</option>
                          <option value="completed">مكتمل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <FileText className="h-3.5 w-3.5 text-indigo-600" />
                          <span>فاتورة PDF</span>
                        </button>

                        <a
                          href={buildWhatsAppLink(order.customerPhone, statusWaMsg)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>إشعار واتساب</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewTab === "calendar" && (
        /* Tab 2: Calendar & Capacity Lock */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {ARABIC_MONTHS[calMonth]} {calYear}
                </h3>
                <p className="text-xs text-slate-500">
                  اضغطي على أي يوم لمراجعة طلباته أو قفل الحجز فيه فوراً
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-500 pb-2">
              {ARABIC_WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 rounded-xl bg-slate-50/40" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const iso = toISODate(calYear, calMonth, dayNum);
                const dayOrders = ordersCountByDate.get(iso) ?? [];
                const isBlocked = state.blockedDates.includes(iso);
                const isFull = dayOrders.length >= state.store.dailyCapacity;
                const isSelected = selectedDayISO === iso;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedDayISO(iso)}
                    className={`flex h-20 flex-col justify-between rounded-xl border p-2 text-right transition ${
                      isSelected
                        ? "border-indigo-600 ring-2 ring-indigo-100"
                        : "border-slate-200 hover:border-slate-300"
                    } ${
                      isBlocked
                        ? "bg-rose-50/70"
                        : isFull
                        ? "bg-amber-50/70"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        {dayNum}
                      </span>
                      {isBlocked && <Lock className="h-3 w-3 text-rose-600" />}
                    </div>

                    <div className="w-full">
                      {isBlocked ? (
                        <span className="block rounded bg-rose-100 px-1 py-0.5 text-center text-[10px] font-bold text-rose-700">
                          مغلق
                        </span>
                      ) : (
                        <span
                          className={`block rounded px-1 py-0.5 text-center text-[10px] font-semibold tabular-nums ${
                            dayOrders.length > 0
                              ? isFull
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-50 text-emerald-700"
                              : "text-slate-400"
                          }`}
                        >
                          {dayOrders.length} / {state.store.dailyCapacity}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Day Control Panel */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-4">
            <div className="border-b border-slate-100 pb-3">
              <p className="text-xs font-semibold text-slate-500">
                تفاصيل يوم
              </p>
              <h4 className="mt-0.5 text-lg font-bold text-slate-900 tabular-nums">
                {selectedDayISO}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => toggleBlockedDate(selectedDayISO)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                isSelectedDayBlocked
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-rose-600 text-white hover:bg-rose-700"
              }`}
            >
              {isSelectedDayBlocked ? (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>إعادة فتح هذا اليوم للطلبات</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>قفل هذا اليوم (ممتلئ / إجازة)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500">
              أي يوم يتم قفله هنا يختفي تلقائياً من التقويم المتاح للعميلة في رابط
              المتجر وفي ردود الواتساب.
            </p>

            <div className="space-y-2 pt-2">
              <h5 className="text-xs font-bold text-slate-800">
                الطلبات المحجوزة ({selectedDayOrders.length})
              </h5>
              {selectedDayOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  لا توجد طلبات مسجلة في هذا اليوم
                </div>
              ) : (
                selectedDayOrders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{o.customerName}</span>
                      <span className="tabular-nums">
                        {formatSAR(o.totalPrice)}
                      </span>
                    </div>
                    <p className="text-slate-600">{o.productName}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoiceOrder(o)}
                      className="text-[11px] font-semibold text-indigo-600 hover:underline"
                    >
                      عرض الفاتورة
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewTab === "prep" && (
        /* Tab 3: Smart Shopping & Prep List */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  قائمة المشتريات المجمعة للطلبات النشطة القادمة
                </h3>
                <p className="text-xs text-slate-500">
                  تحسب تلقائياً إجمالي الجرامات والعلب المطلوبة لكل طلبات
                  (جديد / بانتظار العربون / قيد التحضير)
                </p>
              </div>
              <span className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white tabular-nums">
                التكلفة التقديرية: {formatSAR(prepResult.totalEstimatedCost)}
              </span>
            </div>

            {prepResult.items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                لا توجد خامات مطلوبة لوصفات جاهزة في الطلبات القادمة حالياً.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {prepResult.items.map((item) => {
                  const isChecked = checkedPrepIds.includes(item.ingredient.id);
                  return (
                    <label
                      key={item.ingredient.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 py-3 transition ${
                        isChecked ? "opacity-50 line-through" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePrepCheck(item.ingredient.id)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {item.ingredient.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.ingredient.category} • لعدد{" "}
                            {item.matchedOrdersCount} طلبات
                          </p>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="block text-sm font-bold text-indigo-700 tabular-nums">
                          {item.totalQuantity} {item.ingredient.unit}
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          ~ {formatSAR(item.estimatedCost, 1)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                الطلبات المشمولة بالحساب ({prepResult.matchedOrders.length})
              </h4>
              {prepResult.matchedOrders.length === 0 ? (
                <p className="text-xs text-slate-400">لا يوجد</p>
              ) : (
                <div className="space-y-2">
                  {prepResult.matchedOrders.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"
                    >
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>#{o.orderNumber}</span>
                        <span className="tabular-nums">{o.deliveryDate}</span>
                      </div>
                      <p className="mt-0.5 text-slate-600">{o.productName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {prepResult.unmatchedCustomOrders.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs space-y-2">
                <h4 className="text-xs font-bold text-amber-900">
                  طلبات كيك مخصص تحتاج تجهيز يدوي (
                  {prepResult.unmatchedCustomOrders.length})
                </h4>
                {prepResult.unmatchedCustomOrders.map((o) => (
                  <p key={o.id} className="text-[11px] text-amber-800">
                    • #{o.orderNumber}: {o.productName} ({o.deliveryDate})
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* New Manual Order Modal */}
      {newOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-900">
                إضافة طلب جديد يدوياً
              </h3>
              <button
                type="button"
                onClick={() => setNewOrderOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    اسم العميلة
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    رقم الجوال
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  الصنف المطلوب
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    تاريخ التسليم
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    الاستلام / التوصيل
                  </label>
                  <select
                    value={deliveryType}
                    onChange={(e) =>
                      setDeliveryType(e.target.value as DeliveryType)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="استلام">استلام</option>
                    <option value="توصيل">توصيل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    سعر البيع الإجمالي (ر.س)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={totalPrice}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    التكلفة التقديرية (ر.س)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={depositPaidNow}
                  onChange={(e) => setDepositPaidNow(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>تم استلام العربون مسبقاً</span>
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setNewOrderOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  حفظ الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
