import { extensionId } from 'src/shared/write'
import * as vscode from 'vscode'
import packageJson from '../../package.json'
import { updateSettingsCycle } from './settings'

let _item: vscode.StatusBarItem
/**
 * The icon's purpose is to indicate the workbench.ts script the extension is active.
 */
export async function ExtensionState_statusBarItem(
  context: vscode.ExtensionContext,
  wasActive?: boolean
) {
  // TODO: decouple the update from the status bar item

  const active = stateManager<'true' | 'false'>(
    context,
    extensionId + '.active'
  )
  if (wasActive !== undefined) {
    await active.write(wasActive ? 'true' : 'false')
  }

  const emitExtensionState = async (previous: boolean) => {
    // TODO: add a subscriber or something to update the settings before the tooltip
    await updateSettingsCycle(previous ? 'active' : 'inactive')
    _item.tooltip = `Concise Syntax: ` + (previous ? 'active' : 'inactive')
  }

  if (_item) {
    if (wasActive !== undefined) {
      await emitExtensionState(wasActive)
    }
    return
  }

  async function toggle(next: boolean) {
    await emitExtensionState(next)
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
  await emitExtensionState(getActive())
  item.show()
  context.subscriptions.push(item)
}

export function getStateStore(context: vscode.ExtensionContext) {
  return stateManager<'active' | 'restart' | 'disposed'>(
    context,
    extensionId + '.state'
  )
}
export function getErrorStore(context: vscode.ExtensionContext) {
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
