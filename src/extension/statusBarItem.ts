import { extensionId } from 'src/shared/write'
import * as vscode from 'vscode'
import packageJson from '../../package.json'
import { updateSettingsCycle } from './settings'
import { IState, State, state } from 'src/shared/state'

let _item: vscode.StatusBarItem

/**
 * The icon's purpose is to indicate the workbench.ts script the extension is active.
 */
let statusIcon = 'symbol-keyword'
let statusIconLoading = 'loading~spin'
let busy: boolean | undefined

export async function ExtensionState_statusBarItem(
  context: vscode.ExtensionContext,
  setState: State
) {
  // TODO: decouple the update from the status bar item

  const windowState = getWindowState(context)
  if (setState !== undefined) {
    await windowState.write(setState)
  }

  const emitExtensionState = async (next: State) => {
    // TODO: add a subscriber or something to update the settings before the tooltip
    await updateSettingsCycle(binary(next))
    _item.tooltip = IState.encode(next)
  }

  if (_item) {
    if (setState !== undefined) {
      await emitExtensionState(setState)
      if (setState != 'disposed') {
        _item.show()
      } else {
        _item.hide()
      }
    }
    return
  }

  const myCommandId = packageJson.contributes.commands[2].command
  context.subscriptions.push(
    vscode.commands.registerCommand(myCommandId, async () => {
      const extensionState = getStateStore(context)
      if (extensionState.read() == 'disposed') {
        return vscode.window.showInformationMessage(
          'The extension is disposed. Mount it to use this command.'
        )
      }
      if (busy) {
        return vscode.window.showInformationMessage(
          'The extension is busy. Try again in a few seconds.'
        )
      }

      try {
        busy = true
        _item.text = `$(${statusIconLoading}) Concise`
        const next = flip(windowState.read())
        await updateSettingsCycle(next)
        await windowState.write(next)
        if (next == 'active') {
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
        _item.text = `$(${statusIcon}) Concise`
        _item.tooltip = IState.encode(next)
        busy = false
      } catch (error) {
        _item.text = `$(error) Concise`
        _item.tooltip = IState.encode(state.error)
        busy = undefined
      }
    })
  )
  const item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  )
  _item = item
  item.command = myCommandId
  item.text = `$(${statusIcon}) Concise`
  await emitExtensionState(windowState.read() ?? 'active')
  item.show()
  context.subscriptions.push(item)
}

export function binary(state?: State) {
  return state == 'active' ? 'active' : 'inactive'
}
function flip(next?: State) {
  return next == 'active' ? 'inactive' : 'active'
}

export function getWindowState(context: vscode.ExtensionContext) {
  return stateManager<State>(context, extensionId + '.window')
}
export function getStateStore(context: vscode.ExtensionContext) {
  return stateManager<'active' | 'disposed'>(
    context,
    extensionId + '.extension'
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
