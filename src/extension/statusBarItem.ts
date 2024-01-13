import * as vscode from 'vscode'
import packageJson from '../../package.json'
import { key, updateSettingsCycle } from './settings'
import {
  IState,
  State,
  calibrate,
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

type UsingContext = { stores: Stores; context: vscode.ExtensionContext }

export async function ExtensionState_statusBarItem(
  context: vscode.ExtensionContext,
  setState: State
) {
  // TODO: decouple the update from the status bar item
  const stores = getStores(context)
  await stores.windowState.write(setState)
  const usingContext = { stores, context }
  checkDisposedCommandContext(setState)

  if (_item) {
    return REC_nextWindowStateCycle(setState, binary(setState), usingContext)
  }

  // This section will be called once because you are counting on the _item to be defined
  // and you are counting on the scope closure to keep the context

  const toggleCommand = packageJson.contributes.commands[2].command
  _item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
  _item.command = toggleCommand

  const remoteCalibratePath = path.join(__dirname, calibrationFileName)
  const uriRemote = vscode.Uri.file(remoteCalibratePath)
  const calibrateCommand = packageJson.contributes.commands[3].command
  // prettier-ignore
  _calibrate = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
  _calibrate.command = calibrateCommand
  defaultCalibrate(_calibrate)

  const next = setState ?? 'active'
  await REC_nextWindowStateCycle(next, binary(next), usingContext)

  context.subscriptions.push(
    _item,
    vscode.commands.registerCommand(toggleCommand, () =>
      toggleCommandCycle(usingContext)
    ),
    _calibrate,
    vscode.commands.registerCommand(calibrateCommand, () =>
      calibrateCommandCycle(uriRemote, usingContext)
    ),
    {
      dispose() {
        disposeConfiguration.consume()
        disposeClosedEditor.consume()
        calibrate_confirmation_token.consume()
      },
    }
  )
}

async function REC_windowStateSandbox(
  tryNext: State,
  settings: 'active' | 'inactive',
  usingContext: UsingContext & { _item: vscode.StatusBarItem },
  recursiveDiff?: boolean
) {
  debugger
  const { stores, context, _item } = usingContext

  if (stores.calibrationState.read() != state.active) {
    await defaultWindowState(_item, state.stale, stores.windowState)
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
  if (typeof cash == 'function' && recursiveDiff && tryNext == state.active && stores.globalInvalidation.read() != state.active) {
    await defaultWindowState(_item, state.stale, stores.windowState)
    const res = await vscode.window.showInformationMessage(
      "The extension settings were invalidated while the extension was running. \
        Shall we add missing extension textMateRules if any and move them to the end to avoid conflicts?",
      'Yes and remember',
      'No and deactivate',
    )
    const next = res?.includes('Yes') ? state.active : state.inactive
    await stores.globalInvalidation.write(next)

    if( next == state.inactive){
      await defaultWindowState(_item, next, stores.windowState)
      return
    }
  }

  if (typeof cash == 'function') {
    if (recursiveDiff) {
      withProgress({
        title: 'Concise Syntax: revalidating...',
        seconds: 5,
      })
    }
    const task = createTask()
    const watcher = vscode.workspace.onDidChangeConfiguration(task.resolve)
    await cash()
    await Promise.race([
      task.promise, // either the configuration changes or the timeout
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ])
    watcher.dispose()
  }

  await defaultWindowState(_item, tryNext, stores.windowState)

  // prettier-ignore
  if(tryNext == state.active)
  disposeConfiguration.fn = vscode.workspace.onDidChangeConfiguration(async (config) => {
    if (busy || !config.affectsConfiguration(key)) return
    const next = stores.windowState.read()
    if (!next) return
    // TODO: add a throttle to be extra safe
    await REC_nextWindowStateCycle(next, binary(next), usingContext, recursiveDiff)
  }).dispose
}

async function calibrateStateSandbox(
  uriRemote: vscode.Uri,
  usingContext: { stores: Stores; context: vscode.ExtensionContext },
  _calibrate: vscode.StatusBarItem
) {
  const { stores } = usingContext

  if (stores.globalCalibration.read() != state.active) {
    const res = await vscode.window.showInformationMessage(
      'The Concise Syntax extension will add/remove textMateRules in .vscode/settings.json to sync up with the window state. \
      Do you want to continue?',
      'Yes and remember',
      'No and deactivate'
    )
    const next = res?.includes('Yes') ? state.active : state.inactive
    await stores.globalCalibration.write(next)
    checkCalibratedCommandContext(next, stores.calibrationState)

    if (next == state.inactive && stores.windowState.read() != state.active) {
      return
    }
  } else {
    // seems dumb but if "globalCalibration" is active, then "calibrationState" should be active too
    checkCalibratedCommandContext(state.active, stores.calibrationState)
  }
  debugger

  withProgress({
    title: 'Concise Syntax: calibrating...',
    seconds: 10,
  })

  // FIXME: get me out of here
  testShortCircuitWindowState = true
  // update the settings before showing the calibration file and risking the user to close it while the procedure is waiting
  await REC_nextWindowStateCycle(state.inactive, state.inactive, usingContext)
  testShortCircuitWindowState = false
  if (stores.windowState.read() != state.active && _item) {
    // this would be a cold start or a restart...
    await defaultWindowState(_item, 'active', stores.windowState)
  }

  await tryUpdateCalibrateState(calibrate.opening, _calibrate)
  const document = await vscode.workspace.openTextDocument(uriRemote)
  const editor = await vscode.window.showTextDocument(document, {
    preview: false,
    preserveFocus: false,
  })

  disposeClosedEditor.fn = onDidCloseTextDocument(async (doc) => {
    if (doc.uri.path === uriRemote.path || editor.document.isClosed) {
      await consume_close(_calibrate)
      return true
    }
  })

  await tryUpdateCalibrateState(calibrate.opened, _calibrate, 1500)

  // then update the settings with the extension's textMateRules
  await REC_nextWindowStateCycle(state.active, state.active, usingContext)

  // then notify the window the calibration is done
  // FIXME: the window should trigger this event
  await tryUpdateCalibrateState(calibrate.idle, _calibrate, 500)

  withProgress({
    title: 'Concise Syntax: calibrated you may close the file',
    seconds: 5,
  })
}

//#region module

async function REC_nextWindowStateCycle(
  tryNext: State,
  settings: 'active' | 'inactive',
  usingContext: UsingContext,
  recursiveDiff?: boolean
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
    calibrate_confirmation_token.consume()

    await REC_windowStateSandbox(
      tryNext,
      settings,
      Object.assign(usingContext, { _item }),
      recursiveDiff
    )

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
let testShortCircuitWindowState = false
async function defaultWindowState(
  _item: vscode.StatusBarItem,
  next: State,
  windowState: Stores['windowState']
) {
  if (testShortCircuitWindowState) return

  await windowState.write(next)
  _item.text = `$(${stateIcon})` + iconText
  _item.tooltip = IState.encode(next)
  const failure =
    next == state.disposed || next == state.stale || next == state.error
  await hold(failure ? 1000 : 100)

  if (failure) {
    _item.hide()
  } else {
    _item.show()
  }
}

async function calibrateCommandCycle(
  uriRemote: vscode.Uri,
  usingContext: UsingContext
) {
  const { stores } = usingContext

  if (!_calibrate) {
    vscode.window.showErrorMessage('No status bar item found')
    return
  }
  if (stores.extensionState.read() == 'disposed') {
    vscode.window.showInformationMessage(
      'The extension is disposed. Mount it to use this command.'
    )
    return
  }
  if (c_busy || busy) {
    // FIXME: if any showInformationMessage you are waiting for is hidden to the notification area
    // and the user wants to run this command again, the message is unclear...
    vscode.window.showInformationMessage(
      'The extension is busy. Try again in a few seconds.'
    )
    return
  }

  try {
    c_busy = true

    calibrate_confirmation_token.consume()

    await calibrateStateSandbox(uriRemote, usingContext, _calibrate)

    c_busy = false
  } catch (error: any) {
    debugger
    testShortCircuitWindowState = false
    await consume_close(_calibrate)
    vscode.window.showErrorMessage(
      `Error: failed to open calibrate file -> ${error?.message}`
    )
  }
}

async function toggleCommandCycle(usingContext: UsingContext) {
  const { stores } = usingContext

  if (stores.extensionState.read() == 'disposed') {
    vscode.window.showInformationMessage(
      'The extension is disposed. Mount it to use this command.'
    )
    return
  }
  if (busy) {
    vscode.window.showInformationMessage(
      'The extension is busy. Try again in a few seconds.'
    )
    return
  }

  const next = flip(stores.windowState.read())
  await REC_nextWindowStateCycle(next, next, usingContext)
}

function defaultCalibrate(_calibrate: vscode.StatusBarItem) {
  // prettier-ignore

  _calibrate.text = `$(${calibrateIcon})`
  _calibrate.tooltip = 'bootUp'
  // FIXME: show _calibrate only when the extension is active
  _calibrate.show()
}

function consume_close(_calibrate: vscode.StatusBarItem) {
  disposeClosedEditor.consume()
  return tryUpdateCalibrateState(calibrate.closed, _calibrate)
}
function tryUpdateCalibrateState(
  state: Calibrate,
  _calibrate: vscode.StatusBarItem,
  t = 100
) {
  _calibrate!.tooltip = state
  return hold(t)
}

async function checkCalibratedCommandContext(
  next: State,
  calibrationState: Stores['calibrationState']
) {
  vscode.commands.executeCommand(
    'setContext',
    'extension.calibrated',
    next == state.active
  )
  // https://stackoverflow.com/a/74468400
  await calibrationState.write(next)
}
function getStores(context: vscode.ExtensionContext) {
  return {
    extensionState: getStateStore(context),
    windowState: getWindowState(context),
    globalInvalidation: getGlobalAnyInvalidate(context),
    globalCalibration: getGlobalAnyCalibrate(context),
    calibrationState: getAnyCalibrate(context),
  }
}
type Stores = ReturnType<typeof getStores>

export async function wipeAllState(context: vscode.ExtensionContext) {
  const states = getStores(context)
  for (const iterator of Object.values(states)) {
    await iterator.write(undefined as any)
  }
  return context
}

function withProgress(params: { title: string; seconds: number }) {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: params.title,
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
      for (let i = 0; i < params.seconds; i++) {
        await hold(1_000)
      }
      resolve(null)
    })
  )
}

