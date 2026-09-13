import { useEffect, useRef, useState } from 'react';

// Runs `loader()` immediately, then again every `intervalMs`, storing the
// latest resolved value. Cancels in-flight/stale results on unmount or when
// deps change so a slow response can't clobber a newer one.
export function usePolling(loader, deps = [], { intervalMs = 30000 } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const savedLoader = useRef(loader);
  savedLoader.current = loader;

  useEffect(() => {
    let cancelled = false;
    let timer;

    const run = async (isFirst) => {
      if (isFirst) setState((s) => ({ ...s, loading: true }));
      try {
        const data = await savedLoader.current();
        if (!cancelled) setState({ data, error: null, loading: false });
      } catch (error) {
        if (!cancelled) setState((s) => ({ ...s, error, loading: false }));
      }
    };

    run(true);
    timer = setInterval(() => run(false), intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
