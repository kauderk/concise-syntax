import {
  editorSelector,
  highlightSelector,
  idSelector,
  linesSelector,
  overlaySelector,
} from './keys'
import { lifecycle } from './lifecycle'
import {
  createAttributeArrayMutation,
  createChildrenMutation,
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

  // let overlayStack = new Map<HTMLElement, Function>()
  // const RootContainerTracker = createStackedMutation({
  //   options: {
  //     childList: true,
  //     subtree: true,
  //   },
  //   added(node) {
  //     for (const overlay of queryOverlays(node)) {
  //       if (overlayStack.has(overlay)) continue

  //       const editor = overlay.closest(editorSelector)
  //       if (!(editor instanceof HTMLElement)) {
  //         console.warn('Found overlay without editor', overlay)
  //         continue
  //       }
  //       overlayStack.set(overlay, editorOverlayLifecycle(editor, overlay))
  //     }
  //   },
  //   removed(node) {
  //     for (const overlay of queryOverlays(node)) {
  //       overlayStack.get(overlay)?.()
  //       overlayStack.delete(overlay)
  //     }
  //   },
  // })

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
      function lookup(node: Node | null, up: number): Node {
        return Array(up)
          .fill(0)
          .reduce((acc, _) => acc?.parentElement, node)
      }
      function lookupTo(
        node: Node | null,
        up: number,
        to: Node
      ): node is HTMLElement {
        return lookup(node, up) === to
      }
      let viewStack = new Map<HTMLElement, Function>()
      let editorStack = new Map<HTMLElement, Function>()
      let observableEditorStack = new Map<HTMLElement, Function>()
      // prettier-ignore
      const REC_containerTracker = (target: HTMLElement) =>
        createChildrenMutation({
          target: () => target,
          options: {
            childList: true,
          },
          added(splitViewView) {
            if (!e(splitViewView)) return

            // funny code, how do you select without any sub view?
            const container = splitViewView.querySelector('.editor-container')
            if (
							
							lookupTo(container,2,splitViewView) 
							) {
								
							const editor = splitViewView.querySelector(editorSelector)
							if(
								lookupTo(editor,3,splitViewView) 
							)
							{

								const overlay = editor.querySelector(overlaySelector)
	
								if (e(overlay)) {
									if (!editorStack.has(editor)) {
										console.log('Found new editor', editor)
										editorStack.set(
											editor,
											editorOverlayLifecycle(editor, overlay)
										)
									} else {
										console.warn('Duplicate editor', editor)
									}
								} else {
									console.warn('Editor without overlay', editor)
								}
							}
              else{
								if (!observableEditorStack.has(container)) {
									console.log('Found new editor', container)
									const containerObserver = createChildrenMutation({
										target: () => container,
										options: {
											childList: true,
										},
										added(editor) {
											if (!e(editor)) return

											
											const overlay = editor.querySelector(overlaySelector)
											if (e(overlay)) {
												if (!editorStack.has(editor)) {
													console.log('Found new editor from containerObserver', editor)
													editorStack.set(
														editor,
														editorOverlayLifecycle(editor, overlay)
													)
												} else {
													console.warn('Duplicate editor from containerObserver', editor)
												}
											} else {
												console.warn('Editor without overlay from containerObserver', editor)
											}
											
										},
										removed(editor) {
											if (!e(editor)) return

											console.log('SHould remove editor from containerObserver', editor)
											// editorStack.get(editor)?.()
											// editorStack.delete(editor)
											
										},
									})

									containerObserver.plug()

									console.log('Found new container - instance of containerObserver', container)
									observableEditorStack.set(
										container,
										containerObserver.unplug
									)
								} else {
									console.warn('Duplicate editor', editor)
								}

							}
            } else {
              const nextContainer = splitViewView.querySelector(
                '.split-view-container'
              )
              if (
                e(nextContainer) &&
                nextContainer.parentElement?.parentElement?.parentElement
                  ?.parentElement === splitViewView
              ) {
                const recursive = REC_containerTracker(nextContainer)
                recursive.plug()

                console.log('Found new container', splitViewView)
                viewStack.set(splitViewView, recursive.plug)
              } else {
                console.warn(
                  'End of recursion or could not find view-container',
                  splitViewView
                )
              }
            }
          },
          removed(splitViewView) {
            if (!e(splitViewView)) return

            const editor = splitViewView.querySelector(editorSelector)
            if (
              lookupTo(editor,3,splitViewView) &&
              editorStack.has(editor)
            ) {
              console.log('Removed editor', editor)
              editorStack.get(editor)?.()
              editorStack.delete(editor)
            } else {
              console.warn(
                'Could not remove --editor-- from stack',
                splitViewView,
                editor,
                editorStack
              )
            }
						const container = splitViewView.querySelector('.editor-container')
						if (
							lookupTo(container,2,splitViewView) &&
							observableEditorStack.has(container)
						) {
							console.log('Removed container', container)
							observableEditorStack.get(container)?.()
							observableEditorStack.delete(container)
						}else{
							console.warn(
								'Could not remove **container** from stack',
								splitViewView,
								container,
								observableEditorStack
							)
						}


            console.log('Removed container', splitViewView)
            viewStack.get(splitViewView)?.()
            viewStack.delete(splitViewView)
          },
        })
      debugger
      const root = REC_containerTracker(dom.watchForRemoval)
      root.plug()

      // RootContainerTracker.track(dom.watchForRemoval)
      return () => {
        root.unplug()
        viewStack.forEach((cleanup) => cleanup())
        viewStack.clear()
        editorStack.forEach((cleanup) => cleanup())
        editorStack.clear()

        // RootContainerTracker.untrack(dom.watchForRemoval)
        // overlayStack.forEach((cleanup) => cleanup())
        // overlayStack.clear()
      }
    },
    dispose() {
      styles.clearAll()
    },
  })

  return cycle
}

function e(el: unknown): el is HTMLElement {
  return el instanceof HTMLElement
}
