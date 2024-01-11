import { linesSelector, customCSS, extensionId } from './keys'
import { toastConsole } from './shared'

export const editorFlags = {
  jsx: {
    flags: {
      jsxTag: null as FlagOr,
      jsxTagUpperCase: null as FlagOr,
      jsxTernaryBrace: null as FlagOr,
      jsxTernaryOtherwise: null as FlagOr,
      vsCodeHiddenTokens: null as FlagOr,
      separator: null as FlagOr,
      beginQuote: null as FlagOr,
      endQuote: null as FlagOr,
    },
    customFlags: {
      singleQuotes: null as string | null,
      jsxTernaryOtherwiseHover: null as string | null,
    },
  },
}

type Condition = (payload: {
  siblings: HTMLSpanElement[]
  current: HTMLSpanElement
}) => HTMLElement | undefined
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

  anySpace: { match: /^\s+$/ },

  colon: { match: /:/ },
  nul: { match: /null/ },
  // undefine: { match: /undefined/ },
} satisfies SymbolClass

const lastSymbolTable = {
  closeTag: {
    match: /(>|\/>)$/,
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
  indentation: {
    match: /}$/, // FIXME: this is bet that if it is closing brace, then there must be indentation
    capture({ siblings }) {
      return siblings[0]
    },
  },
} satisfies SymbolClass

const bracketSymbolTable = {
  brackets: { match: /{/ },
  braces: { match: /\(/ },
} satisfies SymbolClass

const multipleSymbolTale = {
  quotes: {
    match: /"|'|`/,
    empty({ siblings, current }) {
      const empty = current?.textContent?.match(/^(""|''|``)$/)
      if (empty?.[0]) {
        return [current]
      }
    },
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

function parseSymbolColors(lineEditor: HTMLElement) {
  debugger

  const lines = Array.from(lineEditor.querySelectorAll('div>span'))

  let table: any = structuredClone(symbolTable)
  let lastTable: any = structuredClone(lastSymbolTable)
  let bracketTable: any = structuredClone(bracketSymbolTable)
  let multipleTable: any = structuredClone(multipleSymbolTale)
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
            output[key][conditionKey] = getColor(evaluation, match[0])
            delete table[key][conditionKey]
          }
        }
        if (Object.keys(table[key]).length === 0) {
          output[key].capture ??= getColor(current, match[0])
          delete table[key]
        } else {
          table[key].match = regex
        }
      }

      for (let key in bracketTable) {
        const regex = bracketTable[key].match
        const match = content?.match(regex)
        if (!match) continue

        output[key] ??= []
        if (output[key].every((m: any) => m.className !== current.className)) {
          output[key].push(getColor(current, match[0]))
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
            output[key][conditionKey] = evaluations.map(getColor)
            delete multipleTable[key][conditionKey]
          }
        }
        if (Object.keys(multipleTable[key]).length === 0) {
          output[key].capture ??= getColor(current, match[0])
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
        output[key].capture = getColor(evaluation, match[0])
        delete lastTable[key]
      }
    }
  }
  console.log(output)
}
function getColor(span: HTMLElement, match: string) {
  const color = span.computedStyleMap().get('color')?.toString()
  return { color, span, match, className: span.className }
}

