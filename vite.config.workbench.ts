import { defineConfig } from 'vite'
import { patchWorkbench, preRead } from './src/shared/write'
import path from 'path'
import os from 'os'
import fs from 'fs'
import { exec } from 'child_process'

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    outDir: 'out',
    emptyOutDir: false,
    lib: {
      entry: 'src/workbench/index.ts',
      name: 'workbench',
      fileName: () => 'workbench.js',
      formats: ['umd'],
    },
  },
})

// update package.json.d.ts
const file = 'package.json'
const jsonData = JSON.stringify(require(`./${file}`), null, 2)
fs.promises.writeFile(
  `${file}.d.ts`,
  `/** Generated with \`./json-d-ts.js\` */\ndeclare const data: ${jsonData}\nexport = data`
)

// tsc src/shared/uninstall.ts --outDir out/uninstall.js
exec('tsc src/shared/uninstall.ts --outDir out')

// FIXME: find a vite hook on fileSaveEnd and nodeProcessEnded to stop this function
fs.promises
  .access('out/workbench.js')
  .then(() =>
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
  .catch(() => {})
