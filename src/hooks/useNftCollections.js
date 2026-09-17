import { usePolling } from './usePolling';
import { loadNftCollections } from '../services/nftCollections';

export function useNftCollections() {
  const { data, error, loading } = usePolling(loadNftCollections, [], { intervalMs: 45000 });
  return {
    collections: data?.data ?? [],
    live: data?.live ?? false,
    loading,
    error,
  };
}
