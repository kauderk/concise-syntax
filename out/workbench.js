(function(factory) {
  typeof ignoreDefine === "function" && ignoreDefine.amd ? ignoreDefine(factory) : factory();
})(function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

  const extensionId = "kauderk.concise-syntax";
  const windowId = "window." + extensionId;
  const editorSelector = ".editor-instance";
  const idSelector = '[data-mode-id="typescriptreact"]';
  const linesSelector = idSelector + ` .view-lines.monaco-mouse-cursor-text`;
  const overlaySelector = ".view-overlays";
  const highlightSelector = idSelector + ` ` + overlaySelector;
  const selectedSelector = ".selected-text";
  const currentSelector = ".current-line";
  const splitViewContainerSelector = ".split-view-container";
  /*!
  * Toastify js 1.12.0
  * https://github.com/apvarun/toastify-js
  * @license MIT licensed
  *
  * Copyright (C) 2018 Varun A P
  */
  class Toastify {
    /**
     * Create a new Toastify instance
     * @param {Partial<ToastifyConfigurationObject>} options - The configuration object to configure Toastify
     * 
    */
    constructor(options) {
      __publicField(this, "defaults", {
        oldestFirst: true,
        text: "Toastify is awesome!",
        node: void 0,
        duration: 3e3,
        selector: void 0,
        callback: function() {
        },
        destination: void 0,
        newWindow: false,
        close: false,
        gravity: "toastify-top",
        positionLeft: false,
        position: "",
        backgroundColor: "",
        avatar: "",
        className: "",
        stopOnFocus: true,
        onClick: function() {
        },
        offset: { x: 0, y: 0 },
        escapeMarkup: true,
        ariaLive: "polite",
        style: { background: "" }
      });
      this.version = "1.12.0";
      this.options = {};
      this.toastElement = null;
      this._rootElement = document.body;
      this._init(options);
    }
    /**
     * Display the toast
     * @public
     */
    showToast() {
      this.toastElement = this._buildToast();
      if (typeof this.options.selector === "string") {
        this._rootElement = document.getElementById(this.options.selector);
      } else if (this.options.selector instanceof HTMLElement || this.options.selector instanceof ShadowRoot) {
        this._rootElement = this.options.selector;
      } else {
        this._rootElement = document.body;
      }
      if (!this._rootElement) {
        throw "Root element is not defined";
      }
      this._rootElement.insertBefore(this.toastElement, this._rootElement.firstChild);
      this._reposition();
      if (this.options.duration > 0) {
        this.toastElement.timeOutValue = window.setTimeout(
          () => {
            this._removeElement(this.toastElement);
          },
          this.options.duration
        );
      }
      return this;
    }
    /**
     * Hide the toast
     * @public
     */
    hideToast() {
      if (this.toastElement.timeOutValue) {
        clearTimeout(this.toastElement.timeOutValue);
      }
      this._removeElement(this.toastElement);
    }
    /**
     * Init the Toastify class
     * @param {ToastifyConfigurationObject} options - The configuration object to configure Toastify
     * @param {string} [options.text=Hi there!] - Message to be displayed in the toast
     * @param {Element} [options.node] - Provide a node to be mounted inside the toast. node takes higher precedence over text
     * @param {number} [options.duration=3000] - Duration for which the toast should be displayed. -1 for permanent toast
     * @param {string} [options.selector] - CSS Selector on which the toast should be added
     * @param {url} [options.destination] - URL to which the browser should be navigated on click of the toast
     * @param {boolean} [options.newWindow=false] - Decides whether the destination should be opened in a new window or not
     * @param {boolean} [options.close=false] - To show the close icon or not
     * @param {string} [options.gravity=toastify-top] - To show the toast from top or bottom
     * @param {string} [options.position=right] - To show the toast on left or right
     * @param {string} [options.backgroundColor] - Sets the background color of the toast (To be deprecated)
     * @param {url} [options.avatar] - Image/icon to be shown before text
     * @param {string} [options.className] - Ability to provide custom class name for further customization
     * @param {boolean} [options.stopOnFocus] - To stop timer when hovered over the toast (Only if duration is set)
     * @param {Function} [options.callback] - Invoked when the toast is dismissed
     * @param {Function} [options.onClick] - Invoked when the toast is clicked
     * @param {Object} [options.offset] - Ability to add some offset to axis
     * @param {boolean} [options.escapeMarkup=true] - Toggle the default behavior of escaping HTML markup
     * @param {string} [options.ariaLive] - Announce the toast to screen readers
     * @param {Object} [options.style] - Use the HTML DOM style property to add styles to toast
     * @private
     */
    _init(options) {
      this.options = Object.assign(this.defaults, options);
      if (this.options.backgroundColor) {
        console.warn('DEPRECATION NOTICE: "backgroundColor" is being deprecated. Please use the "style.background" property.');
      }
      this.toastElement = null;
      this.options.gravity = options.gravity === "bottom" ? "toastify-bottom" : "toastify-top";
      this.options.stopOnFocus = options.stopOnFocus === void 0 ? true : options.stopOnFocus;
      if (options.backgroundColor) {
        this.options.style.background = options.backgroundColor;
      }
    }
    /**
     * Build the Toastify element
     * @returns {Element}
     * @private
     */
    _buildToast() {
      if (!this.options) {
        throw "Toastify is not initialized";
      }
      let divElement = document.createElement("div");
      divElement.className = `toastify on ${this.options.className}`;
      divElement.className += ` toastify-${this.options.position}`;
      divElement.className += ` ${this.options.gravity}`;
      for (const property in this.options.style) {
        divElement.style[property] = this.options.style[property];
      }
      if (this.options.ariaLive) {
        divElement.setAttribute("aria-live", this.options.ariaLive);
      }
      if (this.options.node && this.options.node.nodeType === Node.ELEMENT_NODE) {
        divElement.appendChild(this.options.node);
      } else {
        if (this.options.escapeMarkup) {
          divElement.innerText = this.options.text;
        } else {
          divElement.innerText = this.options.text;
        }
        if (this.options.avatar !== "") {
          let avatarElement = document.createElement("img");
          avatarElement.src = this.options.avatar;
          avatarElement.className = "toastify-avatar";
          if (this.options.position == "left") {
            divElement.appendChild(avatarElement);
          } else {
            divElement.insertAdjacentElement("afterbegin", avatarElement);
          }
        }
      }
      if (this.options.close === true) {
        let closeElement = document.createElement("button");
        closeElement.type = "button";
        closeElement.setAttribute("aria-label", "Close");
        closeElement.className = "toast-close";
        closeElement.innerText = "X";
        closeElement.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();
            this._removeElement(this.toastElement);
            window.clearTimeout(this.toastElement.timeOutValue);
          }
        );
        const width = window.innerWidth > 0 ? window.innerWidth : screen.width;
        if (this.options.position == "left" && width > 360) {
          divElement.insertAdjacentElement("afterbegin", closeElement);
        } else {
          divElement.appendChild(closeElement);
        }
      }
      if (this.options.stopOnFocus && this.options.duration > 0) {
        divElement.addEventListener(
          "mouseover",
          (event) => {
            window.clearTimeout(divElement.timeOutValue);
          }
        );
        divElement.addEventListener(
          "mouseleave",
          () => {
            divElement.timeOutValue = window.setTimeout(
              () => {
                this._removeElement(divElement);
              },
              this.options.duration
            );
          }
        );
      }
      if (typeof this.options.destination !== "undefined") {
        divElement.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();
            if (this.options.newWindow === true) {
              window.open(this.options.destination, "_blank");
            } else {
              window.location = this.options.destination;
            }
          }
        );
      }
      if (typeof this.options.onClick === "function" && typeof this.options.destination === "undefined") {
        divElement.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();
            this.options.onClick();
          }
        );
      }
      if (typeof this.options.offset === "object") {
        const x = this._getAxisOffsetAValue("x", this.options);
        const y = this._getAxisOffsetAValue("y", this.options);
        const xOffset = this.options.position == "left" ? x : `-${x}`;
        const yOffset = this.options.gravity == "toastify-top" ? y : `-${y}`;
        divElement.style.transform = `translate(${xOffset},${yOffset})`;
      }
      return divElement;
    }
    /**
     * Remove the toast from the DOM
     * @param {Element} toastElement
     */
    _removeElement(toastElement) {
      toastElement.className = toastElement.className.replace(" on", "");
      window.setTimeout(
        () => {
          if (this.options.node && this.options.node.parentNode) {
            this.options.node.parentNode.removeChild(this.options.node);
          }
          if (toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
          }
          this.options.callback.call(toastElement);
          this._reposition();
        },
        400
      );
    }
    /**
     * Position the toast on the DOM
     * @private
     */
    _reposition() {
      let topLeftOffsetSize = {
        top: 15,
        bottom: 15
      };
      let topRightOffsetSize = {
        top: 15,
        bottom: 15
      };
      let offsetSize = {
        top: 15,
        bottom: 15
      };
      let allToasts = this._rootElement.querySelectorAll(".toastify");
      let classUsed;
      for (let i = 0; i < allToasts.length; i++) {
        if (allToasts[i].classList.contains("toastify-top") === true) {
          classUsed = "toastify-top";
        } else {
          classUsed = "toastify-bottom";
        }
        let height = allToasts[i].offsetHeight;
        classUsed = classUsed.substr(9, classUsed.length - 1);
        let offset = 15;
        let width = window.innerWidth > 0 ? window.innerWidth : screen.width;
        if (width <= 360) {
          allToasts[i].style[classUsed] = `${offsetSize[classUsed]}px`;
          offsetSize[classUsed] += height + offset;
        } else {
          if (allToasts[i].classList.contains("toastify-left") === true) {
            allToasts[i].style[classUsed] = `${topLeftOffsetSize[classUsed]}px`;
            topLeftOffsetSize[classUsed] += height + offset;
          } else {
            allToasts[i].style[classUsed] = `${topRightOffsetSize[classUsed]}px`;
            topRightOffsetSize[classUsed] += height + offset;
          }
        }
      }
    }
    /**
     * Helper function to get offset
     * @param {string} axis - 'x' or 'y'
     * @param {ToastifyConfigurationObject} options - The options object containing the offset object
     */
    _getAxisOffsetAValue(axis, options) {
      if (options.offset[axis]) {
        if (isNaN(options.offset[axis])) {
          return options.offset[axis];
        } else {
          return `${options.offset[axis]}px`;
        }
      }
      return "0px";
    }
  }
  const minifiedCss = `.toastify{padding:12px 20px;color:#fff;display:inline-block;box-shadow:0 3px 6px -1px rgba(0,0,0,.12),0 10px 36px -4px rgba(77,96,232,.3);background:-webkit-linear-gradient(315deg,#73a5ff,#5477f5);background:linear-gradient(135deg,#73a5ff,#5477f5);position:fixed;opacity:0;transition:all .4s cubic-bezier(.215, .61, .355, 1);border-radius:2px;cursor:pointer;text-decoration:none;max-width:calc(50% - 20px);z-index:2147483647}.toastify.on{opacity:1}.toast-close{background:0 0;border:0;color:#fff;cursor:pointer;font-family:inherit;font-size:1em;opacity:.4;padding:0 5px}.toastify-right{right:15px}.toastify-left{left:15px}.toastify-top{top:-150px}.toastify-bottom{bottom:-150px}.toastify-rounded{border-radius:25px}.toastify-avatar{width:1.5em;height:1.5em;margin:-7px 5px;border-radius:2px}.toastify-center{margin-left:auto;margin-right:auto;left:0;right:0;max-width:fit-content;max-width:-moz-fit-content}@media only screen and (max-width:360px){.toastify-left,.toastify-right{margin-left:auto;margin-right:auto;left:0;right:0;max-width:fit-content}}`;
  const stylesContainer = document.getElementById(windowId) ?? document.createElement("div");
  stylesContainer.id = windowId;
  document.body.appendChild(stylesContainer);
  const levels = {
    log: {
      background: "linear-gradient(to right, #292d3e, #31364a)",
      "box-shadow": "0 3px 6px -1px #0000001f, 0 10px 36px -4px #4d60e84d",
      border: "1px dotted #e3e4e229"
    },
    error: {
      background: "linear-gradient(to right, #ff4757, #6e1e38)",
      "box-shadow": "0 3px 6px -1px #ff475796, 0 10px 36px -4px #a944424d",
      border: "1px dotted #ff4757"
    },
    warn: {
      background: "linear-gradient(to right, #8a6d3b, #7a5b32)",
      "box-shadow": "0 3px 6px -1px #8a6d3b70, 0 10px 36px -4px #8a6d3b4d",
      border: "1px dotted #e3e4e229"
    }
    // success: {
    //   background: 'linear-gradient(to right, #3c763d, #356635)',
    //   'box-shadow': '0 3px 6px -1px #509d51b3, 0 10px 36px -4px #3c763d9c',
    //   border: '1px dotted #e3e4e229',
    // },
  };
  const toastConsole = new Proxy(
    {},
    // dangerous type casting
    {
      get(target, level) {
        if (!(level in levels)) {
          throw new Error("invalid console level");
        }
        return (message, objects, options = {}) => {
          const print = "Concise Syntax " + level + ": " + message;
          console[level](print, objects ?? {});
          const toastStyle = createStyles("toast");
          toastStyle.styleIt(minifiedCss);
          const toast = new Toastify({
            duration: 5e5,
            close: true,
            gravity: "bottom",
            position: "left",
            stopOnFocus: true,
            style: levels[level],
            text: message,
            ...options
          });
          toast.showToast();
        };
      }
    }
  );
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
    const bridgeAttribute = (target) => props.watchAttribute.map((a) => {
      var _a;
      return (_a = target == null ? void 0 : target.getAttribute) == null ? void 0 : _a.call(target, a);
    });
    function change(target) {
      const newData = bridgeAttribute(target);
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
    let tryFn2 = createTryFunction({ fallback: clean });
    let interval;
    let disposeObserver;
    let disposeActivate;
    function patch() {
      const dom = props.dom();
      if (running || !dom.check())
        return;
      running = true;
      clearInterval(interval);
      tryFn2(() => {
        disposeObserver = watchForRemoval(dom.watchForRemoval, reload);
        disposeActivate = props.activate(dom);
      }, "Lifecycle crashed unexpectedly when activating");
    }
    function dispose() {
      clearInterval(interval);
      tryFn2(() => {
        var _a;
        disposeActivate == null ? void 0 : disposeActivate();
        disposeActivate = void 0;
        disposeObserver == null ? void 0 : disposeObserver();
        disposeObserver = void 0;
        (_a = props.dispose) == null ? void 0 : _a.call(props);
        running = false;
      }, "Lifecycle crashed unexpectedly when disposing");
    }
    function reload() {
      dispose();
      interval = setInterval(patch, 5e3);
    }
    function clean() {
      clearTimeout(exhaust);
      clearInterval(interval);
    }
    let exhaust;
    return {
      activate() {
        if (tryFn2.guard("Lifecycle already crashed therefore not activating again")) {
          return;
        }
        reload();
        return;
      },
      dispose() {
        if (tryFn2.guard("Lifecycle already crashed therefore not disposing again")) {
          return;
        }
        dispose();
        clean();
      }
    };
  }
  function createTryFunction(guard) {
    let crashed = false;
    function tryFunction(fn, message) {
      if (crashed)
        return;
      try {
        fn();
      } catch (error) {
        crashed = true;
        toastConsole.error("Fatal - " + message, { error });
      }
    }
    Object.defineProperty(tryFunction, "crashed", {
      get() {
        return crashed;
      }
    });
    tryFunction.guard = (action) => {
      if (crashed) {
        const fallback = action ?? (guard == null ? void 0 : guard.fallback);
        if (typeof fallback === "function") {
          fallback();
        }
        const message = action ?? (guard == null ? void 0 : guard.message);
        if (typeof message === "string") {
          console.warn(message);
        }
      }
      return crashed;
    };
    return tryFunction;
  }
  function domExtension() {
    const statusBar = document.querySelector(".right-items");
    const item = statusBar == null ? void 0 : statusBar.querySelector(`[id="${extensionId}"]`);
    const icon = item == null ? void 0 : item.querySelector(".codicon");
    return { icon, item, statusBar };
  }
  function createSyntaxLifecycle() {
    const syntaxStyle = createStyles("hide");
    syntaxStyle.styleIt(
      `.view-lines {--r: transparent;}.view-lines > div:hover {--r: yellow;}.view-lines:has(:is(.mtk35+.mtk14,.mtk35,.mtk36,.mtk37):hover) {--r: red;}[data-mode-id="typescriptreact"] .view-lines.monaco-mouse-cursor-text>div>span:has(:nth-last-child(3).mtk35+.mtk14+.mtk35) :nth-last-child(2),[data-mode-id="typescriptreact"] .view-lines.monaco-mouse-cursor-text>div>span>.mtk35,[data-mode-id="typescriptreact"] .view-lines.monaco-mouse-cursor-text>div>span>.mtk36,[data-mode-id="typescriptreact"] .view-lines.monaco-mouse-cursor-text>div>span>.mtk37 {color: var(--r);}.mtk36:has(+.mtk37), .mtk36+.mtk37 {color: gray;}`
    );
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
  function consumeStack(stack, key) {
    var _a;
    (_a = stack.get(key)) == null ? void 0 : _a();
    stack.delete(key);
  }
  function guardStack(stack, key, cleanup) {
    if (stack.has(key)) {
      consumeStack(stack, key);
    }
    stack.set(key, cleanup);
  }
  function parseTopStyle(node) {
    var _a, _b;
    return Number((_b = (_a = node.style) == null ? void 0 : _a.top.match(/\d+/)) == null ? void 0 : _b[0]);
  }
  function validateAddedView(node, rebootCleanup) {
    if (rebootCleanup) {
      toastConsole.error("Reboot cleanup already exists", {
        rebootCleanup
      });
      return;
    }
    if (!e(node)) {
      toastConsole.warn("Reboot added node is not HTMLElement", { node });
      return;
    }
    const rootContainer = node.querySelector(splitViewContainerSelector);
    if (!rootContainer) {
      toastConsole.warn("Reboot rootContainer not found with selector", {
        node,
        splitViewContainerSelector
      });
      return;
    }
    const [firstView, ...restViews] = rootContainer.childNodes;
    if (!e(firstView)) {
      toastConsole.warn("Reboot first view element is not HTMLElement", {
        rootContainer,
        firstView
      });
      return;
    }
    const container = findScopeElements(firstView).container;
    if (container) {
      return {
        rootContainer,
        firstView,
        container,
        restViews
      };
    } else {
      toastConsole.error("Reboot first view container not found", {
        rootContainer,
        firstView
      });
    }
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
        lineTracker.stop();
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
          "#workbench\\.parts\\.editor > div.content > div > div"
        );
        const root = gridRoot.querySelector(
          ":scope > div > div > div.monaco-scrollable-element > " + splitViewContainerSelector
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
          added: REC_added,
          removed: bruteForceRemove
        });
        function clearStacks(condition) {
          for (const stack of [recStack, editorStack, treeStack]) {
            for (const [keyNode] of stack) {
              if (condition && !condition(keyNode))
                continue;
              consumeStack(stack, keyNode);
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
        function REC_added(splitViewView) {
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
              // FIXME: this should handle the mutation callback instead of each added node
              added() {
                const elements2 = findScopeElements(splitViewView);
                if (awkwardStack(elements2)) {
                  treeTracker.stop();
                }
              },
              // TODO: this is not needed
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
        const reboot = specialChildrenMutation({
          target: () => DOM.watchForRemoval,
          options: { childList: true },
          added(node) {
            const res = validateAddedView(node, rebootCleanup);
            if (!res)
              return;
            const recursiveViewTracker = REC_EditorOverlayTracker(
              res.rootContainer
            );
            const firsContainerTracker = specialChildrenMutation({
              target: () => res.container,
              options: { childList: true },
              added() {
                REC_added(res.firstView);
              },
              removed() {
                bruteForceRemove(res.firstView);
              }
            });
            recursiveViewTracker.plug(() => res.restViews);
            firsContainerTracker.plug();
            rebootCleanup = () => {
              recursiveViewTracker.stop();
              firsContainerTracker.stop();
            };
          },
          removed: consumeRebootCleanup
        });
        function consumeRebootCleanup() {
          rebootCleanup == null ? void 0 : rebootCleanup();
          rebootCleanup = void 0;
        }
        reboot.plug();
        return () => {
          reboot.stop();
          consumeRebootCleanup();
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
  const tryFn = createTryFunction();
  const conciseSyntax = {
    activate() {
      tryFn(() => {
        syntax.activate();
        highlight.activate();
      }, "Concise Syntax Extension crashed unexpectedly when activating");
    },
    dispose() {
      tryFn(() => {
        syntax.dispose();
        highlight.dispose();
      }, "Concise Syntax Extension crashed unexpectedly when disposing");
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
