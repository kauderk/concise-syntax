import { highlightSelector, idSelector, linesSelector, windowId } from './keys'
import { lifecycle } from './lifecycle'
import {
  MutationOptions,
  createAttributeMutation,
  createMutation,
  styleIt,
  stylesContainer,
} from './shared'

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
    // @ts-ignore
    const old = node.editor
    const group =
      node.closest('[aria-label][data-mode-id]')?.getAttribute('aria-label') ??
      old
    // @ts-ignore
    node.editor = group

    const top = Number(node.style?.top.match(/\d+/)?.[0])
    if (
      isNaN(top) ||
      set.has(top) === add ||
      (!add &&
        // most likely a node previous the lifecycle
        (!group ||
          // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
          document.querySelector(
            highlightSelector + `>[style*="${top}"]>` + selector
          )))
    ) {
      return
    }

    if (!add && !group) {
      return console.warn('no group', node, top)
    }

    // funny code
    set[add ? 'add' : 'delete'](top)

    const lines = Array.from(set)
      .reduce((acc, top) => acc + `[style*="${top}"],`, '')
      .slice(0, -1)

    const uid = (group ?? windowId) + selector
    let style = stylesContainer.querySelector(
      `[data-editor="${uid}"]`
    ) as HTMLElement
    if (!style || !stylesContainer.contains(style)) {
      style = document.createElement('style')
      style.dataset.editor = uid
      stylesContainer.appendChild(style)
    }

    styleIt(
      style,
      `[aria-label="${group}"]${linesSelector} :is(${lines}) {
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
      stylesContainer.querySelectorAll('style').forEach((style) => {
        style.textContent = ''
      })
    },
  })

  return cycle
}

type Selected = {
  node: HTMLElement
  selector: string
  add: boolean
  set: Set<number>
  color: string
}
