import { extensionId } from 'src/shared/write'
import * as vscode from 'vscode'
import packageJson from '../../package.json'
import { key, updateSettingsCycle } from './settings'
import {
  IState,
  State,
  calibrationFileName,
  state,
  stateIcon,
} from 'src/shared/state'
import { Calibrate, calibrateIcon } from 'src/shared/state'
import { useState } from './utils'
import path from 'path'
import { deltaFn } from 'src/shared/utils'

/**
 * The icon's purpose is to indicate the workbench.ts script the extension is active.
 */
let _item: vscode.StatusBarItem | undefined
const statusIconLoading = 'loading~spin'
const iconText = '' //' Concise'
let busy: boolean | undefined
let disposeConfiguration = deltaFn()
let crashedMessage = ''

let _calibrate: vscode.StatusBarItem | undefined
let c_state: undefined | boolean = false
let c_busy = false
let disposeClosedEditor = deltaFn(true)
let isCalibrating = deltaFn<() => boolean>(true)

export async function ExtensionState_statusBarItem(
  context: vscode.ExtensionContext,
  setState: State
) {
  // TODO: decouple the update from the status bar item
  const extensionState = getStateStore(context)
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

      disposeConfiguration.consume()

      _item.text = `$(${statusIconLoading})` + iconText
      const task = createTask()
      const watcher = vscode.workspace.onDidChangeConfiguration(task.resolve)
      const cash = await updateSettingsCycle(context, settings)
      await windowState.write(next)
      await Promise.race([
        task.promise, // either the configuration changes or the timeout
        new Promise((resolve) => setTimeout(resolve, !cash ? 3000 : 0)),
      ])
      watcher.dispose()
      _item.text = `$(${stateIcon})` + iconText
      _item.tooltip = IState.encode(next)
      await hold()
      // FIXME: get me out of here
      if (!cash && isCalibrating.fn?.()) {
        debugger
        await tryUpdateCalibrateState('invalidate')
          .then(() => tryUpdateCalibrateState('idle'))
          .catch(() => {
            vscode.window.showErrorMessage('Failed to invalidate calibration')
          })
      }

      if (next != state.disposed) {
        _item.show()
      } else {
        _item.hide()
      }

      // prettier-ignore
      disposeConfiguration.fn = vscode.workspace.onDidChangeConfiguration(async (config) => {
				if (busy || !config.affectsConfiguration(key)) return
				const next = windowState.read()
				if (!next) return
				// TODO: add a throttle to be extra safe
				await REC_nextStateCycle(next, binary(next))
			}).dispose

      busy = false
    } catch (error: any) {
      debugger
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

  const toggleCommand = packageJson.contributes.commands[2].command
  context.subscriptions.push(
    vscode.commands.registerCommand(toggleCommand, async () => {
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

  const remoteCalibratePath = path.join(__dirname, calibrationFileName)
  const uriRemote = vscode.Uri.file(remoteCalibratePath)

  const calibrateCommand = packageJson.contributes.commands[3].command
  context.subscriptions.push(
    vscode.commands.registerCommand(calibrateCommand, async () => {
      if (!_calibrate) {
        vscode.window.showErrorMessage('No status bar item found')
        return
      }
      if (extensionState.read() == 'disposed') {
        return vscode.window.showInformationMessage(
          'The extension is disposed. Mount it to use this command.'
        )
      }
      if (c_state === undefined) {
        vscode.window.showErrorMessage(
          'Error: cannot calibrate because there is no valid state'
        )
        return
      }
      if (c_busy || busy) {
        vscode.window.showInformationMessage(
          'The extension is busy. Try again in a few seconds.'
        )
        return
      }

      // show
      try {
        c_busy = true

        // FIXME: get me out of here
        if (windowState.read() == state.inactive) {
          // makes sense right? because having to activate two times is a bit annoying...
          await REC_nextStateCycle(state.active, state.active)
        }

        // click - state was bootUp or closed
        if (c_state === false) {
          c_state = true

          await tryUpdateCalibrateState('opening')
          const document = await vscode.workspace.openTextDocument(uriRemote)
          const editor = await vscode.window.showTextDocument(document, {
            preview: false,
            preserveFocus: false,
          })

          isCalibrating.fn = () => !!c_state && !editor.document.isClosed

          disposeClosedEditor.fn = onDidCloseTextDocument(async (doc) => {
            if (doc.uri.path === uriRemote.path && editor.document.isClosed) {
              c_state = false
              await consume_close()
              return true
            }
          })

          await new Promise((resolve) => setTimeout(resolve, 1000)) // FIXME: find the perfect time to notify the dom
          await tryUpdateCalibrateState('opened')
          await tryUpdateCalibrateState('idle')

          // click
        } else if (c_state === true) {
          c_state = false
          consume()

          await closeFileIfOpen(uriRemote)
          await tryUpdateCalibrateState('closed')

          // just be extra safe
        } else {
          throw new Error('Invalid state')
        }

        c_busy = false
      } catch (error: any) {
        debugger
        c_state = undefined
        await consume_close()
        vscode.window.showErrorMessage(
          `Error: failed to open calibrate file -> ${error?.message}`
        )
      }
      function consume() {
        isCalibrating.consume()
        disposeClosedEditor.consume()
      }
      function consume_close() {
        consume()
        return tryUpdateCalibrateState('closed')
      }
    })
  )
  function tryUpdateCalibrateState(state: Calibrate) {
    if (!_calibrate) return Promise.reject('you are messing up')
    _calibrate.tooltip = state
    return hold()
  }

  _item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
  _item.command = toggleCommand

  _calibrate = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    0
  )
  _calibrate.command = calibrateCommand
  _calibrate.text = `$(${calibrateIcon})`
  _calibrate.tooltip = 'bootUp'
  _calibrate.show()

  const next = windowState.read() ?? 'active'
  await REC_nextStateCycle(next, binary(next))

  context.subscriptions.push(_item, {
    dispose() {
      disposeConfiguration.consume()
      disposeClosedEditor.consume()
    },
  })
}

function onDidCloseTextDocument(
  tryClose: (doc: { uri: { path: string } }) => Promise<boolean | undefined>
) {
  // https://github.com/microsoft/vscode/issues/102737#issuecomment-660208607
  // prettier-ignore
  return (vscode.window as any).tabGroups?.onDidChangeTabs?.(async (changedEvent:any) => {
		for (const doc of Array.from(changedEvent.closed)) {
			if (await tryClose((doc as any).input)) {
				return
			}
		}
	})?.dispose || 
	// this is delayed by 4-5 minutes, so it's not reliable
	vscode.workspace.onDidCloseTextDocument(async (doc) => {
		if (await tryClose(doc)) {
			// noop
		} else{
			// sometimes the callback decides to not work :D
			for (const editor of vscode.window.visibleTextEditors) {
				if (await tryClose(editor.document)) {
					return
				}
			}
		}
	}).dispose
}
// prettier-ignore
// If they deprecate it for good then close whatever is open :(
async function closeFileIfOpen(file: vscode.Uri) {
	try {
		// @ts-ignore
		const tabs: any = vscode.window.tabGroups.all.map(tg => tg.tabs).flat();
		// @ts-ignore
		const index = tabs.findIndex(tab => tab.input instanceof vscode.TabInputText && tab.input.uri.path === file.path);
		if (index !== -1) {
			// @ts-ignore
				return await vscode.window.tabGroups.close(tabs[index]);
		}
	} catch (error) {
		vscode.commands.executeCommand('workbench.action.closeActiveEditor')
	}
}

export function binary(state?: State) {
  return state == 'active' ? 'active' : 'inactive'
}
function flip(next?: State) {
  return next == 'active' ? 'inactive' : 'active'
}

export function getWindowState(context: vscode.ExtensionContext) {
  return useState<State>(context, extensionId + '.window')
}
export function getStateStore(context: vscode.ExtensionContext) {
  return useState<'active' | 'inactive' | 'disposed'>(
    context,
    extensionId + '.extension'
  )
}
export function getErrorStore(context: vscode.ExtensionContext) {
  return useState<'error' | 'throw' | 'unhandled'>(
    context,
    extensionId + '.error'
  )
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

// hold this thread and allow the dom to render the state
function hold() {
  return new Promise((resolve) => setTimeout(resolve, 100))
}
