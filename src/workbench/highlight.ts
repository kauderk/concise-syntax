import {
  currentSelector,
  highlightSelector,
  idSelector,
  linesSelector,
  overlaySelector,
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
  _overlay: HTMLElement,
  foundEditor: () => void
) {
  // lookup state
  let editorLabel = editor.getAttribute('aria-label') as string | undefined
  // when changing the textDocument the editor outlives the overlay
  let deltaOverlay = _overlay as HTMLElement // | undefined

  const EditorLanguageTracker = createAttributeArrayMutation({
    target: () => editor,
    watchAttribute: ['data-mode-id', 'aria-label'],
    change([language, label], [, oldLabel]) {
      editorLabel = label

      if (!language || !label) {
        if (oldLabel && label != oldLabel) {
          styles.clear(oldLabel)
        }
        return
      }

      OverlayLineTracker.disconnect()

      // FIXME: this is a panic scenario, should throw and exception or execute a failure callback
      if (!editor.contains(deltaOverlay!)) {
        // also if it fails to query the overlay, use the last one because a undefined overlay will cause a crash
        deltaOverlay = editor?.querySelector<H>(overlaySelector) ?? deltaOverlay
      }

      if (label.match(/(\.tsx$)|(\.tsx, )/)) {
        if (language === 'typescriptreact') {
          foundEditor()
          OverlayLineTracker.observe()
          bruteForceLayoutShift()
        }
        if (oldLabel && label != oldLabel) {
          toastConsole.log('look! this gets executed...', oldLabel)
        }
      } else {
        styles.clear(label)
      }
    },
  })
  function mount() {
    selectedLines.clear()
    currentLines.clear()
    deltaOverlay.childNodes.forEach((node) => highlightStyles(node, true)) // if you restart vscode, there might be selected lines already
  }

  // lookup state
  let selectedLines = new Set<number>()
  let currentLines = new Set<number>()

  const OverlayLineTracker = createMutation({
    target: () => deltaOverlay,
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
  const limit = 5
  let layoutShift: any
  const lineTracker = () => {
    const line = deltaOverlay.querySelector(selectedSelector) as H
    if (!line || tries > limit) {
      clearInterval(layoutShift)
      return
    }
    const top = parseTopStyle(line)
    if (!isNaN(top)) {
      tries += 1
      mount()
    }
  }
  function bruteForceLayoutShift() {
    tries = 0
    clearInterval(layoutShift)
    layoutShift = setInterval(lineTracker, 100)
  }

  mount()
  EditorLanguageTracker.plug()
  bruteForceLayoutShift()

  return function dispose() {
    tries = limit + 2
    clearInterval(layoutShift)
    if (editorLabel) {
      styles.clear(editorLabel)
    } else {
      // FIXME: this is like leaking information that can't be clean up later
      toastConsole.error('editorLabel is undefined')
    }
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
      // toastConsole.log('awkwardStack')
      editorStack.set(
        editor,
        editorOverlayLifecycle(editor, overlay, foundEditor)
      )
      return true
    }
  }
  function REC_added(splitViewView: HTMLElement) {
    // toastConsole.log('REC_added')
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
