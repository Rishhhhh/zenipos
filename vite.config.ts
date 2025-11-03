import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react-window']
  },
  build: {
    commonjsOptions: {
      include: [/react-window/, /node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Group npm packages only
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-core';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-radix';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'tanstack';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 0,
  },
}));
