import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';

export default defineNuxtConfig({
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
