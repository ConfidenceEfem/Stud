// Generic retry with exponential backoff. Rate-limit errors (HTTP 429 —
// "Too many requests") get a much longer wait than other transient
// failures, because retrying quickly into an active rate limit just wastes
// the attempt: the window that's limiting you usually needs real time to
// reset, not a couple of seconds.
export async function withRetries(fn, { attempts = 4, baseDelayMs = 2000 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i === attempts - 1) break;

      const isRateLimited = /429|too many requests|rate limit/i.test(err?.message || '');
      const delay = isRateLimited
        ? 8000 * (i + 1) // 8s, 16s, 24s... — give the RPC's rate-limit window real time to clear
        : baseDelayMs * 2 ** i; // 2s, 4s, 8s... for ordinary transient failures

      console.warn(
        `[retry] attempt ${i + 1}/${attempts} failed${isRateLimited ? ' (rate limited)' : ''}, retrying in ${delay}ms:`,
        err?.message || err
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
