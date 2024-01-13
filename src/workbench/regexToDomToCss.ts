import { linesSelector } from './keys'

//#region tables
type Condition = (payload: {
  siblings: HTMLSpanElement[]
  current: HTMLSpanElement
}) => HTMLElement | undefined // FIXME: handle multiple return types
type SymbolClass<C = Condition> = {
  [key: string]:
    | {
        match: RegExp | string
        capture?: Condition
      }
    | ({
        match: RegExp | string
      } & Partial<{
        [condition: string]: C
      }>)
}

const symbolTable = {
  openTag: {
    match: /<|<\//,
    lowerCase({ siblings, current }) {
      const tag = siblings[siblings.indexOf(current) + 1]
      if (tag.textContent?.toLowerCase() === tag.textContent) {
        return tag
      }
    },
    upperCase({ siblings, current }) {
      const tag = siblings[siblings.indexOf(current) + 1]
      if (tag.textContent?.match(/^[A-Z]/)) {
        return tag
      }
    },
  },

  text: { match: /Hello\sConcise\sSyntax!/ },
  comaSeparator: {
    match: /,/,
    capture({ siblings, current }) {
      const next = siblings[siblings.indexOf(current) + 1]
      if (next) {
        return current
      }
    },
  },

  ternaryOperator: { match: /\?/ },
} satisfies SymbolClass

const lastSymbolTable = {
  closeTag: {
    match: /(>|\/>)$/,
    capture({ siblings }) {
      return siblings[siblings.length - 1]
    },
  },
  lastSemicolon: {
    match: /;$/,
    capture({ siblings }) {
      return siblings[siblings.length - 1]
    },
  },
  lastComa: {
    match: /,$/,
    capture({ siblings }) {
      return siblings[siblings.length - 1]
    },
  },
  jsxBracket: {
    match: /={{$/,
    capture({ siblings }) {
      return siblings[siblings.length - 2]
    },
  },
  ternaryOtherwise: {
    match: /\).+?:.+\}/,
    // FIXME: type me
    capture({ siblings, current }) {
      return siblings
    },
  },
} satisfies SymbolClass

