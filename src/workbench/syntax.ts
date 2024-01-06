import { bridgeBetweenVscodeExtension, extensionId } from './keys'
import { lifecycle } from './lifecycle'
import {
  createAttributeArrayMutation,
  innerChildrenMutation,
  toastConsole,
} from './shared'
import { IState, State } from '../shared/state'
import type { stateObservable } from './index'

const statusBarSelector = `[id="${extensionId}"]:has(.codicon-symbol-keyword)`

/**
 * @description When the vscode extension changes the "bridge attribute" apply custom styles
 *
 * Take a look at: regexToDomToCss.ts to see how the styles are generated
 */
export function createSyntaxLifecycle(
  _stateObservable: typeof stateObservable
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
              const stringState = IState.decode(bridge)
              let deltaState = _stateObservable.value
              if (!stringState || deltaState === stringState) return
              _stateObservable.value = deltaState = stringState
            },
          })

          attributeObserver.plug()
          return attributeObserver.stop
        },
        removed(node, consume) {
          if (node.matches(statusBarSelector)) {
            consume()
          }
        },
      })
    },
    dispose() {
      // syntaxStyle.dispose() FIXME: create a global extension dispose hook
    },
  })
}

type Extension = NonNullable<ReturnType<typeof domExtension>>
function domExtension(statusBar: HTMLElement) {
  const item = statusBar?.querySelector(statusBarSelector) as H
  if (!item) return
  const icon = item?.querySelector('.codicon') as H
  return { icon, item }
}
type H = HTMLElement
