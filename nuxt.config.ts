import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      contractAddr: process.env.CONTRACT_ADDR,
      explorerURI: process.env.EXPLORER_URI,
    },
  },
  app: {
    buildAssetsDir: "/something/",
    head: {
      htmlAttrs: { dir: "rtl", lang: "fa" },
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/images/favicon.png",
        },
      ],
    },
  },

  devtools: { enabled: true },

  // Add Vuetify build configuration
  build: {
    transpile: ["vuetify"],
  },

  // Add Vuetify CSS
  css: [
    "vuetify/lib/styles/main.sass",
    "@mdi/font/css/materialdesignicons.min.css",
    "@/assets/css/main.css",
  ],

  // Vite configuration for Vuetify
  vite: {
    define: {
      "process.env.DEBUG": false,
    },
    ssr: {
      noExternal: ["vuetify"],
    },
  },

  // Add TypeScript support
  typescript: {
    strict: true,
  },

  compatibilityDate: "2025-09-02",
});
