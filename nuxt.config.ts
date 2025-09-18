import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      backendURI: process.env.BACKEND_URI,
      contractAddress: process.env.CONTRACT_ADDRESS,
      explorerURI: process.env.EXPLORER_URI,
      chainID: process.env.CHAIN_ID,
      usdcContract: process.env.USDC_CONTRACT,
      usdtContract: process.env.USDT_CONTRACT,
      usdcDecimals: process.env.USDC_DECIMALS,
      usdtDecimals: process.env.USDT_DECIMALS,
    },
  },
  app: {
    buildAssetsDir: '/something/',
    head: {
      htmlAttrs: { dir: 'rtl', lang: 'fa' },
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/images/favicon.png',
        },
      ],
    },
  },

  devtools: { enabled: true },

  // Add Vuetify build configuration
  build: {
    transpile: ['vuetify'],
  },

  // Add Vuetify CSS
  css: [
    'vuetify/lib/styles/main.sass',
    '@mdi/font/css/materialdesignicons.min.css',
    '@/assets/css/main.css',
  ],

  // Vite configuration for Vuetify
  vite: {
    define: {
      'process.env.DEBUG': false,
    },
    ssr: {
      noExternal: ['vuetify'],
    },
  },

  // Add TypeScript support
  typescript: {
    strict: true,
  },

  compatibilityDate: '2025-09-02',
});
