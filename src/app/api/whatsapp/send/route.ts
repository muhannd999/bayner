import { NextRequest, NextResponse } from "next/server";

interface SendRequestBody {
  to?: string;
  message?: string;
  phoneNumberId?: string;
  accessToken?: string;
}

/**
 * Outbound WhatsApp Cloud API dispatcher (supports dry-run mode without Meta credentials)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendRequestBody;
    const to = body.to?.trim();
    const message = body.message?.trim();

    if (!to || !message) {
      return NextResponse.json(
        {
          ok: false,
          error: "يجب تحديد رقم المستلم (to) ونص الرسالة (message).",
        },
        { status: 400 }
      );
    }

    const phoneNumberId =
      body.phoneNumberId?.trim() || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken =
      body.accessToken?.trim() || process.env.WHATSAPP_ACCESS_TOKEN;

    if (phoneNumberId && accessToken) {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to.replace(/[^\d]/g, ""),
            type: "text",
            text: { body: message },
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          ok: response.ok,
          mode: "cloud_api",
          status: response.status,
          data,
        },
        { status: response.ok ? 200 : response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "dry_run",
      to,
      message:
        "الواجهة البرمجية جاهزة — أضيفي Access Token و Phone Number ID من Meta للإرسال الفعلي",
      previewPayload: {
        messaging_product: "whatsapp",
        to: to.replace(/[^\d]/g, ""),
        type: "text",
        text: { body: message },
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "تعذر قراءة بيانات الطلب." },
      { status: 400 }
    );
  }
}
