import { defineApiCollection } from '@heyintech/sdkr-nuxt'

export default defineApiCollection({
  name: 'playground-demo-api',
  routeGroups: [
    {
      dir: 'runtime/server',
      clientPrefix: '/demo',
    },
  ],
})
