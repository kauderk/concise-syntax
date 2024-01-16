import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId, viewLinesSelector } from './keys'
import { IState, State, calibrationFileName, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { addRemoveRootStyles, createStyles, toastConsole } from './shared'
import { parseSymbolColors } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
import { deltaFn } from 'src/shared/utils'
import { createTryFunction } from './lifecycle'
import { type calibrateWIndowPlaceholder } from 'src/extension/statusBarItem'
export type { editorObservable, stateObservable, calibrateObservable }

const editorObservable = createObservable<undefined | string>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)

const sessionKey = `${extensionId}.session.styles`

function cacheProc() {
  try {
    const cache = window.localStorage.getItem(sessionKey)
    if (cache) syntaxStyle.styleIt(cache)
    else throw new Error('cache is empty')
  } catch (error) {
    window.localStorage.removeItem(sessionKey)
  }
}
const calibrateStyle = createStyles('calibrate')
calibrateStyle.styleIt(`${ICalibrate.selector}{display: none !important}`)

const calibrateWindowStyle = createStyles('calibrate.window')

let tableTask: ReturnType<typeof createTask<'opened' | 'idle'>> | undefined
export type windowColorsTable = ReturnType<
  typeof parseSymbolColors
>['colorsTableOutput']
const createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((state) => {
    //#region opened -> idle -> reset
    if (!(state == calibrate.opened || state == calibrate.idle)) return
    // prettier-ignore
    // FIXME: use proper uri or shared file path between extension and workbench
    const lineEditor = document.querySelector<HTMLElement>(`[data-uri$="concise-syntax/out/${calibrationFileName}"] ${viewLinesSelector}`)
    if (!lineEditor) {
      return toastConsole.error('Calibrate Editor not found')
    }
    if (tableTask && state == calibrate.opened) {
      toastConsole.error('Calibrate Window already opened')
      return
    }

    // FIXME: overcomplicated state for the sake of the following async procedure
    if (!tableTask) {
      tableTask = createTask()
    } else if (state == calibrate.idle) {
      tableTask.resolve(state)
      return
    }
    //#endregion

    syntaxStyle.dispose()
    const snapshot = parseSymbolColors(lineEditor)
    BonkersExecuteCommand(
      'Concise Syntax',
      'Calibrate Window' satisfies calibrateWIndowPlaceholder,
      JSON.stringify(snapshot.colorsTableOutput)
    )
      .catch(() => toastConsole.error('Failed to run Calibrate Window command'))
      .finally(() => BonkersExecuteCommand.clean())
      .catch(() => toastConsole.error('Failed to PREVENT_NULL input'))
      // FIXME: here is where the window should resolve the 'Calibrate Window' task
      // take a look at src/extension/statusBarItem.ts calibrateStateSandbox procedure
      .then(() => tableTask!.promise)
      .catch(() => toastConsole.error('Failed to get colors table'))
      .then(() => {
        const css = parseSymbolColors(lineEditor).process(snapshot.payload)
        window.localStorage.setItem(sessionKey, css)
        syntaxStyle.styleIt(css)
      })
      .finally(() => (tableTask = undefined))
  })
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
// prettier-ignore
async function BonkersExecuteCommand(displayName: string, commandName: string, value: string) {
  calibrateWindowStyle.styleIt(`* {pointer-events:none;}`)
  PREVENT(window)
  let inputView = document.querySelector("li.action-item.command-center-center") as H
  if (inputView){
    await tap(inputView)
  } else {
    const view: H = document.querySelector(`.menubar-menu-button[aria-label="View"]`) as H
    await tap(view)
    const commandPalletOption = document.querySelector(`[class="action-item"]:has([aria-label="Command Palette..."])`) as H
    await tap(commandPalletOption)
  }
  let preventInput = getInput();
  PREVENT(preventInput)
  preventInput.value = `>${displayName}`
  await hold()
  let input = getInput();
  input.dispatchEvent(new Event('input'))
  await tries(async()=>{
    const command = document.querySelector(`.quick-input-list [aria-label*="${displayName}: ${commandName}"] label`) as H
    command.click()
    return command
  }, 3)
  input = await tries(async ()=>{
    const deltaInput = getInput();
    if (deltaInput.getAttribute('placeholder') != commandName) {
      throw new Error('Failed to find command input element')
    }
		if(preventInput!==deltaInput){
			toastConsole.warn('BonkersExecuteCommand preventInput !== deltaInput')
			debugger
			PREVENT_NULL(preventInput)
		}
    PREVENT_NULL(deltaInput)
    deltaInput.value = value
    deltaInput.dispatchEvent(new Event('input'))
    await hold(300)
    return deltaInput
  }, 3)
  input.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    composed: true
  }))
  await hold()
  
  async function tries(cb:()=>Promise<H>, n: number){
    let m = ''
    for (let i = 0; i < n; i++) {
      try {
        return await cb()
      } catch (error: any) {
        m = error.message
        await hold(500)
      }
    }
		debugger
    throw new Error(m || `Failed to find command input element after ${n} tries`)
  }
  async function tap(el:H) {
    el.dispatchEvent(new CustomEvent('-monaco-gesturetap', {}))
    await hold()
  }
  function hold(t = 300) {
    return new Promise((resolve)=>setTimeout(resolve, t))
  }
}
BonkersExecuteCommand.clean = (input = getInput()) => {
  calibrateWindowStyle.dispose()
  PREVENT_NULL(window)
  PREVENT_NULL(input)
}
type H = HTMLInputElement
function getInput() {
  return document.querySelector('div.quick-input-box input') as H
}
function prevent(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  return false
}
function PREVENT($0: HTMLElement | Window) {
  // prettier-ignore
  $0.onclick=$0.onkeydown=$0.onkeyup=$0.onmousedown=$0.onmouseup=$0.onblur=$0.onfocus=prevent
}
function PREVENT_NULL($0: HTMLElement | Window) {
  // prettier-ignore
  $0.onclick=$0.onkeydown=$0.onkeyup=$0.onmousedown=$0.onmouseup=$0.onblur=$0.onfocus=null
}

