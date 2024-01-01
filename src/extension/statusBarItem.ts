import { extensionId } from 'src/shared/write'
import * as vscode from 'vscode'
import packageJson from '../../package.json'
import { key, updateSettingsCycle } from './settings'
import { IState, State, state } from 'src/shared/state'

let _item: vscode.StatusBarItem | undefined

/**
 * The icon's purpose is to indicate the workbench.ts script the extension is active.
 */
let statusIcon = 'symbol-keyword'
let statusIconLoading = 'loading~spin'
const iconText = '' //' Concise'
let busy: boolean | undefined
let disposeConfiguration = () => {}
let crashedMessage = ''

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

  async function REC_nextStateCycle(
    next: State,
    settings: 'active' | 'inactive'
  ) {
    if (!_item) {
      vscode.window.showErrorMessage('No status bar item found')
      return
    } else if (crashedMessage) {
      vscode.window.showErrorMessage(
        `The extension crashed when updating .vscode/settings.json with property ${key}.textMateRules with error: ${crashedMessage}`
      )
      return
    }

    try {
      busy = true

      disposeConfiguration()

      _item.text = `$(${statusIconLoading})` + iconText
      const task = createTask()
      const change = vscode.workspace.onDidChangeConfiguration(task.resolve)
      await updateSettingsCycle(settings)
      await windowState.write(next)
      await Promise.race([
        task.promise, // either the configuration changes or the timeout
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ])
      change.dispose()
      _item.text = `$(${statusIcon})` + iconText
      _item.tooltip = IState.encode(next)
      // hold this thread and allow the dom to render the IState
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (next != state.disposed) {
        _item.show()
      } else {
        _item.hide()
      }

      // prettier-ignore
      disposeConfiguration = vscode.workspace.onDidChangeConfiguration(async (config) => {
				if (!config.affectsConfiguration(key)) return
				const next = windowState.read()
				if (!next) return
				debugger
				await REC_nextStateCycle(next, binary(next))
			}).dispose

      busy = false
    } catch (error: any) {
      crashedMessage = error?.message || 'unknown'
      _item.text = `$(error)` + iconText
      _item.tooltip = IState.encode(state.error)
      _item.show()
    }
  }
  if (_item) {
    await REC_nextStateCycle(setState, binary(setState))
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
      await REC_nextStateCycle(next, next)
    })
  )

  _item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
  _item.command = myCommandId

  context.subscriptions.push({
    dispose() {
      disposeConfiguration()
    },
  })

  const next = windowState.read() ?? 'active'
  await REC_nextStateCycle(next, binary(next))

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

function createTask() {
  let resolve = (value?: unknown) => {},
    reject = () => {}
  const promise = new Promise((_resolve, _reject) => {
    reject = _reject
    resolve = _resolve
  })
  return { promise, resolve, reject }
}
