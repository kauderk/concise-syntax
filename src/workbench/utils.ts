import {
  currentSelector,
  editorSelector,
  overlaySelector,
  selectedSelector,
  splitViewContainerSelector,
} from './keys'
import { stylesContainer, toastConsole } from './shared'

export function clear(label?: string) {
  stylesContainer
    .querySelectorAll(label ? `[aria-label="${label}"]` : '[aria-label]')
    .forEach((style) => style.remove())
}
export const styles = {
  clear(label: string) {
    clear(label)
  },
  clearOverlays() {
    clear()
  },
  getOrCreateLabeledStyle(label: string, selector: string) {
    let style = stylesContainer.querySelector(
      `[aria-label="${label}"][selector="${selector}"]`
    ) as HTMLElement
    if (!style || !stylesContainer.contains(style)) {
      style = document.createElement('style')
      style.setAttribute('aria-label', label)
      style.setAttribute('selector', selector)
      stylesContainer.appendChild(style)
    }
    return style
  },
  swapLabeledStyle(oldLabel: string, newLabel: string) {
    const styles = stylesContainer.querySelectorAll(
      `[aria-label="${oldLabel}"]`
    )
    styles.forEach((style) => {
      style.setAttribute('aria-label', newLabel)
      style.textContent = style.textContent?.replace(oldLabel, newLabel) ?? ''
    })
  },
}

export type Selected = {
  node: Node
  selector: string
  add: boolean
  set: Set<number>
  color: string
  label: string
}
export function tryGetAttribute(
  line: HTMLElement,
  attribute: string
): string | undefined {
  // @ts-ignore
  return (line.editor =
    line.closest(`[${attribute}]`)?.getAttribute(attribute) ??
    // @ts-ignore
    line.editor)
}

export function findScopeElements(view: HTMLElement) {
  type H = HTMLElement | null
  const container = view.querySelector(':scope > div > .editor-container') as H
  const nested = view.querySelector(
    ':scope > div > div > div > .split-view-container'
  ) as H
  const editor = container?.querySelector(editorSelector) as H
  const overlay = editor?.querySelector(overlaySelector) as H
  const anyLine = overlay?.querySelector(
    `${selectedSelector}, ${currentSelector}`
  ) as H
  return { nested, container, editor, overlay, anyLine }
}
function lookup(node: Node | null, up: number): Node {
  return Array(up)
    .fill(0)
    .reduce((acc, _) => acc?.parentElement, node)
}
export function lookupTo(
  node: Node | null,
  up: number,
  to: Node
): node is HTMLElement {
  return lookup(node, up) === to
}

export function e(el: unknown): el is HTMLElement {
  return el instanceof HTMLElement
}

export function consumeStack(
  stack: Map<HTMLElement, Function>,
  key: HTMLElement
) {
  // if (stack.has(key)) { // it's better if it fails so we can fix it
  stack.get(key)?.()
  stack.delete(key)
  // }
}

export function guardStack(
  stack: Map<HTMLElement, Function>,
  key: HTMLElement,
  cleanup: Function
) {
  if (stack.has(key)) {
    // TODO: figure out why this is happening
    // toastConsole.warn('Highlight lifecycle stack already has this key', {
    //   stack,
    //   key,
    // })
    consumeStack(stack, key)
  }
  stack.set(key, cleanup)
}

export function parseTopStyle(node: HTMLElement) {
  return Number(node.style?.top.match(/\d+/)?.[0])
}

export function validateAddedView(node: Node, rebootCleanup?: Function) {
  if (rebootCleanup) {
    toastConsole.error('Reboot cleanup already exists', {
      rebootCleanup,
    })
    return
  }

  type H = HTMLElement | undefined
  if (!e(node)) {
    toastConsole.warn('Reboot added node is not HTMLElement', { node })
    return
  }
  const rootContainer = node.querySelector(splitViewContainerSelector) as H
  if (!rootContainer) {
    toastConsole.warn('Reboot rootContainer not found with selector', {
      node,
      splitViewContainerSelector,
    })
    return
  }

  // root.plug() special case, the first view never gets removed * sigh *
  const [firstView, ...restViews] = rootContainer.childNodes
  if (!e(firstView)) {
    toastConsole.warn('Reboot first view element is not HTMLElement', {
      rootContainer,
      firstView,
    })
    return
  }
  let container = findScopeElements(firstView).container
  if (!container) {
    // FIXME: this is panic scenario
    container = firstView.querySelector('.editor-container') as any
    if (!container) {
      // prettier-ignore
      toastConsole.warn('Reboot container not found even without :scope selector', {
				firstView,
				container,
			})
    }
  }

  if (container) {
    return {
      rootContainer,
      firstView,
      container,
      restViews,
    }
  } else {
    toastConsole.error('Reboot first view container not found', {
      rootContainer,
      firstView,
    })
  }
}
