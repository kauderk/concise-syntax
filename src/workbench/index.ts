import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId, viewLinesSelector } from './keys'
import { createTryFunction } from './lifecycle'
import { IState, State, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { createStyles, toastConsole } from './shared'
import { TryRegexToDomToCss } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
export type { editorObservable, stateObservable, calibrateObservable }

const editorObservable = createObservable<undefined | boolean>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)
const calibrateObservable = createObservable<Calibrate | undefined | 'bootUp'>(
  undefined
)

/**
 * standBy     nothing   / bootUp
 * requesting  click     / opening
 * loaded      dom/click / opened
 * windowState nothing   / closed
 *
 * noting/bootUp > click > opening > opened > dom/click > closed > standBy
 */
let calibrateUnsubscribe: Function | undefined
let createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((value) => {
    toastConsole.log('calibrateObservable', value)
    // FIXME: if anything fails the state cycle will be broken
    if (value == 'bootUp') {
      tryClick()
    } else if (value == calibrate.opening) {
      // noop
    } else if (value == calibrate.opened) {
      const lineEditor = document.querySelector<HTMLElement>(
        `[data-uri$="concise-syntax/out/syntax.tsx"] ${viewLinesSelector}`
      )
      if (!lineEditor) {
        toastConsole.error('Line Editor not found')
      } else {
        const css = TryRegexToDomToCss(lineEditor)
        if (css) {
          syntaxStyle.styleIt(css)
        } else {
          toastConsole.error(
            'Fail to load concise syntax styles even with cache'
          )
        }
      }
      tryClick()
    } else if (value == calibrate.closed) {
      // noop
    } else {
      // noop
    }
    function tryClick() {
      const c = document.querySelector<HTMLElement>(ICalibrate.selector)
      if (!c) {
        toastConsole.error('Calibrate button not found')
      } else {
        c.click()
      }
    }
  })

let anyEditor: typeof editorObservable.value
let editorUnsubscribe: Function | undefined
let createEditorSubscription = () =>
  editorObservable.$ubscribe((value) => {
    toastConsole.log('editorObservable', value)
    if (anyEditor || !value) return // the unwinding of the editorObservable could cause a stack overflow but you are checking "anyEditor || !value"
    anyEditor = value

    stateObservable.notify()
  })

const syntaxStyle = createStyles('hide')
let unsubscribeState = () => {}
let running = false
const createStateSubscription = () =>
  stateObservable.$ubscribe((deltaState) => {
    toastConsole.log('stateObservable', deltaState)
    if (deltaState == state.active) {
      if (running) return toastConsole.warn('Trying to run again')
      running = true

      editorUnsubscribe = createEditorSubscription()
      highlight.activate(500) // FIXME: find the moment the css finishes loading

      calibrateUnsubscribe = createCalibrateSubscription()
      calibration.activate(500)
    } else {
      running = false

      editorUnsubscribe?.()
      editorUnsubscribe = undefined
      highlight.dispose() // the unwinding of the editorObservable could cause a stack overflow but you are checking "anyEditor || !value"

      anyEditor = undefined
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
