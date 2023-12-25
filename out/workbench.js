(function(factory) {
  typeof ignoreDefine === "function" && ignoreDefine.amd ? ignoreDefine(factory) : factory();
})(function() {
  "use strict";
  const extensionId = "kauderk.concise-syntax";
  const windowId = "window." + extensionId;
  const bridgeBetweenVscodeExtension = "aria-label";
  const idSelector = '[data-mode-id="typescriptreact"]';
  const linesSelector = idSelector + ` .view-lines.monaco-mouse-cursor-text`;
  const highlightSelector = idSelector + ` .view-overlays`;
  function createStyles(name) {
    const stylesContainer = document.getElementById(windowId) ?? document.createElement("div");
    stylesContainer.id = windowId;
    document.body.appendChild(stylesContainer);
    const id = windowId + "." + name;
    const style = document.getElementById(id) ?? document.createElement("style");
    style.id = id;
    stylesContainer.appendChild(style);
    return {
      element: style,
      styleIt: (text) => styleIt(style, text),
      dispose() {
        style.textContent = "";
      }
    };
  }
  function styleIt(style, text) {
    return style.textContent = text.replace(/\r|\n/g, "").replaceAll(/\t+/g, "\n");
  }
  function createMutation(option) {
    return new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => option.added(node));
        mutation.removedNodes.forEach((node) => option.removed(node));
      });
    });
  }
  function createAttributeMutation(props) {
    let previousData;
    const bridgeAttribute2 = (target) => {
      var _a;
      return (_a = target == null ? void 0 : target.getAttribute) == null ? void 0 : _a.call(target, props.watchAttribute);
    };
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const newData = bridgeAttribute2(mutation.target);
        if (previousData === newData)
          return;
        previousData = newData;
        const payload = {
          target: mutation.target,
          current: newData,
          previous: previousData
        };
        if (newData) {
          props.activate(payload);
        } else {
          props.inactive(payload);
        }
      }
    });
    return {
      activate(target) {
        observer.observe(target, {
          attributes: true,
          attributeFilter: ["data-mode-id"]
        });
      },
      disconnect() {
        observer.disconnect();
      }
    };
  }
  function watchForRemoval(targetElement, callback) {
    let done = false;
    let stack = [];
    const rootObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (done || !stack.includes(mutation.target) || !mutation.removedNodes.length)
          return;
        const nodes = Array.from(mutation.removedNodes);
        if (nodes.indexOf(targetElement) > -1 || // parent match
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
    REC_ObserverAncestors(targetElement);
    function dispose() {
      done = true;
      stack = [];
      rootObserver.takeRecords();
      rootObserver.disconnect();
    }
    return dispose;
  }
  function lifecycle(props) {
    let running = false;
    let anyUsage = false;
    let interval;
    let disposeObserver = () => {
    };
    function patch() {
      const dom = props.dom();
      if (running || !dom.check())
        return;
      anyUsage = true;
      running = true;
      clearInterval(interval);
      disposeObserver = watchForRemoval(dom.watchForRemoval, reload);
      props.activate(dom);
    }
    function dispose() {
      var _a;
      disposeObserver();
      (_a = props.dispose) == null ? void 0 : _a.call(props);
      running = false;
      clearInterval(interval);
    }
    function reload() {
      dispose();
      interval = setInterval(patch, 5e3);
    }
    let exhaust;
    return {
      activate() {
        reload();
        exhaust = setTimeout(() => {
          clearTimeout(exhaust);
          if (!anyUsage) {
            clearInterval(interval);
          }
        }, 1e3 * 60 * 2);
      },
      dispose() {
        dispose();
        clearTimeout(exhaust);
        clearInterval(interval);
      }
    };
  }
  function regexToDomToCss() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const lineEditor = document.querySelector(linesSelector);
    if (!lineEditor) {
      console.log("Fail to find Editor with selector:", linesSelector);
      return "";
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
    return "";
  }
  function domExtension() {
    const statusBar = document.querySelector(".right-items");
    const item = statusBar == null ? void 0 : statusBar.querySelector(`[id="${extensionId}"]`);
    const icon = item == null ? void 0 : item.querySelector(".codicon");
    return { icon, item, statusBar };
  }
  const bridgeAttribute = (target) => {
    var _a, _b;
    return (
      // You could pass stringified data
      !((_b = (_a = target.getAttribute) == null ? void 0 : _a.call(target, bridgeBetweenVscodeExtension)) == null ? void 0 : _b.includes("inactive"))
    );
  };
  function createSyntaxLifecycle() {
    let Extension;
    const syntaxStyle = createStyles("");
    function activate(extension) {
      Extension = extension;
      const on = bridgeAttribute(extension.item);
      extension.icon.style.fontWeight = on ? "bold" : "normal";
      const title = "Concise Syntax";
      extension.item.title = on ? `${title}: active` : `${title}: inactive`;
      syntaxStyle.styleIt(on ? regexToDomToCss() : "");
    }
    function inactive() {
      if (!Extension)
        return;
      Extension.item.removeAttribute("title");
      Extension.icon.style.removeProperty("font-weight");
    }
    const attributeObserver = createAttributeMutation({
      activate() {
        activate(domExtension());
      },
      inactive() {
        inactive();
      },
      watchAttribute: bridgeBetweenVscodeExtension
    });
    const cycle = lifecycle({
      dom() {
        const dom = domExtension();
        return {
          ...dom,
          watchForRemoval: dom.item,
          check() {
            var _a;
            return !!(document.contains((_a = dom.statusBar) == null ? void 0 : _a.parentNode) && dom.icon);
          }
        };
      },
      activate(dom) {
        activate(dom);
        attributeObserver.activate(dom.item);
      },
      dispose() {
        inactive();
        attributeObserver.disconnect();
        syntaxStyle.dispose();
      }
    });
    return cycle;
  }
  function createHighlightLifeCycle() {
    function createHighlight({
      node,
      selector,
      add,
      set,
      styleIt: styleIt2,
      color
    }) {
      var _a, _b;
      if (!node.querySelector(selector))
        return;
      const top = Number((_b = (_a = node.style) == null ? void 0 : _a.top.match(/\d+/)) == null ? void 0 : _b[0]);
      if (isNaN(top) || set.has(top) === add || // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
      !add && document.querySelector(
        highlightSelector + `>[style*="${top}"]>` + selector
      )) {
        return;
      }
      set[add ? "add" : "delete"](top);
      const lines = Array.from(set).reduce((acc, top2) => acc + `[style*="${top2}"],`, "").slice(0, -1);
      styleIt2(`
		${linesSelector} :is(${lines}) {
				--r: ${color};
		}`);
      return true;
    }
    let selectedLines = /* @__PURE__ */ new Set();
    const selectedSelector = ".selected-text";
    const selectedStyles = createStyles("selected");
    let currentLines = /* @__PURE__ */ new Set();
    const currentLineSelector = ".current-line";
    const currentStyles = createStyles("current");
    function highlightStyles(node, add) {
      createHighlight({
        node,
        selector: selectedSelector,
        add,
        set: selectedLines,
        color: "orange",
        styleIt: selectedStyles.styleIt
      }) || createHighlight({
        node,
        selector: currentLineSelector,
        add,
        set: currentLines,
        color: "brown",
        styleIt: selectedStyles.styleIt
      });
    }
    const Highlight = {
      added(node) {
        highlightStyles(node, true);
      },
      removed(node) {
        highlightStyles(node, false);
      }
    };
    const highlightEditorMap = /* @__PURE__ */ new Map();
    const Deployer = {
      added(node) {
        var _a, _b;
        if (!((_a = node.matches) == null ? void 0 : _a.call(node, highlightSelector)))
          return;
        const highlightEditor = createMutation(Highlight);
        (_b = highlightEditorMap.get(node)) == null ? void 0 : _b.disconnect();
        highlightEditor.observe(node, {
          childList: true
        });
        highlightEditorMap.set(node, highlightEditor);
      },
      removed(node) {
        var _a, _b;
        if (!((_a = node.matches) == null ? void 0 : _a.call(node, highlightSelector)))
          return;
        (_b = highlightEditorMap.get(node)) == null ? void 0 : _b.disconnect();
        highlightEditorMap.delete(node);
      }
    };
    const highlightDeployer = createMutation(Deployer);
    const attributeObserver = createAttributeMutation({
      activate({ target }) {
        Deployer.added(target);
      },
      inactive({ current }) {
        if (current !== "typescript")
          return;
        console.log("inactive");
      },
      watchAttribute: "data-mode-id"
    });
    const cycle = lifecycle({
      dom() {
        const editor = document.querySelector(highlightSelector);
        const closestEditorAncestor = document.querySelector(
          ".monaco-scrollable-element"
        );
        return {
          check() {
            return !!(editor && closestEditorAncestor);
          },
          watchForRemoval: editor,
          closestEditorAncestor
        };
      },
      activate(dom) {
        attributeObserver.activate(dom.watchForRemoval);
        highlightDeployer.observe(dom.closestEditorAncestor, {
          childList: true,
          subtree: true
        });
      },
      dispose() {
        attributeObserver.disconnect();
        Object.values(highlightEditorMap).forEach((editor) => editor.disconnect());
        highlightEditorMap.clear();
        highlightDeployer.disconnect();
        selectedLines.clear();
        currentLines.clear();
        selectedStyles.dispose();
        currentStyles.dispose();
      }
    });
    return cycle;
  }
  const syntax = createSyntaxLifecycle();
  const highlight = createHighlightLifeCycle();
  const conciseSyntax = {
    activate() {
      this.dispose();
      syntax.activate();
      highlight.activate();
    },
    dispose() {
      syntax.dispose();
      highlight.dispose();
    }
  };
  if (window.conciseSyntax) {
    window.conciseSyntax.dispose();
  }
  window.conciseSyntax = conciseSyntax;
  debugger;
  conciseSyntax.activate();
});
//# sourceMappingURL=workbench.js.map
