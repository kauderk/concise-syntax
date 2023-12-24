import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import msg from '../shared/messages'
import packageJson from '../../package.json'
import {
  extensionId,
  extensionScriptTag,
  preRead,
  patchWorkbench,
} from '../shared/write'

async function installCycle(context: vscode.ExtensionContext) {
  const state = getStateStore(context)

  const res = await read()
  if (res.wasActive) {
    console.log('vscode-concise-syntax is active!')
    await statusBarItem(context, true)
    await state.write('active')
    return true
  }

  let remoteWorkbenchPath
  let ext = vscode.extensions.getExtension(extensionId)
  if (ext && ext.extensionPath) {
    remoteWorkbenchPath = path.resolve(ext.extensionPath, 'out/workbench.js')
  } else {
    remoteWorkbenchPath = path.resolve(__dirname, 'index.js')
  }
  await patchWorkbench(res, remoteWorkbenchPath)

  await state.write('restart')
}

async function uninstallCycle(context: vscode.ExtensionContext) {
  const state = getStateStore(context)

  const { html, wasActive, workbench } = await read()
  if (wasActive) {
    const newHtml = html.replaceAll(extensionScriptTag(), '')
    await fs.promises.writeFile(workbench.path, newHtml, 'utf-8')
  }
  await fs.promises.unlink(workbench.customPath).catch(_catch)
  await state.write('restart')

  return wasActive
}
// how do you make javascript freak out about promises/errors?
export function deactivate() {
  // FIXME: why is this hook not working? :(
  console.log('vscode-concise-syntax is deactivated!')
}

export async function activate(context: vscode.ExtensionContext) {
  const state = getStateStore(context)

  // FIXME: use a better state manager or state machine
  const { wasActive } = await read()

  const reloadCommand = packageJson.contributes.commands[0].command
  context.subscriptions.push(
    vscode.commands.registerCommand(reloadCommand, async () => {
      try {
        if (state.read() == 'active') {
          vscode.window.showInformationMessage('Already Mounted')
        } else {
          await uninstallCycle(context)
          await installCycle(context)
          if (!wasActive) {
            reloadWindowMessage(msg.enabled)
          } else {
            await statusBarItem(context, true)
            vscode.window.showInformationMessage('Mount: using cache', 'Reload')
          }
        }
      } catch (error) {
        __catch(error)
      }
    })
  )
  const disposeCommand = packageJson.contributes.commands[1].command
  context.subscriptions.push(
    vscode.commands.registerCommand(disposeCommand, async () => {
      try {
        const wasActive = await uninstallCycle(context)
        await statusBarItem(context, false)

        const [message, ...options] = wasActive
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
        __catch(error)
      } finally {
        await state.write('disposed')
      }
    })
  )

  type DeepPartial<T> = T extends object
    ? {
        [P in keyof T]?: DeepPartial<T[P]>
      }
    : T
  type Writeable<T> = { -readonly [P in keyof T]: T[P] } & {
    [x: string]: unknown
  }
  type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> }

  const key = 'editor.tokenColorCustomizations'
  const textMateRules = [
    {
      name: 'kauderk.concise-syntax.text',
      scope: ['meta.jsx.children.tsx'],
      settings: {
        foreground: '#B59E7A',
      },
    },
    {
      name: 'kauderk.concise-syntax.redundant',
      scope: [
        'punctuation.definition.tag.begin.tsx',
        'punctuation.definition.tag.end.tsx',
        'punctuation.section.embedded.begin.tsx',
        'punctuation.section.embedded.end.tsx',
        'punctuation.terminator.statement.tsx',
        'concise.redundant-syntax',
      ],
      settings: {
        foreground: '#00b51b00',
      },
    },
    {
      name: 'kauderk.concise-syntax.quote.begin',
      scope: ['punctuation.definition.string.begin.tsx'],
      settings: {
        foreground: '#b5a90000',
      },
    },
    {
      name: 'kauderk.concise-syntax.quote.end',
      scope: ['punctuation.definition.string.end.tsx'],
      settings: {
        foreground: '#b5030000',
      },
    },
  ]

  const operation = 'add' as 'remove' | 'add'
  // TODO: avoid writing defensive code, someone else surely knows a better way to do this

  if (state.read() != 'disposed') {
    installCycle(context)
      .then(() => {
        if (!wasActive) {
          reloadWindowMessage(msg.enabled)
        }
      })
      .catch(__catch)
  } else if (wasActive) {
    await statusBarItem(context)
  }

  console.log('vscode-concise-syntax is active')

  function __catch(e: unknown) {
    console.error(e)
    const error = getErrorStore(context)
    error.write('unhandled').catch(_catch)
  }
}
function _catch(e: unknown) {}

async function read() {
  if (!require.main?.filename) {
    vscode.window.showErrorMessage(msg.internalError + 'no main filename')
    throw new Error('no main filename')
  }
  const appDir = path.dirname(require.main.filename)
  const base = path.join(appDir, 'vs', 'code', 'electron-sandbox', 'workbench')
  return await preRead(base)
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
async function statusBarItem(
  context: vscode.ExtensionContext,
  wasActive?: boolean
) {
  const active = stateManager<'true' | 'false'>(
    context,
    extensionId + '.active'
  )
  if (activate !== undefined) {
    await active.write(wasActive ? 'true' : 'false')
  }

  const tooltip = (previous: boolean) =>
    (_item.tooltip = `Concise Syntax: ` + (previous ? 'active' : 'inactive'))

  if (_item) {
    if (wasActive !== undefined) {
      tooltip(wasActive)
    }
    return
  }

  async function toggle(next: boolean) {
    tooltip(next)
    await active.write(next ? 'true' : 'false')
  }
  const getActive = () => !!JSON.parse(active.read() ?? 'false')

  const myCommandId = packageJson.contributes.commands[2].command
  context.subscriptions.push(
    vscode.commands.registerCommand(myCommandId, async () => {
      await toggle(!getActive())
    })
  )
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  )
  _item = item
  item.command = myCommandId
  item.text = `$(symbol-keyword) Concise`
  tooltip(getActive())
  item.show()
  context.subscriptions.push(item)
}
