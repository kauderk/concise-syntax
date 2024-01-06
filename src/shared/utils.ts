export function deltaFn() {
  let delta: Function | undefined
  return {
    consume() {
      delta?.()
      delta = undefined
    },
    get fn() {
      return delta
    },
    set fn(value) {
      delta = value
    },
  }
}
