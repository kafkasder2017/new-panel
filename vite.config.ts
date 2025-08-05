import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // PWA build optimizations
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              router: ['react-router-dom'],
              supabase: ['@supabase/supabase-js'],
            },
          },
        },
        // Enable source maps for better debugging
        sourcemap: true,
        // Optimize chunk size
        chunkSizeWarningLimit: 1000,
      },
      server: {
        // Enable service worker in development
        fs: {
          allow: ['..'],
        },
      },
      // PWA specific configurations
      publicDir: 'public',
    };
});
