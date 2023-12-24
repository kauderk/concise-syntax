(function(factory) {
  typeof ignoreDefine === "function" && ignoreDefine.amd ? ignoreDefine(factory) : factory();
})(function() {
  "use strict";
  let conciseSyntax = {
    init: false,
    interval: 0,
    dispose: null,
    extension: null
  };
  window.conciseSyntax ?? (window.conciseSyntax = conciseSyntax);
  const extensionId = "kauderk.concise-syntax";
  const windowId = "window." + extensionId;
  const bridgeBetweenVscodeExtension = "aria-label";
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
  const idSelector = '[data-mode-id="typescriptreact"]';
  const linesSelector = idSelector + ` .view-lines.monaco-mouse-cursor-text`;
  const highlightSelector = idSelector + ` .view-overlays`;
  function regexToDomToCss() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const lineEditor = document.querySelector(linesSelector);
    if (!lineEditor) {
      console.log("no editor");
      return customCSS;
    }
    const flags = {
      jsxTag: null,
      jsxTernaryBrace: null,
      jsxTernaryOtherwise: null,
      vsCodeHiddenTokens: null,
      beginQuote: null,
      endQuote: null
    };
    const customFlags = {
      singleQuotes: null
    };
    const root = `${linesSelector}>div>span`;
    const lines = Array.from(lineEditor.querySelectorAll("div>span"));
    function toFlatClassList(Array2) {
      return Array2.reduce(
        (acc, val) => acc.concat(val.join(".")),
        []
      );
    }
    function SliceClassList(line, slice) {
      const sliced = Array.from(line.children).slice(slice).map((c) => Array.from(c.classList));
      return Object.assign(sliced, { okLength: sliced.length == slice * -1 });
    }
    parser:
      for (const line of lines) {
        const text = line.textContent;
        if (!text)
          continue;
        let anyFlag = false;
        if ((_b = (_a = text.match(".+(</(?<jsxTag>.*)?>)$")) == null ? void 0 : _a.groups) == null ? void 0 : _b.jsxTag) {
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
            hover: `.${angleBracket}+.${tag}`
          };
          flags.vsCodeHiddenTokens = {
            // this is the most common case, you could derive it from other flags
            hide: `>.${angleBracket}`,
            hover: `.${angleBracket}`
          };
          anyFlag = true;
        } else if ((_d = (_c = text.match(/(\{).+\?.+?(?<ternaryBrace>\()$/)) == null ? void 0 : _c.groups) == null ? void 0 : _d.ternaryBrace) {
          if (flags.jsxTernaryBrace)
            continue;
          const closing = SliceClassList(line, -4);
          if (!closing.okLength)
            continue;
          const [blank, questionMark, blank2, openBrace] = toFlatClassList(closing);
          const selector = `.${blank}+.${questionMark}+.${blank}+.${openBrace}:last-child`;
          flags.jsxTernaryBrace = {
            // find the last open brace in " ? ("
            hide: `:has(${selector}) :last-child`,
            hover: selector
          };
          anyFlag = true;
        } else if ((_f = (_e = text.match(/(?<ternaryOtherwise>\).+?:.+\})/)) == null ? void 0 : _e.groups) == null ? void 0 : _f.ternaryOtherwise) {
          if (flags.jsxTernaryOtherwise)
            continue;
          const closing = SliceClassList(line, -7);
          if (!closing.okLength)
            continue;
          const [blank0, closeBrace, blank, colon, blank2, nullIsh, closeBracket] = toFlatClassList(closing);
          const selector = `.${blank0}+.${closeBrace}+.${blank}+.${colon}+.${blank2}+.${nullIsh}+.${closeBracket}:last-child`;
          flags.jsxTernaryOtherwise = {
            // find ") : null}" then hide it all
            hide: `:has(${selector}) *`,
            hover: selector
          };
          anyFlag = true;
        } else if ((_h = (_g = text.match(/(?<singleQuotes>""|''|``)/)) == null ? void 0 : _g.groups) == null ? void 0 : _h.singleQuotes) {
          if (customFlags.singleQuotes)
            continue;
          const array = Array.from(line.children);
          const quote = /"|'|`/;
          singleQuotes:
            for (let i = 0; i < array.length; i++) {
              const child = array[i];
              const current = (_i = child.textContent) == null ? void 0 : _i.match(quote);
              const next = (_k = (_j = array[i + 1]) == null ? void 0 : _j.textContent) == null ? void 0 : _k.match(quote);
              if ((current == null ? void 0 : current[0].length) == 1 && current[0] === (next == null ? void 0 : next[0])) {
                const beginQuote = Array.from(child.classList).join(".");
                const endQuote = Array.from(array[i + 1].classList).join(".");
                customFlags.singleQuotes = `.${beginQuote}:has(+.${endQuote}), .${beginQuote}+.${endQuote} {
							color: gray;
						}`;
                flags.beginQuote = {
                  // this is the most common case, you could derive it from other flags
                  hide: `>.${beginQuote}`,
                  hover: `.${beginQuote}`
                };
                flags.endQuote = {
                  // this is the most common case, you could derive it from other flags
                  hide: `>.${endQuote}`,
                  hover: `.${endQuote}`
                };
                anyFlag = true;
                break singleQuotes;
              }
            }
        }
        if (anyFlag && Object.values(flags).every((f) => !!f) && Object.values(customFlags).every((f) => !!f)) {
          break parser;
        }
      }
    const validFlags = Object.values(flags).filter(
      (f) => (f == null ? void 0 : f.hide) && f.hover
    );
    if (validFlags.length && ((_l = flags.vsCodeHiddenTokens) == null ? void 0 : _l.hover)) {
      const toHover = validFlags.map((f) => f.hover).join(",");
      const toHidden = validFlags.map((f) => root + f.hide).join(",");
      const toCustom = Object.values(customFlags).filter((f) => !!f).join("\n");
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
			`.replace(/\r|\n/g, "").replaceAll(/\t+/g, "\n");
    }
    return customCSS;
  }
  function activate(extension) {
    Extension = extension;
    const isActive = tryParseData(extension.item);
    applyConciseSyntax(isActive, extension);
    function applyConciseSyntax(on, _extension) {
      const styles = document.getElementById(windowId) ?? document.createElement("style");
      styles.id = windowId;
      _extension.icon.style.fontWeight = on ? "bold" : "normal";
      const title = "Concise Syntax";
      _extension.item.title = on ? `${title}: active` : `${title}: inactive`;
      styles.textContent = on ? regexToDomToCss() : "";
      document.body.appendChild(styles);
    }
  }
  function inactive() {
    var _a;
    (_a = document.getElementById(windowId)) == null ? void 0 : _a.remove();
    if (!Extension)
      return;
    Extension.item.removeAttribute("title");
    Extension.icon.style.removeProperty("font-weight");
  }
  let highlightedLines = /* @__PURE__ */ new Set();
  const selectedSelector = ".selected-text";
  const currentLineSelector = ".current-line";
  let currentLines = /* @__PURE__ */ new Set();
  const Highlight = {
    added(node) {
      highlightStyles(node, true);
    },
    removed(node) {
      highlightStyles(node, false);
    }
  };
  function highlightStyles(node, add) {
    var _a, _b, _c, _d;
    if (node.querySelector(selectedSelector)) {
      const top = Number((_b = (_a = node.style) == null ? void 0 : _a.top.match(/\d+/)) == null ? void 0 : _b[0]);
      if (isNaN(top))
        return;
      if (highlightedLines.has(top) === add)
        return;
      if (!add && document.querySelector(
        highlightSelector + `>[style*="${top}"]>` + selectedSelector
      )) {
        return;
      }
      highlightedLines[add ? "add" : "delete"](top);
      const id = windowId + ".highlight";
      const styles = document.getElementById(id) ?? document.createElement("style");
      styles.id = id;
      const lines = Array.from(highlightedLines).reduce((acc, top2) => acc + `[style*="${top2}"],`, "").slice(0, -1);
      styles.textContent = `
			${linesSelector} :is(${lines}) {
					--r: orange;
			}
			`.replace(/\r|\n/g, "").replaceAll(/\t+/g, "\n");
      document.body.appendChild(styles);
    } else if (node.querySelector(currentLineSelector)) {
      const top = Number((_d = (_c = node.style) == null ? void 0 : _c.top.match(/\d+/)) == null ? void 0 : _d[0]);
      if (isNaN(top))
        return;
      if (!add && document.querySelector(
        highlightSelector + `>[style*="${top}"]>` + currentLineSelector
      )) {
        return;
      }
      currentLines[add ? "add" : "delete"](top);
      const id = windowId + ".current";
      const styles = document.getElementById(id) ?? document.createElement("style");
      styles.id = id;
      const lines = Array.from(currentLines).reduce((acc, top2) => acc + `[style*="${top2}"],`, "").slice(0, -1);
      styles.textContent = `
			${linesSelector} :is(${lines}) {
					--r: brown;
			}
			`.replace(/\r|\n/g, "").replaceAll(/\t+/g, "\n");
      document.body.appendChild(styles);
    }
  }
  const highlightEditorMap = /* @__PURE__ */ new Map();
  const Deployer = {
    added(node) {
      var _a;
      if ((_a = node.matches) == null ? void 0 : _a.call(node, highlightSelector)) {
        debugger;
        const highlightEditor = createMutation(Highlight);
        highlightEditor.observe(node, {
          childList: true
        });
        highlightEditorMap.set(node, highlightEditor);
      }
    },
    removed(node) {
      var _a, _b;
      let match = (_a = node.matches) == null ? void 0 : _a.call(node, highlightSelector);
      if (match) {
        debugger;
        (_b = highlightEditorMap.get(node)) == null ? void 0 : _b.disconnect();
        highlightEditorMap.delete(node);
      }
    }
  };
  const highlightDeployer = createMutation(Deployer);
  let Extension = conciseSyntax.extension;
  let disposeObserver = conciseSyntax.dispose ?? (() => {
  });
  let previousData = void 0;
  const tryParseData = (target) => {
    var _a, _b;
    return (
      // You could pass stringified data
      !((_b = (_a = target.getAttribute) == null ? void 0 : _a.call(target, bridgeBetweenVscodeExtension)) == null ? void 0 : _b.includes("inactive"))
    );
  };
  const attributeObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const newData = tryParseData(mutation.target);
      if (previousData === newData)
        return;
      previousData = newData;
      if (newData) {
        activate(domExtension());
      } else {
        inactive();
      }
    }
  });
  function domExtension() {
    const statusBar = document.querySelector(".right-items");
    const item = statusBar == null ? void 0 : statusBar.querySelector(`[id="${extensionId}"]`);
    const icon = item == null ? void 0 : item.querySelector(".codicon");
    return { icon, item, statusBar };
  }
  let anyUsage = false;
  function patch() {
    var _a;
    const dom = domExtension();
    if (!document.contains((_a = dom.statusBar) == null ? void 0 : _a.parentNode) || !dom.icon || conciseSyntax.init)
      return;
    anyUsage = true;
    conciseSyntax.init = true;
    clearInterval(conciseSyntax.interval);
    disposeObserver = watchForRemoval(dom.item, reload);
    attributeObserver.observe(dom.item, {
      attributes: true,
      attributeFilter: [bridgeBetweenVscodeExtension]
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
    conciseSyntax.interval = setInterval(patch, 5e3);
  }
  function watchForRemoval(targetElement, callback) {
    let done2 = false;
    let stack = [];
    const rootObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (done2 || !stack.includes(mutation.target) || !mutation.removedNodes.length)
          return;
        const nodes = Array.from(mutation.removedNodes);
        if (nodes.indexOf(targetElement) > -1 || // parent match
        nodes.some((parent) => parent.contains(targetElement))) {
          dispose2();
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
    REC_ObserverAncestors(targetElement);
    function dispose2() {
      done2 = true;
      stack = [];
      rootObserver.takeRecords();
      rootObserver.disconnect();
    }
    return dispose2;
  }
  function createMutation(option) {
    return new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => option.added(node));
        mutation.removedNodes.forEach((node) => option.removed(node));
      });
    });
  }
  let done = false;
  const patchHighlight = () => {
    const editor = document.querySelector(highlightSelector);
    if (!editor) {
      return;
    }
    const closestEditorAncestor = document.querySelector(
      ".monaco-scrollable-element"
    );
    if (done || !closestEditorAncestor) {
      return;
    }
    done = true;
    clearInterval(patchHighlightInterval);
    debugger;
    Deployer.added(editor);
    highlightDeployer.observe(closestEditorAncestor, {
      childList: true,
      subtree: true
    });
  };
  let patchHighlightInterval = setInterval(patchHighlight, 1e3);
  reload();
  const exhaust = setTimeout(() => {
    clearTimeout(exhaust);
    if (!anyUsage) {
      clearInterval(conciseSyntax.interval);
    }
  }, 1e3 * 60 * 2);
  conciseSyntax.dispose = () => {
    dispose();
    inactive();
    highlightEditorMap.clear();
    highlightDeployer.disconnect();
    highlightedLines.clear();
    currentLines.clear();
  };
});
//# sourceMappingURL=workbench.js.map
