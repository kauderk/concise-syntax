import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId, viewLinesSelector } from './keys'
import { IState, State, calibrationFileName, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { createStyles, toastConsole } from './shared'
import { parseSymbolColors } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
import { or_return } from '../shared/or_return'
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
        fakeExecuteCommand(
          'Concise Syntax',
          'Calibrate Window' satisfies calibrateWIndowPlaceholder,
          windowColorsTable
        ).catch(() => {
          toastConsole.error('Failed to execute Calibrate Window command')
        })
        previous_style_color_table_snapshot = res.payload
        // FIXME: here is where the window should send a message to extension to go to the next state
        return
      }
      if (!previous_style_color_table_snapshot) {
        throw new Error('previousPayload is undefined')
      } else if (state == calibrate.idle) {
        const res = parseSymbolColors(lineEditor)
        const css = res.process(previous_style_color_table_snapshot)
        window.localStorage.setItem(sessionKey, css)

        if (css) {
          requestAnimationFrame(() => syntaxStyle.styleIt(css))
          if (!highlight.running) {
            highlight.activate(500) // FIXME: find the moment the css finishes loading
          }
        }
      }
    } catch (error) {
      toastConsole.error('Failed to calibrate editor')
    }
  })
// prettier-ignore
async function fakeExecuteCommand(displayName: string, commandName: string, value: string) {
  try {
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

  } catch (error) {
    debugger
  }
  type H = HTMLInputElement

  function getInput() {
    return document.querySelector("div.quick-input-box input") as H
  }
  async function tries(cb:()=>Promise<H>, n:number){
    let m = ''
    for (let i = 0; i < n; i++) {
      try {
        return await cb()
      } catch (error) {
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
