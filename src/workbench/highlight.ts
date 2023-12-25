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
    const label =
      node.closest('[aria-label][data-mode-id]')?.getAttribute('aria-label') ??
      old
    // @ts-ignore
    node.editor = label

    const top = Number(node.style?.top.match(/\d+/)?.[0])
    if (
      isNaN(top) ||
      set.has(top) === add ||
      (!add &&
        // most likely a node previous the lifecycle
        (!label ||
          // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
          document.querySelector(
            highlightSelector + `>[style*="${top}"]>` + selector
          )))
    ) {
      return
    }

    if (!add && !label) {
      return console.warn('no group', node, top)
    }

    // funny code
    set[add ? 'add' : 'delete'](top)

    const lines = Array.from(set)
      .reduce((acc, top) => acc + `[style*="${top}"],`, '')
      .slice(0, -1)

    const uid = (label ?? windowId) + selector
    let style = stylesContainer.querySelector(
      `[aria-label="${uid}"]`
    ) as HTMLElement
    if (!style || !stylesContainer.contains(style)) {
      style = document.createElement('style')
      style.dataset.label = uid
      stylesContainer.appendChild(style)
    }

    styleIt(
      style,
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
    usingUnobservable: true,
    added(editor) {
      const overlays = editor.querySelector?.(highlightSelector)
      if (!overlays) return
      const languageObserver = createAttributeMutation({
        watchAttribute: 'data-mode-id',
        activate(language) {
          if (!language) return // hydrating...
          highlightObserver.disconnect()
          if (language === 'typescriptreact') {
            const overlays = editor.querySelector?.(highlightSelector)
            if (!overlays) return console.warn('no overlays')
            console.log('overlays', arguments)
            highlightObserver.observe(overlays, {
              childList: true,
            })
          }
        },
        inactive(language) {
          console.log('inactive', arguments)
          highlightObserver.disconnect()
        },
      })
      const groupObserver = createAttributeMutation({
        watchAttribute: 'aria-label',
        activate(label) {
          console.log('activate', arguments)
          stylesContainer
            .querySelectorAll(`[aria-label="${label}"]`)
            .forEach((style) => style.remove())
        },
        inactive(label) {
          console.log('inactive', arguments)
          stylesContainer
            .querySelectorAll(`[aria-label="${label}"]`)
            .forEach((style) => style.remove())
        },
      })
      const highlightObserver = createMutation(Highlight)

      EditorOverlayMap.get(editor)?.dispose()
      languageObserver.activate(editor)
      groupObserver.activate(editor)
      EditorOverlayMap.set(editor, {
        dispose() {
          highlightObserver.disconnect()
          languageObserver.dispose()
          groupObserver.dispose()
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
      /**
       * - split-view-container
       * 		- split-view-view -> Recursion
       * 			- editor-container
       */
      let editorContainersMap = new Set<HTMLElement>()
      const rootContainerObserver = createMutation({
        added(node) {
          const editorContainers = Array.from(
            node.querySelectorAll('.editor-container')
          )
          editorContainers.forEach((node: any) => {
            if (!editorContainersMap.has(node)) {
              debugger
              EditorOverlay.added(node)
              EditorOverlayDeployer.observe(node, {
                childList: true,
              })
            } else {
              editorContainersMap.add(node)
            }
          })
        },
        removed(node) {
          const editorContainers = Array.from(
            node.querySelectorAll('.editor-container')
          )
          editorContainers.forEach((node: any) => {
            if (editorContainersMap.has(node)) {
              debugger
              EditorOverlay.removed(node)
              EditorOverlayDeployer.disconnect()
              editorContainersMap.delete(node)
            }
          })
        },
      })
      rootContainerObserver.observe(dom.watchForRemoval, {
        childList: true,
        subtree: true,
      })
      return () => rootContainerObserver.disconnect()
    },
    dispose() {
      Object.values(EditorOverlayMap).forEach((observer) => observer.dispose())
      EditorOverlayMap.clear()
      EditorOverlayDeployer.disconnect()
      selectedLines.clear()
      currentLines.clear()
      stylesContainer
        .querySelectorAll('[aria-label]')
        .forEach((style) => style.remove())
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
