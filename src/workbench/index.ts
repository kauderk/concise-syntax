import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId } from './keys'

const syntax = createSyntaxLifecycle()
const highlight = createHighlightLifeCycle()

const conciseSyntax = {
  activate() {
    syntax.activate()
    highlight.activate()
  },
  dispose() {
    syntax.dispose()
    highlight.dispose()
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
