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

let previous_style_color_table_snapshot: any
export type windowColorsTable = ReturnType<
  typeof parseSymbolColors
>['colorsTableOutput']
const createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((state) => {
    if (!(state == calibrate.opened || state == calibrate.idle)) return
    // prettier-ignore
    // FIXME: use proper uri or shared file path between extension and workbench
    const lineEditor = document.querySelector<HTMLElement>(`[data-uri$="concise-syntax/out/${calibrationFileName}"] ${viewLinesSelector}`)
    if (!lineEditor) {
      return toastConsole.error('Calibrate Editor not found')
    }

    try {
      syntaxStyle.dispose() // makes sense right...? otherwise it will conflict with parseSymbolColors
      if (state == calibrate.opened) {
        const res = parseSymbolColors(lineEditor)
        const windowColorsTable = JSON.stringify(res.colorsTableOutput)

        const bonkers = blurOutWindow()
        bonkers?.take()
        BonkersExecuteCommand(
          'Concise Syntax',
          'Calibrate Window' satisfies calibrateWIndowPlaceholder,
          windowColorsTable
        )
          .catch(() => {
            toastConsole.error('Failed to execute Calibrate Window command')
          })
          .finally(() => {
            calibrateWindowStyle.dispose()
            bonkers?.recover()
            PREVENT_NULL(window)
            PREVENT_NULL(getInput())
          })
          .catch(() => {
            toastConsole.error('Failed to PREVENT_NULL input')
          })
        previous_style_color_table_snapshot = res.payload
        // FIXME: here is where the window should resolve the 'Calibrate Window' task
        // take a look at src/extension/statusBarItem.ts calibrateStateSandbox procedure
        return
      }
      if (!previous_style_color_table_snapshot) {
        throw new Error('previousPayload is undefined')
      } else if (state == calibrate.idle) {
        const res = parseSymbolColors(lineEditor)
        const css = res.process(previous_style_color_table_snapshot)
        window.localStorage.setItem(sessionKey, css)
        syntaxStyle.styleIt(css)
        if (!highlight.running) {
          highlight.activate(500) // FIXME: find the moment the css finishes loading
        }
      }
    } catch (error) {
      toastConsole.error('Failed to calibrate editor')
    }
  })
// prettier-ignore
async function BonkersExecuteCommand(displayName: string, commandName: string, value: string) {
  calibrateWindowStyle.styleIt(`* {pointer-events:none;} .split-view-view {outline: 1px solid red;}`)
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
  let input = getInput();
  PREVENT(input)
  input.value = `>${displayName}`
  await hold()
  input = getInput();
  input.dispatchEvent(new Event('input'))
  await hold()
  const command = document.querySelector(`.quick-input-list [aria-label*="${displayName}: ${commandName}"] label`) as H
  command.click()
  await hold()
  input = await tries(async ()=>{
    const input = getInput();
    if (input.getAttribute('placeholder') != commandName) {
      throw new Error('Failed to find command input element')
    }
    input.value = value
    input.dispatchEvent(new Event('input'))
    await hold(100)
    return input
  }, 3)
  calibrateWindowStyle.dispose()
  PREVENT_NULL(window)
  PREVENT_NULL(input)
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

  if (command) {
    return true
  }

  
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
function blurOutWindow() {
  debugger
  // https://stackoverflow.com/questions/63040475/uncaught-referenceerror-geteventlisteners-is-not-defined
  const eventListeners = window.getEventListeners?.(window)
  if (!eventListeners) return

  const freezeListeners = ['focusin', 'focusout', 'focus', 'blur'].map(
    (name) => eventListeners[name]
  )
  return {
    take() {
      debugger
      for (const events of freezeListeners) {
        if (!events) continue
        for (const event of events) {
          if (!event) continue
          window.removeEventListener(event.type, event.listener)
        }
      }
    },
    recover() {
      debugger
      for (const events of freezeListeners) {
        if (!events) continue
        for (const event of events) {
          if (!event) continue
          window.addEventListener(event.type, event.listener, event)
        }
      }
      freezeListeners.length = 0
    },
  }
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
// Just use the "using" keyword...
const createStateSubscription = () =>
  stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      if (!calibration.running) {
        addRemoveRootStyles(true)
        calibration.activate(500)
        let unSubscribers = [createCalibrateSubscription()]

        cacheProc()
        if (!highlight.running) {
          highlight.activate(500) // FIXME: find the moment the css finishes loading
          unSubscribers.push(createEditorSubscription())
        }

        return () => unSubscribers.forEach((un) => un())
      }
    } else {
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
// prettier-ignore
declare global { interface Window { getEventListeners?: (node:unknown)=> Record<string, ({ type: string, listener: EventListenerOrEventListenerObject, useCapture: boolean, once: boolean, passive: boolean }|undefined)[]> }}
if (window.conciseSyntax) {
  debugger
  window.conciseSyntax.dispose()
}
window.conciseSyntax = conciseSyntax
conciseSyntax.activate()

console.log(extensionId, conciseSyntax)

/**
 * FIXME
 * handle drastic user changes for example when changing vscode's profile
 */
