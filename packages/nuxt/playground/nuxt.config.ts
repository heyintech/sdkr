export default defineNuxtConfig({
  modules: ['@heyintech/sdkr'],
  devtools: { enabled: true },
  compatibilityDate: 'latest',
  sdkr: {
    injectCallaToGlobal: true,
    collections: [
      'modules/demo-api',
      'modules/demo-explicit/demo-module.ts',
    ],
  },
})
