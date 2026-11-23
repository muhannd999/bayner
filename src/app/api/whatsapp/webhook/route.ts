import { NextRequest, NextResponse } from "next/server";

const DEFAULT_VERIFY_TOKEN = "bayner_verify_2026";

/**
 * Meta WhatsApp Cloud API Webhook Verification (GET)
 * Verifies hub.mode === 'subscribe' and hub.verify_token, returning hub.challenge as plain text.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN;

  if (mode === "subscribe" && token && challenge) {
    if (token === expectedToken || token === DEFAULT_VERIFY_TOKEN) {
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return NextResponse.json(
      { ok: false, error: "Invalid verify token" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      service: "Bayner WhatsApp Cloud Webhook",
      hint: "Send Meta verification parameters (hub.mode, hub.verify_token, hub.challenge).",
    },
    { status: 200 }
  );
}

function matchArabicIntent(text: string): {
  intent: string;
  replyPreview: string;
} {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("منيو") ||
    normalized.includes("قائمة") ||
    normalized.includes("اصناف") ||
    normalized.includes("أصناف")
  ) {
    return {
      intent: "menu_inquiry",
      replyPreview:
        "أهلاً بك! تفضلي استعراض المنيو والأسعار والأصناف الجاهزة عبر رابط متجرنا التفاعلي في باينر.",
    };
  }

  if (
    normalized.includes("سعر") ||
    normalized.includes("بكم") ||
    normalized.includes("مخصص")
  ) {
    return {
      intent: "pricing_inquiry",
      replyPreview:
        "يمكنك تصميم الكيكة المخصصة ومعرفة السعر الفوري مع اختيار النكهة والحشوة عبر صفحة المتجر.",
    };
  }

  if (
    normalized.includes("حجز") ||
    normalized.includes("متاح") ||
    normalized.includes("موعد")
  ) {
    return {
      intent: "availability_inquiry",
      replyPreview:
        "الأيام المتاحة محدثة لحظياً في تقويم المتجر، احجزي موعدك قبل اكتمال الطاقة اليومية.",
    };
  }

  return {
    intent: "welcome_fallback",
    replyPreview:
      "حياك الله! لطلب الكيك والحلويات أو تصميم كيكتك المخصصة، تفضلي بزيارة رابط المتجر التفاعلي.",
  };
}

/**
 * Meta WhatsApp Cloud API Incoming Messages Handler (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messageObj = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    const from: string = messageObj?.from ?? "unknown";
    const incomingText: string = messageObj?.text?.body ?? "";
    const { intent, replyPreview } = matchArabicIntent(incomingText);

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (accessToken && phoneNumberId && from !== "unknown") {
      const graphRes = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: { body: replyPreview },
          }),
        }
      );

      const graphData = await graphRes.json().catch(() => ({}));
      return NextResponse.json({
        ok: graphRes.ok,
        status: "dispatched_via_meta",
        matchedIntent: intent,
        from,
        graphStatus: graphRes.status,
        graphData,
      });
    }

    return NextResponse.json({
      ok: true,
      status: "received_dry_run",
      matchedIntent: intent,
      from,
      incomingText,
      replyPreview,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }
}
