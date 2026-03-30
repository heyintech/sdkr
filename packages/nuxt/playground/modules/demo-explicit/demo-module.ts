import { defineApiCollection } from '@heyintech/sdkr-nuxt'

export default defineApiCollection({
  name: 'playground-demo-explicit',
  routeGroups: [
    {
      dir: 'runtime/server',
      clientPrefix: '/demo-explicit',
    },
  ],
})
