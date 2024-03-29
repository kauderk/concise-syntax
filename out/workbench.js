(function(factory) {
  typeof ignoreDefine === "function" && ignoreDefine.amd ? ignoreDefine(factory) : factory();
})(function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

  const publisher = "kauderk";
  const extensionName = `concise-syntax`;
  const extensionDisplayName = `Concise Syntax`;
  const calibrateWindowCommandPlaceholder = `Calibrate Window`;
  const extensionId = `${publisher}.${extensionName}`;
  const extensionScriptSrc = `${extensionId}.js`;
  const windowId = `window.${extensionId}`;
  const bridgeBetweenVscodeExtension = "aria-label";
  const editorSelector = ".editor-instance";
  const idSelector = '[data-mode-id="typescriptreact"]';
  const viewLinesSelector = ".view-lines.monaco-mouse-cursor-text";
  const linesSelector = `${idSelector} ${viewLinesSelector}`;
  const overlaySelector = ".view-overlays";
  const highlightSelector = `${idSelector} ${overlaySelector}`;
  const selectedSelector = ".selected-text";
  const currentSelector = ".current-line";
  const splitViewContainerSelector = ".split-view-container";
  const calibrateTimeout = 5e3;
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
  function createTask$1() {
    let resolve = (value) => {
    }, reject = (value) => {
    };
    const promise = new Promise((_resolve, _reject) => {
      reject = _reject;
      resolve = _resolve;
    });
    return { promise, resolve, reject };
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
  const workbenchScript = document.querySelector(`[src*="${extensionScriptSrc}"]`);
  workbenchScript == null ? void 0 : workbenchScript.setAttribute("state", "stale");
  document.head.appendChild(workbenchScript);
  function addRemoveRootStyles(add) {
    if (add) {
      workbenchScript == null ? void 0 : workbenchScript.setAttribute("state", "active");
      document.head.appendChild(stylesContainer);
    } else {
      workbenchScript == null ? void 0 : workbenchScript.setAttribute("state", "inactive");
      stylesContainer.remove();
    }
  }
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
    let tryFn = createTryFunction({ fallback: clean });
    let interval;
    let disposeObserver = deltaFn();
    let disposeActivate = deltaFn();
    function patch() {
      const dom = props.dom();
      if (running || !dom.check())
        return;
      running = true;
      clean();
      tryFn(() => {
        disposeObserver.fn = watchForRemoval(
          dom.watchForRemoval,
          function reload(delay = 5e3) {
            dispose();
            interval = setInterval(patch, delay);
          }
        );
        disposeActivate.fn = props.activate(dom);
      }, "Lifecycle crashed unexpectedly when activating");
    }
    function dispose() {
      clean();
      tryFn(() => {
        var _a;
        disposeActivate.consume();
        disposeObserver.consume();
        (_a = props.dispose) == null ? void 0 : _a.call(props);
      }, "Lifecycle crashed unexpectedly when disposing");
      running = false;
    }
    function clean() {
      clearInterval(interval);
    }
    return {
      get running() {
        return running;
      },
      activate(delay = 5e3) {
        if (running) {
          debugger;
          toastConsole.error(
            "Lifecycle already running, entering an impossible state"
          );
        }
        if (tryFn.guard("Lifecycle already crashed therefore not activating again")) {
          return;
        }
        clean();
        interval = setInterval(patch, delay);
      },
      dispose() {
        if (tryFn.guard("Lifecycle already crashed therefore not disposing again")) {
          return;
        }
        dispose();
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
  const OpacityNames = {
    base: "b",
    selected: "s",
    current: "c",
    hoverAll: "ha",
    hoverLine: "hl",
    bleedCurrentLines: "bcl"
  };
  const DefaultOpacity = {
    base: 0,
    selected: 0.5,
    current: 0.6,
    hoverAll: 0.7,
    hoverLine: 1,
    bleedCurrentLines: 1
  };
  const OpacityTable = Object.entries(DefaultOpacity).reduce(
    (acc, [key, value]) => {
      acc[key] = `var(--${key},${value})`;
      return acc;
    },
    {}
  );
  const cssOpacityName = "--concise-syntax-opacity";
  const calibrationFileName = "syntax.tsx";
  const calibrate = {
    bootUp: "bootUp",
    opening: "opening",
    opened: "opened",
    closed: "closed",
    idle: "idle",
    error: "error"
  };
  const stateIcon = "symbol-keyword";
  const state = {
    resetDev: "resetDev",
    active: "active",
    inactive: "inactive",
    stale: "stale",
    disposed: "disposed",
    error: "error"
  };
  const IState = {
    selector: `[id="${extensionId}"]:has(.codicon-${stateIcon})`,
    encode(input) {
      const opacities = Object.entries(OpacityNames).reduce(
        (acc, [key, value]) => {
          acc[value] = input.opacities[key];
          return acc;
        },
        {}
      );
      return `Concise Syntax: ${input.state},${input.calibrate},${JSON.stringify(
        opacities
      )}`;
    },
    /**
     * VSCode will reinterpret the string: "<?icon>  <extensionName>, <?IState.encode>"
     * @param encoded
     * @returns
     */
    decode(encoded) {
      var _a, _b, _c, _d, _e, _f;
      if (!encoded)
        return {};
      const regex = /Concise Syntax: (?<state>\w+),(?<calibrate>\w+),(?<opacities>\{.+\})/;
      const _opacities = JSON.parse(
        ((_b = (_a = regex.exec(encoded)) == null ? void 0 : _a.groups) == null ? void 0 : _b.opacities) ?? "{}"
      );
      return {
        state: (_d = (_c = regex.exec(encoded)) == null ? void 0 : _c.groups) == null ? void 0 : _d.state,
        calibrate: (_f = (_e = regex.exec(encoded)) == null ? void 0 : _e.groups) == null ? void 0 : _f.calibrate,
        opacities: Object.entries(OpacityNames).reduce((acc, [key, value]) => {
          acc[key] = _opacities[value];
          return acc;
        }, {})
      };
    }
  };
  const enumStates = [
    ...Object.values(state),
    ...Object.values(calibrate)
  ];
  function createSyntaxLifecycle(observables, IState2, props) {
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
            const item = (_a = DOM.watchForRemoval) == null ? void 0 : _a.querySelector(IState2.selector);
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
                Object.entries(IState2.decode(bridge)).forEach(([key, delta]) => {
                  if (key == "opacities" && typeof delta === "object") {
                    let diff = false;
                    for (const [key2, value] of Object.entries(delta)) {
                      if (isNaN(Number(value)))
                        continue;
                      if (observables.opacities.value[key2] === value)
                        continue;
                      observables.opacities.value[key2] = value;
                      diff = true;
                    }
                    if (diff) {
                      observables.opacities.value = {
                        ...observables.opacities.value
                      };
                    }
                    return;
                  }
                  if (!(key == "state" || key == "calibrate"))
                    return;
                  let _delta = enumStates.find((state2) => state2 == delta);
                  if (!_delta || observables[key].value === _delta)
                    return;
                  observables[key].value = _delta;
                });
              }
            });
            attributeObserver.plug();
            return attributeObserver.stop;
          },
          removed(node, consume) {
            if (node.matches(IState2.selector)) {
              consume();
            }
          },
          dispose: props == null ? void 0 : props.activate()
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
  function createHighlightLifeCycle(_editorObservable, _opacitiesObservable) {
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
          _editorObservable,
          _opacitiesObservable
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
  function createHighlight(o) {
    var _a;
    const { node, add, label, selector, set } = o;
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
    (_a = o.thenable) == null ? void 0 : _a.call(o, top);
    const lines = Array.from(set).reduce((acc, top2) => acc + `[style*="${top2}"],`, "").slice(0, -1);
    styleIt(
      styles.getOrCreateLabeledStyle(label, selector),
      `[aria-label="${label}"]${linesSelector} :is(${lines}) {
				${cssOpacityName}: ${o.cssVarOpacity};
		}`
    );
  }
  function editorOverlayLifecycle(editor, _overlay, awkward) {
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
            bruteForceLayoutShift(awkward.foundEditor);
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
      bleedCurrentLines.clear();
      deltaOverlay.childNodes.forEach((node) => highlightStyles(node, true));
    }
    let selectedLines = /* @__PURE__ */ new Set();
    let currentLines = /* @__PURE__ */ new Set();
    let bleedCurrentLines = /* @__PURE__ */ new Set();
    let lineHeight;
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
        set: selectedLines,
        cssVarOpacity: OpacityTable.selected,
        ...pre
      });
      createHighlight({
        selector: currentSelector,
        set: currentLines,
        cssVarOpacity: OpacityTable.current,
        ...pre,
        thenable(top) {
          const { node: node2, add: add2, label } = pre;
          const selector = "div" + currentSelector;
          lineHeight = node2.clientHeight || lineHeight;
          if (!lineHeight || isNaN(lineHeight))
            return toastConsole.error("bleedCurrentLines: offset is NaN");
          const bleed = awkward.bleedCurrentLinesValue();
          for (let i = -bleed; i <= bleed; i++) {
            bleedCurrentLines[add2 ? "add" : "delete"](top + lineHeight * i);
          }
          const onVeryFirstCalibration = [0, lineHeight];
          for (const bad of onVeryFirstCalibration) {
            bleedCurrentLines.delete(bad);
            bleedCurrentLines.delete(bad - 1);
          }
          const lines = Array.from(bleedCurrentLines).reduce((acc, top2) => acc + `[style*="${top2}"],`, "").slice(0, -1);
          styleIt(
            styles.getOrCreateLabeledStyle(label, selector),
            `[aria-label="${label}"]${linesSelector} :is(${lines}) {
							${cssOpacityName}: ${OpacityTable.current};
					}`
          );
        }
      });
    }
    let layoutShift;
    let tries = 0;
    const limit = 5;
    const lineTracker = (cb) => {
      var _a;
      tries += 1;
      if (tries > limit) {
        cb();
        clearInterval(layoutShift);
        return;
      }
      const line = (_a = deltaOverlay.querySelector(selectedSelector + "," + currentSelector)) == null ? void 0 : _a.parentElement;
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
    return {
      mount,
      dispose() {
        clearInterval(layoutShift);
        if (editorLabel) {
          styles.clear(editorLabel);
        } else {
          console.log("Error: editorLabel is undefined");
        }
        EditorLanguageTracker.disconnect();
        OverlayLineTracker.disconnect();
      }
    };
  }
  function createStackStructure(watchForRemoval2, _editorObservable, _opacitiesObservable) {
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
        const cycle = editorOverlayLifecycle(editor, overlay, {
          foundEditor() {
            if (!watchForRemoval2.contains(editor)) {
              toastConsole.error("Editor not found _editorObservable");
              return;
            }
            _editorObservable.value = editor.getAttribute("aria-label");
          },
          bleedCurrentLinesValue() {
            return _opacitiesObservable.value.bleedCurrentLines;
          }
        });
        let deltaBleedCurrentLines = _opacitiesObservable.value.bleedCurrentLines;
        const unSubscribe = _opacitiesObservable.$ubscribe((o) => {
          if (deltaBleedCurrentLines !== o.bleedCurrentLines) {
            deltaBleedCurrentLines = o.bleedCurrentLines;
            cycle.mount();
          }
        });
        const dispose = () => {
          cycle.dispose();
          unSubscribe();
        };
        editorStack.set(editor, dispose);
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
  const symbolTable = {
    "tag.begin": {
      match: /<|<\//,
      entity({ siblings, current }) {
        var _a;
        const tag = siblings[siblings.indexOf(current) + 1];
        if (((_a = tag.textContent) == null ? void 0 : _a.toLowerCase()) === tag.textContent) {
          return tag;
        }
      },
      component({ siblings, current }) {
        var _a;
        const tag = siblings[siblings.indexOf(current) + 1];
        if ((_a = tag.textContent) == null ? void 0 : _a.match(/^[A-Z]/)) {
          return tag;
        }
      }
    },
    text: { match: /Hello\sConcise\sSyntax!/ },
    comma: {
      match: /,/,
      capture({ siblings, current }) {
        const next = siblings[siblings.indexOf(current) + 1];
        if (next) {
          return current;
        }
      }
    },
    ternary: { match: /\?/ }
  };
  const lastSymbolTable = {
    "tag.end": {
      match: /(>|\/>)$/,
      capture({ siblings }) {
        return siblings[siblings.length - 1];
      }
    },
    terminator: {
      match: /;$/,
      capture({ siblings }) {
        return siblings[siblings.length - 1];
      }
    },
    lastComma: {
      match: /,$/,
      capture({ siblings }) {
        return siblings[siblings.length - 1];
      }
    },
    "bracket.begin": {
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
    string: {
      match: /"|'|`/,
      capture({ siblings, current }) {
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
  async function parseSymbolColors(lines, monacoEditor, editorMaxLines) {
    var _a, _b;
    let table = Clone(symbolTable);
    let lastTable = Clone(lastSymbolTable);
    let multipleTable = Clone(multipleSymbolTale);
    let output = {};
    const lineSelector = "div>span";
    let lastLines = [];
    const parsing = () => Object.keys(Object.assign({}, table, lastTable, multipleTable)).length;
    while (parsing()) {
      const deltaLines = Array.from(lines.querySelectorAll(lineSelector)).filter(
        (l) => {
          const included = lastLines.includes(l);
          if (!included) {
            lastLines.push(l);
          }
          return !included;
        }
      );
      for (const line of deltaLines) {
        const text = line.textContent;
        if (!text)
          continue;
        const siblings = Array.from(line.children);
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
          const match = text.match(regex);
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
      if (!parsing() || Array.from(
        monacoEditor.querySelectorAll(
          ".margin-view-overlays > div > .line-numbers"
        )
      ).find((e2) => e2.textContent == editorMaxLines)) {
        break;
      } else {
        await scroll(monacoEditor.offsetHeight * -1);
      }
    }
    function scroll(deltaY) {
      monacoEditor.dispatchEvent(new WheelEvent("wheel", { deltaY }));
      return new Promise((resolve) => setTimeout(resolve, 100));
    }
    await scroll(1e4);
    const process = output;
    const angleBracketSelector = setToSelector(
      process["tag.begin"].capture,
      process["tag.end"].capture
    );
    const anyTagSelector = `${angleBracketSelector}+${setToSelector(
      process["tag.begin"].entity,
      process["tag.begin"].component
    )}`;
    const entityTagSelector = `${angleBracketSelector}+${classSelector(
      process["tag.begin"].entity
    )}`;
    const componentTagSelector = `${angleBracketSelector}+${classSelector(
      process["tag.begin"].component
    )}`;
    const bracketBeginSelector = "." + process["bracket.begin"].capture.className.split(" ").shift();
    const stringEl = process.string.capture[0];
    const beginQuote = stringEl.className;
    const endQuoteEl = process.string.capture[2] ?? stringEl;
    const endQuote = endQuoteEl.className;
    const ternaryOtherwiseSelector = Array.from(process.ternaryOtherwise.capture).map((c) => Array.from(c.classList)).reduce((acc, val) => acc.concat(val.join(".")), []).reduce((acc, val) => acc + "." + val + "+", "").replaceAll(
      /\.bracket-highlighting-\d/g,
      '[class*="bracket-highlighting"]'
    ).slice(0, -1) + ":last-child";
    const opacitySelectors = {
      "tag.begin": {
        selector: angleBracketSelector,
        color: color(process["tag.begin"].capture)
      },
      lastComma: {
        selector: lastChildSelector(process.lastComma.capture),
        color: color(process.lastComma.capture)
      },
      terminator: {
        selector: lastChildSelector(process.terminator.capture),
        color: color(process.terminator.capture)
      },
      "string.begin": {
        selector: "." + beginQuote,
        color: color(stringEl)
      },
      "string.end": {
        selector: "." + endQuote,
        color: color(endQuoteEl)
      }
    };
    const colorsSelectorOnly = {
      "tag.entity": {
        selector: `${entityTagSelector}`,
        color: color(process["tag.begin"].entity)
      },
      "tag.component": {
        selector: `${componentTagSelector}`,
        color: color(process["tag.begin"].component)
      },
      comma: {
        selector: classSelector(process.comma.capture),
        color: color(process.comma.capture)
      },
      ternary: {
        selector: classSelector(process.ternary.capture),
        color: color(process.ternary.capture)
      }
    };
    const colorsOnly = {
      "tag.end": {
        color: color(process["tag.end"].capture)
      },
      text: {
        color: color(process.text.capture)
      },
      "bracket.begin": {
        color: color(process["bracket.begin"].capture)
      },
      "bracket.end": {
        color: color(process["bracket.begin"].capture)
      }
    };
    const colorsTable = {
      ...opacitySelectors,
      ...colorsSelectorOnly,
      ...colorsOnly
    };
    colorsTable[""];
    const selectorOnly = {
      closingTagEntity: {
        selector: `${entityTagSelector}:has(+${angleBracketSelector}:last-child)`
      },
      closingTagComponent: {
        selector: `${componentTagSelector}:has(+${angleBracketSelector}:last-child)`
      },
      emptyQuote: {
        selector: `:is([class="${beginQuote}"]:has(+.${endQuote}), [class="${beginQuote}"]+.${endQuote})`
      },
      bracketBegin: {
        selector: bracketBeginSelector
      },
      ternaryClosingBrace: {
        selector: `${bracketBeginSelector}~${classSelector(
          process.ternary.capture
        )}~[class*="bracket-highlighting-"]:last-child`
      }
    };
    const ternaryOtherwise = {
      scope: `:has(${ternaryOtherwiseSelector})`
    };
    const root = `${linesSelector}>${lineSelector}`;
    const payload = {
      opacitySelectors,
      selectorOnly,
      colorSelectorOnly: colorsSelectorOnly
    };
    function checkMissingProps(obj) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object") {
          checkMissingProps(value);
        } else if (!value) {
          throw new Error(`Missing property ${key} and possibly more...`);
        }
      }
    }
    checkMissingProps({
      ...colorsTable,
      ...selectorOnly,
      ...ternaryOtherwise
    });
    return {
      colorsTable,
      payload,
      process(_payload) {
        for (let key in payload) {
          for (let key2 in payload[key]) {
            if (_payload[key][key2]) {
              payload[key][key2].color = _payload[key][key2].color;
            }
          }
        }
        const { opacitySelectors: opacitySelectors2, selectorOnly: selectorOnly2, colorSelectorOnly } = payload;
        const opacityValues = Object.values(opacitySelectors2);
        const selectorValues = [...opacityValues, ...Object.values(selectorOnly2)];
        const toUnion = selectorValues.map((f) => f.selector).join(",");
        return `
			.view-lines {
				${cssOpacityName}: ${OpacityTable.base};
			}
			.view-lines > div:hover,
			${root}>${selectorOnly2.emptyQuote.selector} {
				${cssOpacityName}: ${OpacityTable.hoverLine};
			}
			.view-lines:has(:is(${toUnion},${anyTagSelector}):hover),
			.view-lines:has(${lineSelector}:hover ${ternaryOtherwiseSelector}) {
				${cssOpacityName}: ${OpacityTable.hoverAll};
			}
			${root} :is(${toUnion}),
			${root}:is(${ternaryOtherwise.scope}) {
				opacity: var(${cssOpacityName});
			}
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
  function color(element) {
    return element.conciseSyntaxColor;
  }
  function _color(element) {
    var _a;
    return (_a = element.computedStyleMap().get("color")) == null ? void 0 : _a.toString();
  }
  function getProcess(evaluation, match) {
    if (evaluation instanceof HTMLElement) {
      evaluation.conciseSyntaxColor = _color(evaluation);
    } else if (evaluation instanceof Array) {
      evaluation.forEach((s) => {
        s.conciseSyntaxColor = _color(s);
      });
    } else {
      throw new Error("Capture editor line: Invalid dom evaluation type");
    }
    return evaluation;
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
      subscribe(sub) {
        const res = sub(_value);
        if (typeof res === "function") {
          _toDispose.set(sub, (_toDispose.get(sub) || []).concat(res));
        } else if (res === "Symbol.dispose") {
          splice(sub);
        }
        return this.$ubscribe(sub);
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
  const errors = createStructByNames({
    observing_was_set_to_true: "",
    observing_was_set_to_false: "",
    findNewBranch_is_busy: "",
    task_tree_is_not_an_array: "",
    invalid_step: "",
    invalid_selector: "",
    invalid_return_value: "",
    failed_next_dom_task: "",
    timeout_exceeded: "",
    panic_next_recursive_tree: "",
    panic_next_tree: "",
    promise_task_rejected: "",
    new_task_tree_is_a_function_expected_an_array: ""
  });
  const createResult = () => createTask();
  const Config = { timeoutMs: calibrateTimeout, pokeTheDomIntervalMs: 500 };
  const work_REC_ObservableTaskTree = (target, domTasks, config) => {
    const _config = { ...Config, ...config };
    const taskPromise = createResult();
    let outParameters = { unplug() {
    }, taskPromise };
    const res = REC_ObservableTaskTree(target, domTasks, _config, outParameters);
    if (res == "finish" || res == "panic" || res == "error")
      ;
    else {
      const timeout = setTimeout(() => {
        taskPromise.reject(errors.timeout_exceeded);
      }, _config.timeoutMs);
      taskPromise.promise.finally(() => clearTimeout(timeout));
    }
    return {
      promise: taskPromise.promise,
      reject() {
        outParameters.unplug();
        taskPromise.reject(errors.promise_task_rejected);
      }
    };
  };
  function REC_ObservableTaskTree(target, domTasks, config, outParameters) {
    let step = 0;
    let findNewBranch;
    const observer = new MutationObserver(async (record) => {
      if (panicked) {
        debugger;
        unplug();
        return;
      }
      if (step == -1) {
        return panic(errors.invalid_step);
      }
      if (findNewBranch) {
        debugger;
        const [node2, tree] = findNewBranch() ?? [];
        if (!(node2 instanceof HTMLElement) || !tree)
          return;
        if (!Array.isArray(tree)) {
          return panic(errors.task_tree_is_not_an_array);
        }
        return tryUnplug(() => {
          findNewBranch = void 0;
          findMatchOrREC(node2, tree);
        });
      }
      for (const mutation of record) {
        if (mutation.type == "attributes") {
          if (stepForward(mutation.target)) {
            return;
          }
        }
        for (const node2 of mutation.addedNodes) {
          if (stepForward(node2)) {
            return;
          }
        }
      }
      const node = document.querySelector(domTasks[step][0]);
      if (stepForward(node)) {
        return;
      }
    });
    function stepForward(node, _tasks = domTasks) {
      if (!(node instanceof HTMLElement) || !_tasks[step]) {
        return;
      }
      const nextBranch = _tasks[step];
      const [selector, dom_task, branch] = nextBranch;
      if (nextBranch.length == 3) {
        return handleBranch(node, selector, dom_task, () => {
          const [selector2] = branch;
          const nextTarget = document.querySelector(selector2);
          if (nextTarget instanceof HTMLElement) {
            return findMatchOrREC(nextTarget, branch);
          } else {
            return setFindMatchFunc(selector2, branch);
          }
        });
      } else {
        return handleBranch(node, selector, dom_task, () => {
          step++;
          if (!_tasks[step]) {
            return tryUnplug(() => {
              outParameters.taskPromise.resolve("finish");
              return "finish";
            });
          }
          return "next";
        });
      }
    }
    function tryREC(target2, tree, error, ret) {
      return tryUnplug(() => {
        const rec = REC_ObservableTaskTree(target2, tree, config, outParameters);
        if (!rec || rec == "panic") {
          return panic(error);
        }
        return ret;
      });
    }
    function findMatchOrREC(node, tree) {
      if (tree.length !== 3) {
        return tryREC(node, tree[1], errors.invalid_return_value, "next tree");
      }
      const [self_selector, dom_task, branch] = tree;
      const res = handleBranch(node, self_selector, dom_task, () => "next");
      if (!res || res == "error" || res == "panic") {
        return panic(errors.failed_next_dom_task);
      }
      const [selector, newTasks] = branch;
      const nextTarget = document.querySelector(selector);
      if (typeof newTasks == "function") {
        return panic(errors.new_task_tree_is_a_function_expected_an_array);
      }
      if (nextTarget instanceof HTMLElement) {
        return tryREC(nextTarget, newTasks, errors.panic_next_recursive_tree, "recursive tree");
      } else {
        return setFindMatchFunc(selector, newTasks);
      }
    }
    function setFindMatchFunc(selector, newDomTasks) {
      toastConsole.log("look I get executed...");
      debugger;
      if (findNewBranch) {
        return panic(errors.findNewBranch_is_busy);
      }
      unplug();
      findNewBranch = () => [document.querySelector(selector), newDomTasks];
      target = document.body;
      step = 0;
      domTasks = newDomTasks;
      return tryPlug("findNewBranch");
    }
    function handleBranch(node, selector, dom_task, thenable) {
      if (!node.matches(selector))
        return;
      try {
        const res = dom_task(node);
        if (res instanceof Error) {
          throw res;
        } else {
          return thenable();
        }
      } catch (error) {
        return tryUnplug(() => {
          step = -1;
          outParameters.taskPromise.reject(
            error instanceof Error ? error : new Error("unknown error", { cause: error })
          );
          return "error";
        });
      }
    }
    function tryUnplug(thenable) {
      if (observing === false) {
        return panic(errors.observing_was_set_to_false);
      }
      unplug();
      return thenable();
    }
    function unplug() {
      clearInterval(pokeTheDomInterval);
      observing = false;
      observer.disconnect();
      observer.takeRecords();
    }
    outParameters.unplug = unplug;
    let pokeTheDomInterval;
    let observing = void 0;
    function tryPlug(ret) {
      if (observing) {
        return panic(errors.observing_was_set_to_true);
      }
      clearInterval(pokeTheDomInterval);
      pokeTheDomInterval = setInterval(() => {
        console.log("poking the dom...");
        const node = document.querySelector(domTasks[step][0]);
        if (stepForward(node)) {
          return;
        }
      }, config.pokeTheDomIntervalMs);
      observing = true;
      observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true
      });
      return ret;
    }
    let panicked = false;
    function panic(error, f) {
      debugger;
      panicked = true;
      unplug();
      outParameters.taskPromise.reject(error);
      return "panic";
    }
    for (let i = 0; i < domTasks.length; i++) {
      const [selector] = domTasks[i];
      if (!selector || selector.length == 1) {
        return panic(errors.invalid_selector);
      }
      const node = target.querySelector(selector);
      const res = stepForward(node);
      if (!res) {
        break;
      }
      if (!(res == "findNewBranch" || res == "next")) {
        return res;
      }
    }
    if (step > -1 && step < domTasks.length && !observing) {
      return tryPlug("return observe");
    } else {
      return panic(errors.invalid_step);
    }
  }
  function createTask() {
    let resolve = (value) => {
    }, reject = (value) => {
    };
    const promise = new Promise((_resolve, _reject) => {
      reject = _reject;
      resolve = _resolve;
    });
    return { promise, resolve, reject };
  }
  function createStructByNames(keys) {
    return Object.keys(keys).reduce((acc, key, i) => {
      acc[key] = key;
      return acc;
    }, {});
  }
  const opacitiesStorageKey = `${extensionId}.opacities`;
  const opacitiesObservable = createObservable({ ...DefaultOpacity });
  const opacitiesStyle = createStyles("opacities");
  const createOpacitiesSubscription = () => opacitiesObservable.subscribe((opacities) => {
    const cssVars = Object.entries(opacities).reduce((acc, [key, value]) => {
      return acc + `--${key}: ${value};`;
    }, "");
    const style = `body { ${cssVars} }`;
    opacitiesStyle.styleIt(style);
    window.localStorage.setItem(opacitiesStorageKey, style);
  });
  function cacheOpacitiesProc() {
    try {
      const cache = window.localStorage.getItem(opacitiesStorageKey);
      if (cache)
        opacitiesStyle.styleIt(cache);
      else
        window.localStorage.removeItem(opacitiesStorageKey);
    } catch (error) {
      window.localStorage.removeItem(opacitiesStorageKey);
    }
  }
  const calibrateStorageKey = `${extensionId}.session.styles`;
  let tableTask;
  const calibrateObservable = createObservable(void 0);
  const createCalibrateSubscription = () => calibrateObservable.$ubscribe((state2) => {
    if (state2 == calibrate.error) {
      tableTask == null ? void 0 : tableTask.reject(calibrate.error);
      return;
    }
    if (!(state2 == calibrate.opened || state2 == calibrate.idle))
      return;
    const monacoEditor = document.querySelector(`[data-uri$="out/${calibrationFileName}"]`);
    const lineEditor = monacoEditor == null ? void 0 : monacoEditor.querySelector(viewLinesSelector);
    if (!e(lineEditor) || !e(monacoEditor)) {
      return toastConsole.error("Calibrate Editor not found");
    }
    if (tableTask && state2 == calibrate.opened) {
      toastConsole.error("Calibrate Window already opened");
      return;
    }
    if (!tableTask) {
      tableTask = createTask$1();
    } else if (state2 == calibrate.idle) {
      tableTask.resolve(state2);
      return;
    }
    let _snapshot;
    const parse = async () => _snapshot = await parseSymbolColors(lineEditor, monacoEditor, "44");
    syntaxStyle.dispose();
    BonkersExecuteCommand.shadow(true);
    Promise.resolve().then(parse).then(
      (snapshot) => BonkersExecuteCommand(
        extensionDisplayName,
        calibrateWindowCommandPlaceholder,
        JSON.stringify(snapshot.colorsTable)
      )
    ).catch(() => {
      toastConsole.error("Failed to run Calibrate Window command");
      BonkersExecuteCommand.shadow(false, getInput());
    }).then(() => tableTask.promise).then(async () => {
      const css = (await parse()).process(_snapshot.payload);
      window.localStorage.setItem(calibrateStorageKey, css);
      syntaxStyle.styleIt(css);
    }).catch(() => toastConsole.error("Failed to get colors table")).finally(() => tableTask = void 0);
  });
  const calibrateWindowStyle = createStyles("calibrate.window");
  function BonkersExecuteCommand(displayName, commandName, value) {
    const widgetSelector = ".quick-input-widget";
    const inputSelector = `${widgetSelector}:not([style*="display: none"]) div.quick-input-box input`;
    let shadowInput;
    const commandWidgetTasks = [
      [
        `${inputSelector}`,
        (el) => {
          shadowEventListeners(shadowInput = el);
          el.value = `>${displayName}`;
          el.dispatchEvent(new Event("input"));
        }
      ],
      [
        `.quick-input-list [aria-label*="${displayName}: ${commandName}"] label`,
        (el) => el.click()
      ],
      [
        `${inputSelector}[placeholder="${commandName}"]`,
        (el) => {
          el.value = value;
          el.dispatchEvent(new Event("input"));
        }
      ],
      [
        `${inputSelector}:is([title="${commandName}"],[placeholder="${commandName}"])[aria-describedby="quickInput_message"]`,
        (el) => {
          if (shadowInput !== el) {
            return new Error("shadowInput!==target");
          } else {
            BonkersExecuteCommand.shadow(false, el);
          }
          el.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true,
              composed: true
            })
          );
        }
      ]
    ];
    const branchTasks = [
      [
        "li.action-item.command-center-center",
        tapVsCode,
        [widgetSelector, commandWidgetTasks]
      ],
      [
        `.menubar-menu-button[aria-label="View"]`,
        tapVsCode,
        [
          `[class="action-item"]:has([aria-label="Command Palette..."])`,
          tapVsCode,
          [widgetSelector, commandWidgetTasks]
        ]
      ]
    ];
    return work_REC_ObservableTaskTree(document.body, branchTasks).promise;
    function tapVsCode(el) {
      el.dispatchEvent(new CustomEvent("-monaco-gesturetap", {}));
    }
  }
  BonkersExecuteCommand.shadow = (block, input) => {
    const styles2 = block ? "* {pointer-events:none;}" : "";
    calibrateWindowStyle.styleIt(styles2);
    const shadow = block ? shadowEventListeners : cleanShadowedEvents;
    shadow(window);
    if (input) {
      shadow(input);
    }
  };
  const shadowEventListeners = events((e2) => {
    e2.preventDefault();
    e2.stopPropagation();
    return false;
  });
  const cleanShadowedEvents = events(null);
  function events(fn) {
    return (el) => {
      el.onclick = el.onkeydown = el.onkeyup = el.onmousedown = el.onmouseup = el.onblur = el.onfocus = fn;
    };
  }
  function getInput() {
    return document.querySelector("div.quick-input-box input");
  }
  function cacheCalibrateProc() {
    try {
      const cache = window.localStorage.getItem(calibrateStorageKey);
      if (cache)
        syntaxStyle.styleIt(cache);
      else
        window.localStorage.removeItem(calibrateStorageKey);
    } catch (error) {
      window.localStorage.removeItem(calibrateStorageKey);
    }
  }
  const editorObservable = createObservable(void 0);
  const createEditorSubscription = () => editorObservable.$ubscribe((value) => {
    if (!value)
      return;
    cacheCalibrateProc();
    return "Symbol.dispose";
  });
  const syntaxStyle = createStyles("hide");
  let deltaSubscribers = deltaFn();
  const stateObservable = createObservable(void 0);
  const createStateSubscription = () => stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      addRemoveRootStyles(true);
      cacheCalibrateProc();
      cacheOpacitiesProc();
      highlight.activate(500);
      const _ = [
        createOpacitiesSubscription(),
        createCalibrateSubscription(),
        createEditorSubscription()
      ];
      deltaSubscribers.fn = () => _.forEach((un) => un());
    } else {
      if (deltaState == state.resetDev) {
        window.localStorage.removeItem(calibrateStorageKey);
        window.localStorage.removeItem(opacitiesStorageKey);
      }
      deltaSubscribers.consume();
      addRemoveRootStyles(false);
      syntaxStyle.dispose();
      highlight.dispose();
    }
  });
  const syntax = createSyntaxLifecycle(
    {
      state: stateObservable,
      calibrate: calibrateObservable,
      opacities: opacitiesObservable
    },
    IState,
    {
      activate() {
        const unSubscribeState = createStateSubscription();
        return () => {
          stateObservable.value = state.inactive;
          unSubscribeState();
        };
      }
    }
  );
  const highlight = createHighlightLifeCycle(
    editorObservable,
    opacitiesObservable
  );
  if (window.conciseSyntax) {
    window.conciseSyntax.dispose();
  }
  window.conciseSyntax = syntax;
  syntax.activate();
  cacheCalibrateProc();
  cacheOpacitiesProc();
  console.log(extensionId, syntax);
});
//# sourceMappingURL=workbench.js.map
