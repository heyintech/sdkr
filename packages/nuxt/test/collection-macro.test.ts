import { describe, expect, it } from 'vitest'
import { rewriteDefineApiCollectionMacro } from '../src/transform'

describe('defineApiCollection macro', () => {
  it('rewrites default-exported defineApiCollection calls to plain objects', async () => {
    const code = [
      `import { defineApiCollection } from "@heyintech/sdkr-nuxt"`,
      '',
      'export default defineApiCollection({',
      `  name: "demo",`,
      '  routeGroups: [],',
      '})',
    ].join('\n')

    const transformed = await rewriteDefineApiCollectionMacro(
      code,
      '/virtual/demo.collection.ts',
    )

    expect(transformed).toContain('export default {')
    expect(transformed).not.toContain('defineApiCollection({')
    expect(transformed).toContain(`name: "demo"`)
  })

  it('skips files that do not use the collection macro', async () => {
    const code = `export default { name: "demo", routeGroups: [] }`

    await expect(
      rewriteDefineApiCollectionMacro(code, '/virtual/demo.collection.ts'),
    ).resolves.toBeNull()
  })
})
