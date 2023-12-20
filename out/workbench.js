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
    const windowId = 'window' + extensionId;
    // exploit the fact that vscode renders data to the dom, could be any other attribute
    const bridgeBetweenVscodeExtension = 'aria-label';
    const customCSS = `
	.view-lines {
		--r: transparent;
	}
	.view-lines:has(.mtk4:hover) {
		--r: red;
	}
	.mtk4 {
		color: var(--r);
	}
	`;
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
            styles.innerHTML = on ? customCSS : '';
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
//# sourceMappingURL=workbench.js.map