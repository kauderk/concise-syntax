import path from 'path'
import {
  extensionId,
  patchWorkbench,
  extensionScriptTag,
  preRead,
} from 'src/shared/write'
import { _catch } from './utils'
import * as vscode from 'vscode'
import * as fs from 'fs'
import msg from '../shared/messages'

export async function installCycle(context: vscode.ExtensionContext) {
  const res = await read()
  if (res.wasActive) {
    return res.wasActive
  }

  let remoteWorkbenchPath
  let ext = vscode.extensions.getExtension(extensionId)
  if (ext && ext.extensionPath) {
    remoteWorkbenchPath = path.resolve(ext.extensionPath, 'out/workbench.js')
  } else {
    remoteWorkbenchPath = path.resolve(__dirname, 'index.js')
  }
  await patchWorkbench(res, remoteWorkbenchPath)
}

export async function uninstallCycle(context: vscode.ExtensionContext) {
  const { html, wasActive, workbench } = await read()
  if (wasActive) {
    const newHtml = html.replaceAll(extensionScriptTag(), '')
    await fs.promises.writeFile(workbench.path, newHtml, 'utf-8')
  }
  await fs.promises.unlink(workbench.customPath).catch(_catch)

  return wasActive
}
// how do you make javascript freak out about promises/errors?
export function deactivateCycle() {
  // FIXME: why is this hook not working? :(
  console.log('vscode-concise-syntax is deactivated!')
}
export async function read() {
  if (!require.main?.filename) {
    vscode.window.showErrorMessage(msg.internalError + 'no main filename')
    throw new Error('no main filename')
  }
  const appDir = path.dirname(require.main.filename)
  const base = path.join(appDir, 'vs', 'code', 'electron-sandbox', 'workbench')
  return await preRead(base)
}