export function checkDisposedCommandContext(next?: State) {
  vscode.commands.executeCommand(
    'setContext',
    'extension.disposed',
    next == state.disposed
  )
  vscode.commands.executeCommand(
    'setContext',
    'extension.running',
    next == state.active || next == state.inactive
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

export function binary(state?: State) {
  return state == 'active' ? 'active' : 'inactive'
}
function flip(next?: State) {
  return next == 'active' ? 'inactive' : 'active'
}

export function getAnyCalibrate(context: vscode.ExtensionContext) {
  return useState(context, 'calibrate', <State>{})
}
export function getGlobalAnyCalibrate(context: vscode.ExtensionContext) {
  return useGlobal(context, 'calibrate', <State>{})
}
export function getGlobalAnyInvalidate(context: vscode.ExtensionContext) {
  return useGlobal(context, 'invalidate', <State>{})
}
export function getWindowState(context: vscode.ExtensionContext) {
  return useState(context, 'window', <State>{})
}
export function getStateStore(context: vscode.ExtensionContext) {
  return useState(context, 'extension', <'active' | 'inactive' | 'disposed'>{})
}
export function getErrorStore(context: vscode.ExtensionContext) {
  return useState(context, 'error', <'error' | 'throw' | 'unhandled'>{})
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

//#endregion
