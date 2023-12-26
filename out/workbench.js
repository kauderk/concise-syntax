(function(factory) {
  typeof ignoreDefine === "function" && ignoreDefine.amd ? ignoreDefine(factory) : factory();
})(function() {
  "use strict";
  const extensionId = "kauderk.concise-syntax";
  const windowId = "window." + extensionId;
  const bridgeBetweenVscodeExtension = "aria-label";
  const editorSelector = ".editor-instance";
  const idSelector = '[data-mode-id="typescriptreact"]';
  const linesSelector = idSelector + ` .view-lines.monaco-mouse-cursor-text`;
  const overlaySelector = ".view-overlays";
  const highlightSelector = idSelector + ` ` + overlaySelector;
  const stylesContainer = document.getElementById(windowId) ?? document.createElement("div");
  stylesContainer.id = windowId;
  document.body.appendChild(stylesContainer);
  function createStyles(name) {
    const id = windowId + "." + name;
    const style = stylesContainer.querySelector(`[id="${id}"]`) ?? document.createElement("style");
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
    const trackNodes = /* @__PURE__ */ new Map();
    const nodes = () => Array.from(trackNodes.keys());
    function add(node) {
      trackNodes.set(node, option.added(node));
    }
    function remove(node) {
      var _a, _b;
      if (nodes().includes(node)) {
        (_a = trackNodes.get(node)) == null ? void 0 : _a();
        trackNodes.delete(node);
        (_b = option.removed) == null ? void 0 : _b.call(option, node);
      }
    }
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(add);
        mutation.removedNodes.forEach(remove);
      });
    });
    return {
      get targets() {
        return nodes();
      },
      track(target) {
        add(target);
        return observer.observe(target, option.options);
      },
      untrack(target) {
        remove(target);
        observer.disconnect();
        nodes().forEach((_target) => {
          observer.observe(_target, option.options);
        });
      },
      clear() {
        trackNodes.forEach((_, node) => remove(node));
        trackNodes.clear();
        observer.disconnect();
      }
    };
  }
  function createSimpleMutation(options) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => options.added(node));
        mutation.removedNodes.forEach((node) => options.added(node));
      });
    });
    return {
      track(target) {
        options.added(target);
        observer.observe(target, options.options);
      },
      untrack(target) {
        options.removed(target);
        observer.disconnect();
      }
    };
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
        if (newData) {
          props.activate(newData);
        } else {
          props.inactive(newData);
        }
      }
    });
    return {
      activate(target) {
        previousData = bridgeAttribute2(target);
        props.activate(previousData);
        observer.observe(target, {
          attributes: true,
          attributeFilter: [props.watchAttribute]
        });
      },
      dispose() {
        props.inactive(previousData);
        observer.disconnect();
      }
    };
  }
  function createAttributeArrayMutation(props) {
    const trackNodes = /* @__PURE__ */ new Map();
    const nodes = () => Array.from(trackNodes.keys());
    const bridgeAttribute2 = (target) => props.watchAttribute.map((a) => {
      var _a;
      return (_a = target == null ? void 0 : target.getAttribute) == null ? void 0 : _a.call(target, a);
    });
    function change(target) {
      const newData = bridgeAttribute2(target);
      const previousData = trackNodes.get(target) ?? [];
      if (newData.every((d, i) => d === previousData[i]))
        return;
      const oldAttributes = [...previousData];
      trackNodes.set(target, newData);
      props.change(target, newData, oldAttributes);
    }
    function remove(target) {
      if (nodes().includes(target)) {
        change(target);
        trackNodes.delete(target);
      }
    }
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        change(mutation.target);
      }
    });
    const options = {
      attributes: true,
      attributeFilter: props.watchAttribute
    };
    return {
      get targets() {
        return nodes();
      },
      track(target) {
        trackNodes.set(target, []);
        change(target);
        observer.observe(target, options);
      },
      untrack(target) {
        remove(target);
        observer.disconnect();
        nodes().forEach((target2) => {
          observer.observe(target2, options);
        });
      },
      clear() {
        nodes().forEach(remove);
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
          console.log("removed", targetElement, stack);
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
    let disposeActivate;
    function patch() {
      const dom = props.dom();
      if (running || !dom.check())
        return;
      anyUsage = true;
      running = true;
      clearInterval(interval);
      disposeObserver = watchForRemoval(dom.watchForRemoval, reload);
      disposeActivate = props.activate(dom);
    }
    function dispose() {
      var _a;
      disposeActivate == null ? void 0 : disposeActivate();
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
    const syntaxStyle = createStyles("hide");
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
      watchAttribute: bridgeBetweenVscodeExtension,
      activate() {
        activate(domExtension());
      },
      inactive() {
        inactive();
      }
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
        debugger;
        attributeObserver.activate(dom.item);
      },
      dispose() {
        debugger;
        attributeObserver.dispose();
        syntaxStyle.dispose();
      }
    });
    return cycle;
  }
  function queryEditors(node) {
    if (!node.querySelector)
      return [];
    const editors = Array.from(node.querySelectorAll(editorSelector));
    if (node.matches(editorSelector))
      editors.push(node);
    return editors;
  }
  function clear(label) {
    stylesContainer.querySelectorAll(label ? `[aria-label="${label}"]` : "[aria-label]").forEach((style) => style.remove());
  }
  const styles = {
    clear(label) {
      clear(label);
    },
    clearAll() {
      clear();
      stylesContainer.querySelectorAll("style").forEach((style) => {
        style.textContent = "";
      });
    },
    getOrCreateLabeledStyle(label) {
      let style = stylesContainer.querySelector(
        `[aria-label="${label}"]`
      );
      if (!style || !stylesContainer.contains(style)) {
        console.log("creating style", label);
        style = document.createElement("style");
        style.setAttribute("aria-label", label);
        stylesContainer.appendChild(style);
      }
      return style;
    }
  };
  function tryGetAttribute(line, attribute) {
    var _a;
    return line.editor = ((_a = line.closest(`[${attribute}]`)) == null ? void 0 : _a.getAttribute(attribute)) ?? // @ts-ignore
    line.editor;
  }
  function createHighlightLifeCycle() {
    function createHighlight({ node, selector, add, set, color }) {
      var _a, _b;
      if (!node.querySelector(selector))
        return;
      const label = tryGetAttribute(node, "aria-label");
      const top = Number((_b = (_a = node.style) == null ? void 0 : _a.top.match(/\d+/)) == null ? void 0 : _b[0]);
      if (!label || isNaN(top) || set.has(top) === add || !add && // most likely a node previous the lifecycle
      // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
      document.querySelector(
        highlightSelector + `>[style*="${top}"]>` + selector
      )) {
        return;
      }
      set[add ? "add" : "delete"](top);
      const lines = Array.from(set).reduce((acc, top2) => acc + `[style*="${top2}"],`, "").slice(0, -1);
      styleIt(
        styles.getOrCreateLabeledStyle(label + selector),
        `[aria-label="${label}"]${linesSelector} :is(${lines}) {
					--r: ${color};
			}`
      );
      return true;
    }
    let selectedLines = /* @__PURE__ */ new Set();
    const selectedSelector = ".selected-text";
    let currentLines = /* @__PURE__ */ new Set();
    const currentLineSelector = ".current-line";
    function highlightStyles(node, add) {
      createHighlight({
        node,
        selector: selectedSelector,
        add,
        set: selectedLines,
        color: "orange"
      }) || createHighlight({
        node,
        selector: currentLineSelector,
        add,
        set: currentLines,
        color: "brown"
      });
    }
    const OverlayLineTracker = createMutation({
      options: {
        childList: true
      },
      added(node) {
        highlightStyles(node, true);
      },
      removed(node) {
        highlightStyles(node, false);
      }
    });
    const EditorLanguageTracker = createAttributeArrayMutation({
      watchAttribute: ["data-mode-id", "aria-label"],
      change(editor, [language, label], [, oldLabel]) {
        if (!language || !label)
          return;
        const overlay = editor.querySelector(overlaySelector);
        overlay == null ? void 0 : overlay.setAttribute("aria-label", label);
        if (!overlay) {
          return console.error("no overlays");
        }
        OverlayLineTracker.untrack(overlay);
        if (label != oldLabel || !label.match(/(\.tsx$)|(\.tsx, E)/)) {
          if (!oldLabel) {
            console.error("no old label", arguments);
            return;
          }
          styles.clear(oldLabel);
          return;
        }
        if (language === "typescriptreact") {
          console.log("overlays", arguments);
          OverlayLineTracker.track(overlay);
        }
      }
    });
    const RootContainerTracker = createSimpleMutation({
      options: {
        childList: true,
        subtree: true
      },
      added(node) {
        queryEditors(node).forEach((editor) => {
          if (!EditorLanguageTracker.targets.includes(editor)) {
            debugger;
            EditorLanguageTracker.track(editor);
          }
        });
      },
      removed(node) {
        queryEditors(node).forEach((editor) => {
          if (EditorLanguageTracker.targets.includes(editor)) {
            debugger;
            EditorLanguageTracker.untrack(editor);
          }
        });
      }
    });
    const cycle = lifecycle({
      dom() {
        var _a;
        const root = document.querySelector(
          "#workbench\\.parts\\.editor > div.content > div > div > div > div > div.monaco-scrollable-element > div.split-view-container"
        );
        const editor = root == null ? void 0 : root.querySelector(idSelector);
        const overlays = (_a = editor == null ? void 0 : editor.querySelector(highlightSelector)) == null ? void 0 : _a.parentElement;
        return {
          check() {
            return !!(root && editor && overlays);
          },
          watchForRemoval: root
        };
      },
      activate(dom) {
        debugger;
        RootContainerTracker.track(dom.watchForRemoval);
        return () => RootContainerTracker.untrack(dom.watchForRemoval);
      },
      dispose() {
        EditorLanguageTracker.clear();
        OverlayLineTracker.clear();
        selectedLines.clear();
        currentLines.clear();
        styles.clearAll();
      }
    });
    return cycle;
  }
  const syntax = createSyntaxLifecycle();
  const highlight = createHighlightLifeCycle();
  const conciseSyntax = {
    activate() {
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
  conciseSyntax.activate();
  console.log(extensionId, conciseSyntax);
});
//# sourceMappingURL=workbench.js.map
