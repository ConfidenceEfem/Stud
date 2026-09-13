// Diagnostic-only helper: temporarily wraps XMLHttpRequest to log every
// request/response whose URL contains `urlSubstring`, for the duration of
// `fn`. This targets XHR specifically (not fetch) because the Irys upload
// SDK (@irys/upload-core, @irys/arweave) uses axios internally, which
// defaults to the XMLHttpRequest adapter in browsers — a fetch-only patch
// is invisible to it. Used because the Irys SDK can swallow the real HTTP
// failure (status code, response body) and surface only "no usable URI",
// which tells us THAT it failed but not WHY. Restores the original
// XMLHttpRequest behavior afterward either way.
export async function withFetchLogging(urlSubstring, fn) {
  const OriginalXHR = window.XMLHttpRequest;

  class LoggingXHR extends OriginalXHR {
    open(method, url, ...rest) {
      this.__debugUrl = url;
      this.__debugMethod = method;
      return super.open(method, url, ...rest);
    }

    send(...args) {
      if (typeof this.__debugUrl === 'string' && this.__debugUrl.includes(urlSubstring)) {
        this.addEventListener('loadend', () => {
          const preview = (this.responseText || '').slice(0, 500);
          console.warn(`[irys-debug] ${this.status} ${this.statusText || ''} — ${this.__debugMethod} ${this.__debugUrl}\n${preview}`);
        });
        this.addEventListener('error', () => {
          console.warn(`[irys-debug] network error — ${this.__debugMethod} ${this.__debugUrl}`);
        });
      }
      return super.send(...args);
    }
  }

  window.XMLHttpRequest = LoggingXHR;

  try {
    return await fn();
  } finally {
    window.XMLHttpRequest = OriginalXHR;
  }
}

