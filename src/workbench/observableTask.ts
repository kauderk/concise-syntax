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

const errors = createStructByNames({
  observing_was_set_to_true: '',
  observing_was_set_to_false: '',
  findNewBranch_is_busy: '',
  task_tree_is_not_an_array: '',
  invalid_step: '',
  invalid_selector: '',
  invalid_return_value: '',
  failed_next_dom_task: '',
  timeout_exceeded: '',
  panic_next_recursive_tree: '',
  panic_next_tree: '',
  promise_task_rejected: '',
})
type FnError = (typeof errors)[keyof typeof errors]
export type Falsy = 0 | -0 | 0n | '' | false | null | undefined // javascript :D
const createResult = () => createTask<'finish', FnError | Error | Falsy>()

export const work_REC_ObservableTaskTree = (
  target: HTMLElement,
  domTasks: BranchObserverTasks
) => {
  debugger
  const taskPromise = createResult()

  let outParameters = { unplug() {}, taskPromise }
  const res = REC_ObservableTaskTree(target, domTasks, outParameters)
  if (res == 'finish' || res == 'panic' || res == 'error') {
    // noop
  } else {
    const timeout = setTimeout(() => {
      taskPromise.reject(errors.timeout_exceeded)
    }, 500_000)
    taskPromise.promise.finally(() => clearTimeout(timeout))
  }

  return {
    promise: taskPromise.promise,
    reject() {
      outParameters.unplug()
      taskPromise.reject(errors.promise_task_rejected)
    },
  }
}

export { work_REC_ObservableTaskTree as REC_ObservableTaskTree }
/**
 I'm positive this could be a 10 line function, but I'm not sure how to do it.
 */
