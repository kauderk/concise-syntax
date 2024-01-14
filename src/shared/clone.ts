export function Clone<T extends object>(o: T, m?: any): T {
  // return non object values
  if ('object' !== typeof o) return o
  // m: a map of old refs to new object refs to stop recursion
  if ('object' !== typeof m || null === m) m = new WeakMap()
  let n = m.get(o)
  if ('undefined' !== typeof n) return n
  // shallow/leaf clone object
  let c = Object.getPrototypeOf(o).constructor
  // TODO: specialize copies for expected built in types i.e. Date etc
  switch (c) {
    // shouldn't be copied, keep reference
    case Boolean:
    case Error:
    case Function:
    case Number:
    case Promise:
    case String:
    case Symbol:
    case WeakMap:
    case WeakSet:
      n = o
      break
    // array like/collection objects
    case Array:
      // @ts-ignore

      m.set(o, (n = o.slice(0)))
      // recursive copy for child objects
      // @ts-ignore
      n.forEach(function (v, i) {
        if ('object' === typeof v) n[i] = Clone(v, m)
      })
      break
    case ArrayBuffer:
      // @ts-ignore
      m.set(o, (n = o.slice(0)))
      break
    case DataView:
      m.set(
        o,
        // @ts-ignore
        (n = new c(Clone(o.buffer, m), o.byteOffset, o.byteLength))
      )
      break
    case Map:
    case Set:
      // @ts-ignore
      m.set(o, (n = new c(Clone(Array.from(o.entries()), m))))
      break
    case Int8Array:
    case Uint8Array:
    case Uint8ClampedArray:
    case Int16Array:
    case Uint16Array:
    case Int32Array:
    case Uint32Array:
    case Float32Array:
    case Float64Array:
      // @ts-ignore
      m.set(o, (n = new c(Clone(o.buffer, m), o.byteOffset, o.length)))
      break
    // use built in copy constructor
    case Date:
    case RegExp:
      m.set(o, (n = new c(o)))
      break
    // fallback generic object copy
    default:
      m.set(o, (n = Object.assign(new c(), o)))
      // recursive copy for child objects
      for (c in n) if ('object' === typeof n[c]) n[c] = Clone(n[c], m)
  }
  return n
}
