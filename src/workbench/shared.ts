import { windowId } from './keys'
import { Toastify, minifiedCss } from '../shared/toast.js'
export const stylesContainer =
  document.getElementById(windowId) ?? document.createElement('div')
stylesContainer.id = windowId
document.body.appendChild(stylesContainer)

// type PropType<TObj, TProp extends keyof TObj> = TObj[TProp]
// type ToastOptions = PropType<typeof Toastify, 'prototype'>['options']

const levels = {
  log: {
    background: 'linear-gradient(to right, #292d3e, #31364a)',
    'box-shadow': '0 3px 6px -1px #0000001f, 0 10px 36px -4px #4d60e84d',
    border: '1px dotted #e3e4e229',
  },
  error: {
    background: 'linear-gradient(to right, #ff4757, #6e1e38)',
    'box-shadow': '0 3px 6px -1px #ff475796, 0 10px 36px -4px #a944424d',
    border: '1px dotted #ff4757',
  },
  warn: {
    background: 'linear-gradient(to right, #8a6d3b, #7a5b32)',
    'box-shadow': '0 3px 6px -1px #8a6d3b70, 0 10px 36px -4px #8a6d3b4d',
    border: '1px dotted #e3e4e229',
  },
  success: {
    background: 'linear-gradient(to right, #3c763d, #356635)',
    'box-shadow': '0 3px 6px -1px #509d51b3, 0 10px 36px -4px #3c763d9c',
    border: '1px dotted #e3e4e229',
  },
} as const

type ToastOptions = {
  level: keyof typeof levels
  message: string
  objects?: Record<string, any>
  onClick?: (e: MouseEvent) => void
  callback?: () => void
}
export function useToast(options: ToastOptions) {
  const { level, message } = options
  const print = level.toUpperCase() + ' : ' + message

  if (level === 'success') {
    // add green ish color to the console.log
    console.log('%c ' + print, 'background: #222; color: #bada55')
  } else {
    console[level](print, options.objects)
  }

  const toastStyle = createStyles('toast')
  toastStyle.styleIt(minifiedCss)
  const toast = new Toastify({
    duration: 500_000,
    close: true,
    gravity: 'bottom', // `top` or `bottom`
    position: 'left', // `left`, `center` or `right`
    stopOnFocus: true, // Prevents dismissing of toast on hover
    style: levels[level],
    onClick: options.onClick,
    callback: options.callback,
    text: message,
  })

  return toast.showToast()
}

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
  added(node: Node): void
  removed(node: Node): void
  options: MutationObserverInit
  target(): HTMLElement
}
export function createMutation(props: MutationOptions) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(props.added)
      mutation.removedNodes.forEach(props.removed)
    }
  })

  return {
    observe() {
      // const target = props.target()
      // props.added(target)
      observer.observe(props.target(), props.options)
    },
    disconnect() {
      // props.removed(props.target())
      observer.disconnect()
    },
  }
}
type MatchMutationOptions = {
  added(node: HTMLElement): void
  removed(node: HTMLElement): void
  // filter(node: Node): boolean
  options: MutationObserverInit
  target(): HTMLElement
}

export function specialChildrenMutation(props: MatchMutationOptions) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        // if (props.filter(node)) {
        props.added(node as any)
        // }
      }
      for (const node of mutation.removedNodes) {
        // if (props.filter(node)) {
        props.removed(node as any)
        // }
      }
    }
  })

  return {
    stop() {
      observer.takeRecords()
      observer.disconnect()
    },
    plug(mapChildren?: (children: NodeListOf<ChildNode>) => ChildNode[]) {
      const target = props.target()

      ;(mapChildren?.(target.childNodes) ?? target.childNodes).forEach(
        props.added as any
      )
      observer.observe(target, props.options)
    },
    unplug() {
      const target = props.target()

      target.childNodes.forEach(props.removed as any)
      observer.disconnect()
    },
  }
}

export function createStackedMutation<T>(options: {
  added(node: Node): void
  removed(node: Node): void
  options: MutationObserverInit
}) {
  function add(node: Node) {
    options.added(node)
  }
  function remove(node: Node) {
    options.removed(node)
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(add)
      mutation.removedNodes.forEach(remove)
    })
  })

  return {
    track(target: HTMLElement) {
      add(target)
      observer.observe(target, options.options)
    },
    untrack(target: HTMLElement) {
      remove(target)
      observer.disconnect()
    },
  }
}

type D = string | undefined

export function createAttributeArrayMutation(props: {
  watchAttribute: string[]
  children?: boolean
  change: (newAttributes: D[], oldAttributes: D[], node: HTMLElement) => void
  target(): HTMLElement
}) {
  let previousData: D[] = []
  const bridgeAttribute = (target: any): D[] =>
    props.watchAttribute.map((a) => target?.getAttribute?.(a))

  function change(target: HTMLElement) {
    const newData = bridgeAttribute(target)
    if (newData.every((d, i) => d === previousData[i])) return
    const oldAttributes = [...previousData]
    previousData = newData

    props.change(newData, oldAttributes, target)
  }
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      change(mutation.target as HTMLElement)
    }
  })
  const options = {
    attributes: true,
    subtree: props.children,
    // childList: props.children,
    attributeFilter: props.watchAttribute,
  }
  return {
    plug() {
      const target = props.target()
      change(target)
      observer.observe(target, options)
    },
    stop() {
      observer.takeRecords()
      observer.disconnect()
    },
    disconnect() {
      // change(props.target())

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
// export function watchForAddition(targetElement: Element, callback: Function, thresholdScopedSelector:string) {
// 	let done = false
// 	let stack: Node[] = []
// 	const rootObserver = new MutationObserver((mutationsList) => {
// 		mutationsList.forEach((mutation) => {
// 			if (
// 				done ||
// 				!stack.includes(mutation.target) ||
// 				!mutation.addedNodes.length
// 			)
// 				return

// 			const nodes = Array.from(mutation.addedNodes)
// 			// console.log(mutation.target)

// 			// direct match
// 			if (
// 				nodes.indexOf(targetElement) > -1 ||
// 				// parent match
// 				nodes.some((parent) => parent.contains(targetElement))
// 			) {
// 				console.log('added', targetElement, stack)
// 				dispose()
// 				callback()
// 				return
// 			}
// 		})
// 	})

// 	function REC_ObserverDescendants(element: Element) {
// 		if (!element.firstChild || element.firstChild === document.body) {
// 			return
// 		}
// 		stack.push(element.parentElement)
// 		rootObserver.observe(element.parentElement, { childList: true })
// 		REC_ObserverDescendants(element.parentElement)
// 	}
// 	// Start observing ancestor hierarchy
// 	REC_ObserverDescendants(targetElement)

// 	function dispose() {
// 		done = true
// 		stack = []
// 		rootObserver.takeRecords()
// 		rootObserver.disconnect()
// 	}
// 	return dispose
// }
