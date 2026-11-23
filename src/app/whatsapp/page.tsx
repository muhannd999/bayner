"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  MessageCircle,
  KeyRound,
  ShieldCheck,
  Radio,
  Sparkles,
  RotateCcw,
  Activity,
  ShoppingBag,
} from "lucide-react";
import { useBayner } from "@/lib/store";
import {
  buildWhatsAppLink,
  formatSAR,
  renderTemplateVariables,
  simulateWhatsAppReply,
} from "@/lib/pricing";

interface ChatMsg {
  id: string;
  sender: "customer" | "bot";
  text: string;
  matchedRule?: string;
}

const QUICK_PROMPTS = [
  "السلام عليكم، وش المنيو عندكم؟",
  "بكم أسعار الكيك المخصص؟",
  "وش الأيام المتاحة للحجز؟",
  "كم العربون وكيف التحويل؟",
  "وين موقعكم للاستلام؟",
];

const TEMPLATE_VARS = [
  { tag: "{store_name}", label: "اسم المتجر" },
  { tag: "{menu_list}", label: "قائمة المنيو والأسعار" },
  { tag: "{open_dates}", label: "الأيام المتاحة" },
  { tag: "{deposit_percent}", label: "نسبة العربون" },
  { tag: "{iban}", label: "رقم الآيبان" },
  { tag: "{store_link}", label: "رابط المتجر" },
];

