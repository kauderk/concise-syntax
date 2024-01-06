/** Just use the Either monad... */
export class or_return<T> {
  constructor(
    private fn: () => T | ((a: any) => T),
    private onError: () => any
  ) {
    this.fn = fn
    this.onError = onError
  }

  finally<R, Y = T>(fn: (a: NonNullable<Y>) => R): R | undefined {
    try {
      const value = this.fn()
      if (value) {
        // @ts-ignore
        return fn(value)
      } else {
        this.onError()
      }
    } catch (error) {
      this.onError()
    }
  }

  or_return<Y>(fn: (a: NonNullable<T>) => Y, onError: () => any) {
    try {
      const value = this.fn()
      if (value) {
        // @ts-ignore
        return new or_return(() => fn(value), onError)
      } else {
        this.onError()
      }
    } catch (error) {
      this.onError()
    }
    return new or_return(console.log, console.error) as or_return<Y>
  }
}
