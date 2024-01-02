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
  innerChildrenMutation,
  toastConsole,
} from './shared'
import {
  Selected,
  consumeStack,
  e,
  findScopeElements,
  guardStack,
  parseTopStyle,
  styles,
  validateAddedView,
} from './utils'
import type { editorObservable } from './index'

/**
 * @description Change color of highlighted or selected lines
 *
 * Take a look at the {createHighlight} function to see how the styles are generated
 */
export function createHighlightLifeCycle(
  _editorObservable: typeof editorObservable
) {
  return lifecycle({
    // prettier-ignore
    dom() {
      const gridRoot = document.querySelector('#workbench\\.parts\\.editor > div.content > div > div') as H
      const root = gridRoot.querySelector(':scope > div > div > div.monaco-scrollable-element > ' + splitViewContainerSelector) as H
      const editor = root?.querySelector(idSelector) as H
      const overlays = editor?.querySelector(highlightSelector)?.parentElement as H
      return {
        check: () => !!overlays,
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
      const structure = createStackStructure(
        DOM.watchForRemoval,
        _editorObservable
      )

      return innerChildrenMutation({
        parent: DOM.watchForRemoval,
        dispose: structure.clearStacks,
        validate: validateAddedView,
        added(res) {
          const recursiveViewTracker = structure.REC_EditorOverlayTracker(
            res.rootContainer
          )
          // This is a special case, the first view never gets removed
          const firsContainerTracker = specialChildrenMutation({
            target: () => res.container,
            options: { childList: true },
            added() {
              structure.REC_added(res.firstView)
            },
            removed() {
              structure.bruteForceRemove(res.firstView)
            },
          })

          recursiveViewTracker.plug(() => res.restViews)
          firsContainerTracker.plug()
          return () => {
            recursiveViewTracker.stop()
            firsContainerTracker.stop()
          }
        },
        removed(node, consume) {
          consume()
        },
      })
    },
    dispose() {
      styles.clearOverlays()
    },
  })
}

function createHighlight({ node, selector, add, set, label, color }: Selected) {
  if (!e(node) || !node.querySelector(selector)) return
  const top = parseTopStyle(node)
  if (
    isNaN(top) ||
    set.has(top) === add ||
    (!add &&
      // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
      document.querySelector(
        `[aria-label="${label}"]` +
          highlightSelector +
          `>[style*="${top}"]>` +
          selector
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
    styles.getOrCreateLabeledStyle(label, selector),
    `[aria-label="${label}"]${linesSelector} :is(${lines}) {
				--r: ${color};
		}`
  )

  return true
}

function editorOverlayLifecycle(
  editor: HTMLElement,
  overlay: HTMLElement,
  foundEditor: () => void
) {
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
          foundEditor()
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
  let tries = 0
  const lineTracker = () => {
    const line = overlay.querySelector(selectedSelector) as H
    if (!line || tries > 5) {
      clearInterval(layoutShift)
      return
    }
    const top = parseTopStyle(line)
    if (!isNaN(top)) {
      tries += 1
      // toastConsole.log('layout shift')
      mount()
    }
  }
  mount()
  EditorLanguageTracker.plug()
  const layoutShift = setInterval(lineTracker, 500)

  return function dispose() {
    tries = 6
    clearInterval(layoutShift)
    if (editorLabel) styles.clear(editorLabel)
    EditorLanguageTracker.disconnect()
    OverlayLineTracker.disconnect()
  }
}

function createStackStructure(
  watchForRemoval: HTMLElement,
  _editorObservable: typeof editorObservable
) {
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
        // TODO: get me out of here
        if (stack === editorStack) _editorObservable.value = false
        consumeStack(stack, keyNode)
      }
    }
  }
  function awkwardStack(elements: ReturnType<typeof findScopeElements>) {
    const { overlay, editor } = elements
    if (overlay && editor && !editorStack.has(editor)) {
      // TODO: get me out of here
      const foundEditor = () => {
        _editorObservable.value = true
      }
      editorStack.set(
        editor,
        editorOverlayLifecycle(editor, overlay, foundEditor)
      )
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
    clearStacks((keyNode) => !watchForRemoval.contains(keyNode))
  }

  return {
    REC_EditorOverlayTracker,
    clearStacks,
    REC_added,
    bruteForceRemove,
  }
}
type H = HTMLElement
