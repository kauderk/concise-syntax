import { deltaFn } from 'src/shared/utils'
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
  let tryFn = createTryFunction({ fallback: clean })
  let interval: NodeJS.Timeout
  let disposeObserver = deltaFn()
  let disposeActivate = deltaFn()

  function patch() {
    const dom = props.dom()
    if (running || !dom.check()) return
    running = true
    clearInterval(interval)

    tryFn(() => {
      disposeObserver.fn = watchForRemoval(dom.watchForRemoval, reload)
      disposeActivate.fn = props.activate(dom)!
    }, 'Lifecycle crashed unexpectedly when activating')
  }
  function dispose() {
    clearInterval(interval)

    tryFn(() => {
      disposeActivate.consume()
      disposeObserver.consume()

      props.dispose?.()
    }, 'Lifecycle crashed unexpectedly when disposing')
    running = false
  }
  function reload(delay = 5000) {
    dispose()
    interval = setInterval(patch, delay)
  }
  function clean() {
    clearInterval(interval)
  }

  return {
    get running() {
      return running
    },
    activate(delay = 5000) {
      if (
        tryFn.guard('Lifecycle already crashed therefore not activating again')
      ) {
        return
      }

      reload(delay)
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
