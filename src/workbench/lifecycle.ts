import { toastConsole, watchForRemoval } from './shared'

export type LifecycleProps<T> = {
  activate(dom: T): void | (() => void)
  dom(): T & { check(): boolean; watchForRemoval: HTMLElement }
  dispose?: () => void
}

/**
 * @description The **activate** function is called when the dom **check** passes. Then if the **item** is removed from the dom, the **dispose** function is called.
 *
 * Then it will try to **reload** the lifecycle.
 */
export function lifecycle<T>(props: LifecycleProps<T>) {
  let running = false
  let anyUsage = false
  let tryFn = createTryFunction({ fallback: clean })
  let interval: NodeJS.Timeout
  let disposeObserver: Function | void
  let disposeActivate: Function | void

  function patch() {
    const dom = props.dom()
    if (running || !dom.check()) return
    anyUsage = true
    running = true
    clearInterval(interval)

    tryFn(() => {
      disposeObserver = watchForRemoval(dom.watchForRemoval, reload)
      disposeActivate = props.activate(dom)
    }, 'Lifecycle crashed unexpectedly when activating')
  }
  function dispose() {
    clearInterval(interval)

    tryFn(() => {
      disposeActivate?.()
      disposeActivate = undefined
      disposeObserver?.()
      disposeObserver = undefined

      props.dispose?.()

      running = false
    }, 'Lifecycle crashed unexpectedly when disposing')
  }
  function reload() {
    dispose()
    interval = setInterval(patch, 5000)
  }
  function clean() {
    clearTimeout(exhaust)
    clearInterval(interval)
  }

  let exhaust: any

  return {
    activate() {
      if (
        tryFn.guard('Lifecycle already crashed therefore not activating again')
      ) {
        return
      }

      reload()
      return
      exhaust = setTimeout(() => {
        clearTimeout(exhaust)
        if (!anyUsage) {
          clearInterval(interval)
        }
      }, 1000 * 60 * 2)
    },
    dispose() {
      if (
        tryFn.guard('Lifecycle already crashed therefore not disposing again')
      ) {
        return
      }

      dispose()
      clean()
    },
  }
}

type Guard = Partial<{ fallback: Function; message: string }>
/**
 * TODO: This gotta be a pattern or something
 */
export function createTryFunction(guard?: Guard) {
  let crashed = false

  function tryFunction(fn: Function, message: string) {
    if (crashed) return

    try {
      fn()
    } catch (error) {
      crashed = true
      toastConsole.error('Fatal - ' + message, { error })
    }
  }
  // assign a getter to the tryFunction
  Object.defineProperty(tryFunction, 'crashed', {
    get() {
      return crashed
    },
  })
  // assign a guard function to the tryFunction
  tryFunction.guard = (action: Function | string) => {
    if (crashed) {
      // just pass a function bruh...
      const fallback = action ?? guard?.fallback
      if (typeof fallback === 'function') {
        fallback()
      }
      const message = action ?? guard?.message
      if (typeof message === 'string') {
        console.warn(message)
      }
    }
    return crashed
  }
  return tryFunction as typeof tryFunction & {
    get crashed(): boolean
  }
}