function REC_ObservableTaskTree(
  target: HTMLElement,
  domTasks: BranchObserverTasks,
  // TODO: find a better way to collapse the recursive stack over time...
  outParameters: {
    unplug: Function
    taskPromise: ReturnType<typeof createResult>
  }
) {
  let step = 0
  let findNewBranch: (() => [Element | null, Branch] | void) | undefined

  const observer = new MutationObserver(async (record) => {
    if (panicked) {
      debugger
      return
    }

    if (step == -1) {
      return panic(errors.invalid_step, step)
    }
    if (findNewBranch) {
      const [node, tree] = findNewBranch() ?? []
      if (!(node instanceof HTMLElement) || !tree) return

      if (!Array.isArray(tree)) {
        return panic(errors.task_tree_is_not_an_array)
      }

      return tryUnplug(() => {
        findNewBranch = undefined
        findMatchOrREC(node, tree)
      })
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
    const node = document.querySelector(domTasks[step][0])
    if (stepForward(node)) {
      return
    }
  })
  let panicked = false
  function panic(error: FnError, f?: any) {
    panicked = true
    unplug()
    outParameters.taskPromise.reject(error)
    return 'panic' as const
  }

  function stepForward(node: Node | null, _tasks = domTasks) {
    if (!(node instanceof HTMLElement) || !_tasks[step]) {
      return
    }

    const nextBranch = _tasks[step]
    const [selector, dom_task, branch] = nextBranch

    if (nextBranch.length == 3) {
      return handleBranch(node, selector, dom_task, () => {
        const [selector] = branch
        const nextTarget = document.querySelector(selector)
        if (nextTarget instanceof HTMLElement) {
          return findMatchOrREC(nextTarget, branch)
        } else {
          return setFindMatchFunc(selector, branch)
        }
      })
    } else {
      return handleBranch(node, selector, dom_task, () => {
        step++
        if (!_tasks[step]) {
          return tryUnplug(() => {
            outParameters.taskPromise.resolve('finish')
            return 'finish' as const
          })
        }
        return 'next'
      })
    }
  }
  function findMatchOrREC(node: HTMLElement, tree: Branch) {
    if (tree.length !== 3) {
      // @ts-expect-error
      const rec = REC_ObservableTaskTree(node, tree[1], outParameters)
      if (!rec || rec == 'panic') {
        return panic(errors.panic_next_tree)
      }
      return 'next tree'
    }

    const [self_selector, dom_task, branch] = tree
    const res = handleBranch(node, self_selector, dom_task, () => 'next')
    if (!res || res == 'error' || res == 'panic') {
      return panic(errors.failed_next_dom_task)
    }

    const [selector, newTasks] = branch
    const nextTarget = document.querySelector(selector)
    if (nextTarget instanceof HTMLElement) {
      // @ts-expect-error
      const rec = REC_ObservableTaskTree(nextTarget, newTasks, outParameters)
      if (!rec || rec == 'panic') {
        return panic(errors.panic_next_recursive_tree)
      }
      return 'recursive tree'
    } else {
      // @ts-expect-error
      return setFindMatchFunc(selector, newTasks)
    }
  }
  function setFindMatchFunc(selector: string, newDomTasks: Branch) {
    if (findNewBranch) {
      return panic(errors.findNewBranch_is_busy)
    }
    // TODO: find another way to recycle the REC function
    // FIXME: avoid resetting the parameters
    findNewBranch = () => [document.querySelector(selector), newDomTasks]
    target = document.body
    step = 0
    // @ts-expect-error
    domTasks = newDomTasks
    observe()
    return 'findNewBranch' as const
  }

  function handleBranch(
    node: Element,
    selector: string,
    dom_task: any,
    // prettier-ignore
    thenable: () => 'next' | 'findNewBranch' | 'finish' | 'recursive tree' | 'next tree' | 'panic'
  ) {
    if (!node.matches(selector)) return

    try {
      const res = dom_task(node as any)
      if (res instanceof Error) {
        throw res
      } else {
        return thenable()
      }
    } catch (error) {
      return tryUnplug(() => {
        step = -1
        outParameters.taskPromise.reject(
          error instanceof Error
            ? error
            : new Error('unknown error', { cause: error })
        )
        return 'error' as const
      })
    }
  }

  function tryUnplug<T>(thenable: () => T) {
    if (observing === false) {
      return panic(errors.observing_was_set_to_false)
    }
    unplug()
    return thenable()
  }
  function unplug() {
    observing = false
    observer.disconnect()
    observer.takeRecords()
  }
  outParameters.unplug = unplug

  let observing: boolean | undefined = undefined
  const observe = () => {
    if (observing) {
      return panic(errors.observing_was_set_to_true)
    }
    observing = true
    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
    })
  }

  for (let i = 0; i < domTasks.length; i++) {
    const [selector] = domTasks[i]
    if (!selector || selector.length == 1) {
      return panic(errors.invalid_selector, selector)
    }
    const node = target.querySelector(selector)
    const res = stepForward(node)
    if (!res) {
      break // TODO: pass OR branch types
    }
    if (!(res == 'findNewBranch' || res == 'next')) {
      return res
    }
  }

  if (step > -1 && step < domTasks.length && !observing) {
    observe()
    return 'return observe'
  } else {
    return panic(errors.invalid_step, step)
  }
}

function createTask<R = unknown, E = unknown>() {
  let resolve = (value: R) => {},
    reject = (value: E) => {}
  const promise = new Promise((_resolve, _reject) => {
    reject = _reject
    resolve = _resolve
  }) as CatchPromise<R, E>
  return { promise, resolve, reject }
}

// I don't like typescript enums...
function createStructByNames<const keys extends Record<string, ''>>(
  keys: keys
) {
  return Object.keys(keys).reduce((acc, key, i) => {
    // @ts-expect-error
    acc[key] = key
    return acc
  }, <{ [key in keyof keys]: key }>{})
}

// https://stackoverflow.com/a/71092111
export type CatchPromise<T, F = unknown> = {
  catch<TResult = never>(
    onrejected?:
      | ((reason: F) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<T | TResult>
} & Promise<T>
