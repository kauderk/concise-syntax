import { watchForRemoval } from './shared'

export type LifecycleProps<T> = {
  activate(dom: T): void
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
  let interval: NodeJS.Timeout
  let disposeObserver = () => {}

  function patch() {
    const dom = props.dom()
    if (running || !dom.check()) return
    anyUsage = true
    running = true
    clearInterval(interval)
    disposeObserver = watchForRemoval(dom.watchForRemoval, reload)
    props.activate(dom)
  }
  function dispose() {
    disposeObserver()
    props.dispose?.()
    running = false
    clearInterval(interval)
  }
  function reload() {
    dispose()
    interval = setInterval(patch, 5000)
  }

  let exhaust: any

  return {
    activate() {
      reload()
      exhaust = setTimeout(() => {
        clearTimeout(exhaust)
        if (!anyUsage) {
          clearInterval(interval)
        }
      }, 1000 * 60 * 2)
    },
    dispose() {
      dispose()
      clearTimeout(exhaust)
      clearInterval(interval)
    },
  }
}
