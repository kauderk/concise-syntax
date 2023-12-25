import { bridgeBetweenVscodeExtension, extensionId } from './keys'
import { lifecycle } from './lifecycle'
import { regexToDomToCss } from './regexToDomToCss'
import { createAttributeMutation, createStyles } from './shared'

function domExtension() {
  const statusBar = document.querySelector('.right-items') as HTMLElement
  const item = statusBar?.querySelector(`[id="${extensionId}"]`) as HTMLElement
  const icon = item?.querySelector('.codicon') as HTMLElement
  return { icon, item, statusBar }
}
const bridgeAttribute = (target: any) =>
  // You could pass stringified data
  !target.getAttribute?.(bridgeBetweenVscodeExtension)?.includes('inactive')

/**
 * @description When the vscode extension changes the "bridge attribute" apply custom styles
 *
 * Take a look at: regexToDomToCss.ts to see how the styles are generated
 */
export function createSyntaxLifecycle() {
  let Extension: null | Extension
  const syntaxStyle = createStyles('hide')

  function activate(extension: Extension) {
    Extension = extension // alright...
    const on = bridgeAttribute(extension.item)

    extension.icon.style.fontWeight = on ? 'bold' : 'normal'
    const title = 'Concise Syntax'
    extension.item.title = on ? `${title}: active` : `${title}: inactive`
    syntaxStyle.styleIt(on ? regexToDomToCss() : '')
  }
  function inactive() {
    if (!Extension) return
    Extension.item.removeAttribute('title')
    Extension.icon.style.removeProperty('font-weight')
  }

  const attributeObserver = createAttributeMutation({
    watchAttribute: bridgeBetweenVscodeExtension,
    activate() {
      activate(domExtension())
    },
    inactive() {
      inactive()
    },
  })

  const cycle = lifecycle<Extension>({
    dom() {
      const dom = domExtension()
      return {
        ...dom,
        watchForRemoval: dom.item,
        check() {
          return !!(document.contains(dom.statusBar?.parentNode) && dom.icon)
        },
      }
    },
    activate(dom) {
      attributeObserver.activate(dom.item)
    },
    dispose() {
      attributeObserver.dispose()
      syntaxStyle.dispose()
    },
  })

  return cycle
}
type Extension = ReturnType<typeof domExtension>
