export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number) => void | Promise<void>;
};

export function isTransientDbError(error: unknown) {
  const code = (error as { code?: string })?.code;
  const errno = Number((error as { errno?: number })?.errno || 0);
  const sqlState = (error as { sqlState?: string })?.sqlState;

  return (
    code === "ER_LOCK_DEADLOCK" ||
    code === "ER_LOCK_WAIT_TIMEOUT" ||
    code === "ER_GET_CONNECTION_TIMEOUT" ||
    code === "ER_CON_COUNT_ERROR" ||
    code === "PROTOCOL_CONNECTION_LOST" ||
    errno === 1205 ||
    errno === 1213 ||
    errno === 1040 ||
    errno === 45028 ||
    sqlState === "40001" ||
    sqlState === "HY000" ||
    sqlState === "08004"
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = Math.max(0, options.retries ?? 2);
  const baseDelayMs = Math.max(50, options.baseDelayMs ?? 150);
  const maxDelayMs = Math.max(baseDelayMs, options.maxDelayMs ?? 1200);
  const shouldRetry = options.shouldRetry ?? (() => true);

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= retries || !shouldRetry(error)) {
        throw error;
      }

      await options.onRetry?.(error, attempt + 1);
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt) + Math.floor(Math.random() * 75);
      await wait(delay);
    }
  }

  throw lastError;
}
