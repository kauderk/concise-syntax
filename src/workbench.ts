/* eslint-env browser */
;(function () {
  function patch() {
    const e1 = document.querySelector('.right-items')
    const e2 = document.querySelector(
      '.right-items .__CONCISE_SYNTAX_INDICATOR_CLS'
    )
    if (e1 && !e2) {
      let e = document.createElement('div')
      const id = 'vscode-concise-syntax'
      e.id = 'kauderk.' + id
      const title = 'Concise syntax'
      e.title = title
      e.className = 'statusbar-item right __CONCISE_SYNTAX_INDICATOR_CLS'
      const span = document.createElement('span')
      {
        const a = document.createElement('a')
        a.tabIndex = -1
        a.className = 'statusbar-item-label'
        {
          span.className = 'codicon codicon-symbol-keyword'
          a.appendChild(span)
        }
        e.appendChild(a)
      }
      e1.appendChild(e)

      const isTrue = () => localStorage.getItem(id) === 'true'
      function applyConciseSyntax(on: boolean) {
        const styles =
          document.getElementById(id) ?? document.createElement('style')
        styles.id = id
        span.style.fontWeight = on ? 'bold' : 'normal'
        e.title = on ? `${title}: enabled` : `${title}: disabled`

        styles.innerHTML = on
          ? `
				.view-lines {
					--r: transparent;
				}
				.view-lines:has(.mtk4:hover) {
					--r: red;
				}
				.mtk4 {
					color: var(--r);
				}
				`
          : ''
        document.body.appendChild(styles)
      }
      // FIXME: figure out why this runs twice sometimes
      applyConciseSyntax(isTrue())

      // Toggle
      e.onclick = () => {
        const on = !isTrue()
        applyConciseSyntax(on)
        localStorage.setItem(id, String(on))
      }

      // @ts-ignore
      if (!window.onloadConciseSyntaxIndicatorInterval) {
        // @ts-ignore
        window.onloadConciseSyntaxIndicatorInterval = true
        console.log('window vscode-concise-syntax is active!')
      }
    }
  }

  // @ts-ignore
  if (window.conciseSyntaxIndicatorInterval) {
    // @ts-ignore
    clearInterval(window.conciseSyntaxIndicatorInterval)
  }
  // @ts-ignore
  window.conciseSyntaxIndicatorInterval = setInterval(patch, 5000)
})()
