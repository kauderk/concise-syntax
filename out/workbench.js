"use strict";
/* eslint-env browser */
;
(function () {
    /**
     * State
     */
    let conciseSyntax = {
        init: false,
        interval: 0,
        observer: null,
        extension: null,
    };
    // @ts-ignore
    conciseSyntax = { ...conciseSyntax, ...(window.conciseSyntax ?? {}) };
    const extensionId = 'kauderk.concise-syntax';
    const windowId = 'window' + extensionId;
    // Should this manage its previous instance?
    function active(extension) {
        const isTrue = () => localStorage.getItem(windowId) === 'true';
        applyConciseSyntax(isTrue(), extension);
        extension.item.onclick = () => {
            const on = !isTrue();
            applyConciseSyntax(on, extension);
            localStorage.setItem(windowId, String(on));
        };
        function applyConciseSyntax(on, _extension) {
            const styles = document.getElementById(windowId) ?? document.createElement('style');
            styles.id = windowId;
            _extension.icon.style.fontWeight = on ? 'bold' : 'normal';
            const title = 'Concise Syntax';
            _extension.item.title = on ? `${title}: enabled` : `${title}: disabled`;
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
                : '';
            document.body.appendChild(styles);
        }
    }
    function inactive(extension) {
        extension.item.onclick = null;
        extension.item.removeAttribute('title');
        extension.icon.style.removeProperty('font-weight');
    }
    function domExtension() {
        const statusBar = document.querySelector('.right-items');
        const item = statusBar?.querySelector(`[id="${extensionId}"]`);
        const icon = item?.querySelector('.codicon');
        //TODO: avoid casting
        return { icon, item, statusBar };
    }
    //#region Lifecycle
    conciseSyntax.observer?.disconnect();
    let Extension = conciseSyntax.extension;
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type !== 'childList') {
                return;
            }
            mutation.addedNodes.forEach((node) => {
                if (node.id === extensionId) {
                    active((Extension = domExtension()));
                    // vscode doesn't provide a hover function when the item is missing a command
                    Extension.item.classList.toggle('customHover', true);
                }
            });
            mutation.removedNodes.forEach((node) => {
                if (node.matches?.('.right-items.items-container')) {
                    reload();
                }
                else if (node.id === extensionId && Extension) {
                    inactive(Extension);
                    Extension.item.classList.toggle('customHover', false);
                }
            });
        });
    });
    conciseSyntax.observer = observer;
    function patch() {
        const dom = domExtension();
        if (!document.contains(dom.statusBar?.parentNode) || conciseSyntax.init)
            return;
        if (dom.icon) {
            conciseSyntax.init = true;
            clearInterval(conciseSyntax.interval);
            // FIXME: the MutationObserver stopped working after multiple debugger sessions
            // I know this is the case because the same thing happened years ago but with a chrome browser
            // after clearing the cache it worked again, I guess I have to reinstall vscode * sigh *
            // observer.observe(dom.statusBar.parentNode!, { childList: true })
            dom.item.classList.toggle('customHover', true);
            active((Extension = dom));
        }
    }
    function reload() {
        observer.disconnect();
        conciseSyntax.init = false;
        clearInterval(conciseSyntax.interval);
        conciseSyntax.interval = setInterval(patch, 5000);
    }
    reload();
    //#endregion
})();
//# sourceMappingURL=workbench.js.map