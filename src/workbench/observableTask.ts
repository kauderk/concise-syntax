import { createTask } from 'src/shared/utils'

export type ObserverTasks = [
  selector: string,
  task: (element: HTMLElement & { value: any }) => void | Error
][]
export type BranchObserver = [
  selector: string,
  task: (element: HTMLElement & { value: any }) => void | Error,
  branchSelector: Branch
]
type Branch = BranchObserver | [string, ObserverTasks]
export type BranchObserverTasks = BranchObserver[]

/**
 I'm positive this could be a 10 line function, but I'm not sure how to do it.
 */
export function REC_ObservableTaskTree(
  target: HTMLElement,
  tasks: BranchObserverTasks,
  root?: boolean
) {
  const task = createTask<undefined, Error>()
  let step = 0
  let findNewBranch: (() => [Element | null, Branch] | void) | undefined

  const observer = new MutationObserver(async (record) => {
    if (findNewBranch) {
      handleNewBranch()
      return
    }
    if (step == -1) {
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

        const nextTarget = document.querySelector(selector)
        if (nextTarget instanceof HTMLElement) {
          return nextMatch(nextTarget, branch)
        } else {
          return findMatchFunc(selector, branch)
        }
      })
    } else {
      return handleBranch(node, selector, o_task, () => {
        step++
        if (!_tasks[step]) {
          unplug()
          task.resolve()
          return 'finish'
        }
        return 'next'
      })
    }
  }
  function nextMatch(node: HTMLElement, tree: Branch) {
    if (tree.length !== 3) {
      // ts-expect-error
      const rec = REC_ObservableTaskTree(node, tree[1])
      return 'recursive tree'
    }

    const [self_selector, o_task, branch] = tree
    const res = handleBranch(node, self_selector, o_task, () => 'next')
    if (!res) {
      debugger
      throw new Error('failed to handle branch')
    }

    const [selector, newTasks] = branch

    const nextTarget = document.querySelector(selector)
    if (nextTarget instanceof HTMLElement) {
      // ts-expect-error
      const rec = REC_ObservableTaskTree(nextTarget, newTasks)
      return 'recursive'
    } else {
      // ts-expect-error
      return findMatchFunc(selector, newTasks)
    }
  }
  // prettier-ignore
  function findMatchFunc(selector: string, newTasks: Branch) {
		if(findNewBranch){
			debugger
		}
    findNewBranch = () => [document.querySelector(selector), newTasks]
    target = document.body
    step = 0
    // ts-expect-error
    tasks = newTasks
    observe()
    return 'findNewBranch' as const
  }

  function handleBranch(
    node: Element,
    selector: string,
    o_task: any,
    // prettier-ignore
    thenable: () => 'next' | 'findNewBranch' | 'finish' | 'recursive' | 'recursive tree'
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
      return 'error'
    }
  }
  function unplug() {
    if (observing === false) {
      debugger
    }
    observing = false
    observer.disconnect()
  }
  function handleNewBranch() {
    if (!findNewBranch) return
    const [node, tree] = findNewBranch() ?? []
    if (!(node instanceof HTMLElement) || !tree) return

    if (step == -1) {
      debugger
      throw new Error(`invalid step: ${step}`)
    }
    if (!Array.isArray(tree)) {
      debugger
      throw new Error('task_tree is not an array')
    }

    findNewBranch = undefined
    unplug()
    task.resolve()

    return nextMatch(node, tree)
  }

  let observing: boolean | undefined = undefined
  const observe = () => {
    if (observing) {
      debugger
    }
    observing = true
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }

  for (let i = 0; i < tasks.length; i++) {
    const [selector] = tasks[i]
    if (!selector || selector.length == 1) {
      debugger
      throw new Error(`invalid selector: ${selector}`)
    }
    const node = target.querySelector(selector)
    const res = stepForward(node)
    if (res?.match(/recursive|error/)) {
      return task
    }
  }

  if (step > -1 && step < tasks.length && !observing) {
    observe()
  } else {
    debugger
    throw new Error(`impossible step : ${step}`)
  }

  return task
}
