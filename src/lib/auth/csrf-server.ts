import "server-only";

import { randomBytes, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_CSRF_COOKIE, ADMIN_CSRF_HEADER } from "@/src/lib/csrf";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ADMIN_CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function createCsrfToken() {
  return randomBytes(32).toString("base64url");
}

export async function setAdminCsrfCookie() {
  const cookieStore = await cookies();
  const token = createCsrfToken();

  cookieStore.set(ADMIN_CSRF_COOKIE, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_CSRF_MAX_AGE_SECONDS,
  });

  return token;
}

export async function clearAdminCsrfCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_CSRF_COOKIE);
}

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function isSameOrigin(request: NextRequest) {
  const headerStore = await headers();
  const host = headerStore.get("host") || request.nextUrl.host;
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const source = origin || referer;
  if (!source) return true;

  try {
    const sourceUrl = new URL(source);
    return sourceUrl.host === host;
  } catch {
    return false;
  }
}

export async function verifyAdminCsrf(request: NextRequest) {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) return null;

  if (!(await isSameOrigin(request))) {
    return NextResponse.json(
      { success: false, message: "CSRF protection: некорректный источник запроса" },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(ADMIN_CSRF_COOKIE)?.value || "";
  const headerToken = request.headers.get(ADMIN_CSRF_HEADER) || "";

  if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
    return NextResponse.json(
      { success: false, message: "CSRF protection: обнови страницу и повтори действие" },
      { status: 403 }
    );
  }

  return null;
}
