export const ADMIN_CSRF_COOKIE = "kimramen_admin_csrf";
export const ADMIN_CSRF_HEADER = "x-kimramen-csrf";

export function readCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=") || "";
}

export function getAdminCsrfToken() {
  const raw = readCookieValue(ADMIN_CSRF_COOKIE);
  return raw ? decodeURIComponent(raw) : "";
}
