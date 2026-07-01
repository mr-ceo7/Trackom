import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const isNgrok = !!process.env.NGROK_URL;
  const ngrokHost = isNgrok
    ? new URL(process.env.NGROK_URL!).hostname
    : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr:
        process.env.DISABLE_HMR === 'true'
          ? false
          : isNgrok
            ? {
                // When behind ngrok, the browser connects over HTTPS (port 443)
                // so HMR WebSocket must use wss:// on the ngrok hostname.
                protocol: 'wss',
                host: ngrokHost,
                clientPort: 443,
              }
            : true,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Allow ngrok's hostname (and any other tunneling host) to proxy requests.
      allowedHosts: true as const,
      // Ensure CORS headers are sent so ngrok's browser interstitial doesn't block assets.
      cors: true,
    },
  };
});
