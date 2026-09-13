import { useWallet } from '../context/WalletContext';
import { mintFromCollection } from '../services/nftMint';
import { mintFromCandyMachinePublic, NoPublicMintError } from '../services/candyMachine';
import { getCollectionConfig } from '../data/collectionConfig';

const ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// Every NFTCard's "Mint now" / "Join whitelist" button calls this via its
// onMint prop. Centralized here so every page that renders NFTCard
// (NFTMarket, Discover, Profile, ...) gets the same real behavior instead
// of each page having to remember to wire it up — that's what was missing
// on the Discover page before: the card was rendered without a handler at
// all, so clicking it silently did nothing.
export function useNftMintHandler() {
  const { connected, getActiveProvider, openPicker } = useWallet();

  return async function handleMint(item) {
    if (!ADDRESS_RE.test(item.id)) {
      throw new Error('This is demo data, not a real on-chain collection yet — nothing to mint.');
    }
    if (!connected) {
      openPicker();
      throw new Error('Connect your wallet first, then try again.');
    }
    const provider = getActiveProvider();
    if (!provider) {
      throw new Error("Connect a Solana wallet (Phantom, Solflare, or OKX) — MetaMask/Rabby can't sign Solana transactions.");
    }

    try {
      // Real public mint: guard-enforced, works for any wallet, on-chain.
      const result = await mintFromCandyMachinePublic({ walletProvider: provider, collectionAddress: item.id });
      // eslint-disable-next-line no-console
      console.log('[nftMint] minted via Candy Machine:', result);
      return;
    } catch (err) {
      // Only fall back for collections that genuinely never got a public
      // mint deployed (older drops from before this was wired up) — every
      // other error (ineligible, insufficient funds, sold out, rejected)
      // should surface to the buyer as-is, not get masked by a fallback.
      if (!(err instanceof NoPublicMintError)) throw err;
    }

    // Fallback for legacy collections with no Candy Machine: only their
    // own creator can test-mint (see services/nftMint.js for why).
    const config = (await getCollectionConfig(item.id)) || {};
    const result = await mintFromCollection({
      walletProvider: provider,
      collectionAddress: item.id,
      name: `${item.name} #${item.minted + 1}`,
      uri: config.metadataUri,
      price: item.price,
      treasuryWallet: config.updateAuthority,
    });
    // eslint-disable-next-line no-console
    console.log('[nftMint] minted asset (creator-only fallback):', result);
  };
}
