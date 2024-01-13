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
  function deltaFn(consume = false) {
    let delta;
    return {
      consume() {
        delta == null ? void 0 : delta();
        delta = void 0;
      },
      get fn() {
        return delta;
      },
      set fn(value) {
        if (consume)
          this.consume();
        delta = value;
      }
    };
  }
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
            debugger;
          } else {
            console.group("\x1B[31m\x1B[40m", `⛔ ${print}`, objects ?? {});
            console.trace();
            console.groupEnd();
            debugger;
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
    let cleanUp = deltaFn();
    const observer = specialChildrenMutation({
      target: () => options.parent,
      options: { childList: true },
      added(node) {
        const data = options.validate(node, cleanUp.fn);
        if (!data)
          return;
        const res = options.added(data);
        if (res) {
          cleanUp.fn = res;
        }
      },
      removed(node) {
        options.removed(node, cleanUp.consume);
      }
    });
    observer.plug();
    return () => {
      var _a;
      (_a = options.dispose) == null ? void 0 : _a.call(options);
      cleanUp.consume();
      observer.stop();
    };
  }
  function lifecycle(props) {
    let running = false;
    let tryFn2 = createTryFunction({ fallback: clean });
    let interval;
    let disposeObserver = deltaFn();
    let disposeActivate = deltaFn();
    function patch() {
      const dom = props.dom();
      if (running || !dom.check())
        return;
      running = true;
      clean();
      tryFn2(() => {
        disposeObserver.fn = watchForRemoval(dom.watchForRemoval, reload);
        disposeActivate.fn = props.activate(dom);
      }, "Lifecycle crashed unexpectedly when activating");
    }
    function dispose() {
      clean();
      tryFn2(() => {
        var _a;
        disposeActivate.consume();
        disposeObserver.consume();
        (_a = props.dispose) == null ? void 0 : _a.call(props);
      }, "Lifecycle crashed unexpectedly when disposing");
      running = false;
    }
    function reload(delay = 5e3) {
      dispose();
      interval = setInterval(patch, delay);
    }
    function clean() {
      clearInterval(interval);
    }
    return {
      get running() {
        return running;
      },
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
  function createHighlight({ node, selector, add, set, label, color: color2 }) {
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
				--r: .7;
		}`
    );
    return true;
  }
  function editorOverlayLifecycle(editor, _overlay, foundEditor) {
    let editorLabel = editor.getAttribute("aria-label");
    let deltaOverlay = _overlay;
    const EditorLanguageTracker = createAttributeArrayMutation({
      target: () => editor,
      watchAttribute: ["data-mode-id", "aria-label"],
      change([language, label], [, oldLabel]) {
        editorLabel = label;
        if (!language || !label) {
          if (oldLabel && label != oldLabel) {
            styles.clear(oldLabel);
          }
          return;
        }
        OverlayLineTracker.disconnect();
        if (!editor.contains(deltaOverlay)) {
          deltaOverlay = (editor == null ? void 0 : editor.querySelector(overlaySelector)) ?? deltaOverlay;
        }
        if (label.match(/(\.tsx$)|(\.tsx, )/)) {
          if (language === "typescriptreact") {
            OverlayLineTracker.observe();
            bruteForceLayoutShift(foundEditor);
          }
          if (oldLabel && label != oldLabel) {
            toastConsole.log("look! this gets executed...", oldLabel);
          }
        } else {
          styles.clear(label);
        }
      }
    });
    function mount() {
      selectedLines.clear();
      currentLines.clear();
      deltaOverlay.childNodes.forEach((node) => highlightStyles(node, true));
    }
    let selectedLines = /* @__PURE__ */ new Set();
    let currentLines = /* @__PURE__ */ new Set();
    const OverlayLineTracker = createMutation({
      target: () => deltaOverlay,
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
    let layoutShift;
    let tries = 0;
    const limit = 5;
    const lineTracker = (cb) => {
      tries += 1;
      if (tries > limit) {
        cb();
        clearInterval(layoutShift);
        return;
      }
      const line = deltaOverlay.querySelector(selectedSelector);
      if (line && !isNaN(parseTopStyle(line))) {
        mount();
      }
    };
    function bruteForceLayoutShift(cb) {
      tries = 0;
      clearInterval(layoutShift);
      layoutShift = setInterval(() => lineTracker(cb), 100);
    }
    EditorLanguageTracker.plug();
    return function dispose() {
      clearInterval(layoutShift);
      if (editorLabel) {
        styles.clear(editorLabel);
      } else {
        toastConsole.error("editorLabel is undefined");
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
          consumeStack(stack, keyNode);
        }
      }
    }
    function awkwardStack(elements) {
      const { overlay, editor } = elements;
      if (overlay && editor && !editorStack.has(editor)) {
        const foundEditor = () => {
          if (!watchForRemoval2.contains(editor)) {
            toastConsole.error("Editor not found _editorObservable");
            return;
          }
          _editorObservable.value = editor.getAttribute("aria-label");
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
    stale: "stale",
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
  const calibrationFileName = "syntax.tsx";
  const calibrate = {
    opening: "opening",
    opened: "opened",
    closed: "closed",
    idle: "idle",
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
  const symbolTable = {
    openTag: {
      match: /<|<\//,
      lowerCase({ siblings, current }) {
        var _a;
        const tag = siblings[siblings.indexOf(current) + 1];
        if (((_a = tag.textContent) == null ? void 0 : _a.toLowerCase()) === tag.textContent) {
          return tag;
        }
      },
      upperCase({ siblings, current }) {
        var _a;
        const tag = siblings[siblings.indexOf(current) + 1];
        if ((_a = tag.textContent) == null ? void 0 : _a.match(/^[A-Z]/)) {
          return tag;
        }
      }
    },
    text: { match: /Hello\sConcise\sSyntax!/ },
    comaSeparator: {
      match: /,/,
      capture({ siblings, current }) {
        const next = siblings[siblings.indexOf(current) + 1];
        if (next) {
          return current;
        }
      }
    },
    ternaryOperator: { match: /\?/ }
  };
  const lastSymbolTable = {
    closeTag: {
      match: /(>|\/>)$/,
      capture({ siblings }) {
        return siblings[siblings.length - 1];
      }
    },
    lastSemicolon: {
      match: /;$/,
      capture({ siblings }) {
        return siblings[siblings.length - 1];
      }
    },
    lastComa: {
      match: /,$/,
      capture({ siblings }) {
        return siblings[siblings.length - 1];
      }
    },
    jsxBracket: {
      match: /={{$/,
      capture({ siblings }) {
        return siblings[siblings.length - 2];
      }
    },
    ternaryOtherwise: {
      match: /\).+?:.+\}/,
      // FIXME: type me
      capture({ siblings, current }) {
        return siblings;
      }
    }
  };
  const multipleSymbolTale = {
    quotes: {
      match: /"|'|`/,
      string({ siblings, current }) {
        var _a;
        const beginQuote = current.textContent;
        const string = siblings[siblings.indexOf(current) + 1];
        const end = siblings[siblings.indexOf(current) + 2];
        const endQuote = end == null ? void 0 : end.textContent;
        if ((beginQuote == null ? void 0 : beginQuote.length) == 1 && ((_a = string == null ? void 0 : string.textContent) == null ? void 0 : _a.length) && beginQuote === endQuote) {
          return [current, string, end];
        } else if ((beginQuote == null ? void 0 : beginQuote.length) > 2 && (beginQuote == null ? void 0 : beginQuote.match(/("|'|`)$/))) {
          return [current];
        }
      }
    }
  };
  function parseSymbolColors(lineEditor) {
    var _a, _b;
    const lines = Array.from(lineEditor.querySelectorAll("div>span"));
    let table = Clone(symbolTable);
    let lastTable = Clone(lastSymbolTable);
    let multipleTable = Clone(multipleSymbolTale);
    let output = {};
    for (const line2 of lines) {
      const text = line2.textContent;
      if (!text)
        continue;
      const siblings = Array.from(line2.children);
      for (let current of siblings) {
        const content = current.textContent;
        for (let key in table) {
          const regex = table[key].match;
          const match = content == null ? void 0 : content.match(regex);
          if (!match)
            continue;
          output[key] ?? (output[key] = {});
          delete table[key].match;
          for (let conditionKey in table[key]) {
            const evaluation = table[key][conditionKey]({
              siblings,
              current
            });
            if (evaluation) {
              output[key][conditionKey] = getProcess(evaluation, match[0]);
              delete table[key][conditionKey];
            }
          }
          if (Object.keys(table[key]).length === 0) {
            (_a = output[key]).capture ?? (_a.capture = getProcess(current, match[0]));
            delete table[key];
          } else {
            table[key].match = regex;
          }
        }
        for (let key in multipleTable) {
          const regex = multipleTable[key].match;
          const match = content == null ? void 0 : content.match(regex);
          if (!match)
            continue;
          output[key] ?? (output[key] = {});
          delete multipleTable[key].match;
          for (let conditionKey in multipleTable[key]) {
            const evaluations = multipleTable[key][conditionKey]({
              siblings,
              current
            });
            if (evaluations) {
              output[key][conditionKey] = evaluations.map(getProcess);
              delete multipleTable[key][conditionKey];
            }
          }
          if (Object.keys(multipleTable[key]).length === 0) {
            (_b = output[key]).capture ?? (_b.capture = getProcess(current, match[0]));
            delete multipleTable[key];
          } else {
            multipleTable[key].match = regex;
          }
        }
      }
      for (let key in lastTable) {
        const regex = lastTable[key].match;
        const match = text == null ? void 0 : text.match(regex);
        if (!match)
          continue;
        output[key] ?? (output[key] = {});
        const evaluation = lastTable[key].capture({
          siblings
        });
        if (evaluation) {
          output[key].capture = getProcess(evaluation, match[0]);
          delete lastTable[key];
        }
      }
    }
    const process = output;
    const angleBracketSelector = setToSelector(
      process.openTag.capture,
      process.closeTag.capture
    );
    const anyTagSelector = `${angleBracketSelector}+${setToSelector(
      process.openTag.lowerCase,
      process.openTag.upperCase
    )}`;
    const lowerCaseTagSelector = `${angleBracketSelector}+${classSelector(
      process.openTag.lowerCase
    )}`;
    const upperCaseTagSelector = `${angleBracketSelector}+${classSelector(
      process.openTag.upperCase
    )}`;
    const jsxBracketSelector = "." + process.jsxBracket.capture.className.split(" ").shift();
    const stringEl = process.quotes.string[0];
    const beginQuote = stringEl.className;
    const endQuoteEl = process.quotes.string[2] ?? stringEl;
    const endQuote = endQuoteEl.className;
    let ternaryOtherWiseSelector;
    const closing7 = SliceClassListC(process.ternaryOtherwise.capture, -7);
    const joinLastChild = (c) => c.reduce((acc, val) => acc + "." + val + "+", "").slice(0, -1) + ":last-child";
    if (closing7.okLength) {
      ternaryOtherWiseSelector = joinLastChild(toFlatClassList(closing7));
    } else {
      const closing5 = SliceClassListC(process.ternaryOtherwise.capture, -5);
      ternaryOtherWiseSelector = joinLastChild(toFlatClassList(closing5));
    }
    const opacitySelectors = {
      angleBrackets: {
        selector: angleBracketSelector,
        color: color(process.openTag.capture)
      },
      lastComa: {
        selector: lastChildSelector(process.lastComa.capture),
        color: color(process.lastComa.capture)
      },
      lastSemicolon: {
        selector: lastChildSelector(process.lastSemicolon.capture),
        color: color(process.lastSemicolon.capture)
      },
      beginQuote: {
        selector: "." + beginQuote,
        color: color(stringEl)
      },
      endQuote: {
        selector: "." + endQuote,
        color: color(endQuoteEl)
      }
    };
    const selectorOnly = {
      closingJsxElementLowerCase: {
        selector: `${lowerCaseTagSelector}:has(+${angleBracketSelector}:last-child)`
      },
      closingJsxElementUpperCase: {
        selector: `${upperCaseTagSelector}:has(+${angleBracketSelector}:last-child)`
      },
      singleQuotes: {
        selector: `:is([class="${beginQuote}"]:has(+.${endQuote}), [class="${beginQuote}"]+.${endQuote})`
      },
      jsxBracket: {
        selector: jsxBracketSelector
      },
      ternaryClosingBrace: {
        selector: `${jsxBracketSelector}~${classSelector(
          process.ternaryOperator.capture
        )}~[class*="bracket-highlighting-"]:last-child`
      }
    };
    const colorOnly = {
      closingJsxElementLowerCase: {
        selector: `${lowerCaseTagSelector}`,
        color: color(process.openTag.lowerCase)
      },
      closingJsxElementUpperCase: {
        selector: `${upperCaseTagSelector}`,
        color: color(process.openTag.upperCase)
      },
      commaSeparator: {
        selector: classSelector(process.comaSeparator.capture),
        color: color(process.comaSeparator.capture)
      },
      ternaryClosingBrace: {
        selector: classSelector(process.ternaryOperator.capture),
        color: color(process.ternaryOperator.capture)
      }
    };
    const ternaryOtherwise = {
      scope: `:has(${ternaryOtherWiseSelector})`
    };
    const line = "div>span";
    const root = `${linesSelector}>${line}`;
    const payload = { opacitySelectors, selectorOnly, colorOnly };
    return {
      payload,
      process(_payload) {
        for (let key in payload) {
          for (let key2 in payload[key]) {
            if (_payload[key][key2]) {
              payload[key][key2].color = _payload[key][key2].color;
            }
          }
        }
        const { opacitySelectors: opacitySelectors2, selectorOnly: selectorOnly2, colorOnly: colorOnly2 } = payload;
        const opacityValues = Object.values(opacitySelectors2);
        const selectorValues = [...opacityValues, ...Object.values(selectorOnly2)];
        const toUnion = selectorValues.map((f) => f.selector).join(",");
        const toColorValue = [...opacityValues, ...Object.values(colorOnly2)].map(
          (f) => `${root} ${f.selector} {
							color: ${f.color};
						}`
        );
        return `
			.view-lines {
				--r: 0;
			}
			.view-lines > div:hover,
			${root}>${selectorOnly2.singleQuotes.selector} {
				--r: 1;
			}
			.view-lines:has(:is(${toUnion},${anyTagSelector}):hover),
			.view-lines:has(${line}:hover ${ternaryOtherWiseSelector}) {
				--r: .5;
			}
			${root} :is(${toUnion}),
			${root}:is(${ternaryOtherwise.scope}) {
				opacity: var(--r);
			}
			${toColorValue.join("\n")}
			`;
      }
    };
  }
  function classSelector(element) {
    return `.${Array.from(element.classList).join(".")}`;
  }
  function lastChildSelector(element) {
    return `${classSelector(element)}:last-child`;
  }
  function setToSelector(...elements) {
    const c = [...new Set(elements.map(classSelector))];
    if (c.length === 1) {
      return c[0];
    } else {
      return `:is(${c.join(", ")})`;
    }
  }
  function SliceClassListC(siblings, slice) {
    const sliced = siblings.slice(slice).map((c) => Array.from(c.classList));
    return Object.assign(sliced, { okLength: sliced.length == slice * -1 });
  }
  function color(element) {
    var _a;
    return (_a = element.computedStyleMap().get("color")) == null ? void 0 : _a.toString();
  }
  function getProcess(span, match) {
    return span;
  }
  function toFlatClassList(Array2) {
    return Array2.reduce(
      (acc, val) => acc.concat(val.join(".")),
      []
    );
  }
  function Clone(o, m) {
    if ("object" !== typeof o)
      return o;
    if ("object" !== typeof m || null === m)
      m = /* @__PURE__ */ new WeakMap();
    let n = m.get(o);
    if ("undefined" !== typeof n)
      return n;
    let c = Object.getPrototypeOf(o).constructor;
    switch (c) {
      case Boolean:
      case Error:
      case Function:
      case Number:
      case Promise:
      case String:
      case Symbol:
      case WeakMap:
      case WeakSet:
        n = o;
        break;
      case Array:
        m.set(o, n = o.slice(0));
        n.forEach(function(v, i) {
          if ("object" === typeof v)
            n[i] = Clone(v, m);
        });
        break;
      case ArrayBuffer:
        m.set(o, n = o.slice(0));
        break;
      case DataView:
        m.set(
          o,
          // @ts-ignore
          n = new c(Clone(o.buffer, m), o.byteOffset, o.byteLength)
        );
        break;
      case Map:
      case Set:
        m.set(o, n = new c(Clone(Array.from(o.entries()), m)));
        break;
      case Int8Array:
      case Uint8Array:
      case Uint8ClampedArray:
      case Int16Array:
      case Uint16Array:
      case Int32Array:
      case Uint32Array:
      case Float32Array:
      case Float64Array:
        m.set(o, n = new c(Clone(o.buffer, m), o.byteOffset, o.length));
        break;
      case Date:
      case RegExp:
        m.set(o, n = new c(o));
        break;
      default:
        m.set(o, n = Object.assign(new c(), o));
        for (c in n)
          if ("object" === typeof n[c])
            n[c] = Clone(n[c], m);
    }
    return n;
  }
  function createObservable(initialValue) {
    let _value = initialValue;
    let _subscribers = [];
    let _toDispose = /* @__PURE__ */ new Map();
    function splice(sub) {
      var _a;
      _subscribers = _subscribers.filter((fn) => fn !== sub);
      (_a = _toDispose.get(sub)) == null ? void 0 : _a.forEach((fn) => typeof fn === "function" && fn());
      _toDispose.delete(sub);
    }
    return {
      get value() {
        return _value;
      },
      set value(payload) {
        if (_value === payload)
          return;
        _value = payload;
        this.notify();
      },
      notify() {
        for (let i = 0; i < _subscribers.length; i++) {
          const sub = _subscribers[i];
          const res = sub(_value);
          if (typeof res === "function") {
            _toDispose.set(sub, (_toDispose.get(sub) || []).concat(res));
          } else if (res === "Symbol.dispose") {
            splice(sub);
            i -= 1;
          }
        }
      },
      /**
       * Subscribe without calling the callback immediately
       */
      $ubscribe(sub) {
        _subscribers.push(sub);
        return () => splice(sub);
      }
    };
  }
  const editorObservable = createObservable(void 0);
  const stateObservable = createObservable(void 0);
  const calibrateObservable = createObservable(void 0);
  const sessionKey = `${extensionId}.session.styles`;
  function cacheProc() {
    try {
      const cache = window.localStorage.getItem(sessionKey);
      if (cache)
        syntaxStyle.styleIt(cache);
      else
        throw new Error("cache is empty");
    } catch (error) {
      window.localStorage.removeItem(sessionKey);
    }
  }
  const calibrateStyle = createStyles("calibrate");
  calibrateStyle.styleIt(`${ICalibrate.selector}{display: none !important}`);
  let previous_style_color_table_snapshot;
  const createCalibrateSubscription = () => calibrateObservable.$ubscribe((state2) => {
    if (!(state2 == calibrate.opened || state2 == calibrate.idle))
      return;
    const lineEditor = document.querySelector(`[data-uri$="concise-syntax/out/${calibrationFileName}"] ${viewLinesSelector}`);
    if (!lineEditor) {
      return toastConsole.error("Calibrate Editor not found");
    }
    try {
      if (state2 == calibrate.opened) {
        const res = parseSymbolColors(lineEditor);
        previous_style_color_table_snapshot = res.payload;
        return;
      }
      if (!previous_style_color_table_snapshot) {
        throw new Error("previousPayload is undefined");
      } else if (state2 == calibrate.idle) {
        const res = parseSymbolColors(lineEditor);
        const css = res.process(previous_style_color_table_snapshot);
        window.localStorage.setItem(sessionKey, css);
        if (css) {
          requestAnimationFrame(() => syntaxStyle.styleIt(css));
          if (!highlight.running) {
            highlight.activate(500);
          }
        }
      }
    } catch (error) {
      toastConsole.error("Failed to calibrate editor");
    }
  });
  const createEditorSubscription = () => editorObservable.$ubscribe((value) => {
    if (!value)
      return;
    cacheProc();
    return "Symbol.dispose";
  });
  const syntaxStyle = createStyles("hide");
  const createStateSubscription = () => stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      if (!calibration.running) {
        calibration.activate(500);
        let unSubscribers = [createCalibrateSubscription()];
        cacheProc();
        if (!highlight.running) {
          highlight.activate(500);
          unSubscribers.push(createEditorSubscription());
        }
        return () => unSubscribers.forEach((un) => un());
      }
    } else {
      syntaxStyle.dispose();
      highlight.dispose();
      calibration.dispose();
    }
  });
  const syntax = createSyntaxLifecycle(stateObservable, IState);
  const calibration = createSyntaxLifecycle(calibrateObservable, ICalibrate);
  const highlight = createHighlightLifeCycle(editorObservable);
  const deltaDispose = deltaFn();
  const tryFn = createTryFunction();
  const conciseSyntax = {
    activate() {
      tryFn(() => {
        deltaDispose.consume();
        syntax.activate();
        const unSubscribeState = createStateSubscription();
        deltaDispose.fn = () => {
          tryFn(() => {
            syntax.dispose();
            stateObservable.value = state.inactive;
            unSubscribeState();
          }, "Failed to dispose concise-syntax");
        };
      }, "Failed to activate concise-syntax");
    },
    dispose: deltaDispose.consume
  };
  if (window.conciseSyntax) {
    window.conciseSyntax.dispose();
  }
  window.conciseSyntax = conciseSyntax;
  conciseSyntax.activate();
  console.log(extensionId, conciseSyntax);
});
//# sourceMappingURL=workbench.js.map
