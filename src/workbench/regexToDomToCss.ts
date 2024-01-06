import { linesSelector, customCSS } from './keys'
import { toastConsole } from './shared'

const editorFlags = {
  jsx: {
    flags: {
      jsxTag: null as FlagOr,
      jsxTernaryBrace: null as FlagOr,
      jsxTernaryOtherwise: null as FlagOr,
      vsCodeHiddenTokens: null as FlagOr,
      beginQuote: null as FlagOr,
      endQuote: null as FlagOr,
    },
    customFlags: {
      singleQuotes: null as string | null,
    },
  },
}

// TODO: add cache
// TODO: call lazy when opening the first jsx file
export function TryRegexToDomToCss(lineEditor: HTMLElement) {
  // TODO: give the option to reset parts of the cache
  editorFlags.jsx = jsx_parseStyles(lineEditor, editorFlags.jsx)
  // @ts-ignore
  window.editorFlags = editorFlags
  return assembleCss(editorFlags.jsx)
}

function jsx_parseStyles(lineEditor: HTMLElement, editorFlag: EditorFlags) {
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
        hide: `:has(:nth-last-child(3).${angleBracket}+.${tag}+.${angleBracket}) :nth-last-child(2)`,
        hover: `.${angleBracket}+.${tag}`,
      }
      flags.vsCodeHiddenTokens = {
        // this is the most common case, you could derive it from other flags
        hide: `>.${angleBracket}`,
        hover: `.${angleBracket}`,
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
          customFlags.singleQuotes = `.${beginQuote}:has(+.${endQuote}), .${beginQuote}+.${endQuote} {
							color: gray;
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
function assembleCss(editorFlags: EditorFlags) {
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
