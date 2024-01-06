import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId } from './keys'
import { createTryFunction } from './lifecycle'
import { IState, State, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { createStyles } from './shared'
import { regexToDomToCss } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
export type { editorObservable, stateObservable, calibrateObservable }

const editorObservable = createObservable<undefined | boolean>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)

/**
 * standBy     nothing   / bootUp
 * requesting  click     / opening
 * loaded      dom/click / opened
 * windowState nothing   / closed
 *
 * noting/bootUp > click > opening > opened > dom/click > closed > standBy
 */
let anyCalibration: any //typeof calibrateObservable.value
let calibrateUnsubscribe: Function | undefined
let createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((value) => {
    if (value == calibrate.opening) {
      // noop
    } else if (value == calibrate.opened) {
      syntaxStyle.styleIt(regexToDomToCss())
    } else if (value == calibrate.closed) {
      document.querySelector<HTMLElement>(ICalibrate.selector)?.click()
    } else {
      // noop
    }
  })

let anyEditor: typeof editorObservable.value
let editorUnsubscribe: Function | undefined
let createEditorSubscription = () =>
  editorObservable.$ubscribe((value) => {
    if (anyEditor || !value) return // the unwinding of the editorObservable could cause a stack overflow but you are checking "anyEditor || !value"
    anyEditor = value

    stateObservable.notify()
  })

const syntaxStyle = createStyles('hide')
let unsubscribeState = () => {}
const createStateSubscription = () =>
  stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      if (!editorUnsubscribe) {
        editorUnsubscribe = createEditorSubscription()
        highlight.activate(500) // FIXME: find the moment the css finishes loading
      }

      if (!anyCalibration) {
        anyCalibration = true
        calibration.activate(500)
        // when the calibration item is found...
        document.querySelector<HTMLElement>(ICalibrate.selector)?.click()
      }
    } else {
      editorUnsubscribe?.()
      editorUnsubscribe = undefined
      highlight.dispose() // the unwinding of the editorObservable could cause a stack overflow but you are checking "anyEditor || !value"

      anyEditor = undefined
      syntaxStyle.dispose()

      anyCalibration = undefined
    }
  })

const syntax = createSyntaxLifecycle(stateObservable, IState)
const calibration = createSyntaxLifecycle(calibrateObservable, ICalibrate)
const highlight = createHighlightLifeCycle(editorObservable)
const tryFn = createTryFunction()

const conciseSyntax = {
  activate() {
    tryFn(() => {
      syntax.activate()
      unsubscribeState = createStateSubscription()
    }, 'Concise Syntax Extension crashed unexpectedly when activating')
  },
  dispose() {
    tryFn(() => {
      syntax.dispose()
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
