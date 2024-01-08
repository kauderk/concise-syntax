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
import { useGlobal, useState } from './utils'
import path from 'path'
import { deltaFn, deltaValue } from 'src/shared/utils'

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
let c_busy = false
let disposeClosedEditor = deltaFn(true)
let calibrate_confirmation_token = deltaValue<vscode.CancellationTokenSource>(
  (t) => t.dispose()
)

export async function ExtensionState_statusBarItem(
  context: vscode.ExtensionContext,
  setState: State
) {
  // TODO: decouple the update from the status bar item
  const extensionState = getStateStore(context)
  const windowState = getWindowState(context)
  const globalInvalidation = getGlobalAnyInvalidate(context)
  const calibrationState = getAnyCalibrate(context)
  debugger
  await windowState.write(setState)
  checkDisposedCommandContext(setState)

  async function REC_nextStateCycle(
    tryNext: State,
    settings: 'active' | 'inactive',
    overloads: {
      diff?: boolean
      calibratedThen?: boolean
    } = {}
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

      debugger
      disposeConfiguration.consume()

      if (
        !(overloads.calibratedThen || calibrationState.read() == state.active)
      ) {
        await defaultWindowState(_item, state.stale)
        busy = false
        return
      }

      _item.text = `$(${statusIconLoading})` + iconText
      const cash = await updateSettingsCycle(context, settings)

      /**
       * There is a cash waiting to be executed (invalidated)
       * The recursion/watcher was called
       * And the extension is active so now it will fall out of sync
       * Therefor the user deserves to know the settings.json is not up to date
       * It is rude to change the settings.json without the user's consent
       */
      // prettier-ignore
      if (typeof cash == 'function' && overloads.diff && tryNext == state.active && globalInvalidation.read() != state.active) {
        const res = await vscode.window.showInformationMessage(
          "The extension settings were invalidated while the extension was running. \
           Shall we add missing extension textMateRules if any and move them to the end to avoid conflicts?",
          'Yes and remember',
          'No and deactivate',
        )
        const next = res?.includes('Yes') ? state.active : state.inactive
        await globalInvalidation.write(next)
        await defaultWindowState(_item, next)
        busy = false
        return
      }

      // prettier-ignore
      if (typeof cash == 'function') {
        const task = createTask()
        const watcher = vscode.workspace.onDidChangeConfiguration(task.resolve)
        await cash()
        await Promise.race([
          task.promise, // either the configuration changes or the timeout
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ])
        watcher.dispose()
      }

      await defaultWindowState(_item, tryNext)

      // prettier-ignore
      if(tryNext == state.active)
      disposeConfiguration.fn = vscode.workspace.onDidChangeConfiguration(async (config) => {
				if (busy || !config.affectsConfiguration(key)) return
				const next = windowState.read()
				if (!next) return
				// TODO: add a throttle to be extra safe
				await REC_nextStateCycle(next, binary(next), {diff:true})
			}).dispose

      busy = false
    } catch (error: any) {
      debugger
      crashedMessage = error?.message || 'unknown'
      _item.text = `$(error)` + iconText
      _item.tooltip = IState.encode(state.error)
      _item.show()
      disposeConfiguration.consume()
    }
  }
  async function defaultWindowState(_item: vscode.StatusBarItem, next: State) {
    await windowState.write(next)
    _item.text = `$(${stateIcon})` + iconText
    _item.tooltip = IState.encode(next)
    await hold()

    if (next == state.disposed || next == state.stale) {
      _item.hide()
    } else {
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
      if (c_busy || busy) {
        vscode.window.showInformationMessage(
          'The extension is busy. Try again in a few seconds.'
        )
        return
      }

      // show
      try {
        c_busy = true

        calibrate_confirmation_token.consume()

        debugger
        const calibratedThen = calibrationState.read() === undefined
        // FIXME: get me out of here
        if (calibratedThen || windowState.read() == state.inactive) {
          // makes sense right? because having to activate two times is a bit annoying...
          await REC_nextStateCycle(state.active, state.active, {
            calibratedThen,
          })
        }

        await tryUpdateCalibrateState('opening')
        const document = await vscode.workspace.openTextDocument(uriRemote)
        const editor = await vscode.window.showTextDocument(document, {
          preview: false,
          preserveFocus: false,
        })

        disposeClosedEditor.fn = onDidCloseTextDocument(async (doc) => {
          if (doc.uri.path === uriRemote.path && editor.document.isClosed) {
            await consume_close()
            return true
          }
        })

        await new Promise((resolve) => setTimeout(resolve, 1000)) // FIXME: find the perfect time to notify the dom
        await tryUpdateCalibrateState('opened', 500)

        checkCalibratedCommandContext(state.active)

        const progressSeconds = 10
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Window,
            title: 'Concise Syntax was calibrated you may close the file',
            cancellable: true,
          },
          // prettier-ignore
          async () => new Promise(async (resolve) => {
            calibrate_confirmation_token.value = new vscode.CancellationTokenSource()
            const dispose = calibrate_confirmation_token.value.token.onCancellationRequested(() => {
              calibrate_confirmation_token.consume()
              dispose()
              resolve(null)
            }).dispose
            for (let i = 0; i < progressSeconds; i++) {
              await hold(1_000)
            }
            resolve(null)
          })
        )

        c_busy = false
      } catch (error: any) {
        debugger
        await consume_close()
        vscode.window.showErrorMessage(
          `Error: failed to open calibrate file -> ${error?.message}`
        )
      }
      function consume_close() {
        disposeClosedEditor.consume()
        return tryUpdateCalibrateState('closed')
      }
      function tryUpdateCalibrateState(state: Calibrate, t = 100) {
        _calibrate!.tooltip = state
        return hold(t)
      }
    })
  )
  async function checkCalibratedCommandContext(next: State) {
    vscode.commands.executeCommand(
      'setContext',
      'extension.calibrated',
      next == state.active
    )
    // https://stackoverflow.com/a/74468400
    await calibrationState.write(next)
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
      calibrate_confirmation_token.consume()
    },
  })
}

export function checkDisposedCommandContext(next?: State) {
  vscode.commands.executeCommand(
    'setContext',
    'extension.disposed',
    next == state.disposed
  )
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

export function getAnyCalibrate(context: vscode.ExtensionContext) {
  return useState<State>(context, extensionId + '.calibrate')
}
export function getGlobalAnyInvalidate(context: vscode.ExtensionContext) {
  return useGlobal<State>(context, extensionId + '.global.invalidate')
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
function hold(t = 100) {
  return new Promise((resolve) => setTimeout(resolve, t))
}
