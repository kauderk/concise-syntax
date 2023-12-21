"use strict";
/* eslint-env browser */
;
(function () {
    let conciseSyntax = {
        init: false,
        interval: 0,
        dispose: null,
        extension: null,
    };
    // @ts-ignore
    window.conciseSyntax ??= conciseSyntax;
    const extensionId = 'kauderk.concise-syntax';
    const windowId = 'window.' + extensionId;
    // exploit the fact that vscode renders data to the dom, could be any other attribute
    const bridgeBetweenVscodeExtension = 'aria-label';
    const customCSS = `
	.view-lines {
		--r: transparent;
	}
	.view-lines:has(.dummy:hover) {
		--r: red;
	}
	.dummy {
		color: var(--r);
	}
	`;
    function regexToDomToCss() {
        const languages = ['typescriptreact', 'javascriptreact'];
        const idSelector = '[data-mode-id="typescriptreact"]';
        const editor = document
            .querySelector(idSelector)
            ?.querySelector('.view-lines.monaco-mouse-cursor-text');
        if (!editor) {
            console.log('no editor');
            return customCSS;
        }
        const flags = {
            jsxTag: null,
            jsxTernaryBrace: null,
            jsxTernaryOtherwise: null,
            vsCodeHiddenTokens: null,
        };
        const root = `${idSelector} .view-lines>div>span`;
        const lines = Array.from(editor.querySelectorAll('div>span'));
        function toFlatClassList(Array) {
            return Array.reduce((acc, val) => acc.concat(val.join('.')), []); // FIXME: avoid casting
        }
        function SliceClassList(line, slice) {
            const sliced = Array.from(line.children)
                .slice(slice)
                .map((c) => Array.from(c.classList));
            return Object.assign(sliced, { okLength: sliced.length == slice * -1 });
        }
        debugger;
        parser: for (const line of lines) {
            const text = line.textContent;
            if (!text)
                continue;
            let anyFlag = false;
            if (text.match('.+(</(?<jsxTag>.*)?>)$')?.groups?.jsxTag) {
                if (flags.jsxTag || flags.vsCodeHiddenTokens)
                    continue;
                const closing = SliceClassList(line, -3);
                if (!closing.okLength)
                    continue;
                const [angleBracket, tag, right] = closing.flat();
                if (angleBracket !== right)
                    continue;
                flags.jsxTag = {
                    // find the last </tag> and hide it "tag" which is the second to last child
                    hide: `:has(:nth-last-child(3).${angleBracket}+.${tag}+.${angleBracket}) :nth-last-child(2)`,
                    hover: `.${angleBracket}+.${tag}`,
                };
                flags.vsCodeHiddenTokens = {
                    // this is the most common case, you could derive it from other flags
                    hide: `>.${angleBracket}`,
                    hover: `.${angleBracket}`,
                };
                anyFlag = true;
            }
            else if (text.match(/(\{).+\?.+?(?<ternaryBrace>\()$/)?.groups?.ternaryBrace) {
                if (flags.jsxTernaryBrace)
                    continue;
                const closing = SliceClassList(line, -4);
                if (!closing.okLength)
                    continue;
                // prettier-ignore
                const [blank, questionMark, blank2, openBrace] = toFlatClassList(closing);
                const selector = `.${blank}+.${questionMark}+.${blank}+.${openBrace}:last-child`;
                flags.jsxTernaryBrace = {
                    // find the last open brace in " ? ("
                    hide: `:has(${selector}) :last-child`,
                    hover: selector,
                };
                anyFlag = true;
            }
            else if (text.match(/(?<ternaryOtherwise>\).+?:.+\})/)?.groups?.ternaryOtherwise) {
                if (flags.jsxTernaryOtherwise)
                    continue;
                const closing = SliceClassList(line, -7);
                if (!closing.okLength)
                    continue;
                // prettier-ignore
                const [blank0, closeBrace, blank, colon, blank2, nullIsh, closeBracket] = toFlatClassList(closing);
                const selector = `.${blank0}+.${closeBrace}+.${blank}+.${colon}+.${blank2}+.${nullIsh}+.${closeBracket}:last-child`;
                flags.jsxTernaryOtherwise = {
                    // find the last open brace in " ? ("
                    hide: `:has(${selector})`,
                    hover: selector,
                };
                anyFlag = true;
            }
            if (anyFlag && Object.values(flags).every((f) => !!f)) {
                break parser;
            }
        }
        // you know the concise syntax hover feature will work because you found the common case
        const validFlags = Object.values(flags).filter((f) => f?.hide && f.hover); // FIXME: avoid casting
        if (validFlags.length && flags.vsCodeHiddenTokens?.hover) {
            const toHover = validFlags.map((f) => f.hover).join(',');
            const toHidden = validFlags.map((f) => root + f.hide).join(',');
            return `
			.view-lines {
				--r: transparent;
			}
			.view-lines:has(:is(${toHover}):hover) {
				--r: red;
			}
			${toHidden} {
				color: var(--r);
			}
			`;
        }
        // FIXME: honestly, the user should get a warning: the extension can't find the common case
        return customCSS;
    }
    /**
     * Apply custom logic when the vscode extension changes the bridge attribute
     */
    function activate(extension) {
        Extension = extension; // alright...
        const isActive = tryParseData(extension.item);
        applyConciseSyntax(isActive, extension);
        function applyConciseSyntax(on, _extension) {
            const styles = document.getElementById(windowId) ?? document.createElement('style');
            styles.id = windowId;
            _extension.icon.style.fontWeight = on ? 'bold' : 'normal';
            const title = 'Concise Syntax';
            _extension.item.title = on ? `${title}: active` : `${title}: inactive`;
            styles.innerText = on ? regexToDomToCss() : '';
            document.body.appendChild(styles);
        }
    }
    /**
     * Clean up
     */
    function inactive() {
        document.getElementById(windowId)?.remove();
        if (!Extension)
            return;
        Extension.item.removeAttribute('title');
        Extension.icon.style.removeProperty('font-weight');
    }
    let Extension = conciseSyntax.extension;
    let disposeObserver = conciseSyntax.dispose ?? (() => { });
    let previousData = undefined;
    const tryParseData = (target) => 
    // You could pass stringified data
    !target.getAttribute?.(bridgeBetweenVscodeExtension)?.includes('inactive');
    const attributeObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const newData = tryParseData(mutation.target);
            if (previousData === newData)
                return;
            previousData = newData;
            if (newData) {
                activate(domExtension());
            }
            else {
                inactive();
            }
        }
    });
    function domExtension() {
        const statusBar = document.querySelector('.right-items');
        const item = statusBar?.querySelector(`[id="${extensionId}"]`);
        const icon = item?.querySelector('.codicon');
        return { icon, item, statusBar };
    }
    let anyUsage = false;
    function patch() {
        const dom = domExtension();
        if (!document.contains(dom.statusBar?.parentNode) ||
            !dom.icon ||
            conciseSyntax.init)
            return;
        anyUsage = true;
        conciseSyntax.init = true;
        clearInterval(conciseSyntax.interval);
        disposeObserver = watchForRemoval(dom.item, reload);
        attributeObserver.observe(dom.item, {
            attributes: true,
            attributeFilter: [bridgeBetweenVscodeExtension],
        });
        activate(dom);
    }
    function dispose() {
        disposeObserver();
        attributeObserver.disconnect();
        conciseSyntax.init = false;
        clearInterval(conciseSyntax.interval);
    }
    function reload() {
        dispose();
        conciseSyntax.interval = setInterval(patch, 5000);
    }
    // TODO: test if this is more "performant" or just mental gymnastics
    function watchForRemoval(targetElement, callback) {
        let done = false;
        let stack = [];
        const rootObserver = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if (done ||
                    !stack.includes(mutation.target) ||
                    !mutation.removedNodes.length)
                    return;
                const nodes = Array.from(mutation.removedNodes);
                // console.log(mutation.target)
                // direct match
                if (nodes.indexOf(targetElement) > -1 ||
                    // parent match
                    nodes.some((parent) => parent.contains(targetElement))) {
                    dispose();
                    callback();
                    return;
                }
            });
        });
        function REC_ObserverAncestors(element) {
            if (!element.parentElement || element.parentElement === document.body) {
                return;
            }
            stack.push(element.parentElement);
            rootObserver.observe(element.parentElement, { childList: true });
            REC_ObserverAncestors(element.parentElement);
        }
        // Start observing ancestor hierarchy
        REC_ObserverAncestors(targetElement);
        function dispose() {
            done = true;
            stack = [];
            rootObserver.takeRecords();
            rootObserver.disconnect();
        }
        return dispose;
    }
    //#endregion
    reload();
    const exhaust = setTimeout(() => {
        if (!anyUsage) {
            clearInterval(conciseSyntax.interval);
        }
    }, 1000 * 60 * 2);
    conciseSyntax.dispose = () => {
        dispose();
        inactive();
    };
})();
/**
 * TODO: regexToDomToCss
 * toggle lookup.settings.json
 * hydrate window.styles when settings change
 */
//# sourceMappingURL=workbench.js.map