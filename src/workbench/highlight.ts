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
import type { editorObservable, opacitiesObservable } from './index'
import { OpacityTable, cssOpacityName } from 'src/shared/state'

/**
 * @description Change color of highlighted or selected lines
 *
 * Take a look at the {createHighlight} function to see how the styles are generated
 */
export function createHighlightLifeCycle(
  _editorObservable: typeof editorObservable,
  _opacitiesObservable: typeof opacitiesObservable
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
        _editorObservable,
        _opacitiesObservable
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

function createHighlight(o: Selected & { thenable?: (top: number) => void }) {
  const { node, add, label, selector, set } = o
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
  o.thenable?.(top)

  const lines = Array.from(set)
    .reduce((acc, top) => acc + `[style*="${top}"],`, '')
    .slice(0, -1)
  styleIt(
    styles.getOrCreateLabeledStyle(label, selector),
    `[aria-label="${label}"]${linesSelector} :is(${lines}) {
				${cssOpacityName}: ${o.cssVarOpacity};
		}`
  )
}

function editorOverlayLifecycle(
  editor: HTMLElement,
  _overlay: HTMLElement,
  awkward: {
    foundEditor: () => void
    bleedCurrentLinesValue(): number
  }
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
          OverlayLineTracker.observe()
          bruteForceLayoutShift(awkward.foundEditor)
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
    bleedCurrentLines.clear()
    deltaOverlay.childNodes.forEach((node) => highlightStyles(node, true)) // if you restart vscode, there might be selected lines already
  }

  // lookup state
  let selectedLines = new Set<number>()
  let currentLines = new Set<number>()
  let bleedCurrentLines = new Set<number>()
  let lineHeight: number | undefined

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
      set: selectedLines,
      cssVarOpacity: OpacityTable.selected,
      ...pre,
    })
    createHighlight({
      selector: currentSelector,
      set: currentLines,
      cssVarOpacity: OpacityTable.current,
      ...pre,
      thenable(top) {
        const { node, add, label } = pre
        const selector = 'div' + currentSelector

        // @ts-expect-error
        lineHeight = node.clientHeight || lineHeight
        if (!lineHeight || isNaN(lineHeight))
          return toastConsole.error('bleedCurrentLines: offset is NaN')
        const bleed = awkward.bleedCurrentLinesValue()
        for (let i = -bleed; i <= bleed; i++) {
          bleedCurrentLines[add ? 'add' : 'delete'](top + lineHeight * i)
        }
        // FIXME: either find a more elegant to handle this edge case
        // or stop using the "*" selector and use a more specific one
        const onVeryFirstCalibration = [0, lineHeight]
        for (const bad of onVeryFirstCalibration) {
          bleedCurrentLines.delete(bad)
          bleedCurrentLines.delete(bad - 1)
        }

        const lines = Array.from(bleedCurrentLines)
          .reduce((acc, top) => acc + `[style*="${top}"],`, '')
          .slice(0, -1)
        styleIt(
          styles.getOrCreateLabeledStyle(label, selector),
          `[aria-label="${label}"]${linesSelector} :is(${lines}) {
							${cssOpacityName}: ${OpacityTable.current};
					}`
        )
      },
    })
  }

  // FIXME: find a better way to handle selected lines flickering and layout shifts
  // issue: the top style shifts right before the last frame
  let layoutShift: any
  let tries = 0
  const limit = 5
  const lineTracker = (cb: Function) => {
    tries += 1
    if (tries > limit) {
      cb()
      clearInterval(layoutShift)
      return
    }
    // prettier-ignore
    const line = deltaOverlay.querySelector(selectedSelector+','+currentSelector)?.parentElement as H
    if (line && !isNaN(parseTopStyle(line))) {
      mount()
    }
  }
  function bruteForceLayoutShift(cb: Function) {
    tries = 0
    clearInterval(layoutShift)
    layoutShift = setInterval(() => lineTracker(cb), 100)
  }

  EditorLanguageTracker.plug()

  return {
    mount,
    dispose() {
      clearInterval(layoutShift)
      if (editorLabel) {
        styles.clear(editorLabel)
      } else {
        // FIXME: this is like leaking information that can't be clean up later
        // FIXME: seems to happen when the editor changes from a non tsx file to a tsx file
        console.log('Error: editorLabel is undefined')
      }
      EditorLanguageTracker.disconnect()
      OverlayLineTracker.disconnect()
    },
  }
}

function createStackStructure(
  watchForRemoval: HTMLElement,
  _editorObservable: typeof editorObservable,
  _opacitiesObservable: typeof opacitiesObservable
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

        consumeStack(stack, keyNode)
      }
    }
  }
  function awkwardStack(elements: ReturnType<typeof findScopeElements>) {
    const { overlay, editor } = elements
    if (overlay && editor && !editorStack.has(editor)) {
      // FIXME: this is so convoluted...
      // FIXME: why does this function provides input callbacks and output methods...?
      const cycle = editorOverlayLifecycle(editor, overlay, {
        foundEditor() {
          if (!watchForRemoval.contains(editor)) {
            toastConsole.error('Editor not found _editorObservable')
            return
          }
          _editorObservable.value = editor.getAttribute('aria-label')!
        },
        bleedCurrentLinesValue() {
          return _opacitiesObservable.value.bleedCurrentLines
        },
      })
      let deltaBleedCurrentLines = _opacitiesObservable.value.bleedCurrentLines
      const unSubscribe = _opacitiesObservable.$ubscribe((o) => {
        if (deltaBleedCurrentLines !== o.bleedCurrentLines) {
          deltaBleedCurrentLines = o.bleedCurrentLines
          cycle.mount()
        }
      })
      const dispose = () => {
        cycle.dispose()
        unSubscribe()
      }
      editorStack.set(editor, dispose)
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
