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
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)

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
    if (value != calibrate.opened) return
    debugger
    // prettier-ignore
    const x = new or_return(
      () => document.querySelector<HTMLElement>(`[data-uri$="concise-syntax/out/syntax.tsx"] ${viewLinesSelector}`),
      () => toastConsole.error('Line Editor not found')
    )
		.or_return(
			TryRegexToDomToCss, 
			() => toastConsole.error('Line Editor not found')
		)
		.finally(css => {
			debugger
			syntaxStyle.styleIt(css)
			stateObservable.notify()
			return 0
		})
    debugger
    console.log(x)
  })

class or_return<T> {
  constructor(
    private fn: () => T | ((a: any) => T),
    private onError: () => any
  ) {
    this.fn = fn
    this.onError = onError
  }

  finally<R, Y = T>(fn: (a: NonNullable<Y>) => R): R | undefined {
    try {
      const value = this.fn()
      if (value) {
        // @ts-ignore
        return fn(value)
      } else {
        this.onError()
      }
    } catch (error) {
      this.onError()
    }
  }

  or_return<Y>(fn: (a: NonNullable<T>) => Y, onError: () => any) {
    try {
      const value = this.fn()
      if (value) {
        // @ts-ignore
        return new or_return(() => fn(value), onError)
      } else {
        this.onError()
      }
    } catch (error) {
      this.onError()
    }
    return new or_return(console.log, console.error) as or_return<Y>
  }
}

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
