import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Several Solana/Metaplex libraries (Irys uploader, @solana/web3.js
    // internals) assume Node's built-in modules exist (crypto, stream,
    // buffer, etc). This shims them for the browser bundle — without it,
    // Tier 2/3 on-chain flows fail to build.
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
  resolve: {
    // Without this, two separate copies of the `buffer` package can end
    // up bundled — one from this polyfill, one required directly by
    // Irys's own dependencies (@irys/bundles). They're functionally
    // identical but are different constructors as far as `instanceof`/
    // internal type checks are concerned, which is exactly what caused
    // "Failed to execute 'digest' on 'SubtleCrypto': The provided value
    // is not of type (ArrayBuffer or ArrayBufferView)" deep inside Irys's
    // signing code — a Buffer built by copy A doesn't look like a real
    // buffer to copy B's internals. Deduping forces one shared instance.
    dedupe: ['buffer'],
  },
})

