import { mkdir, stat, truncate, appendFile } from "node:fs/promises";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), "logs");
const ERROR_LOG_FILE = path.join(LOG_DIR, "app-error.log");
const MAX_ERROR_LOG_BYTES = 20 * 1024 * 1024;

let rotatePromise: Promise<void> | null = null;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as { code?: unknown }).code,
      errno: (error as { errno?: unknown }).errno,
      sqlState: (error as { sqlState?: unknown }).sqlState,
      sqlMessage: (error as { sqlMessage?: unknown }).sqlMessage,
    };
  }

  return { message: String(error) };
}

async function rotateErrorLogIfNeeded() {
  await mkdir(LOG_DIR, { recursive: true });

  try {
    const file = await stat(ERROR_LOG_FILE);
    if (file.size > MAX_ERROR_LOG_BYTES) {
      await truncate(ERROR_LOG_FILE, 0);
      await appendFile(
        ERROR_LOG_FILE,
        `${JSON.stringify({ level: "info", message: "Log rotated after 20MB", at: new Date().toISOString() })}\n`,
        "utf8"
      );
    }
  } catch {
    // файла может еще не быть — это нормально
  }
}

export async function logAppError(label: string, error: unknown, context: Record<string, unknown> = {}) {
  try {
    if (!rotatePromise) {
      rotatePromise = rotateErrorLogIfNeeded().finally(() => {
        rotatePromise = null;
      });
    }

    await rotatePromise;

    const payload = {
      level: "error",
      at: new Date().toISOString(),
      label,
      context,
      error: serializeError(error),
    };

    await appendFile(ERROR_LOG_FILE, `${JSON.stringify(payload)}\n`, "utf8");
  } catch (logError) {
    console.error("logAppError failed:", logError);
  }
}
