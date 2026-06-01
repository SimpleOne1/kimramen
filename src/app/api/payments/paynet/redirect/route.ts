import { NextRequest, NextResponse } from "next/server";
import { getPaynetRedirectForm } from "@/src/lib/payments/paynet";
import { writeErrorLog } from "@/src/lib/server/error-log";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getPublicBaseUrl(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0]?.trim();
  const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "https";

  if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const publicBaseUrl = getPublicBaseUrl(request);

  try {
    const orderNumber = request.nextUrl.searchParams.get("order") || "";
    const form = orderNumber ? await getPaynetRedirectForm(orderNumber, publicBaseUrl) : null;

    if (!form) {
      return NextResponse.redirect(new URL("/orders?payment=failed&provider=paynet", publicBaseUrl));
    }

    const inputs = Object.entries(form.fields)
      .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`)
      .join("\n");

    const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Переход к Paynet</title>
</head>
<body>
  <p>Переходим на страницу оплаты Paynet...</p>
  <form id="paynet-form" method="POST" action="${escapeHtml(form.checkoutUrl)}">
    ${inputs}
    <button type="submit">Продолжить оплату</button>
  </form>
  <script>document.getElementById("paynet-form").submit();</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    await writeErrorLog("GET /api/payments/paynet/redirect", error);
    console.error("GET /api/payments/paynet/redirect error:", error);
    return NextResponse.redirect(new URL("/orders?payment=failed&provider=paynet", publicBaseUrl));
  }
}
