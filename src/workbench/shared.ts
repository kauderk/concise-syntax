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
  added(node: HTMLElement): void
  removed(node: HTMLElement): void
  usingUnobservable?: boolean
}
export function createMutation<M extends MutationOptions>(option: M) {
  const mutationObserver = option.usingUnobservable
    ? MutationUnObserver
    : MutationObserver
  return new mutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node: any) => option.added(node))
      mutation.removedNodes.forEach((node: any) => option.removed(node))
    })
    // typescript should infer this, right?
  }) as M['usingUnobservable'] extends true
    ? MutationUnObserver
    : MutationObserver
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

  let freezeTarget: HTMLElement
  return {
    activate(target: HTMLElement) {
      freezeTarget = target // this is annoying
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

// https://github.com/whatwg/dom/issues/126#issuecomment-1049814948
class MutationUnObserver extends MutationObserver {
  private observerTargets: Array<{
    target: Node
    options?: MutationObserverInit
  }> = []

  observe(target: Node, options?: MutationObserverInit): void {
    this.observerTargets.push({ target, options })

    return super.observe(target, options)
  }

  unobserve(target: Node): void {
    const newObserverTargets = this.observerTargets.filter(
      (ot) => ot.target !== target
    )
    this.observerTargets = []
    this.disconnect()
    newObserverTargets.forEach((ot) => {
      this.observe(ot.target, ot.options)
    })
  }
}
