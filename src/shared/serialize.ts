export const JSON_MAP = {
  stringify: (map: any) => JSON.stringify(map, stringifyMap),
  parseOrNew: (str: any) => {
    try {
      const m = JSON.parse(str, parseMap)
      if (m instanceof Map) return m
      return new Map()
    } catch (error) {
      return new Map()
    }
  },
}

function stringifyMap<K, V>(key: K, value: V) {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()), // or with spread: value: [...value]
    }
  } else {
    return value
  }
}
function parseMap<K, V>(key: K, value: V) {
  if (typeof value === 'object' && value !== null) {
    // @ts-ignore
    if (value.dataType === 'Map') {
      // @ts-ignore
      return new Map(value.value)
    }
  }
  return value
}
