import { bridgeBetweenVscodeExtension } from './keys'
import { lifecycle } from './lifecycle'
import { createAttributeArrayMutation, innerChildrenMutation } from './shared'
import { allPossibleStates } from '../shared/state'
import type { IState as _Istate } from '../shared/state'
import type { stateObservable, calibrateObservable } from './index'

/**
 * @description When the vscode extension changes the "bridge attribute" apply custom styles
 *
 * Take a look at: regexToDomToCss.ts to see how the styles are generated
 */
export function createSyntaxLifecycle(
  observables: {
    state: typeof stateObservable
    calibrate: typeof calibrateObservable
  },
  IState: typeof _Istate,
  props?: { activate: () => () => void }
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
          const item = DOM.watchForRemoval?.querySelector(IState.selector) as H
          const icon = item?.querySelector('.codicon') as H
          if (!item || !icon) return
          return { icon, item }
        },
        added(dom) {
          const attributeObserver = createAttributeArrayMutation({
            target: () => dom.item,
            watchAttribute: [bridgeBetweenVscodeExtension],
            change([bridge]) {
              // TODO: should the type system validate this?
              Object.entries(IState.decode(bridge)).forEach(([key, delta]) => {
                if (!(key == 'state' || key == 'calibrate')) return
                let _delta = allPossibleStates.find((state) => state == delta)
                if (!_delta || observables[key].value === _delta) return
                observables[key].value = _delta
              })
            },
          })

          attributeObserver.plug()
          return attributeObserver.stop
        },
        removed(node, consume) {
          if (node.matches(IState.selector)) {
            consume()
          }
        },
        dispose: props?.activate(),
      })
    },
  })
}

type H = HTMLElement
