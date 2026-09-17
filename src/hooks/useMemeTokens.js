import { usePolling } from './usePolling';
import { loadMemeTokens } from '../services/memeTokens';

export function useMemeTokens() {
  const { data, error, loading } = usePolling(loadMemeTokens, [], { intervalMs: 30000 });
  return {
    tokens: data?.data ?? [],
    live: data?.live ?? false,
    loading,
    error,
  };
}
