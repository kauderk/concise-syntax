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
export function regexToDomToCss() {
  const lineEditor = document.querySelector(linesSelector) as HTMLElement
  if (!lineEditor) {
    let css = assembleCss(editorFlags.jsx)
    if (!css) {
      toastConsole.warn('Failed to load concise cached syntax styles')
      return ''
    }
    console.warn('Fail to find Editor with selector: ', linesSelector)
    return css
  }

  const jsxEditor = jsx_parseStyles(lineEditor)

  let css = assembleCss(jsxEditor)
  if (!css) {
    css = assembleCss(editorFlags.jsx)
    if (!css) {
      toastConsole.warn('Fail to load concise syntax styles even with cache')
      return ''
    }
  }
  Object.assign(editorFlags.jsx.flags, jsxEditor.flags)
  Object.assign(editorFlags.jsx.customFlags, jsxEditor.customFlags)
  return css
}

function jsx_parseStyles(lineEditor: HTMLElement) {
  const flags = {
    jsxTag: null as any,
    jsxTernaryBrace: null as any,
    jsxTernaryOtherwise: null as any,
    vsCodeHiddenTokens: null as any,
    beginQuote: null as any,
    endQuote: null as any,
  }
  const customFlags = {
    singleQuotes: null as string | null,
  }
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
      const closing = SliceClassList(line, -7)
      if (!closing.okLength) continue
      // prettier-ignore
      const [blank0, closeBrace, blank, colon, blank2, nullIsh,closeBracket] = toFlatClassList(closing)
      const selector = `.${blank0}+.${closeBrace}+.${blank}+.${colon}+.${blank2}+.${nullIsh}+.${closeBracket}:last-child`

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

    if (
      anyFlag &&
      // TODO: figure out how to pass empty flags
      Object.values(flags).every((f) => !!f) &&
      Object.values(customFlags).every((f) => !!f)
    ) {
      break parser
    }
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
