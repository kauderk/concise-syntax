import { bridgeBetweenVscodeExtension } from './keys'
import { lifecycle } from './lifecycle'
import { createAttributeArrayMutation, innerChildrenMutation } from './shared'
import type { IState, ICalibrate } from '../shared/state'
import type { stateObservable, calibrateObservable } from './index'

/**
 * @description When the vscode extension changes the "bridge attribute" apply custom styles
 *
 * Take a look at: regexToDomToCss.ts to see how the styles are generated
 */
export function createSyntaxLifecycle(
  _stateObservable: typeof stateObservable | typeof calibrateObservable,
  state: typeof IState | typeof ICalibrate
) {
  return lifecycle<{ watchForRemoval: H }>({
    dom() {
      const statusBar = document.querySelector('footer .right-items') as H
      return {
        watchForRemoval: statusBar,
        check() {
          return !!document.contains(statusBar?.parentNode)
        },
      }
    },
    activate(DOM) {
      // FIXME: share a single mutation
      return innerChildrenMutation({
        parent: DOM.watchForRemoval,
        validate(node, busy) {
          if (!busy) {
            return domExtension(DOM.watchForRemoval)
          }
        },
        added(dom) {
          const attributeObserver = createAttributeArrayMutation({
            target: () => dom.item,
            watchAttribute: [bridgeBetweenVscodeExtension],
            change([bridge]) {
              const stringState = state.decode(bridge)
              if (!stringState || _stateObservable.value === stringState) return
              _stateObservable.value = stringState
            },
          })

          attributeObserver.plug()
          return attributeObserver.stop
        },
        removed(node, consume) {
          if (node.matches(state.selector)) {
            consume()
          }
        },
      })
    },
    dispose() {
      // syntaxStyle.dispose() FIXME: create a global extension dispose hook
    },
  })
  function domExtension(statusBar: HTMLElement) {
    const item = statusBar?.querySelector(state.selector) as H
    if (!item) return
    const icon = item?.querySelector('.codicon') as H
    return { icon, item }
  }
}

type H = HTMLElement
