/* eslint-env browser */
;(function () {
  /**
   * State
   */
  let conciseSyntax = {
    init: false,
    interval: 0 as any as NodeJS.Timeout,
    observer: null as null | MutationObserver,
    extension: null as null | Extension,
  }
  // @ts-ignore
  conciseSyntax = { ...conciseSyntax, ...(window.conciseSyntax ?? {}) }

  const extensionId = 'kauderk.concise-syntax'
  const windowId = 'window' + extensionId

  type Extension = ReturnType<typeof domExtension>

  function activate(extension: Extension) {
    Extension = extension // alright...

    const isActive = findIsActive(extension.item)

    extension.item.classList.toggle('customHover', isActive)

    applyConciseSyntax(isActive, extension)

    function applyConciseSyntax(on: boolean, _extension: typeof extension) {
      const styles =
        document.getElementById(windowId) ?? document.createElement('style')
      styles.id = windowId
      _extension.icon.style.fontWeight = on ? 'bold' : 'normal'
      const title = 'Concise Syntax'
      _extension.item.title = on ? `${title}: enabled` : `${title}: disabled`

      styles.innerHTML = on
        ? `
				.customHover:hover {
					filter: drop-shadow(2px 4px 6px white);
				}
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
  }
  function inactive() {
    document.getElementById(windowId)?.remove()
    if (!Extension) return
    Extension.item.removeAttribute('title')
    Extension.icon.style.removeProperty('font-weight')
    Extension.item.classList.toggle('customHover', false)
  }

  function domExtension() {
    const statusBar = document.querySelector('.right-items') as HTMLElement
    const item = statusBar?.querySelector(
      `[id="${extensionId}"]`
    ) as HTMLElement
    const icon = item?.querySelector('.codicon') as HTMLElement
    //TODO: avoid casting
    return { icon, item, statusBar }
  }

  //#region Lifecycle
  conciseSyntax.observer?.disconnect()
  let Extension = conciseSyntax.extension

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type !== 'childList') {
        return
      }
      mutation.addedNodes.forEach((node: any) => {
        if (node.id === extensionId) {
          activate(domExtension())
        }
      })
      mutation.removedNodes.forEach((node: any) => {
        if (node.matches?.('.right-items.items-container')) {
          reload()
        } else if (node.id === extensionId && Extension) {
          inactive()
        }
      })
    })
  })
  conciseSyntax.observer = observer

  let wasActive: boolean | undefined = undefined
  const findIsActive = (target: any) =>
    !(target as any).getAttribute('aria-label').includes('inactive')
  const attributeObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (
        mutation.type !== 'attributes' ||
        mutation.attributeName !== 'aria-label'
      )
        return

      const isActive = findIsActive(mutation.target)
      if (wasActive === isActive) return
      wasActive = isActive

      if (isActive) {
        activate(domExtension())
      } else {
        inactive()
      }
    })
  })

  function patch() {
    const dom = domExtension()
    if (!document.contains(dom.statusBar?.parentNode) || conciseSyntax.init)
      return

    if (dom.icon) {
      conciseSyntax.init = true
      clearInterval(conciseSyntax.interval)

      // FIXME: the MutationObserver stopped working after multiple debugger sessions
      // I know this is the case because the same thing happened years ago but with a chrome browser
      // after clearing the cache it worked again, I guess I have to reinstall vscode * sigh *
      // observer.observe(dom.statusBar.parentNode!, { childList: true })
      attributeObserver.observe(dom.item, { attributes: true })
      activate(dom)
    }
  }
  function reload() {
    observer.disconnect()
    conciseSyntax.init = false
    clearInterval(conciseSyntax.interval)
    conciseSyntax.interval = setInterval(patch, 5000)
  }
  reload()
  //#endregion
})()
