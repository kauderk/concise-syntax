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
  function createChildrenMutation(props) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(props.added);
        mutation.removedNodes.forEach(props.removed);
      }
    });
    return {
      plug() {
        const target = props.target();
        console.log("plugging", target.childNodes);
        target.childNodes.forEach(props.added);
        observer.observe(target, props.options);
      },
      unplug() {
        const target = props.target();
        console.log("unplugging", target.childNodes);
        target.childNodes.forEach(props.removed);
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
      props.change(newData, oldAttributes);
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
      plug() {
        const target = props.target();
        change(target);
        observer.observe(target, options);
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
        attributeObserver.activate(dom.item);
      },
      dispose() {
        attributeObserver.dispose();
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
  function createHighlightLifeCycle() {
    function createHighlight({ node, selector, add, set, label, color }) {
      var _a, _b;
      if (!(node instanceof HTMLElement) || !node.querySelector(selector))
        return;
      const top = Number((_b = (_a = node.style) == null ? void 0 : _a.top.match(/\d+/)) == null ? void 0 : _b[0]);
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
      let editorLabel;
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
      function mount() {
        selectedLines.clear();
        currentLines.clear();
        overlay.childNodes.forEach((node) => highlightStyles(node, true));
      }
      function highlightStyles(node, add) {
        if (!editorLabel)
          return;
        const pre = { node, add, label: editorLabel };
        createHighlight({
          selector: ".selected-text",
          color: "orange",
          set: selectedLines,
          ...pre
        }) || createHighlight({
          selector: ".current-line",
          color: "brown",
          set: currentLines,
          ...pre
        });
      }
      const layoutShiftInterval = setInterval(() => {
        mount();
        EditorLanguageTracker.plug();
      }, 0);
      return function dispose() {
        clearInterval(layoutShiftInterval);
        if (editorLabel)
          styles.clear(editorLabel);
        EditorLanguageTracker.disconnect();
        OverlayLineTracker.disconnect();
      };
    }
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
        function lookup(node, up) {
          return Array(up).fill(0).reduce((acc, _) => acc == null ? void 0 : acc.parentElement, node);
        }
        function lookupTo(node, up, to) {
          return lookup(node, up) === to;
        }
        let viewStack = /* @__PURE__ */ new Map();
        let editorStack = /* @__PURE__ */ new Map();
        let observableEditorStack = /* @__PURE__ */ new Map();
        const REC_containerTracker = (target) => createChildrenMutation({
          target: () => target,
          options: {
            childList: true
          },
          added(splitViewView) {
            var _a, _b, _c;
            if (!e(splitViewView))
              return;
            const container = splitViewView.querySelector(".editor-container");
            if (lookupTo(container, 2, splitViewView)) {
              const editor = splitViewView.querySelector(editorSelector);
              if (lookupTo(editor, 3, splitViewView)) {
                const overlay = editor.querySelector(overlaySelector);
                if (e(overlay)) {
                  if (!editorStack.has(editor)) {
                    console.log("Found new editor", editor);
                    editorStack.set(
                      editor,
                      editorOverlayLifecycle(editor, overlay)
                    );
                  } else {
                    console.warn("Duplicate editor", editor);
                  }
                } else {
                  console.warn("Editor without overlay", editor);
                }
              } else {
                if (!observableEditorStack.has(container)) {
                  console.log("Found new editor", container);
                  const containerObserver = createChildrenMutation({
                    target: () => container,
                    options: {
                      childList: true
                    },
                    added(editor2) {
                      if (!e(editor2))
                        return;
                      const overlay = editor2.querySelector(overlaySelector);
                      if (e(overlay)) {
                        if (!editorStack.has(editor2)) {
                          console.log("Found new editor from containerObserver", editor2);
                          editorStack.set(
                            editor2,
                            editorOverlayLifecycle(editor2, overlay)
                          );
                        } else {
                          console.warn("Duplicate editor from containerObserver", editor2);
                        }
                      } else {
                        console.warn("Editor without overlay from containerObserver", editor2);
                      }
                    },
                    removed(editor2) {
                      if (!e(editor2))
                        return;
                      console.log("SHould remove editor from containerObserver", editor2);
                    }
                  });
                  containerObserver.plug();
                  console.log("Found new container - instance of containerObserver", container);
                  observableEditorStack.set(
                    container,
                    containerObserver.unplug
                  );
                } else {
                  console.warn("Duplicate editor", editor);
                }
              }
            } else {
              const nextContainer = splitViewView.querySelector(
                ".split-view-container"
              );
              if (e(nextContainer) && ((_c = (_b = (_a = nextContainer.parentElement) == null ? void 0 : _a.parentElement) == null ? void 0 : _b.parentElement) == null ? void 0 : _c.parentElement) === splitViewView) {
                const recursive = REC_containerTracker(nextContainer);
                recursive.plug();
                console.log("Found new container", splitViewView);
                viewStack.set(splitViewView, recursive.plug);
              } else {
                console.warn(
                  "End of recursion or could not find view-container",
                  splitViewView
                );
              }
            }
          },
          removed(splitViewView) {
            var _a, _b, _c;
            if (!e(splitViewView))
              return;
            const editor = splitViewView.querySelector(editorSelector);
            if (lookupTo(editor, 3, splitViewView) && editorStack.has(editor)) {
              console.log("Removed editor", editor);
              (_a = editorStack.get(editor)) == null ? void 0 : _a();
              editorStack.delete(editor);
            } else {
              console.warn(
                "Could not remove --editor-- from stack",
                splitViewView,
                editor,
                editorStack
              );
            }
            const container = splitViewView.querySelector(".editor-container");
            if (lookupTo(container, 2, splitViewView) && observableEditorStack.has(container)) {
              console.log("Removed container", container);
              (_b = observableEditorStack.get(container)) == null ? void 0 : _b();
              observableEditorStack.delete(container);
            } else {
              console.warn(
                "Could not remove **container** from stack",
                splitViewView,
                container,
                observableEditorStack
              );
            }
            console.log("Removed container", splitViewView);
            (_c = viewStack.get(splitViewView)) == null ? void 0 : _c();
            viewStack.delete(splitViewView);
          }
        });
        debugger;
        const root = REC_containerTracker(dom.watchForRemoval);
        root.plug();
        return () => {
          root.unplug();
          viewStack.forEach((cleanup) => cleanup());
          viewStack.clear();
          editorStack.forEach((cleanup) => cleanup());
          editorStack.clear();
        };
      },
      dispose() {
        styles.clearAll();
      }
    });
    return cycle;
  }
  function e(el) {
    return el instanceof HTMLElement;
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
