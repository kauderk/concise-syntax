import {
  editorSelector,
  highlightSelector,
  idSelector,
  linesSelector,
} from './keys'
import { lifecycle } from './lifecycle'
import {
  createAttributeArrayMutation,
  createMutation,
  createStackedMutation,
  styleIt,
} from './shared'
import { Selected, queryOverlays, styles } from './utils'

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
  // prettier-ignore
  function createHighlight({ node, selector, add, set, label, color }: Selected) {
    if (!(node instanceof HTMLElement) || !node.querySelector(selector)) return
    const top = Number(node.style?.top.match(/\d+/)?.[0])
    if (
      isNaN(top) ||
      set.has(top) === add ||
      (!add &&
        // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
        document.querySelector(
          `[aria-label="${label}"]`+highlightSelector + `>[style*="${top}"]>` + selector
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
      styles.getOrCreateLabeledStyle(label , selector),
      `[aria-label="${label}"]${linesSelector} :is(${lines}) {
					--r: ${color};
			}`
    )

    return true
  }

  function editorOverlayLifecycle(editor: HTMLElement, overlay: HTMLElement) {
    // lookup state
    let editorLabel: string | undefined

    const EditorLanguageTracker = createAttributeArrayMutation({
      target: () => editor,
      watchAttribute: ['data-mode-id', 'aria-label'],
      change([language, label], [, oldLabel]) {
        editorLabel = label
        if (!language || !label) return // hydrating...

        OverlayLineTracker.disconnect()

        if (label.match(/(\.tsx$)|(\.tsx, E)/)) {
          if (language === 'typescriptreact') {
            OverlayLineTracker.observe()
          }
          if (oldLabel && label != oldLabel) {
            styles.clear(oldLabel)
            mount()
          }
        } else {
          styles.clear(label)
        }
      },
    })

    // lookup state
    let selectedLines = new Set<number>()
    let currentLines = new Set<number>()

    const OverlayLineTracker = createMutation({
      target: () => overlay,
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
    function mount() {
      selectedLines.clear()
      currentLines.clear()
      overlay.childNodes.forEach((node) => highlightStyles(node, true)) // if you restart vscode, there might be selected lines already
    }
    function highlightStyles(node: Node, add: boolean) {
      if (!editorLabel) return
      const pre = { node, add, label: editorLabel }
      createHighlight({
        selector: '.selected-text',
        color: 'orange',
        set: selectedLines,
        ...pre,
      }) ||
        createHighlight({
          selector: '.current-line',
          color: 'brown',
          set: currentLines,
          ...pre,
        })
    }

    const layoutShiftInterval = setInterval(() => {
      mount()
      EditorLanguageTracker.plug()
    }, 0)

    return function dispose() {
      clearInterval(layoutShiftInterval)
      if (editorLabel) styles.clear(editorLabel)
      EditorLanguageTracker.disconnect()
      OverlayLineTracker.disconnect()
    }
  }

  let overlayStack = new Map<HTMLElement, Function>()
  const RootContainerTracker = createStackedMutation({
    options: {
      childList: true,
      subtree: true,
    },
    added(node) {
      for (const overlay of queryOverlays(node)) {
        if (overlayStack.has(overlay)) continue

        const editor = overlay.closest(editorSelector)
        if (!(editor instanceof HTMLElement)) {
          console.warn('Found overlay without editor', overlay)
          continue
        }
        overlayStack.set(overlay, editorOverlayLifecycle(editor, overlay))
      }
    },
    removed(node) {
      for (const overlay of queryOverlays(node)) {
        overlayStack.get(overlay)?.()
        overlayStack.delete(overlay)
      }
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
      RootContainerTracker.track(dom.watchForRemoval)
      return () => {
        RootContainerTracker.untrack(dom.watchForRemoval)
        overlayStack.forEach((cleanup) => cleanup())
        overlayStack.clear()
      }
    },
    dispose() {
      styles.clearAll()
    },
  })

  return cycle
}
