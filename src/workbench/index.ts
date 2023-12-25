import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'

const syntax = createSyntaxLifecycle()
const highlight = createHighlightLifeCycle()

const conciseSyntax = {
  activate() {
    this.dispose()
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
debugger
conciseSyntax.activate()
