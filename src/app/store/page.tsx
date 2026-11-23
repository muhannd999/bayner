"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Cake,
  CalendarCheck,
  CheckCircle2,
  Copy,
  Check,
  ImagePlus,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Search,
  PackageCheck,
} from "lucide-react";
import { useBayner } from "@/lib/store";
import {
  buildWhatsAppLink,
  buildWhatsAppOrderMessage,
  calculateRecipeFinancials,
  formatSAR,
  getOrderStatusLabel,
} from "@/lib/pricing";
import { DeliveryType, Order, OrderStatus } from "@/lib/types";

interface DateOption {
  iso: string;
  dayName: string;
  dayNum: string;
  isBlocked: boolean;
  isFull: boolean;
  remainingSpots: number;
}

const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function PublicStorefrontPage() {
  const { state, addOrder } = useBayner();

  const [mode, setMode] = useState<"menu" | "custom" | "track">("menu");
  const [trackInput, setTrackInput] = useState("BN-1044");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(
    () => state.recipes.find((r) => r.publishedInMenu)?.id ?? null
  );

  // Custom cake state
  const [sizeId, setSizeId] = useState(
    () => state.customCakeConfig.sizes[1]?.id ?? state.customCakeConfig.sizes[0]?.id ?? ""
  );
  const [flavorId, setFlavorId] = useState(
    () => state.customCakeConfig.flavors[0]?.id ?? ""
  );
  const [fillingId, setFillingId] = useState(
    () => state.customCakeConfig.fillings[0]?.id ?? ""
  );
  const [cakeText, setCakeText] = useState("");
  const [inspirationNote, setInspirationNote] = useState("");
  const [refImagePreview, setRefImagePreview] = useState<string | null>(null);

  // Checkout state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("استلام");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedIban, setCopiedIban] = useState(false);

  const publishedMenu = useMemo(
    () => state.recipes.filter((r) => r.publishedInMenu),
    [state.recipes]
  );

  const dateOptions: DateOption[] = useMemo(() => {
    const list: DateOption[] = [];
    const today = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const count = state.orders.filter(
        (o) => o.deliveryDate === iso && o.status !== "cancelled"
      ).length;
      const isBlocked = state.blockedDates.includes(iso);
      const isFull = count >= state.store.dailyCapacity;
      list.push({
        iso,
        dayName: AR_DAYS[d.getDay()],
        dayNum: `${d.getDate()}/${d.getMonth() + 1}`,
        isBlocked,
        isFull,
        remainingSpots: Math.max(0, state.store.dailyCapacity - count),
      });
    }
    return list;
  }, [state.orders, state.blockedDates, state.store.dailyCapacity]);

  const activeDate =
    selectedDate ||
    dateOptions.find((d) => !d.isBlocked && !d.isFull)?.iso ||
    "";

  const selectedRecipe =
    publishedMenu.find((r) => r.id === selectedRecipeId) ?? publishedMenu[0];

  const selectedRecipeFin = selectedRecipe
    ? calculateRecipeFinancials(selectedRecipe, state.ingredients)
    : null;

  const selectedSize =
    state.customCakeConfig.sizes.find((s) => s.id === sizeId) ??
    state.customCakeConfig.sizes[0];
  const selectedFlavor =
    state.customCakeConfig.flavors.find((f) => f.id === flavorId) ??
    state.customCakeConfig.flavors[0];
  const selectedFilling =
    state.customCakeConfig.fillings.find((f) => f.id === fillingId) ??
    state.customCakeConfig.fillings[0];

  const customTotal =
    (selectedSize?.priceAdd ?? 0) +
    (selectedFlavor?.priceAdd ?? 0) +
    (selectedFilling?.priceAdd ?? 0);

  const finalTotal =
    mode === "menu" ? selectedRecipeFin?.sellingPrice ?? 0 : customTotal;

  const depositRequired = Math.round(
    finalTotal * (state.store.defaultDepositPercent / 100)
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 360;
        const scale = Math.min(1, maxWidth / (img.width || maxWidth));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setRefImagePreview(canvas.toDataURL("image/jpeg", 0.7));
        }
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !activeDate) return;

    const estimatedCost =
      mode === "menu" && selectedRecipeFin
        ? Math.round(selectedRecipeFin.totalDirectCost)
        : Math.round(finalTotal * 0.56);

    const estimatedWaste =
      mode === "menu" && selectedRecipeFin
        ? Math.round(selectedRecipeFin.wasteCost)
        : Math.round(estimatedCost * 0.08);

    const created = addOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryDate: activeDate,
      deliveryType,
      productName:
        mode === "menu"
          ? selectedRecipe?.name ?? "طلب منيو"
          : `كيكة مخصصة — ${selectedSize?.label ?? ""}`,
      isCustomCake: mode === "custom",
      cakeSize: mode === "custom" ? selectedSize?.label : undefined,
      cakeFlavor: mode === "custom" ? selectedFlavor?.label : undefined,
      cakeFilling: mode === "custom" ? selectedFilling?.label : undefined,
      cakeText: mode === "custom" && cakeText ? cakeText : undefined,
      inspirationNote:
        mode === "custom" && inspirationNote ? inspirationNote : undefined,
      referenceImageDataUrl:
        mode === "custom" && refImagePreview ? refImagePreview : undefined,
      totalPrice: finalTotal,
      estimatedCost,
      estimatedWaste,
      depositAmount: depositRequired,
      depositPaid: false,
      status: "awaiting_deposit",
    });

    setConfirmedOrder(created);
  };

  const handleCopyIban = async () => {
    try {
      await navigator.clipboard.writeText(state.store.iban);
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Subtle Demo Bar back to Merchant Dashboard */}
      <div className="bg-slate-900 px-4 py-2 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-xs">
          <span className="text-slate-300">
            معاينة واجهة العميلة المباشرة — مدعوم بنظام باينر
          </span>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-semibold text-white hover:bg-white/20"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>العودة للوحة التاجرة</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-6 space-y-6">
        {/* Store Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                {state.store.name.slice(0, 1)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {state.store.name}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {state.store.city}
                  </span>
                  <span>•</span>
                  <span dir="ltr">{state.store.instagramHandle}</span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              مفتوح لاستقبال الحجوزات
            </span>
          </div>
        </div>

        {confirmedOrder ? (
          /* Order Confirmed Screen */
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 tabular-nums">
                رقم الطلب #{confirmedOrder.orderNumber}
              </span>
              <h2 className="mt-3 text-xl font-bold text-slate-900">
                تم تسجيل طلبك المبدئي بنجاح!
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                تم حجز موعدك ({confirmedOrder.deliveryDate})، ويتبقى فقط إرسال
                تفاصيل الطلب للواتساب وتأكيد العربون.
              </p>
            </div>

            <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4 text-right text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">الصنف:</span>
                <span className="font-bold text-slate-900">
                  {confirmedOrder.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الإجمالي:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatSAR(confirmedOrder.totalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  العربون المطلوب لتثبيت الحجز:
                </span>
                <span className="font-bold text-amber-600 tabular-nums">
                  {formatSAR(confirmedOrder.depositAmount)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <p className="text-[11px] font-semibold text-slate-600">
                  التحويل على {state.store.bankName}:
                </p>
                <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                  <code className="text-[11px] font-bold text-slate-900 tabular-nums">
                    {state.store.iban}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyIban}
                    className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                  >
                    {copiedIban ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        تم
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        نسخ
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <a
                href={buildWhatsAppLink(
                  state.store.whatsappNumber,
                  buildWhatsAppOrderMessage(confirmedOrder, state.store)
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <MessageCircle className="h-5 w-5" />
                <span>إرسال تفاصيل الطلب لواتساب التاجرة الآن</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setConfirmedOrder(null);
                  setCustomerName("");
                  setCustomerPhone("");
                }}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                تقديم طلب آخر
              </button>
            </div>
          </div>
        ) : (
          /* Order Flow */
          <form onSubmit={handleSubmitOrder} className="space-y-6">
            {/* Mode Switcher */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
              <button
                type="button"
                onClick={() => setMode("menu")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition ${
                  mode === "menu"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span>المنيو ({publishedMenu.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition ${
                  mode === "custom"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Cake className="h-4 w-4" />
                <span>كيك مخصص</span>
              </button>

              <button
                type="button"
                onClick={() => setMode("track")}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold transition ${
                  mode === "track"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <PackageCheck className="h-4 w-4" />
                <span>تتبع طلبي</span>
              </button>
            </div>

            {mode === "track" ? (
              /* Order Status Tracker Tab */
              (() => {
                const normalized = trackInput.trim().replace(/^#/, "").toUpperCase();
                const trackedOrder = state.orders.find(
                  (o) =>
                    o.orderNumber.toUpperCase() === normalized ||
                    o.customerPhone.endsWith(normalized)
                );
                const steps: Array<{ key: OrderStatus; label: string }> = [
                  { key: "new", label: "تم الاستلام" },
                  { key: "awaiting_deposit", label: "بانتظار العربون" },
                  { key: "preparing", label: "قيد التحضير" },
                  { key: "ready", label: "جاهز للاستلام" },
                  { key: "completed", label: "مكتمل" },
                ];
                const currentIdx = trackedOrder
                  ? steps.findIndex((s) => s.key === trackedOrder.status)
                  : -1;

                return (
                  <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        تتبع حالة طلبك لحظياً
                      </h2>
                      <p className="text-xs text-slate-500">
                        أدخلي رقم الطلب (مثل BN-1043) أو آخر أرقام الجوال
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          dir="ltr"
                          value={trackInput}
                          onChange={(e) => setTrackInput(e.target.value)}
                          placeholder="BN-1044"
                          className="w-full rounded-xl border border-slate-200 pr-9 pl-3 py-2 text-xs font-bold tabular-nums focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {state.orders.slice(0, 3).map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setTrackInput(o.orderNumber)}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 tabular-nums hover:bg-slate-100"
                          >
                            #{o.orderNumber}
                          </button>
                        ))}
                      </div>
                    </div>

                    {!trackedOrder ? (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                        لم يتم العثور على طلب بهذا الرقم. جرّبي الضغط على أحد
                        الأزرار أعلاه.
                      </div>
                    ) : (
                      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
                              #{trackedOrder.orderNumber}
                            </span>
                            <h3 className="mt-1 text-sm font-bold text-slate-900">
                              {trackedOrder.productName}
                            </h3>
                            <p className="text-xs text-slate-500">
                              العميلة: {trackedOrder.customerName} • التسليم:{" "}
                              {trackedOrder.deliveryDate} (
                              {trackedOrder.deliveryType})
                            </p>
                          </div>

                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
                            {getOrderStatusLabel(trackedOrder.status)}
                          </span>
                        </div>

                        {/* 5-step visual progress tracker */}
                        {trackedOrder.status === "cancelled" ? (
                          <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                            هذا الطلب ملغي حالياً.
                          </div>
                        ) : (
                          <div className="grid grid-cols-5 gap-1.5 pt-2">
                            {steps.map((st, idx) => {
                              const done = idx <= currentIdx;
                              return (
                                <div key={st.key} className="text-center space-y-1.5">
                                  <div
                                    className={`h-2 rounded-full ${
                                      done ? "bg-emerald-600" : "bg-slate-200"
                                    }`}
                                  />
                                  <span
                                    className={`block text-[10px] font-semibold ${
                                      done ? "text-emerald-700" : "text-slate-400"
                                    }`}
                                  >
                                    {st.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs">
                          <span className="text-slate-600 tabular-nums">
                            الإجمالي: <strong>{formatSAR(trackedOrder.totalPrice)}</strong>{" "}
                            • العربون:{" "}
                            <strong
                              className={
                                trackedOrder.depositPaid
                                  ? "text-emerald-700"
                                  : "text-amber-600"
                              }
                            >
                              {trackedOrder.depositPaid ? "مدفوع ✓" : "بانتظار التحويل"}
                            </strong>
                          </span>

                          <a
                            href={buildWhatsAppLink(
                              state.store.whatsappNumber,
                              `مرحباً ${state.store.name}، أستفسر عن طلبي رقم #${trackedOrder.orderNumber}`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>تواصل واتساب</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : mode === "menu" ? (
              /* Ready Menu Selection */
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <h2 className="text-sm font-bold text-slate-900">
                  1. اختاري الصنف المطلوب
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {publishedMenu.map((recipe) => {
                    const fin = calculateRecipeFinancials(
                      recipe,
                      state.ingredients
                    );
                    const isPicked = selectedRecipe?.id === recipe.id;

                    return (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => setSelectedRecipeId(recipe.id)}
                        className={`flex items-start justify-between gap-4 rounded-xl border p-4 text-right transition ${
                          isPicked
                            ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-100"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {recipe.name}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              يكفي {recipe.servings} أشخاص
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {recipe.description}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white tabular-nums">
                          {formatSAR(fin.sellingPrice)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom Cake Builder */
              <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>1. خصصي مواصفات الكيكة</span>
                  </h2>
                  <span className="text-xs font-bold text-indigo-700 tabular-nums">
                    التسعيرة الفورية: {formatSAR(customTotal)}
                  </span>
                </div>

                {/* Size */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    المقاس وعدد الأشخاص
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {state.customCakeConfig.sizes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSizeId(s.id)}
                        className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                          sizeId === s.id
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className="font-bold tabular-nums">
                          {formatSAR(s.priceAdd)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flavor */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    نكهة الكيك
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {state.customCakeConfig.flavors.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFlavorId(f.id)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          flavorId === f.id
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{f.label}</span>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          {f.priceAdd > 0 ? `+${formatSAR(f.priceAdd)}` : "مجاني"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filling */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    الحشوة الداخلية
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {state.customCakeConfig.fillings.map((fil) => (
                      <button
                        key={fil.id}
                        type="button"
                        onClick={() => setFillingId(fil.id)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          fillingId === fil.id
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{fil.label}</span>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          {fil.priceAdd > 0
                            ? `+${formatSAR(fil.priceAdd)}`
                            : "مجاني"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text & Reference Image */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      العبارة المكتوبة على الكيكة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: ألف مبروك التخرج يا سارة"
                      value={cakeText}
                      onChange={(e) => setCakeText(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      ملاحظات الألوان والتصميم
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: تغليف أبيض سادة مع وردي"
                      value={inspirationNote}
                      onChange={(e) => setInspirationNote(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700">
                    صورة إلهام للتصميم (اختياري)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                      <ImagePlus className="h-4 w-4 text-indigo-600" />
                      <span>إرفاق صورة مرجعية</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {refImagePreview && (
                      <img
                        src={refImagePreview}
                        alt="معاينة التصميم"
                        className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 & 3 only shown during ordering modes */}
            {mode !== "track" && (
              <>
            {/* Step 2: Live Calendar Date Picker (Syncs with Merchant Blocked Dates) */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <CalendarCheck className="h-4 w-4 text-emerald-600" />
                  <span>2. اختاري تاريخ الاستلام المتاح</span>
                </h2>
                <span className="text-[11px] text-slate-500">
                  الأيام المقفلة والممتلئة معطلة تلقائياً
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {dateOptions.map((d) => {
                  const disabled = d.isBlocked || d.isFull;
                  const picked = activeDate === d.iso;

                  return (
                    <button
                      key={d.iso}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedDate(d.iso)}
                      className={`rounded-xl border p-2.5 text-center transition ${
                        disabled
                          ? "cursor-not-allowed border-slate-100 bg-slate-100/70 opacity-50"
                          : picked
                          ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="block text-[11px] font-bold text-slate-900">
                        {d.dayName}
                      </span>
                      <span className="block text-xs font-semibold text-slate-600 tabular-nums">
                        {d.dayNum}
                      </span>
                      <span
                        className={`mt-1 block text-[10px] font-semibold ${
                          d.isBlocked
                            ? "text-rose-600"
                            : d.isFull
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }`}
                      >
                        {d.isBlocked
                          ? "مغلق"
                          : d.isFull
                          ? "ممتلئ"
                          : "متاح"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Customer Details & Submit */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900">
                3. بياناتك لتأكيد الحجز
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    الاسم الكريم
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: سلمى العبدالله"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    رقم الجوال (واتساب)
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="05xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(["استلام", "توصيل"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDeliveryType(type)}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                      deliveryType === type
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type === "استلام"
                      ? "استلام من الموقع"
                      : `توصيل داخل ${state.store.city}`}
                  </button>
                ))}
              </div>

              {/* Sticky Summary Footer inside Form */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي الطلب</span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">
                    {formatSAR(finalTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    العربون المطلوب ({state.store.defaultDepositPercent}%)
                  </span>
                  <span className="font-bold text-amber-600 tabular-nums">
                    {formatSAR(depositRequired)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!activeDate}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                تأكيد الطلب وإرساله للواتساب ({formatSAR(finalTotal)})
              </button>
            </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
