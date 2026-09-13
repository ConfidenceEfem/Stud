import { useEffect, useState } from 'react';
import { loadWalletPortfolio, MissingApiKeyError } from '../services/walletPortfolio';

export function useWalletPortfolio(address) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(address) });

  useEffect(() => {
    if (!address) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    loadWalletPortfolio(address)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, error, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  return {
    ...state,
    missingApiKey: state.error instanceof MissingApiKeyError,
  };
}
