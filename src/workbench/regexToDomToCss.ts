import { linesSelector, customCSS } from './keys'

export function regexToDomToCss() {
  const lineEditor = document.querySelector(linesSelector)
  if (!lineEditor) {
    console.warn('Fail to find Editor with selector:', linesSelector)
    return ''
  }
  type Flag = {
    hide: string
    hover: string
  }
  type Flags = null | Flag
  const flags = {
    jsxTag: null as Flags,
    jsxTernaryBrace: null as Flags,
    jsxTernaryOtherwise: null as Flags,
    vsCodeHiddenTokens: null as Flags,
    beginQuote: null as Flags,
    endQuote: null as Flags,
  }
  const customFlags = {
    singleQuotes: null as string | null,
  }

  const root = `${linesSelector}>div>span`
  const lines = Array.from(lineEditor.querySelectorAll('div>span'))

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

  parser: for (const line of lines) {
    const text = line.textContent
    if (!text) continue
    let anyFlag = false

    if (text.match('.+(</(?<jsxTag>.*)?>)$')?.groups?.jsxTag) {
      if (flags.jsxTag || flags.vsCodeHiddenTokens) continue

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
      text.match(/(\{).+\?.+?(?<ternaryBrace>\()$/)?.groups?.ternaryBrace
    ) {
      if (flags.jsxTernaryBrace) continue

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
      text.match(/(?<ternaryOtherwise>\).+?:.+\})/)?.groups?.ternaryOtherwise
    ) {
      if (flags.jsxTernaryOtherwise) continue

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
    } else if (text.match(/(?<singleQuotes>""|''|``)/)?.groups?.singleQuotes) {
      // FIXME: what if there are no empty quotes/strings?
      if (customFlags.singleQuotes) continue

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
      Object.values(flags).every((f) => !!f) &&
      Object.values(customFlags).every((f) => !!f)
    ) {
      break parser
    }
  }
  // you know the concise syntax hover feature will work because you found the common case
  const validFlags = Object.values(flags).filter(
    (f) => f?.hide && f.hover
  ) as Flag[] // FIXME: avoid casting
  if (validFlags.length && flags.vsCodeHiddenTokens?.hover) {
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
      .replace(/\r|\n/g, '')
      .replaceAll(/\t+/g, '\n')
  }
  // FIXME: honestly, the user should get a warning: the extension can't find the common case
  return ''
}
