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

let previousPayload: any
const createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((state) => {
    if (!(state == calibrate.opened || state == calibrate.idle)) return

    // prettier-ignore
    const lineEditor = document.querySelector<HTMLElement>(`[data-uri$="concise-syntax/out/${calibrationFileName}"] ${viewLinesSelector}`)
    if (!lineEditor) {
      return toastConsole.error('Calibrate Editor not found')
    }
    try {
      debugger
      if (state == calibrate.opened) {
        const res = parseSymbolColors(lineEditor)
        previousPayload = res.payload
        // FIXME: here is where the window should send a message to extension to go to the next state
        return
      }
      if (!previousPayload) {
        throw new Error('previousPayload is undefined')
      } else if (state == calibrate.idle) {
        const res = parseSymbolColors(lineEditor)
        const css = res.process(previousPayload)
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
