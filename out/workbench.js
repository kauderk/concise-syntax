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
  const bridgeBetweenVscodeExtension = "aria-label";
  const editorSelector = ".editor-instance";
  const idSelector = '[data-mode-id="typescriptreact"]';
  const viewLinesSelector = ".view-lines.monaco-mouse-cursor-text";
  const linesSelector = idSelector + ` ` + viewLinesSelector;
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
          if (level == "log") {
            console.groupCollapsed(print, objects ?? {});
            console.trace();
            console.groupEnd();
          } else if (level == "warn") {
            console.group("\x1B[33m\x1B[40m", `⚠ ${print}`, objects ?? {});
            console.trace();
            console.groupEnd();
          } else {
            console.group("\x1B[31m\x1B[40m", `⛔ ${print}`, objects ?? {});
            console.trace();
            console.groupEnd();
          }
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
  function innerChildrenMutation(options) {
    let cleanUp;
    const observer = specialChildrenMutation({
      target: () => options.parent,
      options: { childList: true },
      added(node) {
        const data = options.validate(node, cleanUp);
        if (!data)
          return;
        const res = options.added(data);
        if (res) {
          cleanUp = res;
        }
      },
      removed(node) {
        options.removed(node, consume);
      }
    });
    function consume() {
      cleanUp == null ? void 0 : cleanUp();
      cleanUp = void 0;
    }
    observer.plug();
    return () => {
      var _a;
      (_a = options.dispose) == null ? void 0 : _a.call(options);
      consume();
      observer.stop();
    };
  }
  function lifecycle(props) {
    let running2 = false;
    let tryFn2 = createTryFunction({ fallback: clean });
    let interval;
    let disposeObserver;
    let disposeActivate;
    function patch() {
      const dom = props.dom();
      if (running2 || !dom.check())
        return;
      running2 = true;
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
        running2 = false;
      }, "Lifecycle crashed unexpectedly when disposing");
    }
    function reload(delay = 5e3) {
      dispose();
      interval = setInterval(patch, delay);
    }
    function clean() {
      clearInterval(interval);
    }
    return {
      activate(delay = 5e3) {
        if (tryFn2.guard("Lifecycle already crashed therefore not activating again")) {
          return;
        }
        reload(delay);
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
  function createSyntaxLifecycle(observable, state2) {
    return lifecycle({
      dom() {
        const statusBar = document.querySelector("footer .right-items");
        return {
          watchForRemoval: statusBar,
          check() {
            return !!document.contains(statusBar == null ? void 0 : statusBar.parentNode);
          }
        };
      },
      activate(DOM) {
        return innerChildrenMutation({
          parent: DOM.watchForRemoval,
          validate(node, busy) {
            var _a;
            if (busy)
              return;
            const item = (_a = DOM.watchForRemoval) == null ? void 0 : _a.querySelector(state2.selector);
            const icon = item == null ? void 0 : item.querySelector(".codicon");
            if (!item || !icon)
              return;
            return { icon, item };
          },
          added(dom) {
            const attributeObserver = createAttributeArrayMutation({
              target: () => dom.item,
              watchAttribute: [bridgeBetweenVscodeExtension],
              change([bridge]) {
                const delta = state2.decode(bridge);
                if (!delta || observable.value === delta)
                  return;
                observable.value = delta;
              }
            });
            attributeObserver.plug();
            return attributeObserver.stop;
          },
          removed(node, consume) {
            if (node.matches(state2.selector)) {
              consume();
            }
          }
        });
      }
    });
  }
  function clear(label) {
    stylesContainer.querySelectorAll(label ? `[aria-label="${label}"]` : "[aria-label]").forEach((style) => style.remove());
  }
  const styles = {
    clear(label) {
      clear(label);
    },
    clearOverlays() {
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
    let container = findScopeElements(firstView).container;
    if (!container) {
      container = firstView.querySelector(".editor-container");
      if (!container) {
        toastConsole.warn("Reboot container not found even without :scope selector", {
          firstView,
          container
        });
      }
    }
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
  function createHighlightLifeCycle(_editorObservable) {
    return lifecycle({
      // prettier-ignore
      dom() {
        var _a;
        const gridRoot = document.querySelector("#workbench\\.parts\\.editor > div.content > div > div");
        const root = gridRoot.querySelector(":scope > div > div > div.monaco-scrollable-element > " + splitViewContainerSelector);
        const editor = root == null ? void 0 : root.querySelector(idSelector);
        const overlays = (_a = editor == null ? void 0 : editor.querySelector(highlightSelector)) == null ? void 0 : _a.parentElement;
        return {
          check: () => !!overlays,
          watchForRemoval: gridRoot
        };
      },
      activate(DOM) {
        const structure = createStackStructure(
          DOM.watchForRemoval,
          _editorObservable
        );
        return innerChildrenMutation({
          parent: DOM.watchForRemoval,
          dispose: structure.clearStacks,
          validate: validateAddedView,
          added(res) {
            const recursiveViewTracker = structure.REC_EditorOverlayTracker(
              res.rootContainer
            );
            const firsContainerTracker = specialChildrenMutation({
              target: () => res.container,
              options: { childList: true },
              added() {
                structure.REC_added(res.firstView);
              },
              removed() {
                structure.bruteForceRemove(res.firstView);
              }
            });
            recursiveViewTracker.plug(() => res.restViews);
            firsContainerTracker.plug();
            return () => {
              recursiveViewTracker.stop();
              firsContainerTracker.stop();
            };
          },
          removed(node, consume) {
            consume();
          }
        });
      },
      dispose() {
        styles.clearOverlays();
      }
    });
  }
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
  function editorOverlayLifecycle(editor, overlay, foundEditor) {
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
            foundEditor();
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
    let tries = 0;
    const lineTracker = () => {
      const line = overlay.querySelector(selectedSelector);
      if (!line || tries > 5) {
        clearInterval(layoutShift);
        return;
      }
      const top = parseTopStyle(line);
      if (!isNaN(top)) {
        tries += 1;
        mount();
      }
    };
    mount();
    EditorLanguageTracker.plug();
    const layoutShift = setInterval(lineTracker, 500);
    return function dispose() {
      tries = 6;
      clearInterval(layoutShift);
      if (editorLabel) {
        styles.clear(editorLabel);
      } else {
        toastConsole.log("editorLabel is undefined");
      }
      EditorLanguageTracker.disconnect();
      OverlayLineTracker.disconnect();
    };
  }
  function createStackStructure(watchForRemoval2, _editorObservable) {
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
          if (stack === editorStack)
            _editorObservable.value = false;
          consumeStack(stack, keyNode);
        }
      }
    }
    function awkwardStack(elements) {
      const { overlay, editor } = elements;
      if (overlay && editor && !editorStack.has(editor)) {
        const foundEditor = () => {
          _editorObservable.value = true;
        };
        editorStack.set(
          editor,
          editorOverlayLifecycle(editor, overlay, foundEditor)
        );
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
      clearStacks((keyNode) => !watchForRemoval2.contains(keyNode));
    }
    return {
      REC_EditorOverlayTracker,
      clearStacks,
      REC_added,
      bruteForceRemove
    };
  }
  const stateIcon = "symbol-keyword";
  const state = {
    active: "active",
    inactive: "inactive",
    disposed: "disposed",
    error: "error"
  };
  const IState = {
    selector: iconSelector(stateIcon),
    encode(state2) {
      return `Concise Syntax: ${state2}`;
    },
    /**
     * VSCode will reinterpret the string: "<?icon>  <extensionName>, <?IState.encode>"
     * @param string
     * @returns
     */
    decode(string) {
      return Object.values(state).reverse().find((state2) => string == null ? void 0 : string.includes(state2));
    }
  };
  const calibrateIcon = "go-to-file";
  const calibrate = {
    opening: "opening",
    opened: "opened",
    closed: "closed",
    error: "error"
  };
  const ICalibrate = {
    selector: iconSelector(calibrateIcon),
    encode(state2) {
      return `Concise Syntax (calibrate): ${state2}`;
    },
    /**
     * VSCode will reinterpret the string: "<?icon>  <extensionName>, <?IState.encode>"
     * @param string
     * @returns
     */
    decode(string) {
      return Object.values(calibrate).reverse().find((state2) => string == null ? void 0 : string.includes(state2));
    }
  };
  function iconSelector(icon) {
    return `[id="${extensionId}"]:has(.codicon-${icon})`;
  }
  const editorFlags = {
    jsx: {
      flags: {
        jsxTag: null,
        jsxTernaryBrace: null,
        jsxTernaryOtherwise: null,
        vsCodeHiddenTokens: null,
        beginQuote: null,
        endQuote: null
      },
      customFlags: {
        singleQuotes: null
      }
    }
  };
  function TryRegexToDomToCss(lineEditor) {
    editorFlags.jsx = jsx_parseStyles(lineEditor, editorFlags.jsx);
    window.editorFlags = editorFlags;
    return assembleCss(editorFlags.jsx);
  }
  function jsx_parseStyles(lineEditor, editorFlag) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const flags = editorFlag.flags;
    const customFlags = editorFlag.customFlags;
    if (isDone())
      return editorFlag;
    const lines = Array.from(lineEditor.querySelectorAll("div>span"));
    parser:
      for (const line of lines) {
        const text = line.textContent;
        if (!text)
          continue;
        let anyFlag = false;
        if (!flags.jsxTag && ((_b = (_a = text.match(/.+(<\/(?<jsxTag>.*)?>)$/)) == null ? void 0 : _a.groups) == null ? void 0 : _b.jsxTag)) {
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
        } else if (!flags.jsxTernaryBrace && ((_d = (_c = text.match(/(\{).+\?.+?(?<jsxTernaryBrace>\()$/)) == null ? void 0 : _c.groups) == null ? void 0 : _d.jsxTernaryBrace)) {
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
        } else if (!flags.jsxTernaryOtherwise && ((_f = (_e = text.match(/(?<jsxTernaryOtherwise>\).+?:.+\})/)) == null ? void 0 : _e.groups) == null ? void 0 : _f.jsxTernaryOtherwise)) {
          let selector;
          const closing7 = SliceClassList(line, -7);
          if (closing7.okLength) {
            const [blank0, closeBrace, blank, colon, blank2, nullIsh, closeBracket] = toFlatClassList(closing7);
            selector = `.${blank0}+.${closeBrace}+.${blank}+.${colon}+.${blank2}+.${nullIsh}+.${closeBracket}:last-child`;
          } else {
            const closing5 = SliceClassList(line, -5);
            if (!closing5.okLength)
              continue;
            const [blank0, closeBrace, colonBlank, nullIsh, closeBracket] = toFlatClassList(closing5);
            selector = `.${blank0}+.${closeBrace}+.${colonBlank}+.${nullIsh}+.${closeBracket}:last-child`;
          }
          flags.jsxTernaryOtherwise = {
            // find ") : null}" then hide it all
            hide: `:has(${selector}) *`,
            hover: selector
          };
          anyFlag = true;
        } else if (!customFlags.singleQuotes && ((_h = (_g = text.match(/(?<singleQuotes>""|''|``)/)) == null ? void 0 : _g.groups) == null ? void 0 : _h.singleQuotes)) {
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
        if (anyFlag && isDone()) {
          break parser;
        }
      }
    function isDone() {
      return Object.values(flags).every((f) => !!f) && Object.values(customFlags).every((f) => !!f);
    }
    return { flags, customFlags };
  }
  function assembleCss(editorFlags2) {
    var _a;
    const root = `${linesSelector}>div>span`;
    const { flags, customFlags } = editorFlags2;
    const validFlags = Object.values(flags).filter(
      (f) => !!((f == null ? void 0 : f.hide) && f.hover)
    );
    if (!validFlags.length || !((_a = flags.vsCodeHiddenTokens) == null ? void 0 : _a.hover)) {
      console.warn("Fail to find common case");
      return;
    }
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
		`;
  }
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
  function createObservable(initialValue) {
    let _value = initialValue;
    let _subscribers = [];
    return {
      get value() {
        return _value;
      },
      set value(payload) {
        this.set(payload);
      },
      set(payload) {
        if (_value === payload)
          return;
        _value = payload;
        this.notify();
      },
      notify() {
        _subscribers.forEach((observer) => {
          observer(_value);
        });
      },
      subscribe(cb) {
        _subscribers.push(cb);
        cb(_value);
        return () => {
          _subscribers = _subscribers.filter((o) => o !== cb);
        };
      },
      /**
       * Subscribe without calling the callback immediately
       */
      $ubscribe(cb) {
        _subscribers.push(cb);
        return () => {
          _subscribers = _subscribers.filter((o) => o !== cb);
        };
      }
    };
  }
  const editorObservable = createObservable(void 0);
  const stateObservable = createObservable(void 0);
  const calibrateObservable = createObservable(void 0);
  let calibrateUnsubscribe;
  let createCalibrateSubscription = () => calibrateObservable.$ubscribe((value) => {
    if (value != calibrate.opened)
      return;
    debugger;
    const x = new or_return(
      () => document.querySelector(`[data-uri$="concise-syntax/out/syntax.tsx"] ${viewLinesSelector}`),
      () => toastConsole.error("Line Editor not found")
    ).or_return(
      TryRegexToDomToCss,
      () => toastConsole.error("Line Editor not found")
    ).finally((css) => {
      debugger;
      syntaxStyle.styleIt(css);
      stateObservable.notify();
      return 0;
    });
    debugger;
    console.log(x);
  });
  class or_return {
    constructor(fn, onError) {
      this.fn = fn;
      this.onError = onError;
      this.fn = fn;
      this.onError = onError;
    }
    finally(fn) {
      try {
        const value = this.fn();
        if (value) {
          return fn(value);
        } else {
          this.onError();
        }
      } catch (error) {
        this.onError();
      }
    }
    or_return(fn, onError) {
      try {
        const value = this.fn();
        if (value) {
          return new or_return(() => fn(value), onError);
        } else {
          this.onError();
        }
      } catch (error) {
        this.onError();
      }
      return new or_return(console.log, console.error);
    }
  }
  const syntaxStyle = createStyles("hide");
  let unsubscribeState = () => {
  };
  let running = false;
  const createStateSubscription = () => stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      if (running)
        return;
      running = true;
      highlight.activate(500);
      calibrateUnsubscribe = createCalibrateSubscription();
      calibration.activate(500);
    } else {
      running = false;
      highlight.dispose();
      syntaxStyle.dispose();
      calibrateUnsubscribe == null ? void 0 : calibrateUnsubscribe();
      calibrateUnsubscribe = void 0;
      calibration.dispose();
    }
  });
  const syntax = createSyntaxLifecycle(stateObservable, IState);
  const calibration = createSyntaxLifecycle(calibrateObservable, ICalibrate);
  const highlight = createHighlightLifeCycle(editorObservable);
  const tryFn = createTryFunction();
  const conciseSyntax = {
    activate() {
      tryFn(() => {
        syntax.activate();
        unsubscribeState = createStateSubscription();
      }, "Concise Syntax Extension crashed unexpectedly when activating");
    },
    dispose() {
      tryFn(() => {
        syntax.dispose();
        stateObservable.value = state.inactive;
        unsubscribeState();
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
