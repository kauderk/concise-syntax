import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId, viewLinesSelector } from './keys'
import { IState, State, calibrationFileName, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { addRemoveRootStyles, createStyles, toastConsole } from './shared'
import { parseSymbolColors } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
import { createTask, deltaFn } from 'src/shared/utils'
import { type calibrateWIndowPlaceholder } from 'src/extension/statusBarItem'
export type { editorObservable, stateObservable, calibrateObservable }

const editorObservable = createObservable<undefined | string>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)

const sessionKey = `${extensionId}.session.styles`

createStyles('calibrate').styleIt(
  `${ICalibrate.selector}{display: none !important}`
)

let tableTask: ReturnType<typeof createTask<'opened' | 'idle'>> | undefined
export type windowColorsTable = ReturnType<
  typeof parseSymbolColors
>['colorsTable']
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
      JSON.stringify(snapshot.colorsTable)
    )
      .catch(() => {
        toastConsole.error('Failed to run Calibrate Window command')
        BonkersExecuteCommand.shadow(false, getInput())
      })
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

//#region BonkersExecuteCommand
const calibrateWindowStyle = createStyles('calibrate.window')
// prettier-ignore
async function BonkersExecuteCommand(displayName: string, commandName: string, value: string) {
  BonkersExecuteCommand.shadow(true)
  const inputView = await tries(async()=>document.querySelector("li.action-item.command-center-center"), 2, 100)
  if (inputView){
    await tap(inputView)
  } else {
    const view = await tries(async()=>document.querySelector(`.menubar-menu-button[aria-label="View"]`), 2, 100)
    await tap(view)
    const commandPalletOption = await tries(async()=>document.querySelector(`[class="action-item"]:has([aria-label="Command Palette..."])`), 2, 100)
    await tap(commandPalletOption)
  }

  const shadowInput = await tries(async()=>getInput(), 3, 100)
  shadowInput.value = `>${displayName}`
  
  let input = await tries(async ()=>getInput(), 3, 100)
  input.dispatchEvent(new Event('input'))

  const command = await tries(async()=>document.querySelector<HTMLElement>(`.quick-input-list [aria-label*="${displayName}: ${commandName}"] label`), 
                                            3, 300)
  command.click()
  await hold(100)
  input = await tries(async ()=>{
    const input = getInput();
    if (input?.getAttribute('placeholder') != commandName) {
      return
    }
    input.value = value
    input.dispatchEvent(new Event('input'))
    return input
  }, 4, 500)
  await hold(100)
	if (shadowInput!==input) {
		debugger
		throw new Error('shadowInput!==input')
	} else {
		BonkersExecuteCommand.shadow(false, input)
	}
  input.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
    composed: true
  }))
  await hold(100)
  
  async function tries<T>(cb:()=>Promise<T|undefined>, n: number,t=500){
    for (let i = 0; i < n; i++) {
      if(i==n-1) {
        debugger
      }
      const res = await cb()
      if(res) return res
      await hold(t)
    }
    return <any>undefined // better stack trace errors
  }
  async function tap(el:Element) {
    el.dispatchEvent(new CustomEvent('-monaco-gesturetap', {}))
    await hold(300)
  }
  function hold(t:number) {
    return new Promise((resolve)=>setTimeout(resolve, t))
  }
}
BonkersExecuteCommand.shadow = (block: boolean, input?: any) => {
  const styles = block ? '' : '* {pointer-events:none;}'
  calibrateWindowStyle.styleIt(styles)

  const shadow = block ? shadowEventListeners : cleanShadowedEvents
  shadow(window)
  if (input) {
    shadow(input) // FIXME: get me out of here
  }
}
const shadowEventListeners = events((e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  return false
})
const cleanShadowedEvents = events(null)
function events(fn: any) {
  return (el: HTMLElement | Window) => {
    // prettier-ignore
    el.onclick=el.onkeydown=el.onkeyup=el.onmousedown=el.onmouseup=el.onblur=el.onfocus=fn
  }
}
type H = HTMLInputElement | undefined
function getInput() {
  return document.querySelector('div.quick-input-box input') as H
}

//#endregion

function cacheProc() {
  try {
    const cache = window.localStorage.getItem(sessionKey)
    if (cache) syntaxStyle.styleIt(cache)
    else throw new Error('cache is empty')
  } catch (error) {
    window.localStorage.removeItem(sessionKey)
  }
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

const syntax = createSyntaxLifecycle(stateObservable, IState, {
  activate() {
    const unSubscribeState = createStateSubscription()
    return () => {
      stateObservable.value = state.inactive
      unSubscribeState()
    }
  },
})
// TODO: merge extension _calibrate and _state icons/bridges
const calibration = createSyntaxLifecycle(calibrateObservable, ICalibrate)
const highlight = createHighlightLifeCycle(editorObservable)

// prettier-ignore
declare global { interface Window { conciseSyntax?: typeof syntax } }
if (window.conciseSyntax) {
  window.conciseSyntax.dispose()
}
window.conciseSyntax = syntax
syntax.activate()

console.log(extensionId, syntax)

/**
 * FIXME
 * handle drastic user changes for example when changing vscode's profile
 */
