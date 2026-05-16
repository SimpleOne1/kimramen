import { appendFile, mkdir, stat, truncate } from "fs/promises";
import path from "path";

const MAX_LOG_SIZE_BYTES = 20 * 1024 * 1024;
const LOG_DIR = path.join(process.cwd(), "storage", "logs");
const LOG_FILE = path.join(LOG_DIR, "kimramen-error.log");

type ErrorContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

async function rotateLogIfNeeded() {
  try {
    const info = await stat(LOG_FILE);
    if (info.size > MAX_LOG_SIZE_BYTES) {
      await truncate(LOG_FILE, 0);
      await appendFile(
        LOG_FILE,
        `${new Date().toISOString()} | log rotated because file exceeded 20MB\n`,
        "utf8"
      );
    }
  } catch {
    // No log file yet.
  }
}

export async function writeErrorLog(source: string, error: unknown, context: ErrorContext = {}) {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await rotateLogIfNeeded();

    const entry = {
      time: new Date().toISOString(),
      source,
      error: serializeError(error),
      context,
    };

    await appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (logError) {
    console.error("Failed to write kimramen error log:", logError);
  }
}
