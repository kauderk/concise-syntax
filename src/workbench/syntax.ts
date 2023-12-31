import { bridgeBetweenVscodeExtension, extensionId } from './keys'
import { lifecycle } from './lifecycle'
import { regexToDomToCss } from './regexToDomToCss'
import {
  createAttributeArrayMutation,
  createStyles,
  innerChildrenMutation,
  toastConsole,
} from './shared'
import { IState } from '../shared/state'

const statusBarSelector = `[id="${extensionId}"]`
const bridgeAttribute = (target: H): boolean =>
  // You could pass stringified json, at the moment this extension is either active or inactive
  !target.getAttribute?.(bridgeBetweenVscodeExtension)?.includes('inactive')

/**
 * @description When the vscode extension changes the "bridge attribute" apply custom styles
 *
 * Take a look at: regexToDomToCss.ts to see how the styles are generated
 */
export function createSyntaxLifecycle() {
  let Extension: null | Extension
  const syntaxStyle = createStyles('hide')

  function change(extension: Extension) {
    Extension = extension // alright...
    const on = bridgeAttribute(extension.item)

    extension.icon.style.fontWeight = on ? 'bold' : 'normal'
    const title = 'Concise Syntax'
    extension.item.title = on ? `${title}: active` : `${title}: inactive`
    syntaxStyle.styleIt(on ? regexToDomToCss() : '')
  }
  function clear() {
    if (!Extension) return
    Extension.item.removeAttribute('title')
    Extension.icon.style.removeProperty('font-weight')
  }

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
      let deltaState: string | undefined

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

              if (stringState) {
                if (deltaState === stringState) {
                  // console.log('attempting to change', { stringState })
                  return
                }
                deltaState = stringState

                toastConsole.log(
                  `syntax.ts: change() | stringState: ${stringState}`
                )
                if (stringState == 'disposed') {
                  syntaxStyle.dispose()
                  clear()
                  return
                }
                change(dom)
              } else {
                clear()
              }
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
