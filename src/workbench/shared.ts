import { windowId } from './keys'

export function createStyles(name: string) {
  const stylesContainer =
    document.getElementById(windowId) ?? document.createElement('div')
  stylesContainer.id = windowId
  document.body.appendChild(stylesContainer)

  const id = windowId + '.' + name
  const style = document.getElementById(id) ?? document.createElement('style')
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
  added(node: HTMLElement): void
  removed(node: HTMLElement): void
}
export function createMutation(option: MutationOptions) {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node: any) => option.added(node))
      mutation.removedNodes.forEach((node: any) => option.removed(node))
    })
  })
}

type D = string | undefined
type Bridge = {
  target: HTMLElement
  attribute: D
}
export function createAttributeMutation(props: {
  watchAttribute: string
  activate: (payload: Bridge) => void
  inactive: (payload: Partial<Bridge>) => void
}) {
  let previousData: D
  const bridgeAttribute = (target: any): D =>
    target?.getAttribute?.(props.watchAttribute)

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const newData = bridgeAttribute(mutation.target)
      if (previousData === newData) return
      previousData = newData

      const payload = {
        target: mutation.target as HTMLElement,
        attribute: newData,
      }
      if (newData) {
        props.activate(payload)
      } else {
        props.inactive(payload)
      }
    }
  })

  let freezeTarget: HTMLElement
  return {
    activate(target: HTMLElement) {
      freezeTarget = target // this is annoying
      previousData = bridgeAttribute(target)

      props.activate({ target, attribute: previousData })
      observer.observe(target, {
        attributes: true,
        attributeFilter: [props.watchAttribute],
      })
    },
    dispose() {
      // lol this could be a problem
      props.inactive({ target: freezeTarget, attribute: previousData })
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
        debugger
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
