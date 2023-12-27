import {
  currentSelector,
  editorSelector,
  overlaySelector,
  selectedSelector,
} from './keys'
import { stylesContainer } from './shared'

export function queryOverlays(node: Node) {
  if (!(node instanceof HTMLElement)) return []
  const overlays = Array.from(node.querySelectorAll(overlaySelector))
  if (node.matches(overlaySelector)) overlays.push(node)
  return overlays as HTMLElement[]
}
export function clear(label?: string) {
  stylesContainer
    .querySelectorAll(label ? `[aria-label="${label}"]` : '[aria-label]')
    .forEach((style) => style.remove())
}
export const styles = {
  clear(label: string) {
    console.log('clear', label)
    clear(label)
  },
  clearAll() {
    clear()
    stylesContainer.querySelectorAll('style').forEach((style) => {
      style.textContent = ''
    })
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

export function guardStack(
  stack: Map<HTMLElement, Function>,
  key: HTMLElement,
  cleanup: Function
) {
  if (stack.has(key)) {
    console.warn('stack has key', stack, key)
    stack.get(key)?.()
    stack.delete(key)
  }
  stack.set(key, cleanup)
}

export function parseTopStyle(node: HTMLElement) {
  return Number(node.style?.top.match(/\d+/)?.[0])
}
