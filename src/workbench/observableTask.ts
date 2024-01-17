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
export type BranchObserverTasks = [BranchObserver, BranchObserver]

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
    if (step === -1) {
      return console.log('step -1')
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

  function stepForward(node: Node | null) {
    if (!(node instanceof HTMLElement)) {
      return
    }
    if (!tasks[step]) {
      console.log('no task', step, tasks)
      return
    }

    const nextBranch = tasks[step]
    const [selector, o_task, branch] = nextBranch
    if (nextBranch.length === 3) {
      return handleBranch(node, selector, o_task, () => {
        const [selector] = branch
        findNewBranch = () => [document.querySelector(selector), branch]
        step = -1
        return true
      })
    } else {
      return handleBranch(node, selector, o_task, () => {
        step++
        if (!tasks[step]) {
          unplug()
          task.resolve()
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
        // return true
      }
    } catch (error) {
      unplug()
      task.reject(
        error instanceof Error
          ? error
          : new Error('unknown error', { cause: error })
      )
      return
    }
  }
  function unplug() {
    step = -1
    observer.disconnect()
  }
  function handleNewBranch() {
    if (!findNewBranch) {
      return console.log('No new branch found')
    }
    const [branch, tree] = findNewBranch() ?? []

    if (branch instanceof HTMLElement && tree) {
      const task_tree = Array.isArray(tree[1]) ? tree[1] : tree[2]
      if (!Array.isArray(task_tree)) {
        debugger
        throw new Error('task_tree is not an array')
      }
      findNewBranch = undefined
      unplug()
      task.resolve()
      const rec = REC_ObservableTaskTree(branch, task_tree)
      console.log('Walked down the tree', rec)
      return true
    }

    return console.log('No branch found')
  }

  const observe = () =>
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
    })

  debugger
  for (const [selector] of tasks) {
    const node = target.querySelector(selector)
    if (step === 0) {
      if (node) {
        stepForward(node)
      }
      if (handleNewBranch()) {
        return task
      }
    } else {
      break
    }
  }

  if (!findNewBranch) {
    observe()
  } else {
    debugger
  }

  return task
}
