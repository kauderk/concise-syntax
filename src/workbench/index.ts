import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId, viewLinesSelector } from './keys'
import { createTryFunction } from './lifecycle'
import { IState, State, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { createStyles, toastConsole } from './shared'
import { TryRegexToDomToCss } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
import { or_return } from '../shared/or_return'
export type { editorObservable, stateObservable, calibrateObservable }

const editorObservable = createObservable<undefined | boolean>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)

let calibrateUnsubscribe: Function | undefined
let createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((value) => {
    if (value != calibrate.opened) return
    // prettier-ignore
    new or_return(
      () => document.querySelector<HTMLElement>(`[data-uri$="concise-syntax/out/syntax.tsx"] ${viewLinesSelector}`),
      () => toastConsole.error('Line Editor not found')
    )
		.or_return(
			TryRegexToDomToCss, 
			() => toastConsole.error('Line Editor not found')
		)
		.finally(css => {
			syntaxStyle.styleIt(css)
			stateObservable.notify()
		})
  })

const syntaxStyle = createStyles('hide')
let unsubscribeState = () => {}
let running = false
const createStateSubscription = () =>
  stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      if (running) return // FIXME:
      running = true

      highlight.activate(500) // FIXME: find the moment the css finishes loading

      calibrateUnsubscribe = createCalibrateSubscription()
      calibration.activate(500)
    } else {
      running = false

      highlight.dispose() // the unwinding of the editorObservable could cause a stack overflow but you are checking "anyEditor || !value"

      syntaxStyle.dispose()

      calibrateUnsubscribe?.()
      calibrateUnsubscribe = undefined
      calibration.dispose()
    }
  })

const syntax = createSyntaxLifecycle(stateObservable, IState)
const calibration = createSyntaxLifecycle(calibrateObservable, ICalibrate)
const highlight = createHighlightLifeCycle(editorObservable)
const tryFn = createTryFunction()

const conciseSyntax = {
  activate() {
    // TODO: return a local dispose function
    tryFn(() => {
      syntax.activate()
      unsubscribeState = createStateSubscription()
    }, 'Concise Syntax Extension crashed unexpectedly when activating')
  },
  dispose() {
    tryFn(() => {
      syntax.dispose()
      stateObservable.value = state.inactive
      unsubscribeState()
    }, 'Concise Syntax Extension crashed unexpectedly when disposing')
  },
}

// prettier-ignore
declare global { interface Window { conciseSyntax?: typeof conciseSyntax } }
if (window.conciseSyntax) {
  window.conciseSyntax.dispose()
}
window.conciseSyntax = conciseSyntax
conciseSyntax.activate()

console.log(extensionId, conciseSyntax)
