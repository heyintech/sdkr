import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.mjs',
    sdkr: './src/sdkr.mjs',
  },
  format: 'esm',
  dts: false,
  clean: true,
  platform: 'node',
  target: 'node18',
  outDir: 'dist',
  sourcemap: false,
  outExtensions() {
    return {
      js: '.mjs',
    }
  },
})
