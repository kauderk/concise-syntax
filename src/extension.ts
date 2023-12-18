import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import msg from './messages'
import { randomUUID } from 'crypto'

function getWorkBenchHtmlData() {
  if (!require.main?.filename) {
    vscode.window.showErrorMessage(msg.internalError + 'no main filename')
    throw new Error('no main filename')
  }
  const appDir = path.dirname(require.main.filename)
  const base = path.join(appDir, 'vs', 'code')
  const workbenchPath = path.join(
    base,
    'electron-sandbox',
    'workbench',
    'workbench.html'
  )
  const getBackupPath = (uuid: string) =>
    path.join(
      base,
      'electron-sandbox',
      'workbench',
      `workbench.${uuid}.bak-concise-syntax`
    )
  return { path: workbenchPath, getBackupPath }
}
async function installImpl() {
  const file = getWorkBenchHtmlData()

  const backupUuid = await getBackupUuid(file.path)
  if (backupUuid) {
    console.log('vscode-concise-syntax is active!')
    return
  }

  const uuidSession: string = randomUUID()
  // await createBackup(uuidSession)
  {
    try {
      const html = await fs.promises
        .readFile(file.path, 'utf-8')
        .then(clearExistingPatches)
      await fs.promises.writeFile(
        file.getBackupPath(uuidSession),
        html,
        'utf-8'
      )
    } catch (e) {
      vscode.window.showInformationMessage(msg.admin)
      throw e
    }
  }

  // await performPatch(uuidSession)
  {
    let workbenchPath
    let ext = vscode.extensions.getExtension('kauderk.vscode-concise-syntax')
    if (ext && ext.extensionPath) {
      workbenchPath = path.resolve(ext.extensionPath, 'dist/workbench.js')
    } else {
      workbenchPath = path.resolve(__dirname, 'workbench.js')
    }
    const indicatorJsContent = await fs.promises.readFile(
      workbenchPath,
      'utf-8'
    )
    const iifeWorkbench = `<script>${indicatorJsContent}</script>`

    // prettier-ignore
    const html = (await fs.promises
      .readFile(file.path, 'utf-8')
      .then(clearExistingPatches))
      .replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, '')
      .replace(
        /(<\/html>)/,
        `<!-- !! VSCODE-CONCISE-SYNTAX-SESSION-ID ${uuidSession} !! -->\n` +
          '<!-- !! VSCODE-CONCISE-SYNTAX-START !! -->\n' +
          iifeWorkbench +
          '<!-- !! VSCODE-CONCISE-SYNTAX-END !! -->\n</html>'
      )

    try {
      await fs.promises.writeFile(file.path, html, 'utf-8')
    } catch (e) {
      vscode.window.showInformationMessage(msg.admin)
      disabledRestart()
      return
    }

    // enabledRestart()
    vscode.window
      .showInformationMessage(msg.enabled, { title: msg.restartIde })
      .then(reloadWindow)
  }

  console.log('vscode-concise-syntax is active!')
}
function clearExistingPatches(html: string) {
  return html
    .replace(
      /<!-- !! VSCODE-CONCISE-SYNTAX-START !! -->[\s\S]*?<!-- !! VSCODE-CONCISE-SYNTAX-END !! -->\n*/,
      ''
    )
    .replace(/<!-- !! VSCODE-CONCISE-SYNTAX-SESSION-ID [\w-]+ !! -->\n*/g, '')
}
async function getBackupUuid(path: string) {
  try {
    const uid = (await fs.promises.readFile(path, 'utf-8')) //
      .match(/<!-- !! VSCODE-CONCISE-SYNTAX-SESSION-ID ([0-9a-fA-F-]+) !! -->/)
    if (!uid) return null
    else return uid[1]
  } catch (e) {
    vscode.window.showInformationMessage(msg.somethingWrong + e)
    throw e
  }
}
export async function uninstall() {
  return uninstallImpl().then(disabledRestart).catch(_catch)
}
async function uninstallImpl() {
  const file = getWorkBenchHtmlData()

  // if typescript wont won't freak out about promises then nothing matters :D
  // getBackupUuid
  const backupUuid = await getBackupUuid(file.path)

  if (!backupUuid) {
    vscode.window.showInformationMessage(
      msg.somethingWrong + 'no backup uuid found'
    )
    return
  }
  // restoreBackup
  const backupFilePath = file.getBackupPath(backupUuid)
  {
    try {
      if (fs.existsSync(backupFilePath)) {
        await fs.promises.unlink(file.path)
        await fs.promises.copyFile(backupFilePath, file.path)
      }
    } catch (e) {
      vscode.window.showInformationMessage(msg.admin)
      throw e
    }
  }

  // deleteBackupFiles
  {
    const htmlDir = path.dirname(file.path)
    const htmlDirItems = await fs.promises.readdir(htmlDir)
    for (const item of htmlDirItems) {
      if (item.endsWith('.bak-concise-syntax')) {
        await fs.promises.unlink(path.join(htmlDir, item))
      }
    }
  }
}

function reloadWindow() {
  // reload vscode-window
  vscode.commands.executeCommand('workbench.action.reloadWindow')
}

function disabledRestart() {
  vscode.window
    .showInformationMessage(msg.disabled, { title: msg.restartIde })
    .then(reloadWindow)
}

function _catch(e: unknown) {
  console.error(e)
}
// how do you make javascript freak out about promises/errors?
// export function deactivate() {
//   return uninstallImpl().catch(_catch)
// }
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.reload', () => {
      return uninstallImpl().then(installImpl).catch(_catch)
    })
  )

  return installImpl().catch(_catch)
}
