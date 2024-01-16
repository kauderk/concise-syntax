import { type textMateRulesNames } from 'src/extension/settings'
import { linesSelector } from './keys'
import { Clone } from 'src/shared/clone'

//#region tables
type Condition = (payload: {
  siblings: HTMLSpanElement[]
  current: HTMLSpanElement
}) => HTMLElement | undefined // FIXME: handle multiple return types
type SymbolClass<C = Condition> = {
  [key in textMateRulesNames]?:
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
  'tag.begin': {
    match: /<|<\//,
    entity({ siblings, current }) {
      const tag = siblings[siblings.indexOf(current) + 1]
      if (tag.textContent?.toLowerCase() === tag.textContent) {
        return tag
      }
    },
    component({ siblings, current }) {
      const tag = siblings[siblings.indexOf(current) + 1]
      if (tag.textContent?.match(/^[A-Z]/)) {
        return tag
      }
    },
  },
  text: { match: /Hello\sConcise\sSyntax!/ },
  comma: {
    match: /,/,
    capture({ siblings, current }) {
      const next = siblings[siblings.indexOf(current) + 1]
      if (next) {
        return current
      }
    },
  },
  ternary: { match: /\?/ },
} satisfies SymbolClass

const lastSymbolTable = {
  'tag.end': {
    match: /(>|\/>)$/,
    capture({ siblings }) {
      return siblings[siblings.length - 1]
    },
  },
  terminator: {
    match: /;$/,
    capture({ siblings }) {
      return siblings[siblings.length - 1]
    },
  },
  lastComma: {
    match: /,$/,
    capture({ siblings }) {
      return siblings[siblings.length - 1]
    },
  },
  'bracket.begin': {
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
 * FIXME: the types are overloaded but correct, fix them
 */
export function parseSymbolColors(lineEditor: HTMLElement) {
  //#region parser
  const lineSelector = 'div>span'
  const lines = Array.from(lineEditor.querySelectorAll(lineSelector))

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
    process['tag.begin'].capture,
    process['tag.end'].capture
  )
  const anyTagSelector = `${angleBracketSelector}+${setToSelector(
    process['tag.begin'].entity,
    process['tag.begin'].component
  )}`
  const entityTagSelector = `${angleBracketSelector}+${classSelector(
    process['tag.begin'].entity
  )}`
  const componentTagSelector = `${angleBracketSelector}+${classSelector(
    process['tag.begin'].component
  )}`

  const bracketBeginSelector =
    '.' + process['bracket.begin'].capture.className.split(' ').shift()

  const stringEl = process.quotes.string[0]
  const beginQuote = stringEl.className
  const endQuoteEl = process.quotes.string[2] ?? stringEl
  const endQuote = endQuoteEl.className

  // why is this so bloated?
  const ternaryOtherwiseSelector: string =
    Array.from(process.ternaryOtherwise.capture as HTMLElement[])
      .map((c) => Array.from(c.classList))
      .reduce((acc, val) => acc.concat(val.join('.')), [])
      .reduce((acc, val) => acc + '.' + val + '+', '')
      .replaceAll(
        /\.bracket-highlighting-\d/g,
        '[class*="bracket-highlighting"]'
      )
      .slice(0, -1) + ':last-child'
  //#endregion

  //#region map pre selectors to selectors with colors

  const opacitySelectors = {
    'tag.begin': {
      selector: angleBracketSelector,
      color: color(process['tag.begin'].capture),
    },
    lastComma: {
      selector: lastChildSelector(process.lastComma.capture),
      color: color(process.lastComma.capture),
    },
    terminator: {
      selector: lastChildSelector(process.terminator.capture),
      color: color(process.terminator.capture),
    },
    'string.begin': {
      selector: '.' + beginQuote,
      color: color(stringEl),
    },
    'string.end': {
      selector: '.' + endQuote,
      color: color(endQuoteEl),
    },
  } satisfies PartialColorSelector

  const colorsSelectorOnly = {
    'tag.entity': {
      selector: `${entityTagSelector}`,
      color: color(process['tag.begin'].entity),
    },
    'tag.component': {
      selector: `${componentTagSelector}`,
      color: color(process['tag.begin'].component),
    },
    comma: {
      selector: classSelector(process.comma.capture),
      color: color(process.comma.capture),
    },
    ternary: {
      selector: classSelector(process.ternary.capture),
      color: color(process.ternary.capture),
    },
  } satisfies PartialColorSelector
  type PartialColorSelector = Partial<
    Record<textMateRulesNames, { selector: string; color: string | undefined }>
  >

  const colorsOnly = {
    'tag.end': {
      color: color(process['tag.end'].capture),
    },
    text: {
      color: color(process.text.capture),
    },
    'bracket.begin': {
      color: color(process['bracket.begin'].capture),
    },
    'bracket.end': {
      color: color(process['bracket.begin'].capture),
    },
  } satisfies Partial<Record<textMateRulesNames, { color: string | undefined }>>

  const colorsTable = {
    ...opacitySelectors,
    ...colorsSelectorOnly,
    ...colorsOnly,
  }
  // Test you are not missing any keys
  colorsTable['' as textMateRulesNames]

  const selectorOnly = {
    closingTagEntity: {
      selector: `${entityTagSelector}:has(+${angleBracketSelector}:last-child)`,
    },
    closingTagComponent: {
      selector: `${componentTagSelector}:has(+${angleBracketSelector}:last-child)`,
    },
    emptyQuote: {
      selector: `:is([class="${beginQuote}"]:has(+.${endQuote}), [class="${beginQuote}"]+.${endQuote})`,
    },
    bracketBegin: {
      selector: bracketBeginSelector,
    },
    ternaryClosingBrace: {
      selector: `${bracketBeginSelector}~${classSelector(
        process.ternary.capture
      )}~[class*="bracket-highlighting-"]:last-child`,
    },
  }

  const ternaryOtherwise = {
    scope: `:has(${ternaryOtherwiseSelector})`,
  }
  //#endregion

  const root = `${linesSelector}>${lineSelector}`
  const payload = {
    opacitySelectors,
    selectorOnly,
    colorSelectorOnly: colorsSelectorOnly,
  }

  // FIXME: crash if any color or selector are undefined
  function checkMissingProps(obj: object) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object') {
        checkMissingProps(value)
      } else if (!value) {
        // prettier-ignore
        throw new Error(`Missing property ${key} and possibly more...`)
      }
    }
  }
  checkMissingProps({
    ...colorsTable,
    ...selectorOnly,
    ...ternaryOtherwise,
  })

  return {
    colorsTable,
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
      const { opacitySelectors, selectorOnly, colorSelectorOnly } = payload

      const opacityValues = Object.values(opacitySelectors)

      const selectorValues = [...opacityValues, ...Object.values(selectorOnly)]
      const toUnion = selectorValues.map((f) => f.selector).join(',')

      return `
			.view-lines {
				--r: 0;
			}
			.view-lines > div:hover,
			${root}>${selectorOnly.emptyQuote.selector} {
				--r: 1;
			}
			.view-lines:has(:is(${toUnion},${anyTagSelector}):hover),
			.view-lines:has(${lineSelector}:hover ${ternaryOtherwiseSelector}) {
				--r: .5;
			}
			${root} :is(${toUnion}),
			${root}:is(${ternaryOtherwise.scope}) {
				opacity: var(--r);
			}
			`
    },
  }
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
function color(element: HTMLElement) {
  return element.computedStyleMap().get('color')?.toString()
}
function getProcess(span: HTMLElement, match: string) {
  return span
}

//#endregion
