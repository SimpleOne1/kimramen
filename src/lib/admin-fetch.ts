"use client";

import { ADMIN_CSRF_HEADER, getAdminCsrfToken } from "@/src/lib/csrf";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || undefined);

  if (MUTATING_METHODS.has(method)) {
    const token = getAdminCsrfToken();
    if (token && !headers.has(ADMIN_CSRF_HEADER)) {
      headers.set(ADMIN_CSRF_HEADER, token);
    }
  }

  return fetch(input, { ...init, headers });
}
