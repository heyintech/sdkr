import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: {
      module: './src/module.ts',
      calla: './src/calla.ts',
    },
    format: 'esm',
    dts: false,
    clean: true,
    platform: 'node',
    target: 'node18',
    outDir: 'dist',
    outExtensions() {
      return {
        js: '.mjs',
      }
    },
  },
  {
    entry: {
      sdkr: '../cli/src/sdkr.mjs',
    },
    format: 'esm',
    dts: false,
    clean: false,
    platform: 'node',
    target: 'node18',
    outDir: 'dist',
    sourcemap: false,
    outExtensions() {
      return {
        js: '.mjs',
      }
    },
  },
])
