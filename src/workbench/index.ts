import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId, viewLinesSelector } from './keys'
import { IState, State, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { createStyles, toastConsole } from './shared'
// prettier-ignore
import { assembleCss, editorFlags, jsx_parseStyles, mergeDeep } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
import { or_return } from '../shared/or_return'
import { deltaFn } from 'src/shared/utils'
import { createTryFunction } from './lifecycle'
export type { editorObservable, stateObservable, calibrateObservable }

const editorObservable = createObservable<undefined | boolean>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)

const sessionKey = `${extensionId}.sessionFlags.jsx`
function TryRegexToDomToCss(lineEditor: HTMLElement) {
  let jsxFlags = jsx_parseStyles(lineEditor, editorFlags.jsx)
  try {
    let session = JSON.parse(window.localStorage.getItem(sessionKey) || '{}')
    if (typeof session !== 'object') {
      session = {}
    }
    jsxFlags = mergeDeep(session, jsxFlags)
    window.localStorage.setItem(sessionKey, JSON.stringify(jsxFlags))
  } catch (error: any) {
    window.localStorage.removeItem(sessionKey)
    toastConsole.error(`Failed to store jsx flags: ${error.message}`, { error })
  }
  return assembleCss(jsxFlags)
}
function sessionCss() {
  try {
    let session = JSON.parse(window.localStorage.getItem(sessionKey) || '{}')
    if (typeof session !== 'object') {
      throw new Error('session is not an object')
    }
    return assembleCss(session)
  } catch (error) {
    window.localStorage.removeItem(sessionKey)
  }
}
const calibrateStyle = createStyles('calibrate')
calibrateStyle.styleIt(`${ICalibrate.selector}{display: none !important}`)

const createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((value) => {
    if (value != calibrate.opened) return
    // prettier-ignore
    new or_return(
      () => document.querySelector<HTMLElement>(`[data-uri$="concise-syntax/out/syntax.tsx"] ${viewLinesSelector}`),
      () => toastConsole.error('Calibrate Editor not found')
    )
		.or_return(
			TryRegexToDomToCss, 
			() => toastConsole.error('Failed to calibrate editor')
		)
		.finally(css => {
			syntaxStyle.styleIt(css)

			if (!highlight.running) {
        highlight.activate(500) // FIXME: find the moment the css finishes loading
      }
		})
  })

const createEditorSubscription = () =>
  editorObservable.$ubscribe((value) => {
    if (value) {
      const cache = sessionCss()
      if (cache) {
        console.log('real cache?')
        syntaxStyle.styleIt(cache)
      }

      return 'Symbol.dispose'
    }
  })

const syntaxStyle = createStyles('hide')
// Just use the "using" keyword...
const createStateSubscription = () =>
  stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      if (!calibration.running) {
        console.log('active')
        calibration.activate(500)
        let unSubscribers = [createCalibrateSubscription()]

        const cache = sessionCss()
        if (cache && !highlight.running) {
          // let tries = 0
          // let interval = 10
          // const dirty = setInterval(() => {
          //   if (tries++ > interval) return
          //   if (!editorObservable.value) {
          //     console.log('cache')
          //     syntaxStyle.styleIt(cache)
          //   }
          // }, 2500 / interval)
          highlight.activate(500) // FIXME: find the moment the css finishes loading
          unSubscribers.push(createEditorSubscription())
          // unSubscribers.push(() => clearTimeout(dirty))
        }

        return () => unSubscribers.forEach((un) => un())
      }
    } else {
      console.log('dispose')
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
