import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./setupTests.ts'],
        include: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'lcov'],
        },
      },
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
            manualChunks: (id) => {
              // Core vendor libraries - more granular splitting
              if (id.includes('node_modules')) {
                // React ecosystem
                if (id.includes('react/') && !id.includes('react-dom')) {
                  return 'vendor-react-core';
                }
                if (id.includes('react-dom')) {
                  return 'vendor-react-dom';
                }
                if (id.includes('react-router-dom')) {
                  return 'vendor-router';
                }
                if (id.includes('react-hot-toast')) {
                  return 'vendor-ui-toast';
                }
                
                // Supabase
                if (id.includes('@supabase/supabase-js')) {
                  return 'vendor-supabase';
                }
                
                // Charts and visualization
                if (id.includes('recharts')) {
                  return 'vendor-charts-recharts';
                }
                if (id.includes('d3')) {
                  return 'vendor-charts-d3';
                }
                
                // UI libraries
                if (id.includes('lucide-react')) {
                  return 'vendor-icons';
                }
                
                // Utility libraries
                if (id.includes('date-fns') || id.includes('moment')) {
                  return 'vendor-date';
                }
                if (id.includes('lodash') || id.includes('ramda')) {
                  return 'vendor-utils';
                }
                
                // Excel and utility libraries - split into smaller chunks
                if (id.includes('xlsx')) {
                  return 'xlsx-lib';
                }
                if (id.includes('file-saver')) {
                  return 'file-saver';
                }
                if (id.includes('jspdf')) {
                  return 'pdf-lib';
                }
                if (id.includes('useExcelUtils') || id.includes('excelUtils')) {
                  return 'excel-utils';
                }
                
                // Other smaller vendor libraries
                return 'vendor-misc';
              }
              
              // Component chunks - more specific grouping
              if (id.includes('/components/Dashboard.tsx')) {
                return 'page-dashboard';
              }
              
              // Financial management
              if (id.includes('/components/BagisYonetimi.tsx')) {
                return 'page-donations';
              }
              if (id.includes('/components/FinansalKayitlar.tsx')) {
                return 'page-financial';
              }
              if (id.includes('/components/OdemeYonetimi.tsx')) {
                return 'page-payments';
              }
              
              // People management
              if (id.includes('/components/KisiYonetimi.tsx')) {
                return 'page-people';
              }
              if (id.includes('/components/UyeYonetimi.tsx')) {
                return 'page-members';
              }
              if (id.includes('/components/GonulluYonetimi.tsx')) {
                return 'page-volunteers';
              }
              
              // Project and aid management
              if (id.includes('/components/ProjeYonetimi.tsx')) {
                return 'page-projects';
              }
              if (id.includes('/components/YardimBasvurulari.tsx')) {
                return 'page-aid-applications';
              }
              if (id.includes('/components/HukukiYardim.tsx')) {
                return 'page-legal-aid';
              }
              
              // Reports and analytics
              if (id.includes('/components/Raporlar.tsx') || 
                  id.includes('/components/RaporlamaAnalitik.tsx')) {
                return 'page-reports';
              }
              
              // Settings and admin
              if (id.includes('/components/Ayarlar.tsx') ||
                  id.includes('/components/KullaniciYonetimi.tsx') ||
                  id.includes('/components/BaskanOnayi.tsx')) {
                return 'page-admin';
              }
              
              // Other components
              if (id.includes('/components/')) {
                return 'components-misc';
              }
            },
            // Ensure stable chunk names
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') : 'chunk';
              return `assets/[name]-[hash].js`;
            },
          },
        },
        // Enable source maps for better debugging
        sourcemap: true,
        // Optimize chunk size - increased limit for large Excel utilities
        chunkSizeWarningLimit: 2000,
        // Improve build performance
        target: 'esnext',
        minify: 'esbuild',
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