export default function WhatsAppHubPage() {
  const {
    state,
    updateWhatsAppRule,
    addWhatsAppRule,
    deleteWhatsAppRule,
    updateWhatsAppConfig,
    addWebhookLog,
    clearWebhookLogs,
  } = useBayner();

  const [tab, setTab] = useState<"simulator" | "bridge" | "cloud_api">(
    "simulator"
  );

  // Chat simulator state
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "init-bot",
      sender: "bot",
      text: "مرحباً! جرّبي كتابة أي رسالة كما لو كنتِ عميلة على واتساب، وسيقوم محاكي باينر بالرد عليك فوراً من بيانات متجرك الحية (المنيو، الأسعار، والأيام المتاحة).",
      matchedRule: "المساعد التفاعلي",
    },
  ]);

  // Add new rule form
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleKeywords, setNewRuleKeywords] = useState("");
  const [newRuleTemplate, setNewRuleTemplate] = useState("");

  // Quick reply builder state
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    () => state.orders[0]?.id ?? ""
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cloud API test state
  const [webhookResult, setWebhookResult] = useState<string | null>(null);
  const [webhookOk, setWebhookOk] = useState<boolean | null>(null);
  const [testToPhone, setTestToPhone] = useState(state.store.whatsappNumber);
  const [testMessageBody, setTestMessageBody] = useState(
    "رسالة تجريبية من نظام باينر للتحقق من جاهزية Meta WhatsApp Cloud API."
  );
  const [sendApiResult, setSendApiResult] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [simWebhookText, setSimWebhookText] = useState(
    "السلام عليكم، وش المنيو عندكم؟"
  );
  const [webhookPostResult, setWebhookPostResult] = useState<string | null>(
    null
  );

  const storeUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/store`
      : "https://bayner.sa/store";

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/whatsapp/webhook`
      : "/api/whatsapp/webhook";

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSendSim = (textToSend?: string) => {
    const text = (textToSend ?? chatInput).trim();
    if (!text) return;

    const customerMsg: ChatMsg = {
      id: `c-${Date.now()}`,
      sender: "customer",
      text,
    };
    const { matchedRuleName, reply } = simulateWhatsAppReply(
      text,
      state,
      storeUrl
    );
    const botMsg: ChatMsg = {
      id: `b-${Date.now() + 1}`,
      sender: "bot",
      text: reply,
      matchedRule: matchedRuleName,
    };

    setMessages((prev) => [...prev, customerMsg, botMsg]);
    if (!textToSend) setChatInput("");
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleTemplate.trim()) return;
    addWhatsAppRule({
      name: newRuleName.trim(),
      keywords: newRuleKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      responseTemplate: newRuleTemplate.trim(),
      enabled: true,
      attachMenuLink: true,
    });
    setNewRuleName("");
    setNewRuleKeywords("");
    setNewRuleTemplate("");
  };

  const selectedOrder =
    state.orders.find((o) => o.id === selectedOrderId) ?? state.orders[0];

  const quickTemplates = useMemo(() => {
    if (!selectedOrder) return [];
    const remaining = Math.max(
      0,
      selectedOrder.totalPrice - selectedOrder.depositAmount
    );

    return [
      {
        id: "qt-confirm",
        title: "تأكيد الطلب وبيانات العربون",
        body: `أهلاً ${selectedOrder.customerName} 🎂\nتم استلام طلبك رقم #${selectedOrder.orderNumber} (${selectedOrder.productName}) لموعد ${selectedOrder.deliveryDate}.\n\nلتثبيت الحجز يرجى تحويل العربون: ${formatSAR(selectedOrder.depositAmount)}\nالمتبقي عند التسليم: ${formatSAR(remaining)}\n\n${state.store.bankName}\nIBAN: ${state.store.iban}`,
      },
      {
        id: "qt-reminder",
        title: "تذكير لطيف بالعربون",
        body: `مرحباً ${selectedOrder.customerName} 🤍\nتذكير لطيف بخصوص طلبك #${selectedOrder.orderNumber} بتاريخ ${selectedOrder.deliveryDate}.\nبانتظار إرسال إيصال تحويل العربون (${formatSAR(selectedOrder.depositAmount)}) لاعتماد الموعد في الجدول قبل اكتمال الحجوزات.`,
      },
      {
        id: "qt-ready",
        title: "الكيكة جاهزة للاستلام",
        body: `مساء الخير ${selectedOrder.customerName} ✨\nطلبك #${selectedOrder.orderNumber} (${selectedOrder.productName}) أصبح جاهزاً بحمد الله!\n${state.store.pickupAddress}\nبانتظار تشريفك 🎂`,
      },
      {
        id: "qt-review",
        title: "رسالة شكر وطلب تقييم",
        body: `أهلاً ${selectedOrder.customerName} 🌷\nسعدنا جداً بخدمتك في ${state.store.name}!\nنتمنى أن تكون الكيكة نالت إعجابكم وجمّلت مناسبتكم، ويسعدنا رأيك وصوركم على حسابنا ${state.store.instagramHandle}.`,
      },
    ];
  }, [selectedOrder, state.store]);

  const handleTestWebhook = async () => {
    setTestingApi(true);
    setWebhookResult(null);
    try {
      const challenge = "BAYNER_CHECK_2026";
      const token = encodeURIComponent(
        state.whatsappConfig.verifyToken || "bayner_verify_2026"
      );
      const res = await fetch(
        `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${token}&hub.challenge=${challenge}`
      );
      const body = await res.text();
      if (res.ok && body === challenge) {
        setWebhookOk(true);
        setWebhookResult(
          `نجح التحقق (HTTP ${res.status}): تم استرجاع Challenge بنجاح (${body})`
        );
        updateWhatsAppConfig({
          lastTestStatus: "success",
          lastTestedAt: new Date().toLocaleTimeString("en-US"),
        });
      } else {
        setWebhookOk(false);
        setWebhookResult(
          `فشل التحقق (HTTP ${res.status}): تأكدي من مطابقة Verify Token مع إعدادات السيرفر.`
        );
        updateWhatsAppConfig({ lastTestStatus: "error" });
      }
    } catch {
      setWebhookOk(false);
      setWebhookResult("تعذر الاتصال بنقطة النهاية المحلية.");
    } finally {
      setTestingApi(false);
    }
  };

  const handleTestSendApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingApi(true);
    setSendApiResult(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testToPhone,
          message: testMessageBody,
          phoneNumberId: state.whatsappConfig.phoneNumberId || undefined,
          accessToken: state.whatsappConfig.accessToken || undefined,
        }),
      });
      const json = await res.json();
      setSendApiResult(JSON.stringify(json, null, 2));
      addWebhookLog({
        timestamp: new Date().toLocaleTimeString("en-US"),
        direction: "outgoing",
        from: testToPhone,
        body: testMessageBody,
        matchedIntent: json.mode ?? "outbound_api",
        status: res.ok ? "sent_or_dry_run" : "error",
      });
    } catch {
      setSendApiResult("حدث خطأ أثناء اختبار واجهة الإرسال.");
    } finally {
      setTestingApi(false);
    }
  };

  const handleSimulateIncomingWebhook = async () => {
    setTestingApi(true);
    setWebhookPostResult(null);
    try {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "966550001122",
                      text: { body: simWebhookText },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
      const res = await fetch("/api/whatsapp/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setWebhookPostResult(JSON.stringify(json, null, 2));
      addWebhookLog({
        timestamp: new Date().toLocaleTimeString("en-US"),
        direction: "incoming",
        from: "966550001122",
        body: simWebhookText,
        matchedIntent: json.matchedIntent ?? "unknown",
        status: json.status ?? "received",
      });
    } catch {
      setWebhookPostResult("تعذر إرسال محاكاة Webhook.");
    } finally {
      setTestingApi(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "bot",
        text: "تم مسح المحادثة. اكتبي أي رسالة عميلة لتجربة الرد التلقائي من بيانات متجرك الحية.",
        matchedRule: "المساعد التفاعلي",
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("simulator")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === "simulator"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>قواعد الرد الآلي ومحاكي البوت</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("bridge")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === "bridge"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span>جسر الواتساب المجاني (0 ر.س)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("cloud_api")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === "cloud_api"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>الربط الرسمي (Meta Cloud API)</span>
          </button>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          <Radio className="h-3.5 w-3.5" />
          الوضع النشط:{" "}
          {state.whatsappConfig.mode === "cloud_api"
            ? "Meta WhatsApp Cloud API"
            : "جسر الواتساب الذكي"}
        </span>
      </div>

      {/* TAB 1: Auto-Reply Rules + Live Simulator */}
      {tab === "simulator" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Editable Rules (6 cols) */}
          <div className="space-y-4 lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  قواعد الرد التلقائي الذكية
                </h3>
                <p className="text-xs text-slate-500">
                  يقرأ البوت كلمات العميلة ويرد بالمنيو، الأسعار، والأيام المتاحة
                  تلقائياً بدون تدخل منك
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 p-2.5 text-[11px]">
                <span className="font-semibold text-slate-500 ml-1">
                  متغيرات حية (اضغطي للنسخ):
                </span>
                {TEMPLATE_VARS.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    onClick={() => handleCopy(`var-${v.tag}`, v.tag)}
                    className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50"
                    title={`نسخ ${v.label}`}
                  >
                    {copiedId === `var-${v.tag}` ? "تم النسخ ✓" : v.tag}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {state.whatsappRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`rounded-xl border p-4 space-y-3 transition ${
                      rule.enabled
                        ? "border-slate-200 bg-white"
                        : "border-slate-200 bg-slate-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) =>
                          updateWhatsAppRule({ ...rule, name: e.target.value })
                        }
                        className="flex-1 rounded-md border border-transparent px-1 py-0.5 text-sm font-bold text-slate-900 hover:border-slate-200 focus:border-indigo-400 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(e) =>
                              updateWhatsAppRule({
                                ...rule,
                                enabled: e.target.checked,
                              })
                            }
                            className="rounded border-slate-300 text-emerald-600"
                          />
                          <span>مفعل</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteWhatsAppRule(rule.id)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                        الكلمات المفتاحية (افصلي بفاصلة ,)
                      </label>
                      <input
                        type="text"
                        value={rule.keywords.join("، ")}
                        onChange={(e) =>
                          updateWhatsAppRule({
                            ...rule,
                            keywords: e.target.value
                              .split(/[,،]/)
                              .map((k) => k.trim())
                              .filter(Boolean),
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-slate-500">
                        نص الرد التلقائي
                      </label>
                      <textarea
                        rows={3}
                        value={rule.responseTemplate}
                        onChange={(e) =>
                          updateWhatsAppRule({
                            ...rule,
                            responseTemplate: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Rule Form */}
              <form
                onSubmit={handleAddRule}
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4 space-y-3"
              >
                <p className="text-xs font-bold text-slate-800">
                  + إضافة قاعدة رد جديدة
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="اسم القاعدة (مثال: توصيل المدارس)"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    required
                    placeholder="كلمات مفتاحية (توصيل, مندوب)"
                    value={newRuleKeywords}
                    onChange={(e) => setNewRuleKeywords(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder="اكتبي الرد هنا... (يمكنك استخدام {store_link})"
                  value={newRuleTemplate}
                  onChange={(e) => setNewRuleTemplate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>حفظ القاعدة</span>
                </button>
              </form>
            </div>
          </div>

          {/* Live WhatsApp Chat Simulator (6 cols) */}
          <div className="lg:col-span-6">
            <div className="sticky top-20 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              {/* WhatsApp Header */}
              <div className="flex items-center justify-between bg-emerald-700 px-4 py-3 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 font-bold">
                    {state.store.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{state.store.name}</p>
                    <p className="text-[11px] text-emerald-100">
                      محاكي الرد الآلي المباشر (مرتبط ببياناتك الحية)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/orders"
                    className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/25"
                    title="تسجيل طلب جديد من المحادثة"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>إنشاء طلب</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleResetChat}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/25"
                    title="مسح المحادثة"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>مسح</span>
                  </button>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-slate-50 p-3">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendSim(q)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Thread */}
              <div className="h-[420px] space-y-3 overflow-y-auto bg-[#EFEAE2] p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "customer"
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                        msg.sender === "customer"
                          ? "rounded-tr-xs bg-white text-slate-800"
                          : "rounded-tl-xs bg-[#D9FDD3] text-slate-900"
                      }`}
                    >
                      {msg.matchedRule && (
                        <span className="mb-1 inline-block rounded bg-emerald-700/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          {msg.matchedRule}
                        </span>
                      )}
                      <p className="whitespace-pre-line leading-relaxed">
                        {msg.text}
                      </p>
                      {msg.sender === "bot" && (
                        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-emerald-900/10 pt-2">
                          <Link
                            href="/store"
                            className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-2xs hover:bg-emerald-50"
                          >
                            عرض المنيو
                          </Link>
                          <Link
                            href="/store"
                            className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-800"
                          >
                            حجز الآن
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendSim();
                }}
                className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
              >
                <input
                  type="text"
                  placeholder="اكتبي رسالة عميلة لتجربة البوت (مثال: كم السعر؟)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>إرسال</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Free Smart Bridge (0 SAR) */}
      {tab === "bridge" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
            <div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                تكلفة التشغيل: 0 ريال
              </span>
              <h3 className="mt-2 text-sm font-bold text-slate-900">
                رسالة الترحيب التلقائية في WhatsApp Business
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                انسخي هذا النص وضعيه في ميزة &quot;رسالة الترحيب (Greeting
                Message)&quot; داخل تطبيق واتساب للأعمال المجاني، ليتم الرد على كل
                عميلة جديدة برابط المتجر تلقائياً.
              </p>
            </div>

            <textarea
              rows={4}
              value={state.whatsappConfig.welcomeMessage}
              onChange={(e) =>
                updateWhatsAppConfig({ welcomeMessage: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed focus:border-indigo-500 focus:outline-none"
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="mb-1.5 text-[11px] font-bold text-slate-500">
                معاينة النص الجاهز للنسخ:
              </p>
              <p className="whitespace-pre-line text-slate-800 leading-relaxed">
                {renderTemplateVariables(
                  state.whatsappConfig.welcomeMessage,
                  state,
                  storeUrl
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopy(
                  "welcome",
                  renderTemplateVariables(
                    state.whatsappConfig.welcomeMessage,
                    state,
                    storeUrl
                  )
                )
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              {copiedId === "welcome" ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>تم نسخ رسالة الترحيب</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>نسخ رسالة الترحيب الجاهزة</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  الردود السريعة للطلبات بضغطة زر
                </h3>
                <p className="text-xs text-slate-500">
                  اختاري الطلب وسيتم تعبئة الاسم والمبلغ والآيبان تلقائياً
                </p>
              </div>

              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                {state.orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    #{o.orderNumber} — {o.customerName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {tpl.title}
                    </h4>
                    <p className="mt-2 whitespace-pre-line text-[11px] leading-relaxed text-slate-600">
                      {tpl.body}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(tpl.id, tpl.body)}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      {copiedId === tpl.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>

                    {selectedOrder && (
                      <a
                        href={buildWhatsAppLink(
                          selectedOrder.customerPhone,
                          tpl.body
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>إرسال واتساب</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Meta WhatsApp Cloud API Settings */}
      {tab === "cloud_api" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  إعدادات الربط الرسمي مع Meta WhatsApp Cloud API
                </h3>
                <p className="text-xs text-slate-500">
                  نقاط النهاية البرمجية (Webhook & Send API) مبنية ومجهزة داخل
                  باينر للعمل مباشرة فور إدخال بيانات حساب Meta
                </p>
              </div>
              <select
                value={state.whatsappConfig.mode}
                onChange={(e) =>
                  updateWhatsAppConfig({
                    mode: e.target.value as "smart_bridge" | "cloud_api",
                  })
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800"
              >
                <option value="smart_bridge">وضع الجسر الذكي المجاني</option>
                <option value="cloud_api">وضع Meta Cloud API الرسمي</option>
              </select>
            </div>

            {/* Webhook Endpoint Copy */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
              <p className="text-xs font-bold text-indigo-900">
                رابط Webhook المخصص لمتجرك (يوضع في لوحة Meta Developers)
              </p>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2">
                <code className="truncate text-xs font-semibold text-slate-800" dir="ltr">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy("webhook", webhookUrl)}
                  className="shrink-0 rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700"
                >
                  {copiedId === "webhook" ? "تم النسخ ✓" : "نسخ الرابط"}
                </button>
              </div>
            </div>

            {/* Meta Credentials Form */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Phone Number ID
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="مثال: 412890345612890"
                  value={state.whatsappConfig.phoneNumberId}
                  onChange={(e) =>
                    updateWhatsAppConfig({ phoneNumberId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  WhatsApp Business Account ID (WABA)
                </label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="مثال: 109283746501928"
                  value={state.whatsappConfig.wabaId}
                  onChange={(e) =>
                    updateWhatsAppConfig({ wabaId: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Permanent Access Token
                </label>
                <input
                  type="password"
                  dir="ltr"
                  placeholder="EAAG..."
                  value={state.whatsappConfig.accessToken}
                  onChange={(e) =>
                    updateWhatsAppConfig({ accessToken: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Webhook Verify Token
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={state.whatsappConfig.verifyToken}
                  onChange={(e) =>
                    updateWhatsAppConfig({ verifyToken: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={testingApi}
                onClick={handleTestWebhook}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>اختبار جاهزية الـ Webhook الآن</span>
              </button>

              {state.whatsappConfig.lastTestedAt && (
                <span className="text-[11px] text-slate-500 tabular-nums">
                  آخر فحص: {state.whatsappConfig.lastTestedAt}
                </span>
              )}
            </div>

              {webhookResult && (
              <div
                className={`rounded-xl border p-3 text-xs font-medium ${
                  webhookOk
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {webhookResult}
              </div>
            )}

            {/* Simulate Incoming Meta Webhook POST */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-900">
                محاكاة استقبال رسالة واردة من Meta Webhook (POST)
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={simWebhookText}
                  onChange={(e) => setSimWebhookText(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={testingApi}
                  onClick={handleSimulateIncomingWebhook}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  محاكاة Webhook POST
                </button>
              </div>
              {webhookPostResult && (
                <pre
                  dir="ltr"
                  className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[11px] text-emerald-300"
                >
                  {webhookPostResult}
                </pre>
              )}
            </div>
          </div>

          {/* Right: Test Send API & Saudi Activation Checklist */}
          <div className="space-y-6 lg:col-span-5">
            <form
              onSubmit={handleTestSendApi}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900">
                تجربة نقطة الإرسال البرمجية (Send API)
              </h3>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  رقم المستلم للاختبار
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={testToPhone}
                  onChange={(e) => setTestToPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs tabular-nums focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  نص الرسالة التجريبية
                </label>
                <textarea
                  rows={2}
                  value={testMessageBody}
                  onChange={(e) => setTestMessageBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={testingApi}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                إرسال طلب اختبار إلى /api/whatsapp/send
              </button>

              {sendApiResult && (
                <pre
                  dir="ltr"
                  className="overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] text-emerald-300"
                >
                  {sendApiResult}
                </pre>
              )}
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  <span>سجل أحداث الـ Webhook والرسائل</span>
                </h3>
                {state.webhookLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={clearWebhookLogs}
                    className="text-[11px] font-semibold text-rose-600 hover:underline"
                  >
                    مسح السجل
                  </button>
                )}
              </div>

              {state.webhookLogs.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد أحداث مسجلة بعد</p>
              ) : (
                <div className="max-h-52 space-y-2 overflow-y-auto">
                  {state.webhookLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            log.direction === "incoming"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {log.direction === "incoming" ? "وارد" : "صادر"} •{" "}
                          {log.matchedIntent}
                        </span>
                        <span className="text-slate-400 tabular-nums">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-700 truncate">{log.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                خطوات التفعيل الرسمي في السعودية
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed">
                <li>
                  استخراج <strong>وثيقة العمل الحر</strong> أو السجل التجاري
                  (مجاناً خلال دقائق).
                </li>
                <li>
                  إنشاء حساب مطور على{" "}
                  <span className="font-semibold text-slate-800">
                    developers.facebook.com
                  </span>{" "}
                  وإضافة منتج WhatsApp.
                </li>
                <li>
                  ربط رقم جوال غير مستخدم في تطبيق واتساب العادي وإدخال معرف
                  الهاتف والـ Token في الحقول المقابلة.
                </li>
                <li>
                  نسخ رابط الـ Webhook أعلاه وإدخال Verify Token للبدء بالرد
                  الآلي الكامل 24/7.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
