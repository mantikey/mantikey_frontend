import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
  ssr: false,

  css: [
    'vuetify/styles',
    '@mdi/font/css/materialdesignicons.css',
    '@/assets/main.css',
  ],

  typescript: { shim: false },
  build: { transpile: ['vuetify'] },

  vite: {
    vue: { template: { transformAssetUrls } },
  },

  modules: [],

  app: {
    head: { title: 'Hello Nuxt + Vuetify' },
  },

  compatibilityDate: '2025-09-01',
});
