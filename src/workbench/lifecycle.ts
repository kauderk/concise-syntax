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
    clean()
    tryFn(() => {
      disposeObserver.fn = watchForRemoval(
        dom.watchForRemoval,
        function reload(delay = 5000) {
          dispose()
          interval = setInterval(patch, delay)
        }
      )
      disposeActivate.fn = props.activate(dom)!
    }, 'Lifecycle crashed unexpectedly when activating')
  }
  function dispose() {
    clean()
    tryFn(() => {
      disposeActivate.consume()
      disposeObserver.consume()

      props.dispose?.()
    }, 'Lifecycle crashed unexpectedly when disposing')
    running = false
  }

  function clean() {
    clearInterval(interval)
  }

  return {
    get running() {
      return running
    },
    activate(delay = 5000) {
      if (running) {
        debugger
        toastConsole.error(
          'Lifecycle already running, entering an impossible state'
        )
      }
      if (
        tryFn.guard('Lifecycle already crashed therefore not activating again')
      ) {
        return
      }
      clean()
      interval = setInterval(patch, delay)
    },
    dispose() {
      if (
        tryFn.guard('Lifecycle already crashed therefore not disposing again')
      ) {
        return
      }

      dispose()
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
