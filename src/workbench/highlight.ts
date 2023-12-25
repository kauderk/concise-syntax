import { highlightSelector, linesSelector } from './keys'
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

  const Highlight: MutationOptions = {
    added(node) {
      highlightStyles(node, true)
    },
    removed(node) {
      highlightStyles(node, false)
    },
  }
  const highlightEditorMap = new Map<Element, MutationObserver>()
  const Deployer: MutationOptions = {
    added(node) {
      if (!node.matches?.(highlightSelector)) return

      const highlightEditor = createMutation(Highlight)
      highlightEditorMap.get(node)?.disconnect()
      highlightEditor.observe(node, {
        childList: true,
      })
      highlightEditorMap.set(node, highlightEditor)
    },
    removed(node) {
      if (!node.matches?.(highlightSelector)) return

      highlightEditorMap.get(node)?.disconnect()
      highlightEditorMap.delete(node)
    },
  }
  const highlightDeployer = createMutation(Deployer)
  const attributeObserver = createAttributeMutation({
    activate({ target }) {
      Deployer.added(target)
    },
    inactive({ current }) {
      if (current !== 'typescript') return
      // highlightDeployer.disconnect()
      console.log('inactive')
    },
    watchAttribute: 'data-mode-id',
  })
  const cycle = lifecycle<{
    watchForRemoval: HTMLElement
    closestEditorAncestor: HTMLElement
  }>({
    dom() {
      const editor = document.querySelector(highlightSelector) as HTMLElement
      const closestEditorAncestor = document.querySelector(
        '.monaco-scrollable-element'
      ) as HTMLElement
      return {
        check() {
          return !!(editor && closestEditorAncestor)
        },
        watchForRemoval: editor,
        closestEditorAncestor,
      }
    },
    activate(dom) {
      attributeObserver.activate(dom.watchForRemoval)
      highlightDeployer.observe(dom.closestEditorAncestor, {
        childList: true,
        subtree: true,
      })
    },
    dispose() {
      attributeObserver.disconnect()
      Object.values(highlightEditorMap).forEach((editor) => editor.disconnect())
      highlightEditorMap.clear()
      highlightDeployer.disconnect()
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
