/**
 * Less Call Stack
 */
export function createObservable<T>(initialValue: T) {
  let _value: T = initialValue
  let _subscribers: ((payload: T) => void)[] = []

  return {
    get value(): T {
      return _value
    },
    set value(payload: T) {
      this.set(payload)
    },
    set(payload: T) {
      if (_value === payload) return

      _value = payload
      this.notify()
    },
    notify() {
      _subscribers.forEach((observer) => {
        observer(_value)
      })
    },
    subscribe(cb: (payload: T) => void) {
      _subscribers.push(cb)
      cb(_value)
      return () => {
        // unsubscribe
        _subscribers = _subscribers.filter((o) => o !== cb)
      }
    },
    /**
     * Subscribe without calling the callback immediately
     */
    $ubscribe(cb: (payload: T) => void) {
      _subscribers.push(cb)
      return () => {
        // unsubscribe
        _subscribers = _subscribers.filter((o) => o !== cb)
      }
    },
  }
}
export type Observable<T> = ReturnType<typeof createObservable<T>>
