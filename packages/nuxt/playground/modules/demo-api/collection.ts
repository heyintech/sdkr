import { defineApiCollection } from '@heyintech/sdkr'

export default defineApiCollection({
  name: 'playground-demo-api',
  routeGroups: [
    {
      dir: 'runtime/server',
      clientPrefix: '/demo',
    },
  ],
})
