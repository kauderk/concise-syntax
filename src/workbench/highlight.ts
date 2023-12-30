import {
  currentSelector,
  highlightSelector,
  idSelector,
  linesSelector,
  selectedSelector,
  splitViewContainerSelector,
} from './keys'
import { lifecycle } from './lifecycle'
import {
  createAttributeArrayMutation,
  specialChildrenMutation,
  createMutation,
  styleIt,
} from './shared'
import {
  Selected,
  e,
  findScopeElements,
  guardStack,
  parseTopStyle,
  styles,
  validateAddedView,
} from './utils'

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
    if (!e(node) || !node.querySelector(selector)) return
    const top = parseTopStyle(node)
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
    let editorLabel = editor.getAttribute('aria-label') as any

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
    function mount() {
      selectedLines.clear()
      currentLines.clear()
      overlay.childNodes.forEach((node) => highlightStyles(node, true)) // if you restart vscode, there might be selected lines already
    }

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

    function highlightStyles(node: Node, add: boolean) {
      if (!editorLabel) return
      const pre = { node, add, label: editorLabel }
      createHighlight({
        selector: selectedSelector,
        color: 'orange',
        set: selectedLines,
        ...pre,
      }) ||
        createHighlight({
          selector: currentSelector,
          color: 'brown',
          set: currentLines,
          ...pre,
        })
    }

    // FIXME: find a better way to handle selected lines flickering and layout shifts
    // issue: the top style shifts right before the last frame
    let done = false
    const lineTracker = createAttributeArrayMutation({
      target: () => overlay,
      children: true,
      watchAttribute: ['style'],
      change([style], [oldStyle], node) {
        if (done) return
        const top = parseTopStyle(node)
        if (!isNaN(top) && style && oldStyle != style) {
          done = true
          mount()
          lineTracker.stop()
        }
      },
    })
    mount()
    EditorLanguageTracker.plug()
    lineTracker.plug()
    const layoutShift = setTimeout(lineTracker.stop, 500)

    return function dispose() {
      clearTimeout(layoutShift)
      lineTracker.stop()
      if (editorLabel) styles.clear(editorLabel)
      EditorLanguageTracker.disconnect()
      OverlayLineTracker.disconnect()
    }
  }

  const cycle = lifecycle({
    dom() {
      type H = HTMLElement
      const gridRoot = document.querySelector(
        '#workbench\\.parts\\.editor > div.content > div > div'
      ) as H
      const root = gridRoot.querySelector(
        ':scope > div > div > div.monaco-scrollable-element > ' +
          splitViewContainerSelector
      ) as H
      const editor = root?.querySelector(idSelector) as H
      const overlays = editor?.querySelector(highlightSelector)
        ?.parentElement as H
      return {
        check() {
          return !!overlays
        },
        watchForRemoval: gridRoot,
      }
    },
    activate(DOM) {
      /**
       * - split-view-container
       * 		- split-view-view -> Recursion
       * 			- editor-container
       * 				- editor-instance
       * 					- view-overlays
       * 							- selected-text
       * 							- current-line
       */

      //#region Stack Structure
      let recStack = new Map<HTMLElement, Function>()
      let editorStack = new Map<HTMLElement, Function>()
      let treeStack = new Map<HTMLElement, Function>()
      const REC_EditorOverlayTracker = (target: HTMLElement) =>
        specialChildrenMutation({
          target: () => target,
          options: {
            childList: true,
          },
          added: REC_added,
          removed: bruteForceRemove,
        })

      function clearStacks(condition?: (keyNode: HTMLElement) => boolean) {
        for (const stack of [recStack, editorStack, treeStack]) {
          for (const [keyNode] of stack) {
            if (condition && !condition(keyNode)) continue
            stack.get(keyNode)?.()
            stack.delete(keyNode)
          }
        }
      }
      function awkwardStack(elements: ReturnType<typeof findScopeElements>) {
        const { overlay, editor } = elements
        if (overlay && editor && !editorStack.has(editor)) {
          editorStack.set(editor, editorOverlayLifecycle(editor, overlay))
          return true
        }
      }
      function REC_added(splitViewView: HTMLElement) {
        const elements = findScopeElements(splitViewView)

        if (elements.nested) {
          const rec = REC_EditorOverlayTracker(elements.nested)
          rec.plug()

          guardStack(recStack, splitViewView, rec.stop) // don't "unplug" because the unwinding will cause a stack overflow plus the "removed" method is currently brute force
        } else if (awkwardStack(elements)) {
          // noop
        } else if (!elements.overlay) {
          const treeTracker = specialChildrenMutation({
            target: () => splitViewView,
            options: {
              childList: true,
              subtree: true,
            },
            // FIXME: this should handle the mutation callback instead of each added node
            added() {
              const elements = findScopeElements(splitViewView)
              if (awkwardStack(elements)) {
                treeTracker.stop()
                // TODO: maybe both recStack and treeStack could be cleared here without instead of brute force
              }
            },
            // TODO: this is not needed
            removed() {},
          })

          treeTracker.plug()
          guardStack(treeStack, splitViewView, treeTracker.stop) // don't "unplug" because the unwinding will cause a stack overflow plus the "removed" method is currently brute force
        }
      }
      function bruteForceRemove(splitViewView: HTMLElement) {
        // FIXME: this should be handled by each cycle, there is an unhandled cleanup
        clearStacks((keyNode) => !DOM.watchForRemoval.contains(keyNode))
      }
      //#endregion

      //#region Lifecycle
      let rebootCleanup: Function | undefined
      const reboot = specialChildrenMutation({
        target: () => DOM.watchForRemoval,
        options: { childList: true },
        added(node) {
          const res = validateAddedView(node, rebootCleanup)
          if (!res) return

          const recursiveViewTracker = REC_EditorOverlayTracker(
            res.rootContainer
          )
          // This is a special case, the first view never gets removed
          const firsContainerTracker = specialChildrenMutation({
            target: () => res.container,
            options: { childList: true },
            added() {
              REC_added(res.firstView)
            },
            removed() {
              bruteForceRemove(res.firstView)
            },
          })

          recursiveViewTracker.plug(() => res.restViews)
          firsContainerTracker.plug()

          rebootCleanup = () => {
            recursiveViewTracker.stop()
            firsContainerTracker.stop()
          }
        },
        removed: consumeRebootCleanup,
      })
      function consumeRebootCleanup() {
        rebootCleanup?.()
        rebootCleanup = undefined
      }
      //#endregion

      reboot.plug()

      return () => {
        reboot.stop()
        consumeRebootCleanup()
        clearStacks()
      }
    },
    dispose() {
      styles.clearAll()
    },
  })

  return cycle
}
