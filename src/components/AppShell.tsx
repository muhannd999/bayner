"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  BookOpenCheck,
  CalendarClock,
  MessageSquareText,
  PieChart,
  ExternalLink,
  Settings,
  Menu,
  X,
  RotateCcw,
  Check,
  Sparkles,
  Download,
  Upload,
} from "lucide-react";
import { useBayner } from "@/lib/store";

const NAV_ITEMS = [
  {
    href: "/",
    label: "لوحة التحكم والأرباح",
    subtitle: "نظرة تنفيذية على المبيعات وصافي الربح",
    icon: LayoutDashboard,
  },
  {
    href: "/pantry",
    label: "المخزن وحاسبة التسعير",
    subtitle: "حساب المقادير، الهدر، التشغيل، وهامش الربح",
    icon: Calculator,
  },
  {
    href: "/menu-studio",
    label: "استوديو المنيو",
    subtitle: "إدارة الأصناف وتوليد بوستر المنيو PNG",
    icon: BookOpenCheck,
  },
  {
    href: "/orders",
    label: "الطلبات والتقويم",
    subtitle: "سجل الطلبات، قائمة المشتريات، قفل الأيام، وفواتير PDF",
    icon: CalendarClock,
  },
  {
    href: "/finance",
    label: "التقارير المالية والمصروفات",
    subtitle: "دفتر المصروفات، الهدر الفعلي، وصافي الربح النقدي",
    icon: PieChart,
  },
  {
    href: "/whatsapp",
    label: "مركز الواتساب والرد الآلي",
    subtitle: "محاكي البوت، الجسر الذكي، وربط Meta API",
    icon: MessageSquareText,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    state,
    updateStoreProfile,
    resetDemoData,
    exportStateJson,
    importStateJson,
  } = useBayner();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [importError, setImportError] = useState(false);

  const [storeForm, setStoreForm] = useState(state.store);

  if (pathname?.startsWith("/store")) {
    return <>{children}</>;
  }

  const activeNav =
    NAV_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href)
    ) ?? NAV_ITEMS[0];

  const openSettings = () => {
    setStoreForm(state.store);
    setSettingsOpen(true);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile(storeForm);
    setSettingsOpen(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleExportBackup = () => {
    const json = exportStateJson();
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.store.slug || "bayner"}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(false);
    try {
      const text = await file.text();
      const ok = importStateJson(text);
      if (ok) {
        setSettingsOpen(false);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      } else {
        setImportError(true);
      }
    } catch {
      setImportError(true);
    }
  };

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-lg shadow-sm">
              ب
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-base tracking-tight">
                  باينر
                </span>
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500">مساعد التاجرة الذكي</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Store Badge */}
        <div className="mx-3 mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                {state.store.name}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {state.store.city} • الطاقة اليومية: {state.store.dailyCapacity}{" "}
                طلبات
              </p>
            </div>
            <button
              type="button"
              onClick={openSettings}
              className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              title="إعدادات المتجر"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-2 border-t border-slate-200 p-3">
        <Link
          href="/store"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <ExternalLink className="h-4 w-4" />
          <span>معاينة متجر العميلة</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            resetDemoData();
            setMobileOpen(false);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>استعادة البيانات التجريبية</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Desktop Fixed Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 border-l border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 h-full w-72 max-w-[85vw] border-l border-slate-200 bg-white shadow-xl">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Executive Bar */}
        <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                  {activeNav.label}
                </h1>
                <p className="hidden truncate text-xs text-slate-500 sm:block">
                  {activeNav.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {savedToast && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                  <Check className="h-3.5 w-3.5" />
                  تم الحفظ
                </span>
              )}

              <Link
                href="/whatsapp"
                className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 sm:inline-flex"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {state.whatsappConfig.mode === "cloud_api"
                  ? "Meta Cloud API"
                  : "جسر الواتساب نشط"}
              </Link>

              <button
                type="button"
                onClick={openSettings}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">إعدادات المتجر</span>
              </button>

              <Link
                href="/store"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>رابط العميلة</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Store Settings Modal */}
      {settingsOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  إعدادات المتجر والبيانات البنكية
                </h2>
                <p className="text-xs text-slate-500">
                  تنعكس هذه البيانات مباشرة في الفواتير، المنيو، ورسائل الواتساب
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    اسم المشروع / المتجر
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.name}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    اسم صاحبة المشروع
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.ownerName}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, ownerName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    رقم الواتساب (مع رمز الدولة)
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={storeForm.whatsappNumber}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        whatsappNumber: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    المدينة
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.city}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, city: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    اسم البنك
                  </label>
                  <input
                    type="text"
                    value={storeForm.bankName}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, bankName: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    رقم الآيبان (IBAN)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={storeForm.iban}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, iban: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    الطاقة الاستيعابية اليومية (طلبات)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={storeForm.dailyCapacity}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        dailyCapacity: Number(e.target.value) || 1,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    نسبة العربون الافتراضية (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={storeForm.defaultDepositPercent}
                    onChange={(e) =>
                      setStoreForm({
                        ...storeForm,
                        defaultDepositPercent: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  حساب إنستقرام
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={storeForm.instagramHandle}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      instagramHandle: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  وصف عنوان الاستلام
                </label>
                <input
                  type="text"
                  value={storeForm.pickupAddress}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      pickupAddress: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Backup Export / Import */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <p className="text-xs font-bold text-slate-800">
                  النسخ الاحتياطي لبيانات المتجر (JSON)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-600" />
                    <span>تصدير نسخة احتياطية (JSON)</span>
                  </button>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    <Upload className="h-3.5 w-3.5 text-emerald-600" />
                    <span>استيراد نسخة احتياطية</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
                {importError && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    ملف النسخة الاحتياطية غير صالح.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
