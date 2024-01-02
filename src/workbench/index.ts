import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId } from './keys'
import { createTryFunction } from './lifecycle'
import { State, state } from 'src/shared/state'
import { createStyles } from './shared'
import { regexToDomToCss } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
export type { editorObservable, stateObservable }

const editorObservable = createObservable<undefined | boolean>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)

let anyEditor: typeof editorObservable.value
let editorUnsubscribe: Function | undefined
let createEditorSubscription = () =>
  editorObservable.$ubscribe((value) => {
    if (anyEditor || !value) return
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
        highlight.activate()
      }

      if (anyEditor) {
        syntaxStyle.styleIt(regexToDomToCss())
      }
    } else {
      editorUnsubscribe?.()
      editorUnsubscribe = undefined
      highlight.dispose() // the unwinding of the editorObservable could cause a stack overflow but you are checking "anyEditor || !value"

      anyEditor = undefined
      syntaxStyle.dispose()
    }
  })

const syntax = createSyntaxLifecycle(stateObservable)
const highlight = createHighlightLifeCycle(editorObservable)
const tryFn = createTryFunction()

debugger

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
