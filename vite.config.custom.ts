import { type UserConfig, build } from 'vite'
import { patchWorkbench, preRead } from './src/shared/write'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { exec } from 'child_process'

const watch = process.argv.includes('--watch')

const shared = {
  sourcemap: true,
  minify: false,
  outDir: 'out',
  emptyOutDir: false,
  watch: watch ? { include: ['src/**/*'] } : undefined,
}
const resolve = {
  alias: {
    src: path.resolve(__dirname, 'src'),
  },
}
const config: UserConfig[] = [
  {
    resolve,
    build: {
      ...shared,
      lib: {
        entry: 'src/workbench/index.ts',
        name: 'workbench',
        fileName: () => 'workbench.js',
        formats: ['umd'],
      },
      rollupOptions: {
        output: {
          amd: {
            // alternative to https://github.com/rollup/rollup/issues/3490#issuecomment-645348130
            define: 'ignoreDefine', // ignore define, just run the factory function
          },
        },
      },
    },
  },
  {
    resolve,
    build: {
      target: 'node18',
      ssr: true, // https://github.com/vitejs/vite/issues/13926
      ...shared,
      lib: {
        entry: 'src/extension/index.ts',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: ['vscode'],
        output: {
          entryFileNames: 'extension.js', // otherwise it will be index.js
        },
      },
    },
  },
]

async function preBuild() {
  // update package.json.d.ts
  const file = 'package.json'
  const jsonData = JSON.stringify(require(`./${file}`), null, 2)
  await fs.promises.writeFile(
    `${file}.d.ts`,
    `/** Generated with \`./json-d-ts.js\` */\ndeclare const data: ${jsonData}\nexport = data`
  )

  // tsc src/shared/uninstall.ts --outDir out/uninstall.js
  await exec('tsc src/shared/uninstall.ts --outDir out')
}
function postBuild() {
  // FIXME: find a vite hook on fileSaveEnd and nodeProcessEnded to stop this function
  return fs.promises.access('out/workbench.js').then(() =>
    fs.watchFile('out/workbench.js', async () => {
      const vscodePath = path.join(
        os.homedir(),
        'AppData/Local/Programs/Microsoft VS Code/resources/app/out/vs/code/electron-sandbox/workbench'
      )
      const remotePath = path.join(__dirname, 'out/workbench.js')
      const res = await preRead(vscodePath)
      await patchWorkbench(res, remotePath)
      console.log('patch vscode:', path.basename(res.workbench.customPath))
    })
  )
}

preBuild()
  .then(async () => {
    for (const c of config) {
      // https://github.com/vitejs/vite/issues/11424#issuecomment-1483847848
      await build(c)
    }
  })
  .then(() => (watch ? postBuild() : undefined))
  .catch(console.error)
