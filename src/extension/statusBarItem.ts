import { extensionId } from 'src/shared/write'
import * as vscode from 'vscode'
import packageJson from '../../package.json'
import { updateSettingsCycle } from './settings'
import { IState, State, state } from 'src/shared/state'

let _item: vscode.StatusBarItem | undefined

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
  await windowState.write(setState)

  vscode.commands.executeCommand(
    'setContext',
    'extension.disposed',
    setState == state.disposed
  )

  async function nextStateCycle(next: State, settings: 'active' | 'inactive') {
    if (!_item) {
      vscode.window.showErrorMessage('No status bar item found')
      return
    }

    try {
      busy = true
      _item.text = `$(${statusIconLoading}) Concise`
      await updateSettingsCycle(settings)
      await windowState.write(next)
      if (next == state.active) {
        // TODO: figure out when exactly the settings update the dom
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
      _item.text = `$(${statusIcon}) Concise`
      _item.tooltip = IState.encode(next)
      // hold this thread and allow the dom to render the IState
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (next != state.disposed) {
        _item.show()
      } else {
        _item.hide()
      }
      busy = false
    } catch (error) {
      _item.text = `$(error) Concise`
      _item.tooltip = IState.encode(state.error)
      _item.show()
      busy = undefined
    }
  }
  if (_item) {
    await nextStateCycle(setState, binary(setState))
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

      const next = flip(windowState.read())
      await nextStateCycle(next, next)
    })
  )

  _item = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  )
  _item.command = myCommandId

  const next = windowState.read() ?? 'active'
  await updateSettingsCycle(binary(next))
  if (next == state.active) {
    // TODO: figure out when exactly the settings update the dom
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  _item.text = `$(${statusIcon}) Concise`
  _item.tooltip = IState.encode(next)
  // hold this thread and allow the dom to render the IState
  await new Promise((resolve) => setTimeout(resolve, 100))
  if (next != state.disposed) {
    _item.show()
  }

  context.subscriptions.push(_item)
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
  return stateManager<'active' | 'inactive' | 'disposed'>(
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
