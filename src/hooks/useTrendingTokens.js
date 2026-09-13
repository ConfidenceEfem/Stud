import { usePolling } from './usePolling';
import { loadTrendingTokens } from '../services/trendingTokens';

export function useTrendingTokens(limit = 20) {
  const { data, error, loading } = usePolling(() => loadTrendingTokens(limit), [limit], { intervalMs: 30000 });
  return {
    tokens: data?.data ?? [],
    source: data?.source ?? 'demo',
    live: data?.live ?? false,
    loading,
    error,
  };
}
