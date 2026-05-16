type RetryOptions = {
  attempts?: number;
  delayMs?: number;
  backoff?: number;
  onRetry?: (error: unknown, attempt: number) => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const delayMs = Math.max(0, options.delayMs ?? 250);
  const backoff = Math.max(1, options.backoff ?? 2);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;
      options.onRetry?.(error, attempt);
      await sleep(delayMs * Math.pow(backoff, attempt - 1));
    }
  }

  throw lastError;
}
