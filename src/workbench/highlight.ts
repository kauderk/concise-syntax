import { highlightSelector, idSelector, linesSelector } from './keys'
import { lifecycle } from './lifecycle'
import {
  MutationOptions,
  createAttributeMutation,
  createMutation,
} from './shared'
import { createStyles } from './shared'

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
  function createHighlight({
    node,
    selector,
    add,
    set,
    styleIt,
    color,
  }: Selected) {
    if (!node.querySelector(selector)) return
    const top = Number(node.style?.top.match(/\d+/)?.[0])
    if (
      isNaN(top) ||
      set.has(top) === add ||
      // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
      (!add &&
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

    styleIt(`
		${linesSelector} :is(${lines}) {
				--r: ${color};
		}`)

    return true
  }

  let selectedLines = new Set<number>()
  const selectedSelector = '.selected-text'
  const selectedStyles = createStyles('selected')

  let currentLines = new Set<number>()
  const currentLineSelector = '.current-line'
  const currentStyles = createStyles('current')

  function highlightStyles(node: HTMLElement, add: boolean) {
    createHighlight({
      node,
      selector: selectedSelector,
      add,
      set: selectedLines,
      color: 'orange',
      styleIt: selectedStyles.styleIt,
    }) ||
      createHighlight({
        node,
        selector: currentLineSelector,
        add,
        set: currentLines,
        color: 'brown',
        styleIt: selectedStyles.styleIt,
      })
  }
  const Highlight = {
    added(node) {
      highlightStyles(node, true)
    },
    removed(node) {
      highlightStyles(node, false)
    },
  } satisfies MutationOptions

  const EditorOverlayMap = new Map<Element, { dispose(): void }>()
  const EditorOverlay = {
    added(editor) {
      const overlays = editor.querySelector?.(highlightSelector)
      if (!overlays) return
      const languageObserver = createAttributeMutation({
        watchAttribute: 'data-mode-id',
        activate: swap,
        inactive: swap,
      })
      const highlightObserver = createMutation(Highlight)
      function swap({ attribute }: any) {
        if (!attribute) return // hydrating...
        highlightObserver.disconnect()

        if (attribute === 'typescriptreact') {
          const overlays = editor.querySelector?.(highlightSelector)
          if (!overlays) return console.warn('no overlays')
          highlightObserver.observe(overlays, {
            childList: true,
          })
        }
      }

      EditorOverlayMap.get(editor)?.dispose()
      languageObserver.activate(editor)
      EditorOverlayMap.set(editor, {
        dispose() {
          highlightObserver.disconnect()
          languageObserver?.dispose()
        },
      })
    },
    removed(editor) {
      if (!editor.querySelector?.(highlightSelector)) return

      EditorOverlayMap.get(editor)?.dispose()
      EditorOverlayMap.delete(editor)
    },
  } satisfies MutationOptions
  const EditorOverlayDeployer = createMutation(EditorOverlay)

  const cycle = lifecycle({
    dom() {
      const overlays = document.querySelector(highlightSelector)
        ?.parentElement as HTMLElement
      const editor = document.querySelector(idSelector) as HTMLElement
      return {
        check() {
          return !!(overlays && editor)
        },
        watchForRemoval: editor,
      }
    },
    activate(dom) {
      EditorOverlay.added(dom.watchForRemoval)
      EditorOverlayDeployer.observe(dom.watchForRemoval, {
        childList: true,
      })
    },
    dispose() {
      Object.values(EditorOverlayMap).forEach((observer) => observer.dispose())
      EditorOverlayMap.clear()
      EditorOverlayDeployer.disconnect()
      selectedLines.clear()
      currentLines.clear()
      selectedStyles.dispose()
      currentStyles.dispose()
    },
  })

  return cycle
}

type Selected = {
  node: HTMLElement
  selector: string
  add: boolean
  set: Set<number>
  styleIt: (text: string) => void
  color: string
}
