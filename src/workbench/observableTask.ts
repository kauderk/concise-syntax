import { createTask } from 'src/shared/utils'

export type ObserverTasks = [
  selector: string,
  task: (element: HTMLElement & { value: any }) => void | Error
][]
export type BranchObserver = [
  selector: string,
  task: (element: HTMLElement & { value: any }) => void | Error,
  branchSelector: [string, ObserverTasks] | BranchObserver
]
export type BranchObserverTasks = BranchObserver[]

export function REC_ObservableTaskTree(
  target: HTMLElement,
  tasks: BranchObserverTasks,
  root?: boolean
) {
  const task = createTask<undefined, Error>()
  let step = 0
  let findNewBranch:
    | (() => [Element | null, [string, ObserverTasks] | BranchObserver] | void)
    | undefined

  const observer = new MutationObserver(async (record) => {
    if (findNewBranch) {
      handleNewBranch()
      return
    }
    if (step == -1 || step == Infinity || step == -Infinity) {
      debugger
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
    }
    const node = document.querySelector(tasks[step][0])
    if (stepForward(node)) {
      return
    }
  })

  function stepForward(node: Node | null, _tasks = tasks) {
    if (!(node instanceof HTMLElement) || !_tasks[step]) {
      return
    }

    const nextBranch = _tasks[step]
    const [selector, o_task, branch] = nextBranch

    if (nextBranch.length == 3) {
      return handleBranch(node, selector, o_task, () => {
        const [selector] = branch
        findNewBranch = () => [document.querySelector(selector), branch]
        step = Infinity
        return true
      })
    } else {
      return handleBranch(node, selector, o_task, () => {
        step++
        if (!_tasks[step]) {
          step = -Infinity
          unplug()
          task.resolve()
          // maybe should return false?
        }
        return true
      })
    }
  }
  function handleBranch(
    node: Element,
    selector: string,
    o_task: any,
    thenable: () => void | true
  ) {
    if (!node.matches(selector)) return

    try {
      const res = o_task(node as any)
      if (res instanceof Error) {
        throw res
      } else {
        return thenable()
      }
    } catch (error) {
      step = -1
      unplug()
      task.reject(
        error instanceof Error
          ? error
          : new Error('unknown error', { cause: error })
      )
    }
  }
  function unplug() {
    observing = false
    observer.disconnect()
  }
  function handleNewBranch() {
    if (!findNewBranch) return
    const [branch, tree] = findNewBranch() ?? []
    if (!(branch instanceof HTMLElement) || !tree) return

    if (step != Infinity) {
      debugger
      throw new Error('step is not Infinity')
    }
    if (!Array.isArray(tree)) {
      debugger
      throw new Error('task_tree is not an array')
    }

    findNewBranch = undefined
    unplug()
    task.resolve()

    if (tree.length !== 3) {
      const rec = REC_ObservableTaskTree(branch, tree)
      return true
    }

    const [selector, o_task, _branch] = tree
    const res = handleBranch(branch, selector, o_task, () => true)
    if (!res) {
      debugger
      throw new Error('failed to handle branch')
    }

    const [_selector, newTasks] = _branch
    const nextTarget = document.querySelector(_selector)
    if (nextTarget instanceof HTMLElement) {
      const rec = REC_ObservableTaskTree(nextTarget, newTasks)
    } else {
      // hijack this recursive function
      findNewBranch = () => [document.querySelector(_selector), newTasks]
      target = document.body
      step = 0
      tasks = newTasks
      observe()
    }

    return true
  }

  let observing = false
  const observe = () => {
    observing = true
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }

  debugger

  for (const [selector] of tasks) {
    const node = target.querySelector(selector)
    const res = stepForward(node)
    if (step == -1 || step == -Infinity) {
      return task
    }
    if (!res) {
      observe()
      return task
    }
    if (handleNewBranch()) {
      return task
    }
  }

  if (step != -1 || step != Infinity || step != -Infinity) {
    debugger
    observe()
  } else if (!observing) {
    debugger
    throw new Error(`impossible step : ${step}`)
  }

  return task
}
