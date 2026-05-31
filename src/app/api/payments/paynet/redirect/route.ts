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

export async function GET(request: NextRequest) {
  try {
    const orderNumber = request.nextUrl.searchParams.get("order") || "";
    const form = orderNumber ? await getPaynetRedirectForm(orderNumber) : null;

    if (!form) {
      return NextResponse.redirect(new URL("/orders?payment=failed&provider=paynet", request.url));
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
    return NextResponse.redirect(new URL("/orders?payment=failed&provider=paynet", request.url));
  }
}
