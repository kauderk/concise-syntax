// @ts-check
import fs from 'fs'
import { patchWorkbench, preRead } from './src/write'

fs.watchFile('out/workbench.js', async () => {
  const base =
    'C:/Users/kauder/AppData/Local/Programs/Microsoft VS Code/resources/app/out/vs/code/electron-sandbox/workbench'
  const path =
    'C:/Users/kauder/Documents/PC Installer/Github/zen-jsx/concise-syntax/out/workbench.js'
  await patchWorkbench(await preRead(base), path)
})
