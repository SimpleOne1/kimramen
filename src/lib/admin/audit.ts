import { mkdir, stat, truncate, appendFile } from "fs/promises";
import path from "path";
import type { CurrentAdmin } from "@/src/lib/auth/admin";

const LOG_DIR = path.join(process.cwd(), "logs");
const AUDIT_LOG_PATH = path.join(LOG_DIR, "admin-audit.log");
const MAX_LOG_SIZE_BYTES = 20 * 1024 * 1024;

type AuditPayload = {
  admin: CurrentAdmin | null;
  action: string;
  target?: string;
  details?: Record<string, unknown>;
};

async function rotateIfNeeded() {
  try {
    const info = await stat(AUDIT_LOG_PATH);
    if (info.size > MAX_LOG_SIZE_BYTES) {
      await truncate(AUDIT_LOG_PATH, 0);
    }
  } catch {
    // File does not exist yet.
  }
}

export async function logAdminAction(payload: AuditPayload) {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await rotateIfNeeded();

    const line = JSON.stringify({
      at: new Date().toISOString(),
      adminId: payload.admin?.id ?? null,
      adminLogin: payload.admin?.login ?? null,
      adminRole: payload.admin?.role ?? null,
      action: payload.action,
      target: payload.target ?? null,
      details: payload.details ?? null,
    });

    await appendFile(AUDIT_LOG_PATH, `${line}\n`, "utf8");
  } catch (error) {
    console.error("admin audit log error:", error);
  }
}
