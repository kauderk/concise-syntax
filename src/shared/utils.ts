export function deltaFn<F extends () => any>(consume: boolean = false) {
  let delta: F | undefined
  return {
    consume() {
      delta?.()
      delta = undefined
    },
    get fn() {
      return delta
    },
    set fn(value) {
      // TODO: check if this won't break anything else
      if (consume) this.consume()
      delta = value
    },
  }
}
export function deltaValue<T>(consume: (value: T) => void) {
  let delta: T | undefined
  return {
    consume() {
      if (delta) consume(delta)
      delta = undefined
    },
    get value() {
      return delta
    },
    set value(value) {
      this.consume()
      delta = value
    },
  }
}
