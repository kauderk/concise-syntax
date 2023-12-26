import { windowId } from './keys'

export const stylesContainer =
  document.getElementById(windowId) ?? document.createElement('div')
stylesContainer.id = windowId
document.body.appendChild(stylesContainer)

export function createStyles(name: string) {
  const id = windowId + '.' + name
  const style =
    stylesContainer.querySelector(`[id="${id}"]`) ??
    document.createElement('style')
  style.id = id
  stylesContainer.appendChild(style)

  return {
    element: style,
    styleIt: (text: string) => styleIt(style, text),
    dispose() {
      style.textContent = ''
    },
  }
}

export function styleIt(style: Element, text: string) {
  return (style.textContent = text
    .replace(/\r|\n/g, '')
    .replaceAll(/\t+/g, '\n'))
}

export type MutationOptions = {
  added(node: HTMLElement): void | (() => void)
  removed?(node: HTMLElement): void
  options: MutationObserverInit
}
export function createMutation<M extends MutationOptions>(option: M) {
  const trackNodes = new Map<HTMLElement, void | (() => void)>()
  const nodes = () => Array.from(trackNodes.keys())

  // https://github.com/whatwg/dom/issues/126#issuecomment-1049814948

  function add(node: any) {
    trackNodes.set(node, option.added(node))
  }
  function remove(node: any) {
    if (nodes().includes(node)) {
      trackNodes.get(node)?.()
      trackNodes.delete(node)
    }
    option.removed?.(node)
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(add)
      mutation.removedNodes.forEach(remove)
    })
  })

  return {
    get targets() {
      return nodes()
    },
    track(target: Element) {
      add(target)
      return observer.observe(target, option.options)
    },
    untrack(target: Element) {
      remove(target)
      observer.disconnect()
      nodes().forEach((_target) => {
        observer.observe(_target, option.options)
      })
    },
    clear() {
      trackNodes.forEach((_, node) => remove(node))
      trackNodes.clear()
      observer.disconnect()
    },
  }
}

type D = string | undefined
type Bridge = {
  target: HTMLElement
  attribute: D
}
export function createAttributeMutation(props: {
  watchAttribute: string
  activate: (payload: D) => void
  inactive: (payload: D) => void
}) {
  let previousData: D
  const bridgeAttribute = (target: any): D =>
    target?.getAttribute?.(props.watchAttribute)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const newData = bridgeAttribute(mutation.target)
      if (previousData === newData) return
      previousData = newData

      if (newData) {
        props.activate(newData)
      } else {
        props.inactive(newData)
      }
    }
  })

  return {
    activate(target: HTMLElement) {
      previousData = bridgeAttribute(target)

      props.activate(previousData)
      observer.observe(target, {
        attributes: true,
        attributeFilter: [props.watchAttribute],
      })
    },
    dispose() {
      // lol this could be a problem
      props.inactive(previousData)
      observer.disconnect()
    },
  }
}
export function createAttributeArrayMutation(props: {
  watchAttribute: string[]
  change: (newAttributes: D[], oldAttributes: D[]) => void
}) {
  let previousData: D[] = []
  const bridgeAttribute = (target: any): D[] =>
    props.watchAttribute.map((a) => target?.getAttribute?.(a))

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const newData = bridgeAttribute(mutation.target)
      if (previousData.some((d, i) => d !== newData[i])) return
      const oldAttributes = [...previousData]
      previousData = newData

      props.change(newData, oldAttributes)
    }
  })

  return {
    activate(target: HTMLElement) {
      previousData = bridgeAttribute(target)
      props.change(previousData, previousData)
      observer.observe(target, {
        attributes: true,
        attributeFilter: props.watchAttribute,
      })
    },
    dispose() {
      props.change(previousData, previousData)
      observer.disconnect()
    },
  }
}

// TODO: test if this is more "performant" or just mental gymnastics
export function watchForRemoval(targetElement: Element, callback: Function) {
  let done = false
  let stack: Node[] = []
  const rootObserver = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (
        done ||
        !stack.includes(mutation.target) ||
        !mutation.removedNodes.length
      )
        return

      const nodes = Array.from(mutation.removedNodes)
      // console.log(mutation.target)

      // direct match
      if (
        nodes.indexOf(targetElement) > -1 ||
        // parent match
        nodes.some((parent) => parent.contains(targetElement))
      ) {
        console.log('removed', targetElement, stack)
        dispose()
        callback()
        return
      }
    })
  })

  function REC_ObserverAncestors(element: Element) {
    if (!element.parentElement || element.parentElement === document.body) {
      return
    }
    stack.push(element.parentElement)
    rootObserver.observe(element.parentElement, { childList: true })
    REC_ObserverAncestors(element.parentElement)
  }

  // Start observing ancestor hierarchy
  REC_ObserverAncestors(targetElement)

  function dispose() {
    done = true
    stack = []
    rootObserver.takeRecords()
    rootObserver.disconnect()
  }
  return dispose
}
