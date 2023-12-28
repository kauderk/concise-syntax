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
  const selectedSelector = ".selected-text";
  const currentSelector = ".current-line";
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
  function createMutation(props) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(props.added);
        mutation.removedNodes.forEach(props.removed);
      }
    });
    return {
      observe() {
        observer.observe(props.target(), props.options);
      },
      disconnect() {
        observer.disconnect();
      }
    };
  }
  function specialChildrenMutation(props) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          props.added(node);
        }
        for (const node of mutation.removedNodes) {
          props.removed(node);
        }
      }
    });
    return {
      stop() {
        observer.takeRecords();
        observer.disconnect();
      },
      plug(mapChildren) {
        const target = props.target();
        ((mapChildren == null ? void 0 : mapChildren(target.childNodes)) ?? target.childNodes).forEach(
          props.added
        );
        observer.observe(target, props.options);
      },
      unplug() {
        const target = props.target();
        target.childNodes.forEach(props.removed);
        observer.disconnect();
      }
    };
  }
  function createAttributeArrayMutation(props) {
    let previousData = [];
    const bridgeAttribute2 = (target) => props.watchAttribute.map((a) => {
      var _a;
      return (_a = target == null ? void 0 : target.getAttribute) == null ? void 0 : _a.call(target, a);
    });
    function change(target) {
      const newData = bridgeAttribute2(target);
      if (newData.every((d, i) => d === previousData[i]))
        return;
      const oldAttributes = [...previousData];
      previousData = newData;
      props.change(newData, oldAttributes, target);
    }
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        change(mutation.target);
      }
    });
    const options = {
      attributes: true,
      subtree: props.children,
      // childList: props.children,
      attributeFilter: props.watchAttribute
    };
    return {
      plug() {
        const target = props.target();
        change(target);
        observer.observe(target, options);
      },
      stop() {
        observer.takeRecords();
        observer.disconnect();
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
    let interval;
    let disposeObserver;
    let disposeActivate;
    function patch() {
      const dom = props.dom();
      if (running || !dom.check())
        return;
      running = true;
      clearInterval(interval);
      disposeObserver = watchForRemoval(dom.watchForRemoval, reload);
      disposeActivate = props.activate(dom);
    }
    function dispose() {
      var _a;
      disposeActivate == null ? void 0 : disposeActivate();
      disposeActivate = void 0;
      disposeObserver == null ? void 0 : disposeObserver();
      disposeObserver = void 0;
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
        return;
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
      console.warn("Fail to find Editor with selector:", linesSelector);
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
        const attributeObserver = createAttributeArrayMutation({
          target: () => dom.item,
          watchAttribute: [bridgeBetweenVscodeExtension],
          change([bridge]) {
            if (bridge) {
              activate(domExtension());
            } else {
              inactive();
            }
          }
        });
        attributeObserver.plug();
        return () => attributeObserver.disconnect();
      },
      dispose() {
      }
    });
    return cycle;
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
    getOrCreateLabeledStyle(label, selector) {
      let style = stylesContainer.querySelector(
        `[aria-label="${label}"][selector="${selector}"]`
      );
      if (!style || !stylesContainer.contains(style)) {
        style = document.createElement("style");
        style.setAttribute("aria-label", label);
        style.setAttribute("selector", selector);
        stylesContainer.appendChild(style);
      }
      return style;
    },
    swapLabeledStyle(oldLabel, newLabel) {
      const styles2 = stylesContainer.querySelectorAll(
        `[aria-label="${oldLabel}"]`
      );
      styles2.forEach((style) => {
        var _a;
        style.setAttribute("aria-label", newLabel);
        style.textContent = ((_a = style.textContent) == null ? void 0 : _a.replace(oldLabel, newLabel)) ?? "";
      });
    }
  };
  function findScopeElements(view) {
    const container = view.querySelector(":scope > div > .editor-container");
    const nested = view.querySelector(
      ":scope > div > div > div > .split-view-container"
    );
    const editor = container == null ? void 0 : container.querySelector(editorSelector);
    const overlay = editor == null ? void 0 : editor.querySelector(overlaySelector);
    const anyLine = overlay == null ? void 0 : overlay.querySelector(
      `${selectedSelector}, ${currentSelector}`
    );
    return { nested, container, editor, overlay, anyLine };
  }
  function e(el) {
    return el instanceof HTMLElement;
  }
  function guardStack(stack, key, cleanup) {
    var _a;
    if (stack.has(key)) {
      console.warn("stack has key", stack, key);
      (_a = stack.get(key)) == null ? void 0 : _a();
      stack.delete(key);
    }
    stack.set(key, cleanup);
  }
  function parseTopStyle(node) {
    var _a, _b;
    return Number((_b = (_a = node.style) == null ? void 0 : _a.top.match(/\d+/)) == null ? void 0 : _b[0]);
  }
  function createHighlightLifeCycle() {
    function createHighlight({ node, selector, add, set, label, color }) {
      if (!e(node) || !node.querySelector(selector))
        return;
      const top = parseTopStyle(node);
      if (isNaN(top) || set.has(top) === add || !add && // FIXME: figure out how to overcome vscode rapid dom swap at viewLayers.ts _finishRenderingInvalidLines
      document.querySelector(
        `[aria-label="${label}"]` + highlightSelector + `>[style*="${top}"]>` + selector
      )) {
        return;
      }
      set[add ? "add" : "delete"](top);
      const lines = Array.from(set).reduce((acc, top2) => acc + `[style*="${top2}"],`, "").slice(0, -1);
      styleIt(
        styles.getOrCreateLabeledStyle(label, selector),
        `[aria-label="${label}"]${linesSelector} :is(${lines}) {
					--r: ${color};
			}`
      );
      return true;
    }
    function editorOverlayLifecycle(editor, overlay) {
      let editorLabel = editor.getAttribute("aria-label");
      const EditorLanguageTracker = createAttributeArrayMutation({
        target: () => editor,
        watchAttribute: ["data-mode-id", "aria-label"],
        change([language, label], [, oldLabel]) {
          editorLabel = label;
          if (!language || !label)
            return;
          OverlayLineTracker.disconnect();
          if (label.match(/(\.tsx$)|(\.tsx, E)/)) {
            if (language === "typescriptreact") {
              OverlayLineTracker.observe();
            }
            if (oldLabel && label != oldLabel) {
              styles.clear(oldLabel);
              mount();
            }
          } else {
            styles.clear(label);
          }
        }
      });
      function mount() {
        selectedLines.clear();
        currentLines.clear();
        overlay.childNodes.forEach((node) => highlightStyles(node, true));
      }
      let selectedLines = /* @__PURE__ */ new Set();
      let currentLines = /* @__PURE__ */ new Set();
      const OverlayLineTracker = createMutation({
        target: () => overlay,
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
      function highlightStyles(node, add) {
        if (!editorLabel)
          return;
        const pre = { node, add, label: editorLabel };
        createHighlight({
          selector: selectedSelector,
          color: "orange",
          set: selectedLines,
          ...pre
        }) || createHighlight({
          selector: currentSelector,
          color: "brown",
          set: currentLines,
          ...pre
        });
      }
      let done = false;
      const lineTracker = createAttributeArrayMutation({
        target: () => overlay,
        children: true,
        watchAttribute: ["style"],
        change([style], [oldStyle], node) {
          if (done)
            return;
          const top = parseTopStyle(node);
          if (!isNaN(top) && style && oldStyle != style) {
            done = true;
            mount();
            lineTracker.stop();
          }
        }
      });
      mount();
      EditorLanguageTracker.plug();
      lineTracker.plug();
      const layoutShift = setTimeout(lineTracker.stop, 500);
      return function dispose() {
        clearTimeout(layoutShift);
        if (editorLabel)
          styles.clear(editorLabel);
        EditorLanguageTracker.disconnect();
        OverlayLineTracker.disconnect();
      };
    }
    const cycle = lifecycle({
      dom() {
        var _a;
        const gridRoot = document.querySelector(
          "#workbench\\.parts\\.editor > div.content > div > div > div > div > div.monaco-scrollable-element > div.split-view-container"
        );
        const root = gridRoot.querySelector(
          ":scope > div > div > div.monaco-scrollable-element > div.split-view-container"
        );
        const editor = root == null ? void 0 : root.querySelector(idSelector);
        const overlays = (_a = editor == null ? void 0 : editor.querySelector(highlightSelector)) == null ? void 0 : _a.parentElement;
        return {
          check() {
            return !!overlays;
          },
          watchForRemoval: gridRoot
        };
      },
      activate(DOM) {
        let recStack = /* @__PURE__ */ new Map();
        let editorStack = /* @__PURE__ */ new Map();
        let treeStack = /* @__PURE__ */ new Map();
        const REC_EditorOverlayTracker = (target) => specialChildrenMutation({
          target: () => target,
          options: {
            childList: true
          },
          added,
          removed: bruteForceRemove
        });
        function clearStacks(condition) {
          var _a;
          for (const stack of [recStack, editorStack, treeStack]) {
            for (const [keyNode] of stack) {
              if (condition && !condition(keyNode))
                continue;
              (_a = stack.get(keyNode)) == null ? void 0 : _a();
              stack.delete(keyNode);
            }
          }
        }
        function awkwardStack(elements) {
          const { overlay, editor } = elements;
          if (overlay && editor && !editorStack.has(editor)) {
            editorStack.set(editor, editorOverlayLifecycle(editor, overlay));
            return true;
          }
        }
        function added(splitViewView) {
          const elements = findScopeElements(splitViewView);
          if (elements.nested) {
            const rec = REC_EditorOverlayTracker(elements.nested);
            rec.plug();
            guardStack(recStack, splitViewView, rec.stop);
          } else if (awkwardStack(elements))
            ;
          else if (!elements.overlay) {
            const treeTracker = specialChildrenMutation({
              target: () => splitViewView,
              options: {
                childList: true,
                subtree: true
              },
              added() {
                const elements2 = findScopeElements(splitViewView);
                if (awkwardStack(elements2)) {
                  treeTracker.stop();
                }
              },
              removed() {
              }
            });
            treeTracker.plug();
            guardStack(treeStack, splitViewView, treeTracker.stop);
          }
        }
        function bruteForceRemove(splitViewView) {
          clearStacks((keyNode) => !DOM.watchForRemoval.contains(keyNode));
        }
        let rebootCleanup;
        const reboot = createMutation({
          target: () => DOM.watchForRemoval,
          options: {
            childList: true
          },
          added(node) {
            if (rebootCleanup)
              throw new Error("reboot cleanup already exists");
            if (!e(node))
              return console.warn("no node");
            const rootContainer = node.querySelector(
              "div.split-view-container"
            );
            if (!rootContainer)
              return console.warn("no root container");
            const root = REC_EditorOverlayTracker(rootContainer);
            const [firstView, ...restViews] = rootContainer.childNodes;
            const container = findScopeElements(firstView).container;
            let stopFirstContainer = () => {
            };
            if (container) {
              const firsContainerTracker = specialChildrenMutation({
                target: () => container,
                options: {
                  childList: true
                },
                added() {
                  added(firstView);
                },
                removed() {
                  bruteForceRemove();
                }
              });
              firsContainerTracker.plug();
              stopFirstContainer = firsContainerTracker.stop;
            }
            root.plug(() => restViews);
            rebootCleanup = () => {
              root.stop();
              stopFirstContainer();
            };
          },
          removed(node) {
            rebootCleanup == null ? void 0 : rebootCleanup();
            rebootCleanup = void 0;
          }
        });
        return () => {
          reboot.disconnect();
          rebootCleanup == null ? void 0 : rebootCleanup();
          rebootCleanup = void 0;
          clearStacks();
        };
      },
      dispose() {
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
