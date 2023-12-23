import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node18',
    ssr: true, // https://github.com/vitejs/vite/issues/13926
    sourcemap: true,
    minify: false,
    outDir: 'out',
    emptyOutDir: false,
    lib: {
      entry: 'src/extension.ts',
      fileName: () => 'extension.js',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['vscode'],
    },
  },
})
