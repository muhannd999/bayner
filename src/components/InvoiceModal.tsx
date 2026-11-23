"use client";

import React, { useState } from "react";
import { X, Printer, MessageCircle, Copy, Check, Building2 } from "lucide-react";
import { Order } from "@/lib/types";
import { useBayner } from "@/lib/store";
import {
  buildWhatsAppLink,
  buildWhatsAppOrderMessage,
  formatSAR,
  getOrderStatusLabel,
} from "@/lib/pricing";

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const { state } = useBayner();
  const [copiedIban, setCopiedIban] = useState(false);

  if (!order) return null;

  const remaining = Math.max(0, order.totalPrice - order.depositAmount);
  const waHref = buildWhatsAppLink(
    order.customerPhone,
    buildWhatsAppOrderMessage(order, state.store)
  );

  const handleCopyIban = async () => {
    try {
      await navigator.clipboard.writeText(state.store.iban);
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="invoice-print-area w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Action Header (Hidden in Print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <span className="text-xs font-semibold text-slate-600">
            معاينة فاتورة العميلة — جاهزة للحفظ كـ PDF أو الإرسال
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>حفظ / طباعة PDF</span>
            </button>
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>إرسال للواتساب</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-lg">
                  ب
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {state.store.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {state.store.city} • {state.store.instagramHandle}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left">
              <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 tabular-nums">
                فاتورة طلب #{order.orderNumber}
              </span>
              <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
                تاريخ الإنشاء: {order.createdAt}
              </p>
              <p className="text-xs font-semibold text-indigo-700">
                الحالة: {getOrderStatusLabel(order.status)}
              </p>
            </div>
          </div>

          {/* Customer & Delivery Details */}
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                بيانات العميلة
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {order.customerName}
              </p>
              <p className="text-xs text-slate-600 tabular-nums" dir="ltr">
                {order.customerPhone}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">
                موعد وطريقة التسليم
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">
                {order.deliveryDate}
              </p>
              <p className="text-xs text-slate-600">
                {order.deliveryType} —{" "}
                {order.deliveryType === "استلام"
                  ? state.store.pickupAddress
                  : state.store.city}
              </p>
            </div>
          </div>

          {/* Product Details */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">تفاصيل الطلب</th>
                  <th className="px-4 py-3 text-left font-semibold">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-4">
                    <p className="font-bold text-slate-900">
                      {order.productName}
                    </p>
                    {order.isCustomCake && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                        {order.cakeSize && <span>• المقاس: {order.cakeSize}</span>}
                        {order.cakeFlavor && (
                          <span>• النكهة: {order.cakeFlavor}</span>
                        )}
                        {order.cakeFilling && (
                          <span>• الحشوة: {order.cakeFilling}</span>
                        )}
                        {order.cakeText && (
                          <span>• العبارة: &quot;{order.cakeText}&quot;</span>
                        )}
                        {order.inspirationNote && (
                          <span className="col-span-2">
                            • ملاحظة: {order.inspirationNote}
                          </span>
                        )}
                      </div>
                    )}
                    {order.referenceImageDataUrl && (
                      <div className="mt-3">
                        <p className="mb-1 text-[11px] font-semibold text-slate-500">
                          صورة التصميم المرجعية:
                        </p>
                        <img
                          src={order.referenceImageDataUrl}
                          alt="تصميم مرجعي"
                          className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-left font-bold text-slate-900 tabular-nums">
                    {formatSAR(order.totalPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Breakdown */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Building2 className="h-4 w-4 text-indigo-600" />
                <span>بيانات التحويل البنكي</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                البنك: <span className="font-semibold">{state.store.bankName}</span>
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
                <code className="text-[11px] font-semibold text-slate-800 tabular-nums">
                  {state.store.iban}
                </code>
                <button
                  type="button"
                  onClick={handleCopyIban}
                  className="no-print inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
                >
                  {copiedIban ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      تم النسخ
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

            <div className="space-y-2 rounded-xl border border-slate-200 p-4 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>إجمالي الفاتورة</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatSAR(order.totalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">
                  العربون ({order.depositPaid ? "مدفوع ✓" : "مطلوب للتأكيد"})
                </span>
                <span
                  className={`font-bold tabular-nums ${
                    order.depositPaid ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {formatSAR(order.depositAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-900">
                  المتبقي عند الاستلام
                </span>
                <span className="text-base font-bold text-slate-900 tabular-nums">
                  {formatSAR(order.depositPaid ? remaining : order.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          <p className="border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
            شكراً لاختياركم {state.store.name} • تم إصدار الفاتورة عبر نظام باينر
          </p>
        </div>
      </div>
    </div>
  );
}
