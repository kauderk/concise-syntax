import { createTask } from 'src/shared/utils'

export type ObserverTasks = [
  selector: string,
  task: (element: HTMLElement & { value: any }) => void | Error
][]

export function createObservableTask(
  target: HTMLElement,
  tasks: ObserverTasks
) {
  const task = createTask<undefined, Error>()
  let step = 0

  const observer = new MutationObserver(async (record) => {
    for (const mutation of record) {
      if (mutation.type == 'attributes') {
        if (stepForward(mutation.target)) {
          return
        }
      }
      for (const node of mutation.addedNodes) {
        if (stepForward(node)) {
          return
        }
      }
      // for (const node of mutation.removedNodes) {
      //   if (stepBackwards(node)) {
      //     return
      //   }
      // }
    }
    const node = document.querySelector(tasks[step][0])
    if (stepForward(node)) {
      return
    }
  })

  function stepForward(node: Node | null) {
    if (!(node instanceof HTMLElement)) {
      return
    }
    if (!tasks[step]) return

    const [selector, o_task] = tasks[step]
    if (node.matches(selector)) {
      try {
        const res = o_task(node as any)
        if (res instanceof Error) {
          step = -1
          observer.disconnect()
          task.reject(res)
          return
        }
      } catch (error) {
        step = -1
        observer.disconnect()
        task.reject(error instanceof Error ? error : new Error('unknown error'))
        return
      }
      step++
      if (!tasks[step]) {
        step = -1
        observer.disconnect()
        task.resolve()
      }
      return true
    }
  }

  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
  })

  return task
}

export type BranchObserver = [
  selector: string,
  task: (element: HTMLElement & { value: any }) => void | Error,
  branchSelector: [string, ObserverTasks] | BranchObserver
]
export type BranchObserverTasks = [BranchObserver, BranchObserver]
export function branchObservableTask(
  target: HTMLElement,
  tasks: BranchObserverTasks
) {
  const task = createTask<undefined, Error>()
  let step = 0

  let findNewBranch:
    | (() => [Element | null, [string, ObserverTasks] | BranchObserver] | void)
    | undefined

  const observer = new MutationObserver(async (record) => {
    if (findNewBranch) {
      const [node, tree] = findNewBranch() ?? []
      findNewBranch = undefined

      if (node instanceof HTMLElement) {
        unplug()
        task.resolve()
        const rec = branchObservableTask(node, tree)
        return
      }
      return
    }

    for (const mutation of record) {
      if (mutation.type == 'attributes') {
        if (stepForward(mutation.target)) {
          return
        }
      }
      for (const node of mutation.addedNodes) {
        if (stepForward(node)) {
          return
        }
      }
      // for (const node of mutation.removedNodes) {
      //   if (stepBackwards(node)) {
      //     return
      //   }
      // }
    }
    const node = document.querySelector(tasks[step][0])
    if (stepForward(node)) {
      return
    }
  })

  function stepForward(node: Node | null) {
    if (!(node instanceof HTMLElement)) {
      return
    }
    if (!tasks[step]) {
      console.log('no task', step, tasks)
      return
    }

    const nextBranch = tasks[step]
    if (nextBranch.length === 3) {
      const [selector, o_task, branch] = nextBranch
      if (node.matches(selector)) {
        try {
          const res = o_task(node as any)
          if (res instanceof Error) {
            unplug()
            task.reject(res)
            return
          }

          const [selector] = branch
          findNewBranch = () => [document.querySelector(selector), branch]
        } catch (error) {
          unplug()
          task.reject(
            error instanceof Error ? error : new Error('unknown error')
          )
          return
        }
        step++
        if (!tasks[step]) {
          unplug()
          task.resolve()
        }
        return true
      }
    } else {
      const [selector, o_task] = nextBranch

      if (node.matches(selector)) {
        try {
          const res = o_task(node as any)
          if (res instanceof Error) {
            unplug()
            task.reject(res)
            return
          }
        } catch (error) {
          unplug()
          task.reject(
            error instanceof Error ? error : new Error('unknown error')
          )
          return
        }
        step++
        if (!tasks[step]) {
          unplug()
          task.resolve()
        }
        return true
      }
    }
  }
  function unplug() {
    observer.disconnect()
    step = -1
  }

  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
  })

  return task
}
