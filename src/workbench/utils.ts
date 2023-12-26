import { editorSelector } from './keys'
import { stylesContainer } from './shared'

export function queryEditors(node: HTMLElement) {
  if (!node.querySelector) return []
  const editors = Array.from(node.querySelectorAll(editorSelector))
  if (node.matches(editorSelector)) editors.push(node)
  return editors as HTMLElement[]
}
export function clear(label?: string) {
  stylesContainer
    .querySelectorAll(label ? `[aria-label="${label}"]` : '[aria-label]')
    .forEach((style) => style.remove())
}
export const styles = {
  clear(label: string) {
    clear(label)
  },
  clearAll() {
    clear()
    stylesContainer.querySelectorAll('style').forEach((style) => {
      style.textContent = ''
    })
  },
  getOrCreateLabeledStyle(label: string) {
    let style = stylesContainer.querySelector(
      `[aria-label="${label}"]`
    ) as HTMLElement
    if (!style || !stylesContainer.contains(style)) {
      console.log('creating style', label)
      style = document.createElement('style')
      style.setAttribute('aria-label', label)
      stylesContainer.appendChild(style)
    }
    return style
  },
}

export type Selected = {
  node: HTMLElement
  selector: string
  add: boolean
  set: Set<number>
  color: string
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
