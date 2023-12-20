import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import msg from './messages'
import { randomUUID } from 'crypto'
import packageJson from '../package.json'

const extensionId = packageJson.publisher + '.' + packageJson.name

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
async function installCycle(context: vscode.ExtensionContext) {
  const file = getWorkBenchHtmlData()
  const state = getStateStore(context)

  const backupUuid = await getBackupUuid(file.path)
  if (backupUuid) {
    console.log('vscode-concise-syntax is active!')
    statusBarItem(context).show()
    await state.write('active')
    return true
  }

  const error = getErrorStore(context)
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
      await error.write('throw')
      throw e
    }
  }

  // await performPatch(uuidSession)
  {
    let workbenchPath
    let ext = vscode.extensions.getExtension(extensionId)
    if (ext && ext.extensionPath) {
      workbenchPath = path.resolve(ext.extensionPath, 'out/workbench.js')
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

    const error = getErrorStore(context)
    try {
      await fs.promises.writeFile(file.path, html, 'utf-8')
    } catch (e) {
      vscode.window.showInformationMessage(msg.admin)
      reloadWindowMessage(msg.disabled)
      await error.write('error')
      return
    }

    // enabledRestart()

    await state.write('restart')
    return
  }
}
function reloadWindowMessage(message: string) {
  vscode.window
    .showInformationMessage(message, { title: msg.restartIde })
    .then((selection) => {
      if (selection) {
        vscode.commands.executeCommand('workbench.action.reloadWindow')
      }
    })
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
async function uninstallCycle(context: vscode.ExtensionContext) {
  const file = getWorkBenchHtmlData()
  const state = getStateStore(context)
  const error = getErrorStore(context)

  // if typescript wont won't freak out about promises then nothing matters :D
  // getBackupUuid
  const backupUuid = await getBackupUuid(file.path)

  if (!backupUuid) {
    // const message = msg.somethingWrong + 'no backup uuid found'
    // vscode.window.showInformationMessage(message)
    // await error.write('error')
    return backupUuid
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
      await error.write('throw')
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
  await state.write('restart')
  return backupUuid
}

// how do you make javascript freak out about promises/errors?
export function deactivate() {
  // FIXME: why is this hook not working? :(
  console.log('vscode-concise-syntax is deactivated!')
}

function getStateStore(context: vscode.ExtensionContext) {
  return stateManager<'active' | 'restart' | 'disposed'>(
    context,
    extensionId + '.state'
  )
}
function getErrorStore(context: vscode.ExtensionContext) {
  return stateManager<'error' | 'throw' | 'unhandled'>(
    context,
    extensionId + '.error'
  )
}

export async function activate(context: vscode.ExtensionContext) {
  const state = getStateStore(context)

  // FIXME: use a better state manager or state machine
  const file = getWorkBenchHtmlData()
  const backup = await getBackupUuid(file.path)

  const reloadCommand = packageJson.contributes.commands[0].command
  context.subscriptions.push(
    vscode.commands.registerCommand(reloadCommand, async () => {
      try {
        if (state.read() == 'active') {
          vscode.window.showInformationMessage('Already Mounted')
        } else {
          await uninstallCycle(context)
          await installCycle(context)
          if (!backup) {
            reloadWindowMessage(msg.enabled)
          } else {
            statusBarItem(context).show()
            vscode.window.showInformationMessage('Mount: using cache')
          }
        }
      } catch (error) {
        _catch(error)
      }
    })
  )
  const disposeCommand = packageJson.contributes.commands[1].command
  context.subscriptions.push(
    vscode.commands.registerCommand(disposeCommand, async () => {
      try {
        const backup = await uninstallCycle(context)
        statusBarItem(context).hide()

        const [message, ...options] = backup
          ? ['Disposed', 'Reload', 'Uninstall']
          : ['Already Disposed', 'Uninstall']
        // prettier-ignore
        const selection = await vscode.window.showInformationMessage(message, ...options)

        if (selection == 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow')
        } else if (selection == 'Uninstall') {
          vscode.commands.executeCommand(
            'workbench.extensions.action.uninstallExtension',
            extensionId
          )
        }
      } catch (error) {
        _catch(error)
      } finally {
        await state.write('disposed')
      }
    })
  )

  if (state.read() != 'disposed') {
    installCycle(context).catch(_catch)
  } else if (backup) {
    statusBarItem(context).show()
  }

  console.log('vscode-concise-syntax is active')

  function _catch(e: unknown) {
    console.error(e)
    const error = getErrorStore(context)
    error.write('unhandled').catch(() => {})
  }
}

function stateManager<T extends string>(
  context: vscode.ExtensionContext,
  key: string
) {
  return {
    value: '' as any,
    read() {
      return (this.value = context.globalState.get(key) as T | undefined)
    },
    async write(newState: T) {
      this.value = newState
      await context.globalState.update(key, newState)
      return newState
    },
  }
}

let _item: vscode.StatusBarItem
/**
 * The icon's purpose is to indicate the workbench.ts script the extension is active.
 */
function statusBarItem({ subscriptions }: vscode.ExtensionContext) {
  if (_item) return _item
  // FIXME: find a way to apply custom css on the client side from here
  // const myCommandId = packageJson.contributes.commands[1].command
  // subscriptions.push(
  //   vscode.commands.registerCommand(myCommandId, () => {
  //     vscode.window.showInformationMessage(
  //       `Clicked on concise syntax indicator`
  //     )
  //   })
  // )
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  )
  // myStatusBarItem.command = myCommandId
  item.text = `$(symbol-keyword) Concise`
  item.tooltip = `Concise Syntax: pending`
  item.show()
  subscriptions.push(item)
  return (_item = item)
}
