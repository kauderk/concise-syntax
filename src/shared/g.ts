import { highlightSelector, idSelector, linesSelector, windowId } from './keys'
import { lifecycle } from './lifecycle'
import {
  createAttributeArrayMutation,
  createMutation,
  styleIt,
  stylesContainer,
} from './shared'
const overlaySelector = '.view-overlays'


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
      console.log('creating style', uid)
      style = document.createElement('style')
      style.setAttribute('aria-label', uid)
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
		change(editor:HTMLElement,[language, label], [_, oldLabel]) {
			if (!language || !label) return // hydrating...

			const overlay = editor.querySelector(overlaySelector)
			overlay?.setAttribute('aria-label', label)
			if (!overlay) {
				return console.error('no overlays')
			}
			OverlayLineTracker.untrack(overlay) // maybe disconnect is better a api

			if (!label.match(/(\.tsx$)|(\.tsx, E)/)) {
				if (!oldLabel) {
					console.error('no old label', arguments)
					return
				}
				stylesContainer
					.querySelectorAll(`[aria-label="${oldLabel}"]`)
					.forEach((style) => style.remove())
				return
			}
			if (language === 'typescriptreact') {
				console.log('overlays', arguments)
				OverlayLineTracker.track(overlay)
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
      /**
       * - split-view-container
       * 		- split-view-view -> Recursion
       * 			- editor-container
       * 				- editor-instance
       */
      debugger
      const editorSelector = '.editor-instance'
      const RootContainerTracker = createMutation({
        options: {
          childList: true,
          subtree: true,
        },
        added(node) {
          if (!node.querySelector) return

          // const overlays = Array.from(node.querySelectorAll(overlaySelector))
          // if (node.matches(overlaySelector)) overlays.push(node)

          // overlays.forEach((overlay: any) => {
          //   if (!OverlayLineTracker.targets.includes(overlay)) {
          //     debugger
          //     OverlayLineTracker.track(overlay)
          //   }
          // })

					const editors = Array.from(node.querySelectorAll(editorSelector))
					if (node.matches(editorSelector)) editors.push(node)
					editors.forEach((editor: any) => {
							if (!EditorLanguageTracker.targets.includes(editor)) {
								debugger
								EditorLanguageTracker.track(editor)
							}
						}
					)
        },
        removed(node) {
          if (!node.querySelector) return

          // const overlays = Array.from(node.querySelectorAll(overlaySelector))
          // if (node.matches(overlaySelector)) overlays.push(node)

          // overlays.forEach((overlay: any) => {
          //   if (OverlayLineTracker.targets.includes(overlay)) {
          //     debugger
          //     OverlayLineTracker.untrack(overlay)
          //   }
          // })

					const editors = Array.from(node.querySelectorAll(editorSelector))
					if (node.matches(editorSelector)) editors.push(node)
					editors.forEach((editor: any) => {
							if (EditorLanguageTracker.targets.includes(editor)) {
								debugger
								EditorLanguageTracker.untrack(editor)
							}
						}
					)
        },
      })

      RootContainerTracker.track(dom.watchForRemoval)
      return () => {
        RootContainerTracker.clear()
				EditorLanguageTracker.clear()
				OverlayLineTracker.clear()
      }
    },
    dispose() {
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
function tryGetAttribute(node: HTMLElement, attribute:string) {
	// @ts-ignore
	return node.editor =
		node.closest(`[${attribute}][data-mode-id]`)?.getAttribute(attribute) ??
		// @ts-ignore
		node.editor
}

