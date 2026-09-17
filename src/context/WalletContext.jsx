import { createContext, useContext, useEffect, useState } from 'react';

// Real wallet-extension connections — no wallet-adapter package needed,
// since each of these injects a provider straight onto `window`.
//
// Heads up: MetaMask and Rabby are EVM wallets, so connecting them returns
// an Ethereum address (0x…), not a Solana one. Phantom / Solflare / OKX
// return real Solana addresses via connect()/publicKey. Both flows are
// handled below (`kind: 'evm'` vs the Solana default) so all four actually
// connect for real — just be aware the EVM two won't match a Solana wallet
// address anywhere else a Solana address is expected (e.g. on-chain mint
// proceeds).
const PROVIDERS = {
  phantom: {
    id: 'phantom',
    label: 'Phantom',
    color: '#AB9FF2',
    icon: 'Ghost',
    installUrl: 'https://phantom.app/download',
    getProvider: () =>
      typeof window === 'undefined'
        ? undefined
        : window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : undefined),
  },
  solflare: {
    id: 'solflare',
    label: 'Solflare',
    color: '#FC822B',
    icon: 'Flame',
    installUrl: 'https://solflare.com/download',
    getProvider: () => (typeof window === 'undefined' ? undefined : window.solflare),
  },
  okx: {
    id: 'okx',
    label: 'OKX Wallet',
    color: '#FFFFFF',
    icon: 'Hexagon',
    installUrl: 'https://www.okx.com/web3',
    getProvider: () => (typeof window === 'undefined' ? undefined : window.okxwallet?.solana),
  },
  metamask: {
    id: 'metamask',
    label: 'MetaMask',
    color: '#F6851B',
    icon: 'Wallet',
    kind: 'evm',
    installUrl: 'https://metamask.io/download',
    getProvider: () => {
      if (typeof window === 'undefined' || !window.ethereum) return undefined;
      const eth = window.ethereum;
      if (Array.isArray(eth.providers)) return eth.providers.find((p) => p.isMetaMask && !p.isRabby);
      return eth.isMetaMask && !eth.isRabby ? eth : undefined;
    },
  },
  rabby: {
    id: 'rabby',
    label: 'Rabby',
    color: '#7084FF',
    icon: 'Rabbit',
    kind: 'evm',
    installUrl: 'https://rabby.io/',
    getProvider: () => {
      if (typeof window === 'undefined' || !window.ethereum) return undefined;
      const eth = window.ethereum;
      if (Array.isArray(eth.providers)) return eth.providers.find((p) => p.isRabby);
      return eth.isRabby ? eth : undefined;
    },
  },
};

const PROVIDER_LIST = Object.values(PROVIDERS);
const LAST_PROVIDER_KEY = 'stub_wallet_provider';
const USERNAMES_KEY = 'stub_usernames';

const readUsernames = () => {
  try {
    return JSON.parse(localStorage.getItem(USERNAMES_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeUsernames = (map) => {
  try {
    localStorage.setItem(USERNAMES_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (privacy mode, etc.) — demo persistence only
  }
};

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [providerId, setProviderId] = useState('');
  const [username, setUsername] = useState('');
  const [needsUsername, setNeedsUsername] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  // On first load, try a *silent* reconnect to whichever wallet was used
  // last time — real wallets support this (Phantom/Solflare/Backpack all
  // honour `onlyIfTrusted`), so if the person already approved this site
  // before, they land back in without clicking anything. If they haven't,
  // this just quietly fails and they stay disconnected.
  useEffect(() => {
    let cancelled = false;
    let lastId;
    try {
      lastId = localStorage.getItem(LAST_PROVIDER_KEY);
    } catch {
      lastId = null;
    }
    const meta = lastId && PROVIDERS[lastId];
    const provider = meta?.getProvider();
    if (!provider) return;

    (async () => {
      try {
        if (meta.kind === 'evm') {
          const accounts = await provider.request({ method: 'eth_accounts' });
          const addr = accounts?.[0];
          if (!cancelled && addr) applyConnection(lastId, addr);
        } else {
          const resp = await provider.connect({ onlyIfTrusted: true });
          const pubkey = (resp?.publicKey ?? provider.publicKey)?.toString();
          if (!cancelled && pubkey) applyConnection(lastId, pubkey);
        }
      } catch {
        // Not previously trusted — require an explicit click, as normal.
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyConnection = (id, pubkey) => {
    setAddress(pubkey);
    setProviderId(id);
    setConnected(true);
    try {
      localStorage.setItem(LAST_PROVIDER_KEY, id);
    } catch {
      // ignore
    }

    const usernames = readUsernames();
    if (usernames[pubkey]) {
      setUsername(usernames[pubkey]);
      setNeedsUsername(false);
    } else {
      setUsername('');
      setNeedsUsername(true); // this wallet has never connected here before
    }
  };

  const openPicker = () => {
    setConnectError('');
    setPickerOpen(true);
  };
  const closePicker = () => {
    if (connecting) return;
    setPickerOpen(false);
    setConnectError('');
  };

  const connectWith = async (id) => {
    const meta = PROVIDERS[id];
    if (!meta) return;
    const provider = meta.getProvider();

    if (!provider) {
      setConnectError(`${meta.label} isn't installed in this browser.`);
      window.open(meta.installUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      setConnecting(true);
      setConnectError('');
      let identifier;
      if (meta.kind === 'evm') {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        identifier = accounts?.[0];
        if (!identifier) throw new Error('No account returned by the wallet.');
      } else {
        const resp = await provider.connect();
        identifier = (resp?.publicKey ?? provider.publicKey)?.toString();
        if (!identifier) throw new Error('No public key returned by the wallet.');
      }
      applyConnection(id, identifier);
      setPickerOpen(false);
    } catch (err) {
      setConnectError(err?.message?.includes('User rejected') ? 'Connection request was rejected.' : err?.message || 'Could not connect — try again.');
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    const meta = PROVIDERS[providerId];
    const provider = meta?.getProvider();
    try {
      provider?.disconnect?.();
    } catch {
      // ignore
    }
    setConnected(false);
    setNeedsUsername(false);
    setProviderId('');
  };

  // Exposes the raw injected wallet provider (Phantom/Solflare/OKX) so
  // Tier 2/3 flows can hand it straight to Umi/web3.js as the transaction
  // signer — the same object driving connect/disconnect above. Returns
  // undefined for EVM wallets (MetaMask/Rabby), which can't sign Solana
  // transactions.
  const getActiveProvider = () => {
    const meta = PROVIDERS[providerId];
    if (!meta || meta.kind === 'evm') return undefined;
    return meta.getProvider();
  };

  const saveUsername = (name) => {
    const trimmed = name.trim();
    if (!trimmed || !address) return false;
    const usernames = readUsernames();
    usernames[address] = trimmed;
    writeUsernames(usernames);
    setUsername(trimmed);
    setNeedsUsername(false);
    return true;
  };

  return (
    <WalletContext.Provider
      value={{
        connected,
        address,
        providerId,
        providerLabel: PROVIDERS[providerId]?.label ?? '',
        username,
        needsUsername,
        pickerOpen,
        connecting,
        connectError,
        providers: PROVIDER_LIST,
        openPicker,
        closePicker,
        connectWith,
        disconnect,
        saveUsername,
        getActiveProvider,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
