import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId, viewLinesSelector } from './keys'
import { IState, State, calibrationFileName, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { createStyles, toastConsole } from './shared'
// prettier-ignore
import { assembleCss, editorFlags, jsx_parseStyles, mergeDeep } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
import { or_return } from '../shared/or_return'
import { deltaFn } from 'src/shared/utils'
import { createTryFunction } from './lifecycle'
export type { editorObservable, stateObservable, calibrateObservable }

const editorObservable = createObservable<undefined | string>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)

const sessionKey = `${extensionId}.sessionFlags.jsx`
function TryRegexToDomToCss(lineEditor: HTMLElement) {
  let jsxFlags = jsx_parseStyles(lineEditor, editorFlags.jsx)
  try {
    debugger
    let session = JSON.parse(window.localStorage.getItem(sessionKey) || '{}')
    if (typeof session !== 'object') {
      session = {}
    }
    jsxFlags = mergeDeep(session, jsxFlags)
    // TODO: check if there are new flags or new schema then delete the session
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

// prettier-ignore
const queryEditor = () => document.querySelector<HTMLElement>(`[data-uri$="concise-syntax/out/${calibrationFileName}"] ${viewLinesSelector}`)
// prettier-ignore
const tryStyleEditor = () => 
	new or_return(
		queryEditor,
		() => toastConsole.error('Calibrate Editor not found')
	)
	.or_return(
		TryRegexToDomToCss, 
		() => toastConsole.error('Failed to calibrate editor')
	)
	.finally(css => {
		requestAnimationFrame(() => syntaxStyle.styleIt(css))

		if (!highlight.running) {
			highlight.activate(500) // FIXME: find the moment the css finishes loading
		}
	})
const createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((value) => {
    if (!(value == calibrate.opened || value == calibrate.invalidate)) return
    if (value == calibrate.invalidate && !queryEditor()) {
      debugger
      // Something failed or fall out of sync
      // let the editorObservable handle the recovery
      editorObservable.value = undefined
      return createEditorSubscription()
    }

    debugger
    tryStyleEditor()
  })

const createEditorSubscription = () =>
  editorObservable.$ubscribe((value) => {
    if (!value) return
    debugger
    if (value.includes(calibrationFileName)) {
      tryStyleEditor()
    } else {
      const cache = sessionCss()
      if (cache) syntaxStyle.styleIt(cache)
    }
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

        if (sessionCss() && !highlight.running) {
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
 * TODO
 * there should be a way to update the editor without calibrating
 * there should be a way to hook textMateRules when activating the extension
 * 	for example the case of constant.language.boolean "{true}"
 * */
/**
 * FIXME
 * handle drastic user changes for example when changing vscode's profile
 */
