import { createTask } from 'src/shared/utils'

export type ObserverTasks = [
  string,
  (element: HTMLElement & { value: any }) => void
][]

export function createObservableTask(
  target: HTMLElement,
  tasks: ObserverTasks
) {
  const task = createTask()

  let done = false
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
    if (done || !tasks[step]) return

    const [selector, o_task] = tasks[step]
    if (node.matches(selector)) {
      o_task(node as any)
      step++
      if (!tasks[step]) {
        done = true
        observer.disconnect()
        task.resolve()
      }
      return true
    }
  }

  let step = 0
  // let f = tasks[step]
  // async function* taskGenerator() {}
  // const task = taskGenerator()
  // task.next()

  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
  })

  return task
}
