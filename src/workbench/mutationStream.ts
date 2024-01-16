/**
 * Observe dom mutation using a MutationObserver as a stream (AsyncIterator)
 */
export class MutationStream {
  private mo: MutationObserver

  private _resolve: ((value?: MutationRecord[] | null) => void) | null

  private _loopStream: boolean

  constructor() {
    this.mo = new MutationObserver((ml, ob) => {
      if (this._resolve) {
        this._resolve(ml)
      }
    })

    this._resolve = null
    this._loopStream = false
  }

  /**
   * Start observing an element for mutations
   * @param {Node} elem - The element to be observed for mutations
   * @param {Object} config - Configuration object accepted by mutation observers
   */
  public observe(elem: Node, config: MutationObserverInit): void {
    this.mo.observe(elem, config)
    this._loopStream = true
  }

  /**
   * Start observing an element for mutations and receive an async iterator
   * yielding the observed mutations
   * @param {Node} elem - The element to be observed for mutations
   * @param {Object} config - Configuration object accepted by mutation observers
   * @return {AsyncIterableIterator<MutationRecord[]>}
   */
  public observeStream(
    elem: Node,
    config: MutationObserverInit
  ): AsyncIterableIterator<MutationRecord[]> {
    this.observe(elem, config)
    return this.streamItr()
  }

  /**
   * Creates a conditional mutation stream. If the startPredicate
   * does not return true then the observer discontents ending the stream.
   * Otherwise, the stream continues to emit mutations until the observer is
   * disconnected or the stopPredicate returns true. The stopPredicate is polled
   * at 1.5 second intervals when the observer is waiting for the next mutation.
   * @param {Node} elem - The element to be observed for mutations
   * @param {Object} config - Configuration object accepted by mutation observers
   * @param {function(): boolean} startPredicate - Predicate function right before
   * mutations are yielded to determine if the stream should end immediately or not
   * @param {function(): boolean} stopPredicate - Predicate function polled
   * while waiting for mutations to occur that returns false to indicate
   * the stream should end.
   * @return {AsyncIterator<MutationRecord[]>}
   */
  public predicatedStream(
    elem: Node,
    config: MutationObserverInit,
    startPredicate: () => boolean,
    stopPredicate: () => boolean
  ): AsyncIterator<MutationRecord[]> {
    this.observe(elem, config)
    return this.predicateStreamItr(startPredicate, stopPredicate)
  }

  /**
   * Disconnects the mutation observer and ends the stream
   */
  public disconnect(): void {
    this.mo.disconnect()
    this._loopStream = false
    if (this._resolve) {
      this._resolve(null)
    }
    this._resolve = null
  }

  /**
   * Returns a promise that resolves with the next observed mutation
   * @return {Promise<?MutationRecord[]>}
   * @private
   */
  private _getNext(): Promise<MutationRecord[] | null> {
    return new Promise((resolve) => {
      if (this._resolve) {
        this._resolve = resolve
      }
    })
  }

  /**
   * Returns a stream (async iterator) that yields
   * the observed mutations. Must have called {@link observe} before
   * calling this method, otherwise no mutations will be yielded
   * @return {AsyncIterator<MutationRecord[]>}
   */
  public async *streamItr(): AsyncGenerator<MutationRecord[], void, unknown> {
    let next: MutationRecord[] | null
    while (this._loopStream) {
      next = await this._getNext()
      if (next == null) {
        break
      }
      yield next
    }
    this.disconnect()
  }

  /**
   * Returns a mutation stream that ends if the startPredicate returns false
   * otherwise keeps the stream alive until disconnect or the stopPredicate, polled
   * at 1.5 second intervals when waiting for the next mutation, returns false.
   * Automatically disconnects at the end.
   * @param {function(): boolean} startPredicate - Predicate function right before
   * mutations are yielded to determine if the stream should end immediately or not
   * @param {function(): boolean} stopPredicate - Predicate function polled
   * while waiting for mutations to occur that returns false to indicate
   * the stream should end.
   * @return {AsyncIterator<?MutationRecord[]>}
   */
  public async *predicateStreamItr(
    startPredicate: () => boolean,
    stopPredicate: () => boolean
  ): AsyncIterator<MutationRecord[] | null> {
    if (!startPredicate()) {
      this.disconnect()
      return
    }
    let checkTo: NodeJS.Timeout | null
    let next: MutationRecord[] | null
    while (this._loopStream) {
      next = await Promise.race([
        this._getNext(),
        new Promise<MutationRecord[] | null>((resolve) => {
          checkTo = setInterval(() => {
            if (stopPredicate()) {
              if (checkTo) {
                clearInterval(checkTo)
                checkTo = null
              }
              return resolve(null)
            }
          }, 1500)
        }),
      ])
      if (checkTo) {
        clearInterval(checkTo)
        checkTo = null
      }
      if (next == null) break
      yield next
    }
    this.disconnect()
  }

  /**
   * @return {AsyncIterator<?MutationRecord[]>}
   */
  [Symbol.asyncIterator](): AsyncGenerator<
    MutationRecord[] | null,
    void,
    unknown
  > {
    return this.streamItr()
  }
}


// Create an element to observe for mutations
const targetElement = document.createElement('div');
document.body.appendChild(targetElement);

// Create a MutationStream instance
const mutationStream = new MutationStream();
mutationStream.streamItr
mutationStream.observeStream
mutationStream.observe
mutationStream.disconnect
mutationStream.predicateStreamItr
mutationStream[Symbol.asyncIterator]
mutationStream.predicatedStream

// Example 1: Observe mutations using observe method
mutationStream.observe(targetElement, { attributes: true, childList: true, subtree: true });

// Example 2: Observe mutations and get an async iterator
const asyncIterator = mutationStream.observeStream(targetElement, { childList: true });

// Example 3: Create a conditional mutation stream using predicates
const startPredicate = () => true; // Always start the stream
const stopPredicate = () => false; // Never stop the stream (for demo purposes)
const conditionalIterator = mutationStream.predicatedStream(targetElement, { attributes: true }, startPredicate, stopPredicate);

// Example 4: Disconnect after a timeout
setTimeout(() => {
  mutationStream.disconnect();
}, 5000);

// Log mutations from the first example
mutationStream.streamItr().next().then(result => {
  console.log('Example 1 - Mutations:', result.value);
});

// Log mutations from the second example
asyncIterator.next().then(result => {
  console.log('Example 2 - Mutations:', result.value);
});

// Log mutations from the third example
conditionalIterator.next().then(result => {
  console.log('Example 3 - Conditional Mutations:', result.value);
});

// Log mutations from the fourth example after 5 seconds
setTimeout(async () => {
  mutationStream.streamItr().next().then(result => {
    console.log('Example 4 - Mutations after disconnect:', result.value);
  });
}, 6000);

