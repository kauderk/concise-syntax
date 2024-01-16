import * as vscode from 'vscode'
import packageJson from '../../package.json'
import {
  getTextMateRules,
  key,
  updateSettingsCycle,
  updateWriteTextMateRules,
} from './settings'
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
import { type windowColorsTable } from 'src/workbench'

/**
 * The icon's purpose is to indicate the workbench.ts script the extension is active.
 */
let _item: vscode.StatusBarItem | undefined
const statusIconLoading = 'loading~spin'
const iconText = '' //' Concise'
let busy: boolean | undefined
let disposeConfiguration = deltaFn(true)
let crashedMessage = ''

let _calibrate: vscode.StatusBarItem | undefined
let c_busy = false
let disposeClosedEditor = deltaFn(true)
let calibrate_confirmation_task = deltaValue<Task>((t) => {
  t.resolve()
})
let calibrate_window_task = deltaValue<Task>((t) => {
  t.resolve()
})

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
  // the scope closure maintains the context

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

  const calibrateWIndowCommand = packageJson.contributes.commands[4].command

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
    vscode.commands.registerCommand(calibrateWIndowCommand, () =>
      calibrateWindowCommandCycle(usingContext)
    ),
    await handleThemeChange(usingContext),
    {
      dispose() {
        disposeConfiguration.consume()
        disposeClosedEditor.consume()
        calibrate_confirmation_task.consume()
      },
    }
  )
}

async function REC_windowStateSandbox(
  tryNext: State,
  settings: 'active' | 'inactive',
  usingContext: UsingContext & { _item: vscode.StatusBarItem },
  invalidRecursiveDiff?: RecursiveDiff
) {
  const { stores, context, _item } = usingContext

  _item.text = `$(${statusIconLoading})` + iconText
  const cache = await updateSettingsCycle(context, settings)

  if (typeof cache == 'function') {
    if (await invalidRecursiveDiff?.(cache)) {
      return 'invalid recursive diff'
    }
    const task = createTask()
    const watcher = vscode.workspace.onDidChangeConfiguration(task.resolve)
    await cache()
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
    const tryNext = stores.windowState.read()
    if (!tryNext) return
    
    await REC_nextWindowStateCycle(
      tryNext,
      binary(tryNext),
      usingContext,
      async (cache) => {
        if (typeof cache != 'function') return
        
        /**
         * There is a cash waiting to be executed (invalidated)
         * The recursion/watcher was called
         * And the extension is active so now it will fall out of sync
         * Therefor the user deserves to know the settings.json is not up to date
         * It is rude to change the settings.json without the user's consent
         */
        if (tryNext == state.active && stores.globalInvalidation.read() != state.active) {
          await defaultWindowState(_item, state.stale, stores.windowState)
          const res = await vscode.window.showInformationMessage(
            "The extension settings were invalidated while the extension was running. \
              Shall we add missing extension textMateRules if any and move them to the end to avoid conflicts?",
            'Yes and remember',
            'No and deactivate',
          )
          const next = res?.includes('Yes') ? state.active : state.inactive
          await stores.globalInvalidation.write(next)

          if(next == state.inactive){
            await defaultWindowState(_item, next, stores.windowState)
            return true
          }
        }
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Window,
            title: packageJson.displayName,
          },
          async (progress) => {
            progress.report({ message: 'revalidating...' })
            for (let i = 0; i < 5; i++) {
              await hold(1_000)
            }
          }
        )
      })
  }).dispose

  if (cache === true) {
    return 'cached'
  } else {
    return 'invalidated'
  }
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

  const taskProgress = withProgress()
  calibrate_confirmation_task.value = taskProgress.task

  taskProgress.progress.report({ message: 'calibrating extension' })
  // update the settings before showing the calibration file and risking the user to close it while the procedure is waiting
  defaultWindowState = (() => {}) as any
  // prettier-ignore
  const res1 = await REC_nextWindowStateCycle(state.inactive, state.inactive, usingContext)
  defaultWindowState = annoyance
  if (res1 instanceof Error) throw res1
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

  taskProgress.progress.report({ message: 'calibrating window' })
  calibrate_window_task.value = createTask()
  await checkCalibrateWindowCommandContext(state.active)
  await tryUpdateCalibrateState(calibrate.opened, _calibrate, 1500)

  const race = await Promise.race([
    calibrate_window_task.value.promise,
    new Promise((reject) =>
      setTimeout(() => {
        reject(new Error('calibrate_window_task timed out '))
      }, 5_000)
    ),
  ])
  if (race instanceof Error) throw race
  taskProgress.progress.report({ message: 'calibrating syntax and theme' })
  // prettier-ignore
  const error2 = await REC_nextWindowStateCycle(state.active, state.active, usingContext)
  if (error2 instanceof Error) throw error2

  calibrate_window_task.consume()
  // FIXME: the window should trigger the 'Calibrate Window' task
  // take a look at src/workbench/index.ts createCalibrateSubscription's "state == calibrate.opened" branch
  await checkCalibrateWindowCommandContext(state.inactive)
  await tryUpdateCalibrateState(calibrate.idle, _calibrate, 500)
  taskProgress.progress.report({ message: 'calibrated you may close the file' })

  setTimeout(calibrate_confirmation_task.consume, 5_000)
}

