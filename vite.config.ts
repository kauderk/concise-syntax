import { defineConfig } from 'vite'

// this file exist because you can't build multiple libraries at the same time with vite https://github.com/vitejs/vite/issues/2039#issuecomment-779356090
// and tsc doesn't build umd to a single file * sigh *
// also vscode extension only support commonjs
// TODO: find a smaller compiler, vite is too overkill
export default defineConfig({
  build: {
    target: 'node18',
    ssr: true, // https://github.com/vitejs/vite/issues/13926
    sourcemap: true,
    minify: false,
    outDir: 'out',
    emptyOutDir: false,
    lib: {
      entry: 'src/extension/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['vscode'],
      output: {
        entryFileNames: 'extension.js', // other wise it will be index.js
      },
    },
  },
})
