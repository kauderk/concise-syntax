/**
 * Less Call Stack
 */
export function createObservable<T>(initialValue: T) {
  let _value: T = initialValue
  type SelfCleanup = (() => void) | 'Symbol.dispose' // is this well supported?
  type Subscriber = (payload: T) => SelfCleanup | void
  let _subscribers: Subscriber[] = []
  let _toDispose = new Map<Subscriber, SelfCleanup[]>()

  function splice(sub: Subscriber) {
    _subscribers = _subscribers.filter((fn) => fn !== sub)
    _toDispose.get(sub)?.forEach((fn) => typeof fn === 'function' && fn())
    _toDispose.delete(sub)
  }
  return {
    get value(): T {
      return _value
    },
    set value(payload: T) {
      if (_value === payload) return
      _value = payload
      this.notify()
    },
    notify() {
      // debugger right now it is hardcoded... maybe after each subscriber callback _toDispose should be cleaned up
      for (let i = 0; i < _subscribers.length; i++) {
        const sub = _subscribers[i]
        const res = sub(_value)

        if (typeof res === 'function') {
          // prettier-ignore
          _toDispose.set(sub, (_toDispose.get(sub) || []).concat(res))
        } else if (res === 'Symbol.dispose') {
          splice(sub)
          i -= 1
        }
      }
    },
    /**
     * Subscribe without calling the callback immediately
     */
    $ubscribe(sub: Subscriber) {
      _subscribers.push(sub)
      return () => splice(sub)
    },
  }
}
export type Observable<T> = ReturnType<typeof createObservable<T>>