//#region module
type RecursiveDiff = (
  cache: Awaited<ReturnType<typeof updateSettingsCycle>>
) => Promise<true | undefined>
async function REC_nextWindowStateCycle(
  tryNext: State,
  settings: 'active' | 'inactive',
  usingContext: UsingContext,
  recursiveDiff?: RecursiveDiff
) {
  if (!_item) {
    const r = 'No status bar item found'
    vscode.window.showErrorMessage(r)
    return r
  } else if (crashedMessage) {
    vscode.window.showErrorMessage(
      `The extension crashed when updating .vscode/settings.json with property ${key}.textMateRules with error: ${crashedMessage}`
    )
    return 'crashed'
  }
  const { stores } = usingContext
  if (stores.calibrationState.read() != state.active) {
    await defaultWindowState(_item, state.stale, stores.windowState)
    return 'not calibrated'
  }

  try {
    busy = true

    const res = await REC_windowStateSandbox(
      tryNext,
      settings,
      Object.assign(usingContext, { _item }),
      recursiveDiff
    )

    busy = false
    return res
  } catch (error: any) {
    debugger
    busy = false
    showCrashIcon(_item, error)
    return error as Error
  }
}
function showCrashIcon(_item: vscode.StatusBarItem, error: any) {
  crashedMessage = error?.message || 'unknown'
  _item.text = `$(error)` + iconText
  _item.tooltip = IState.encode(state.error)
  _item.show()
  _calibrate?.hide()
  disposeConfiguration.consume()
}
let defaultWindowState = async function (
  _item: vscode.StatusBarItem,
  next: State,
  windowState: Stores['windowState']
) {
  await windowState.write(next)
  _item.text = `$(${stateIcon})` + iconText
  _item.tooltip = IState.encode(next)
  const failure =
    next == state.disposed || next == state.stale || next == state.error
  await hold(failure ? 1000 : 100)

  if (failure) {
    _calibrate?.hide()
    _item.hide()
  } else {
    _calibrate?.show()
    _item.show()
  }
}
// Prevent rare annoying flickering on editors when the workbench observers trigger their inactive states
// I won't create an abstraction on top of REC_nextWindowStateCycle to handle this case because it is too specific
const annoyance = defaultWindowState

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
  if (calibrate_window_task.value) {
    vscode.window.showInformationMessage(
      'The extension is busy with a window task. Try again later'
    )
    return
  }

  try {
    c_busy = true

    await calibrateStateSandbox(uriRemote, usingContext, _calibrate)

    c_busy = false
  } catch (error: any) {
    debugger
    c_busy = false
    if (_item) {
      showCrashIcon(_item, error)
    }
    calibrate_confirmation_task.consume()
    await consume_close(_calibrate)
    vscode.window.showErrorMessage(
      `Error: failed to execute calibrate command with error: ${error?.message}`
    )
  }
}
export type calibrateWIndowPlaceholder = 'Calibrate Window'
async function calibrateWindowCommandCycle(usingContext: UsingContext) {
  const task = createTask<Error>()
  const blurEvent = vscode.window.onDidChangeWindowState((state) => {
    vscode.window.showInformationMessage(
      `window focus changed to ${state.focused}`
    )
    if (state.focused === false) {
      task.resolve(
        new Error('Window lost focus, calibrate window task was cancelled')
      )
    }
  })
  const input = vscode.window.showInputBox({
    placeHolder: 'Calibrate Window' satisfies calibrateWIndowPlaceholder,
    prompt: `Calibrate Window using session's syntax and theme`,
    value: '',
  })
  const race = await Promise.race([task.promise, input])
  blurEvent.dispose()
  if (race instanceof Error) {
    calibrate_window_task.value?.reject(race)
    return
  }
  if (!race) {
    calibrate_window_task.value?.reject(
      new Error('No window input was provided')
    )
    return
  }
  try {
    const table: windowColorsTable = JSON.parse(race)
    // panic on a random missing color
    table['string.begin'].color!.toString()

    await updateWriteTextMateRules(
      usingContext.context,
      (textMateRules, nameSuffix) => {
        const len = textMateRules.length
        for (let i = 0; i < len; i++) {
          const value = textMateRules[i]
          // @ts-expect-error
          const tableValue = table[value.name.replace(nameSuffix, '')]
          if (tableValue && tableValue.color) {
            // prettier-ignore
            const divergence = ((i / len) / len) + .9
            // the window script function "parseSymbolColors" depends on unique colors
            value.settings.foreground =
              rgbToHexDivergent(tableValue.color, divergence) ??
              value.settings.foreground
          }
        }
        const begin = textMateRules.find((r) =>
          r.name.includes('bracket.begin')
        )
        const end = textMateRules.find((r) => r.name.includes('bracket.end'))
        if (begin && end) {
          end.settings.foreground = begin.settings.foreground
        }
      }
    )

    calibrate_window_task.value?.resolve()
  } catch (error: any) {
    vscode.window.showErrorMessage('Failed to parse window input')
    calibrate_window_task.value?.reject(
      new Error('Failed to parse window input')
    )
  }
}
function rgbToHexDivergent(rgbString: string, scalar = 1) {
  const cleanedString = rgbString.replace(/\s/g, '').toLowerCase()
  const isRgba = cleanedString.includes('rgba')
  const values = cleanedString.match(/\d+(\.\d+)?/g)
  if (values && (isRgba ? values.length === 4 : values.length === 3)) {
    const hexValues = values.map((value, index) => {
      const intValue = parseFloat(value)
      const scaledValue = Math.min(255, Math.round(intValue * scalar))
      const hex = scaledValue.toString(16).padStart(2, '0')
      return index < 3 ? hex : scaledValue.toString(16).padStart(2, '0')
    })
    return `#${hexValues.join('')}`
  } else {
    vscode.window.showErrorMessage(`Failed to parse rbg to hex: ${rgbString}`)
    return null
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
  _calibrate.text = `$(${calibrateIcon})`
  _calibrate.tooltip = 'bootUp'
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
  _calibrate.tooltip = state
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

async function handleThemeChange(usingContext: UsingContext) {
  const { stores } = usingContext

  let t_busy = false
  async function handler(e?: { kind: unknown }) {
    const kind = e?.kind
    if (typeof kind != 'number') {
      // vscode.window.showInformationMessage(
      //   `Can't change the color theme because the kind is not a number`
      // )
      return
    }
    if (busy || c_busy) {
      vscode.window.showInformationMessage(
        `Can't calibrate theme, the extension is busy...`
      )
      return
    }
    if (t_busy) {
      vscode.window.showWarningMessage(
        `The extension is busy changing the color theme...`
      )
      return
    }
    t_busy = true

    debugger
    if ((kind as any) === stores.colorThemeKind.read()) {
      // noop
    } else {
      await stores.colorThemeKind.write(kind as any)
      const res = await vscode.window.showInformationMessage(
        'The color theme changed. Shall re calibrate the extension settings?',
        'Yes',
        'No'
      )
      if (!res?.includes('Yes')) return

      const tryNext = stores.windowState.read()
      if (!tryNext) return
      await REC_nextWindowStateCycle(tryNext, binary(tryNext), usingContext)
      await hold()
    }

    t_busy = false
  }
  // @ts-expect-error
  await handler(vscode.window.activeColorTheme)
  // @ts-expect-error
  const dispose = vscode.window.onDidChangeActiveColorTheme?.(handler)?.dispose
  if (!dispose) {
    console.error('Missing onDidChangeActiveColorTheme API')
  }
  return {
    dispose() {
      if (!dispose) return
    },
  }
}

function getStores(context: vscode.ExtensionContext) {
  return {
    extensionState: getStateStore(context),
    windowState: getWindowState(context),
    globalInvalidation: getGlobalAnyInvalidate(context),
    globalCalibration: getGlobalAnyCalibrate(context),
    calibrationState: getAnyCalibrate(context),
    textMateRules: getTextMateRules(context),
    colorThemeKind: getColorThemeKind(context),
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

function withProgress() {
  const task = createTask()
  let _progress: vscode.Progress<{ message?: string }>

  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: packageJson.displayName,
    },
    async (progress, token) => {
      _progress = progress
      await task.promise
    }
  )
  return {
    task,
    get progress() {
      if (!_progress) throw new Error('progress is undefined')
      return _progress
    },
  }
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
async function checkCalibrateWindowCommandContext(next?: State) {
  await vscode.commands.executeCommand(
    'setContext',
    'extension.calibrateWindow',
    next == state.active
  )
  await hold(500)
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

export function getColorThemeKind(context: vscode.ExtensionContext) {
  return useState(context, 'colorThemeKind', <string>{})
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

type Task = ReturnType<typeof createTask>
function createTask<R = unknown, E = R>() {
  let resolve = (value?: R) => {},
    reject = (value?: E) => {}
  const promise = new Promise<R | E>((_resolve, _reject) => {
    reject = _reject
    // @ts-expect-error
    resolve = _resolve
  })
  return { promise, resolve, reject }
}

// hold this thread and allow the dom to render the state
function hold(t = 100) {
  return new Promise((resolve) => setTimeout(resolve, t))
}

//#endregion