export function jsx_parseStyles(
  lineEditor: HTMLElement,
  _editorFlag: EditorFlags
) {
  const editorFlag = structuredClone(_editorFlag)
  const flags = editorFlag.flags
  const customFlags = editorFlag.customFlags

  if (isDone()) return editorFlag

  const lines = Array.from(lineEditor.querySelectorAll('div>span'))

  parser: for (const line of lines) {
    const text = line.textContent
    if (!text) continue
    let anyFlag = false

    if (
      !flags.jsxTag &&
      text.match(/.+(<\/(?<jsxTag>.*)?>)$/)?.groups?.jsxTag
    ) {
      const closing = SliceClassList(line, -3)
      if (!closing.okLength) continue
      const [angleBracket, tag, right] = closing.flat()
      if (angleBracket !== right) continue

      flags.jsxTag = {
        // find the last </tag> and hide it "tag" which is the second to last child
        hide: `:has([class="${angleBracket}"]:nth-last-child(3)+.${tag}+.${angleBracket}) :nth-last-child(2)`,
        hover: `.${angleBracket}+.${tag}`,
      }
      flags.vsCodeHiddenTokens = {
        // this is the most common case, you could derive it from other flags
        hide: `>.${angleBracket}`,
        hover: `.${angleBracket}`,
      }

      anyFlag = true
    } else if (
      // TODO: better abstraction to implement overloads
      !flags.jsxTagUpperCase &&
      text.match(/.+(<\/(?<jsxTagUpperCase>[A-Z].*)?>)$/)?.groups
        ?.jsxTagUpperCase
    ) {
      const closing = SliceClassList(line, -3)
      if (!closing.okLength) continue
      const [angleBracket, tag, right] = closing.flat()
      if (angleBracket !== right) continue

      flags.jsxTagUpperCase = {
        // find the last </Tag> and hide it "tag" which is the second to last child
        hide: `:has([class="${angleBracket}"]:nth-last-child(3)+.${tag}+.${angleBracket}) :nth-last-child(2)`,
        hover: `.${angleBracket}+.${tag}`,
      }

      anyFlag = true
    } else if (
      // TODO: find out what else could be affected through experimentation
      !flags.separator &&
      text.match(/(?<separator>,$)/)?.groups?.separator
    ) {
      const closing = SliceClassList(line, -1)
      if (!closing.okLength) continue
      const [terminator] = closing.flat()

      flags.separator = {
        // find the last , and hide it
        hide: `>.${terminator}:last-child`,
        hover: `.${terminator}`,
      }

      anyFlag = true
    } else if (
      !flags.jsxTernaryBrace &&
      text.match(/(\{).+\?.+?(?<jsxTernaryBrace>\()$/)?.groups?.jsxTernaryBrace
    ) {
      const closing = SliceClassList(line, -4)
      if (!closing.okLength) continue
      // prettier-ignore
      const [blank, questionMark, blank2, openBrace] = toFlatClassList(closing)
      const selector = `.${blank}+.${questionMark}+.${blank}+.${openBrace}:last-child`

      flags.jsxTernaryBrace = {
        // find the last open brace in " ? ("
        hide: `:has(${selector}) :last-child`,
        hover: selector,
      }

      anyFlag = true
    } else if (
      !flags.jsxTernaryOtherwise &&
      text.match(/(?<jsxTernaryOtherwise>\).+?:.+\})/)?.groups
        ?.jsxTernaryOtherwise
    ) {
      let selector: string
      const closing7 = SliceClassList(line, -7)
      if (closing7.okLength) {
        // prettier-ignore
        const [blank0, closeBrace, blank, colon, blank2, nullIsh,closeBracket] = toFlatClassList(closing7)
        selector = `.${blank0}+.${closeBrace}+.${blank}+.${colon}+.${blank2}+.${nullIsh}+.${closeBracket}:last-child`
      } else {
        // FIXME: be more resilient to other cases
        const closing5 = SliceClassList(line, -5)
        if (!closing5.okLength) continue
        // prettier-ignore
        const [blank0, closeBrace,               colonBlank, nullIsh, closeBracket] = toFlatClassList(closing5)
        selector = `.${blank0}+.${closeBrace}+.${colonBlank}+.${nullIsh}+.${closeBracket}:last-child`
      }

      flags.jsxTernaryOtherwise = {
        // find ") : null}" then hide it all
        hide: `:has(${selector}) *`,
        hover: selector,
      }
      // FIXME: find a better way to do this
      customFlags.jsxTernaryOtherwiseHover = `.view-lines:has(.view-line span:hover ${selector}) {
				--r: red;
			}`

      anyFlag = true
    } else if (
      !customFlags.singleQuotes &&
      text.match(/(?<singleQuotes>""|''|``)/)?.groups?.singleQuotes
    ) {
      const array = Array.from(line.children)
      const quote = /"|'|`/

      singleQuotes: for (let i = 0; i < array.length; i++) {
        const child = array[i]

        const current = child.textContent?.match(quote)
        const next = array[i + 1]?.textContent?.match(quote)
        if (current?.[0].length == 1 && current[0] === next?.[0]) {
          const beginQuote = Array.from(child.classList).join('.')
          const endQuote = Array.from(array[i + 1].classList).join('.') // wow, why isn't typescript freaking out?

          // Find "" or '' or `` and show them
          customFlags.singleQuotes = `[class="${beginQuote}"]:has(+.${endQuote}), [class="${beginQuote}"]+.${endQuote} {
							--r: gray;
						}`
          flags.beginQuote = {
            // this is the most common case, you could derive it from other flags
            hide: `>.${beginQuote}`,
            hover: `.${beginQuote}`,
          }
          flags.endQuote = {
            // this is the most common case, you could derive it from other flags
            hide: `>.${endQuote}`,
            hover: `.${endQuote}`,
          }

          anyFlag = true
          break singleQuotes
        }
      }
    }

    if (anyFlag && isDone()) {
      break parser
    }
  }

  function isDone() {
    // TODO: figure out how to pass empty flags
    return (
      Object.values(flags).every((f) => !!f) &&
      Object.values(customFlags).every((f) => !!f)
    )
  }

  return { flags, customFlags }
}

type EditorFlags = (typeof editorFlags)[keyof typeof editorFlags]
export function assembleCss(editorFlags: EditorFlags) {
  const root = `${linesSelector}>div>span`
  const { flags, customFlags } = editorFlags

  // you know the concise syntax hover feature will work because you found the common case
  const validFlags = Object.values(flags).filter(
    (f): f is Flag => !!(f?.hide && f.hover)
  )
  if (!validFlags.length || !flags.vsCodeHiddenTokens?.hover) {
    console.warn('Fail to find common case')
    return
  }

  const toHover = validFlags.map((f) => f.hover).join(',')
  const toHidden = validFlags.map((f) => root + f.hide).join(',')
  const toCustom = Object.values(customFlags)
    .filter((f) => !!f)
    .join('\n')

  return `
		.view-lines {
			--r: transparent;
		}
		.view-lines > div:hover {
			--r: yellow;
		}
		.view-lines:has(:is(${toHover}):hover) {
			--r: red;
		}
		${toHidden} {
			color: var(--r);
		}
		${toCustom}
		`
}

type Flag = {
  hide: string
  hover: string
}
type FlagOr = null | Flag

function toFlatClassList<T extends { join: (to?: string) => string }>(
  Array: T[]
) {
  return Array.reduce(
    (acc, val) => acc.concat(val.join('.')),
    <string[]>[]
  ) as string[] // FIXME: avoid casting
}

function SliceClassList(line: Element, slice: number) {
  const sliced = Array.from(line.children)
    .slice(slice)
    .map((c) => Array.from(c.classList))
  return Object.assign(sliced, { okLength: sliced.length == slice * -1 })
}

export function mergeDeep(...objects: any[]) {
  const isObject = (obj: any) => obj && typeof obj === 'object'

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key]
      const oVal = obj[key]

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal)
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal)
      } else {
        prev[key] = oVal
      }
    })

    return prev
  }, {})
}
