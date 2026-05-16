import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "kimramen_admin_session";
const ADMIN_LOGIN_PATH = "/admin/login";
const CSRF_COOKIE = "kimramen_csrf";

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function getIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function json(status: number, message: string) {
  return NextResponse.json({ success: false, message }, { status });
}

function isMutatingMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function checkRateLimit(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const ip = getIp(request);
  const isAuthPath = path.includes("/login") || path.includes("/auth");
  const windowMs = 60_000;
  const limit = isAuthPath ? 20 : path.startsWith("/api/") ? 180 : 300;
  const key = `${ip}:${path}:${Math.floor(Date.now() / windowMs)}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);

  if (rateLimitBuckets.size > 5000) {
    for (const [bucketKey, value] of rateLimitBuckets) {
      if (value.resetAt <= now) rateLimitBuckets.delete(bucketKey);
    }
  }

  return bucket.count <= limit;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) return false;
  if (origin) return new URL(origin).host === host;
  if (referer) return new URL(referer).host === host;

  return true;
}

function csrfOk(request: NextRequest) {
  if (!isMutatingMethod(request.method)) return true;
  if (!sameOrigin(request)) return false;

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-kimramen-csrf");

  if (!cookieToken || !headerToken) return true;
  return cookieToken === headerToken;
}

function ensureCsrfCookie(response: NextResponse, request: NextRequest) {
  if (request.cookies.get(CSRF_COOKIE)?.value) return response;

  const token = crypto.randomUUID();
  response.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!checkRateLimit(request)) {
    return json(429, "Слишком много запросов. Попробуйте немного позже.");
  }

  if (pathname.startsWith("/api/") && !csrfOk(request)) {
    return json(403, "CSRF protection: запрос отклонён");
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return ensureCsrfCookie(NextResponse.next(), request);
  }

  if (pathname === ADMIN_LOGIN_PATH) {
    return ensureCsrfCookie(NextResponse.next(), request);
  }

  const sessionCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    if (isAdminApi) return json(401, "Нужна авторизация администратора");

    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return ensureCsrfCookie(NextResponse.next(), request);
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
