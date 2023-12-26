import {
  highlightSelector,
  idSelector,
  linesSelector,
  overlaySelector,
} from './keys'
import { lifecycle } from './lifecycle'
import {
  createAttributeArrayMutation,
  createMutation,
  createSimpleMutation,
  styleIt,
} from './shared'
import { Selected, tryGetAttribute, styles, queryEditors } from './utils'

/**
 * @description Change color of highlighted or selected lines
 *
 * Read this function from bottom to top
 *
 * At the bottom is the lifecycle function
 *
 * At the top is main function: createHighlight
 */
export function createHighlightLifeCycle() {
  function createHighlight({ node, selector, add, set, color }: Selected) {
    if (!node.querySelector(selector)) return
    const label = tryGetAttribute(node, 'aria-label')
    const top = Number(node.style?.top.match(/\d+/)?.[0])
    if (
      !label ||
      isNaN(top) ||
      set.has(top) === add ||
      (!add &&
        // most likely a node previous the lifecycle
        // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
        document.querySelector(
          highlightSelector + `>[style*="${top}"]>` + selector
        ))
    ) {
      return
    }

    // funny code
    set[add ? 'add' : 'delete'](top)

    const lines = Array.from(set)
      .reduce((acc, top) => acc + `[style*="${top}"],`, '')
      .slice(0, -1)

    styleIt(
      styles.getOrCreateLabeledStyle(label + selector),
      `[aria-label="${label}"]${linesSelector} :is(${lines}) {
					--r: ${color};
			}`
    )

    return true
  }

  let selectedLines = new Set<number>()
  const selectedSelector = '.selected-text'

  let currentLines = new Set<number>()
  const currentLineSelector = '.current-line'

  function highlightStyles(node: HTMLElement, add: boolean) {
    createHighlight({
      node,
      selector: selectedSelector,
      add,
      set: selectedLines,
      color: 'orange',
    }) ||
      createHighlight({
        node,
        selector: currentLineSelector,
        add,
        set: currentLines,
        color: 'brown',
      })
  }

  const OverlayLineTracker = createMutation({
    options: {
      childList: true,
    },
    added(node) {
      highlightStyles(node, true)
    },
    removed(node) {
      highlightStyles(node, false)
    },
  })

  const EditorLanguageTracker = createAttributeArrayMutation({
    watchAttribute: ['data-mode-id', 'aria-label'],
    change(editor: HTMLElement, [language, label], [, oldLabel]) {
      if (!language || !label) return // hydrating...

      const overlay = editor.querySelector(overlaySelector)
      overlay?.setAttribute('aria-label', label) // TODO: find a better way to pass this data, it is this to prevent virtual dom shenanigans
      if (!overlay) {
        return console.error('no overlays')
      }
      OverlayLineTracker.untrack(overlay)

      if (label != oldLabel || !label.match(/(\.tsx$)|(\.tsx, E)/)) {
        if (!oldLabel) {
          console.error('no old label', arguments)
          return
        }
        styles.clear(oldLabel)
        return
      }
      if (language === 'typescriptreact') {
        console.log('overlays', arguments)
        OverlayLineTracker.track(overlay) // FIXME: the target shouldn't be part of the tracker internal state
      }
    },
  })

  const RootContainerTracker = createSimpleMutation({
    options: {
      childList: true,
      subtree: true,
    },
    added(node) {
      queryEditors(node).forEach((editor) => {
        if (!EditorLanguageTracker.targets.includes(editor)) {
          debugger
          EditorLanguageTracker.track(editor)
        }
      })
    },
    removed(node) {
      queryEditors(node).forEach((editor) => {
        if (EditorLanguageTracker.targets.includes(editor)) {
          debugger
          EditorLanguageTracker.untrack(editor)
        }
      })
    },
  })

  const cycle = lifecycle({
    dom() {
      const root = document.querySelector(
        '#workbench\\.parts\\.editor > div.content > div > div > div > div > div.monaco-scrollable-element > div.split-view-container'
      ) as HTMLElement
      const editor = root?.querySelector(idSelector) as HTMLElement
      const overlays = editor?.querySelector(highlightSelector)
        ?.parentElement as HTMLElement
      return {
        check() {
          return !!(root && editor && overlays)
        },
        watchForRemoval: root,
      }
    },
    activate(dom) {
      debugger
      RootContainerTracker.track(dom.watchForRemoval)
      return () => RootContainerTracker.untrack(dom.watchForRemoval)
    },
    dispose() {
      EditorLanguageTracker.clear()
      OverlayLineTracker.clear()
      selectedLines.clear()
      currentLines.clear()
      styles.clearAll()
    },
  })

  return cycle
}