const multipleSymbolTale = {
  quotes: {
    match: /"|'|`/,
    string({ siblings, current }) {
      const beginQuote = current.textContent
      const string = siblings[siblings.indexOf(current) + 1]
      const end = siblings[siblings.indexOf(current) + 2]
      const endQuote = end?.textContent
      if (
        beginQuote?.length == 1 &&
        string?.textContent?.length &&
        beginQuote === endQuote
      ) {
        return [current, string, end]
      } else if (beginQuote?.length! > 2 && beginQuote?.match(/("|'|`)$/)) {
        return [current]
      }
    },
  },
} satisfies SymbolClass<
  (payload: {
    siblings: HTMLSpanElement[]
    current: HTMLSpanElement
  }) => HTMLElement[] | undefined
>
//#endregion

/**
 * FIXME: This function might crash if it can't find valid selectors...
 */
export function parseSymbolColors(lineEditor: HTMLElement) {
  //#region parser
  const lines = Array.from(lineEditor.querySelectorAll('div>span'))

  let table: any = Clone(symbolTable)
  let lastTable: any = Clone(lastSymbolTable)
  let multipleTable: any = Clone(multipleSymbolTale)
  let output: any = {}

  parser: for (const line of lines) {
    const text = line.textContent
    if (!text) continue
    const siblings = Array.from(line.children) as HTMLElement[]

    line: for (let current of siblings) {
      const content = current.textContent

      for (let key in table) {
        const regex = table[key].match
        const match = content?.match(regex)
        if (!match) continue
        output[key] ??= {}
        delete table[key].match

        for (let conditionKey in table[key]) {
          const evaluation = table[key][conditionKey]({
            siblings,
            current,
          })
          if (evaluation) {
            output[key][conditionKey] = getProcess(evaluation, match[0])
            delete table[key][conditionKey]
          }
        }
        if (Object.keys(table[key]).length === 0) {
          output[key].capture ??= getProcess(current, match[0])
          delete table[key]
        } else {
          table[key].match = regex
        }
      }

      for (let key in multipleTable) {
        const regex = multipleTable[key].match
        const match = content?.match(regex)
        if (!match) continue
        output[key] ??= {}
        delete multipleTable[key].match

        for (let conditionKey in multipleTable[key]) {
          const evaluations = multipleTable[key][conditionKey]({
            siblings,
            current,
          })
          if (evaluations) {
            output[key][conditionKey] = evaluations.map(getProcess)
            delete multipleTable[key][conditionKey]
          }
        }
        if (Object.keys(multipleTable[key]).length === 0) {
          output[key].capture ??= getProcess(current, match[0])
          delete multipleTable[key]
        } else {
          multipleTable[key].match = regex
        }
      }
    }

    for (let key in lastTable) {
      const regex = lastTable[key].match
      const match = text?.match(regex)
      if (!match) continue
      output[key] ??= {}

      const evaluation = lastTable[key].capture({
        siblings,
      })
      if (evaluation) {
        output[key].capture = getProcess(evaluation, match[0])
        delete lastTable[key]
      }
    }
  }

  // typescript...
  type Table = typeof symbolTable
  type TableKeyUnions<T> = { [K in keyof T]: { [K2 in keyof T[K]]: any } }
  type AllKeys<T> = T extends any ? keyof T : never
  type TableKeys =
    | AllKeys<TableKeyUnions<typeof symbolTable>>
    | AllKeys<TableKeyUnions<typeof lastSymbolTable>>
    | AllKeys<TableKeyUnions<typeof multipleSymbolTale>>
  type conditionKeys = AllKeys<TableKeyUnions<Table>[keyof Table]>
  // FIXME: type me correctly...
  const process = output as { [key in TableKeys]: { capture: HTMLElement } }
  //#endregion

  //#region map capture to pre selectors

  const angleBracketSelector = setToSelector(
    process.openTag.capture,
    process.closeTag.capture
  )
  const anyTagSelector = `${angleBracketSelector}+${setToSelector(
    process.openTag.lowerCase,
    process.openTag.upperCase
  )}`
  const lowerCaseTagSelector = `${angleBracketSelector}+${classSelector(
    process.openTag.lowerCase
  )}`
  const upperCaseTagSelector = `${angleBracketSelector}+${classSelector(
    process.openTag.upperCase
  )}`

  const jsxBracketSelector =
    '.' + process.jsxBracket.capture.className.split(' ').shift()

  const stringEl = process.quotes.string[0]
  const beginQuote = stringEl.className
  const endQuoteEl = process.quotes.string[2] ?? stringEl
  const endQuote = endQuoteEl.className

  let ternaryOtherWiseSelector: string
  const closing7 = SliceClassListC(process.ternaryOtherwise.capture, -7)
  // prettier-ignore
  const joinLastChild = (c: string[]) => c.reduce((acc, val) => acc + '.' + val + '+', '').slice(0, -1) + ':last-child'
  if (closing7.okLength) {
    ternaryOtherWiseSelector = joinLastChild(toFlatClassList(closing7))
  } else {
    const closing5 = SliceClassListC(process.ternaryOtherwise.capture, -5)
    // FIXME: honestly, just crash if you can't find the selector
    ternaryOtherWiseSelector = joinLastChild(toFlatClassList(closing5))
  }
  //#endregion

  //#region map pre selectors to selectors with colors
  const opacitySelectors = {
    angleBrackets: {
      selector: angleBracketSelector,
      color: color(process.openTag.capture),
    },
    lastComa: {
      selector: lastChildSelector(process.lastComa.capture),
      color: color(process.lastComa.capture),
    },
    lastSemicolon: {
      selector: lastChildSelector(process.lastSemicolon.capture),
      color: color(process.lastSemicolon.capture),
    },
    beginQuote: {
      selector: '.' + beginQuote,
      color: color(stringEl),
    },
    endQuote: {
      selector: '.' + endQuote,
      color: color(endQuoteEl),
    },
  }

  const selectorOnly = {
    closingJsxElementLowerCase: {
      selector: `${lowerCaseTagSelector}:has(+${angleBracketSelector}:last-child)`,
    },
    closingJsxElementUpperCase: {
      selector: `${upperCaseTagSelector}:has(+${angleBracketSelector}:last-child)`,
    },
    singleQuotes: {
      selector: `:is([class="${beginQuote}"]:has(+.${endQuote}), [class="${beginQuote}"]+.${endQuote})`,
    },
    jsxBracket: {
      selector: jsxBracketSelector,
    },
    ternaryClosingBrace: {
      selector: `${jsxBracketSelector}~${classSelector(
        process.ternaryOperator.capture
      )}~[class*="bracket-highlighting-"]:last-child`,
    },
  }
  const colorOnly = {
    closingJsxElementLowerCase: {
      selector: `${lowerCaseTagSelector}`,
      color: color(process.openTag.lowerCase),
    },
    closingJsxElementUpperCase: {
      selector: `${upperCaseTagSelector}`,
      color: color(process.openTag.upperCase),
    },
    commaSeparator: {
      selector: classSelector(process.comaSeparator.capture),
      color: color(process.comaSeparator.capture),
    },
    ternaryClosingBrace: {
      selector: classSelector(process.ternaryOperator.capture),
      color: color(process.ternaryOperator.capture),
    },
  }
  const ternaryOtherwise = {
    scope: `:has(${ternaryOtherWiseSelector})`,
  }
  //#endregion

  const line = 'div>span'
  const root = `${linesSelector}>${line}`
  const payload = { opacitySelectors, selectorOnly, colorOnly }

  return {
    payload,
    process(_payload: typeof payload) {
      // FIXME: avoid mutations...
      for (let key in payload) {
        for (let key2 in payload[key]) {
          if (_payload[key][key2]) {
            payload[key][key2].color = _payload[key][key2].color
          }
        }
      }
      const { opacitySelectors, selectorOnly, colorOnly } = payload

      const opacityValues = Object.values(opacitySelectors)

      const selectorValues = [...opacityValues, ...Object.values(selectorOnly)]
      const toUnion = selectorValues.map((f) => f.selector).join(',')

      const toColorValue = [...opacityValues, ...Object.values(colorOnly)].map(
        (f) => `${root} ${f.selector} {
							color: ${f.color};
						}`
      )

      return `
			.view-lines {
				--r: 0;
			}
			.view-lines > div:hover,
			${root}>${selectorOnly.singleQuotes.selector} {
				--r: 1;
			}
			.view-lines:has(:is(${toUnion},${anyTagSelector}):hover),
			.view-lines:has(${line}:hover ${ternaryOtherWiseSelector}) {
				--r: .5;
			}
			${root} :is(${toUnion}),
			${root}:is(${ternaryOtherwise.scope}) {
				opacity: var(--r);
			}
			${toColorValue.join('\n')}
			`
    },
  }
}

function mergeColor<Table extends { [key: string]: { color?: string } }>(
  base: Table,
  override: Table
) {
  for (let key in base) {
    if (override[key].color) {
      base[key].color = override[key].color
    }
  }
  return base
}

//#region utils
function classSelector(element: HTMLElement) {
  return `.${Array.from(element.classList).join('.')}`
}
function lastChildSelector(element: HTMLElement) {
  return `${classSelector(element)}:last-child`
}
function setToSelector(...elements: HTMLElement[]) {
  const c = [...new Set(elements.map(classSelector))]
  if (c.length === 1) {
    return c[0]
  } else {
    return `:is(${c.join(', ')})`
  }
}
function SliceClassListC(siblings: Element[], slice: number) {
  const sliced = siblings.slice(slice).map((c) => Array.from(c.classList))
  return Object.assign(sliced, { okLength: sliced.length == slice * -1 })
}
function color(element: HTMLElement) {
  return element.computedStyleMap().get('color')?.toString()
}
function getProcess(span: HTMLElement, match: string) {
  return span
}
function toFlatClassList<T extends { join: (to?: string) => string }>(
  Array: T[]
) {
  return Array.reduce(
    (acc, val) => acc.concat(val.join('.')),
    <string[]>[]
  ) as string[] // FIXME: avoid casting
}
function Clone<T extends object>(o: T, m?: any): T {
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
//#endregion