const createEditorSubscription = () =>
  editorObservable.$ubscribe((value) => {
    if (!value) return
    cacheProc()
    return 'Symbol.dispose'
  })

const syntaxStyle = createStyles('hide')
let deltaSubscribers = deltaFn()
// Just use the "using" keyword...
const createStateSubscription = () =>
  stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      addRemoveRootStyles(true)
      cacheProc()
      calibration.activate(500)
      highlight.activate(500) // FIXME: find the moment the css finishes loading
      const _ = [createCalibrateSubscription(), createEditorSubscription()]
      deltaSubscribers.fn = () => _.forEach((un) => un())
    } else {
      deltaSubscribers.consume()
      addRemoveRootStyles(false)
      syntaxStyle.dispose()
      highlight.dispose() // the unwinding of the editorObservable could cause a stack overflow
      calibration.dispose()
    }
  })

const syntax = createSyntaxLifecycle(stateObservable, IState)
const calibration = createSyntaxLifecycle(calibrateObservable, ICalibrate)
const highlight = createHighlightLifeCycle(editorObservable)

const deltaDispose = deltaFn()
const tryFn = createTryFunction()
const conciseSyntax = {
  activate() {
    tryFn(() => {
      deltaDispose.consume()
      syntax.activate()
      const unSubscribeState = createStateSubscription()
      deltaDispose.fn = () => {
        tryFn(() => {
          syntax.dispose()
          stateObservable.value = state.inactive
          unSubscribeState()
        }, 'Failed to dispose concise-syntax')
      }
    }, 'Failed to activate concise-syntax')
  },
  dispose: deltaDispose.consume,
}

// prettier-ignore
declare global { interface Window { conciseSyntax?: typeof conciseSyntax } }
if (window.conciseSyntax) {
  window.conciseSyntax.dispose()
}
window.conciseSyntax = conciseSyntax
conciseSyntax.activate()

console.log(extensionId, conciseSyntax)

/**
 * FIXME
 * handle drastic user changes for example when changing vscode's profile
 */
