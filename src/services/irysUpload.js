import { WebUploader } from '@irys/web-upload';
import { WebSolana } from '@irys/web-upload-solana';
import { RPC_URL, NETWORK } from '../config/env';

// Why this file exists instead of just using @metaplex-foundation/
// umi-uploader-irys directly: that package uploads through a library
// called PromisePool, which — when a single file upload fails internally
// (bad signature, bundler rejection, whatever) — silently records the
// failure and moves on rather than throwing. The public `.upload()` API
// then just returns an empty results array with no indication of what
// went wrong. We call Irys's lower-level client ourselves instead, with a
// plain try/catch around a single file, so a real failure actually
// surfaces instead of vanishing into "no usable URI, cause unknown".
const gatewayUrl = (id) => `https://gateway.irys.xyz/${id}`;

// Irys's InjectedSolanaSigner does `return await this.provider.signMessage(t)`
// and treats the result as raw signature bytes. But Phantom (and every
// standard-compliant Solana wallet) actually resolves signMessage() to
// { signature: Uint8Array, publicKey }, not a bare Uint8Array. Irys then
// hashes that whole object directly, and crypto.subtle.digest() throws
// "not of type ArrayBuffer/ArrayBufferView" because an object isn't a
// valid buffer. This wraps the real wallet so signMessage returns exactly
// what Irys expects, without touching how the rest of the app talks to
// the wallet (Umi's walletAdapterIdentity is untouched, uses the raw one).
function irysCompatibleProvider(walletProvider) {
  return {
    publicKey: walletProvider.publicKey,
    // Bound explicitly (not spread) because wallet provider objects often
    // have these on their prototype rather than as own enumerable
    // properties — a naive {...walletProvider} would silently drop them,
    // breaking the funding transaction step that still needs a real
    // signTransaction/signAllTransactions.
    signTransaction: walletProvider.signTransaction?.bind(walletProvider),
    signAllTransactions: walletProvider.signAllTransactions?.bind(walletProvider),
    connect: walletProvider.connect?.bind(walletProvider),
    signMessage: async (message) => {
      const result = await walletProvider.signMessage(message);
      // Some wallets already return raw bytes; only unwrap if it's the
      // { signature, publicKey } shape.
      return result?.signature ?? result;
    },
  };
}

async function getIrysClient(walletProvider) {
  let builder = WebUploader(WebSolana).withProvider(irysCompatibleProvider(walletProvider)).withRpc(RPC_URL);
  builder = NETWORK === 'mainnet-beta' ? builder.mainnet() : builder.devnet();
  return builder; // UploadBuilder implements .then(), so this is awaitable
}

async function ensureFunded(irys, bytes) {
  const price = await irys.getPrice(bytes);
  const balance = await irys.getBalance();
  if (price.isGreaterThan(balance)) {
    await irys.fund(price.minus(balance).multipliedBy(1.1));
  }
}

export async function uploadFileToIrys(walletProvider, file) {
  const irys = await getIrysClient(walletProvider);
  await ensureFunded(irys, file.size);
  const receipt = await irys.uploadFile(file);
  return gatewayUrl(receipt.id);
}

export async function uploadJsonToIrys(walletProvider, json) {
  const irys = await getIrysClient(walletProvider);
  const body = JSON.stringify(json);
  await ensureFunded(irys, Buffer.byteLength(body));
  const receipt = await irys.upload(body, {
    tags: [{ name: 'Content-Type', value: 'application/json' }],
  });
  return gatewayUrl(receipt.id);
}
