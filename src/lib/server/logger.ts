import { existsSync, mkdirSync, statSync, truncateSync, appendFileSync } from "fs";
import { dirname, join } from "path";

const MAX_LOG_SIZE_BYTES = 20 * 1024 * 1024;
const LOG_DIR = join(process.cwd(), "logs");
const ERROR_LOG_FILE = join(LOG_DIR, "kimramen-errors.log");
const REQUEST_LOG_FILE = join(LOG_DIR, "kimramen-requests.log");

type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function ensureLogFile(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  if (existsSync(filePath)) {
    const size = statSync(filePath).size;
    if (size > MAX_LOG_SIZE_BYTES) truncateSync(filePath, 0);
  }
}

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

function writeLog(filePath: string, level: LogLevel, message: string, payload: LogPayload = {}) {
  try {
    ensureLogFile(filePath);
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      message,
      ...payload,
    });
    appendFileSync(filePath, `${line}\n`, "utf8");
  } catch (logError) {
    console.error("Kimramen logger failed:", logError);
  }
}

export function logError(message: string, error: unknown, payload: LogPayload = {}) {
  writeLog(ERROR_LOG_FILE, "error", message, {
    ...payload,
    error: serializeError(error),
  });
}

export function logWarning(message: string, payload: LogPayload = {}) {
  writeLog(ERROR_LOG_FILE, "warn", message, payload);
}

export function logInfo(message: string, payload: LogPayload = {}) {
  writeLog(ERROR_LOG_FILE, "info", message, payload);
}

export function logRequest(payload: LogPayload = {}) {
  writeLog(REQUEST_LOG_FILE, "info", "request", payload);
}

export const loggerFiles = {
  errorLogFile: ERROR_LOG_FILE,
  requestLogFile: REQUEST_LOG_FILE,
  maxLogSizeBytes: MAX_LOG_SIZE_BYTES,
};
