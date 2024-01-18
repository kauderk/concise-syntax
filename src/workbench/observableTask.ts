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
})
type FnError = (typeof errors)[keyof typeof errors]

export class Unknown {} // https://stackoverflow.com/questions/61685819/typescript-does-not-recognize-a-union-of-type-unknown-and-type-promiseunknown#comment109112699_61685819
const Result = createTask<
  'finish' | 'recursive',
  FnError | Error | (Unknown & undefined)
>()

Result.promise.catch((e) => {})
/**
 I'm positive this could be a 10 line function, but I'm not sure how to do it.
 */
export function REC_ObservableTaskTree(
  target: HTMLElement,
  tasks: BranchObserverTasks
  // Result = Result
) {
  let step = 0
  let findNewBranch: (() => [Element | null, Branch] | void) | undefined

  const observer = new MutationObserver(async (record) => {
    if (panicked) {
      debugger
      return
    }

    if (findNewBranch) {
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
      Result.resolve('recursive')

      // TODO: do something with the result
      return nextMatch(node, tree)
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
  let panicked = false
  function panic(error: FnError) {
    panicked = true
    observing = false
    observer.disconnect()
    Result.reject(error)
  }

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
          Result.resolve('finish')
          return 'finish'
        }
        return 'next'
      })
    }
  }
  function nextMatch(node: HTMLElement, tree: Branch) {
    if (tree.length !== 3) {
      // @ts-expect-error
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
      // @ts-expect-error
      const rec = REC_ObservableTaskTree(nextTarget, newTasks)
      return 'recursive'
    } else {
      // @ts-expect-error
      return findMatchFunc(selector, newTasks)
    }
  }
  // prettier-ignore
  function findMatchFunc(selector: string, newTasks: Branch) {
		if(findNewBranch){
			return panic(errors.findNewBranch_is_busy)
		}
    findNewBranch = () => [document.querySelector(selector), newTasks]
    target = document.body
    step = 0
    // @ts-expect-error
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
      Result.reject(
        error instanceof Error
          ? error
          : new Error('unknown error', { cause: error })
      )
      panic(errors.observing_was_set_to_false)
      return 'error'
    }
  }

  function unplug() {
    if (observing === false) {
      return panic(errors.observing_was_set_to_true)
    }
    observing = false
    observer.disconnect()
  }

  let observing: boolean | undefined = undefined
  const observe = () => {
    if (observing) {
      return panic(errors.observing_was_set_to_false)
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
      return Result
    }
  }

  if (step > -1 && step < tasks.length && !observing) {
    observe()
  } else {
    debugger
    throw new Error(`impossible step : ${step}`)
  }

  return Result
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
