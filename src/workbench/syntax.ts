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
  observable: typeof stateObservable | typeof calibrateObservable,
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
          if (busy) return
          const item = DOM.watchForRemoval?.querySelector(state.selector) as H
          const icon = item?.querySelector('.codicon') as H
          if (!item || !icon) return
          return { icon, item }
        },
        added(dom) {
          const attributeObserver = createAttributeArrayMutation({
            target: () => dom.item,
            watchAttribute: [bridgeBetweenVscodeExtension],
            change([bridge]) {
              const delta = state.decode(bridge)
              if (!delta || observable.value === delta) return
              observable.value = delta
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
  })
}

type H = HTMLElement
