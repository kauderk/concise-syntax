import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId } from './keys'
import { createTryFunction } from './lifecycle'

const syntax = createSyntaxLifecycle()
const highlight = createHighlightLifeCycle()
const tryFn = createTryFunction()

const conciseSyntax = {
  activate() {
    tryFn(() => {
      syntax.activate()
      highlight.activate()
    }, 'Concise Syntax Extension crashed unexpectedly when activating')
  },
  dispose() {
    tryFn(() => {
      syntax.dispose()
      highlight.dispose()
    }, 'Concise Syntax Extension crashed unexpectedly when disposing')
  },
}

// @ts-ignore
if (window.conciseSyntax) {
  // @ts-ignore
  window.conciseSyntax.dispose()
}
// @ts-ignore
window.conciseSyntax = conciseSyntax
conciseSyntax.activate()

console.log(extensionId, conciseSyntax)
