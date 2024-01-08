"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const JSONC = require("comment-json");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const vscode__namespace = /* @__PURE__ */ _interopNamespaceDefault(vscode);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const msg = {
  admin: "Run VS Code with admin privileges so the changes can be applied.",
  enabled: "Concise syntax enabled. Restart to take effect. ",
  disabled: "Concise syntax disabled and reverted to default. Restart to take effect.",
  already_disabled: "Concise syntax already disabled.",
  somethingWrong: "Something went wrong: ",
  internalError: "Internal error: ",
  restartIde: "Restart Visual Studio Code",
  notfound: "Concise syntax not found.",
  notConfigured: "Concise syntax path not configured.",
  reloadAfterVersionUpgrade: "Detected reloading Concise syntax after VSCode is upgraded. Performing application only.",
  cannotLoad: (url) => `Cannot load '${url}'. Skipping.`
};
const name$1 = "concise-syntax";
const displayName = "Concise Syntax";
const description = "Hide unnecessary syntax or markup from programming languages";
const version = "0.0.1";
const publisher = "kauderk";
const type = "commonjs";
const engines = {
  vscode: "^1.70.0"
};
const categories = [
  "Programming Languages"
];
const main = "./out/extension";
const activationEvents = [
  "*"
];
const scripts = {
  watch: "ts-node vite.config.custom.ts --watch",
  "vscode:prepublish": "ts-node vite.config.custom.ts",
  "vscode:uninstall": "node ./out/uninstall"
};
const contributes = {
  commands: [
    {
      command: "extension.reload",
      title: "Mount Extension",
      category: "Concise Syntax",
      enablement: "extension.disposed"
    },
    {
      command: "extension.disposeExtension",
      title: "Dispose Extension (free memory)",
      category: "Concise Syntax",
      enablement: "!extension.disposed"
    },
    {
      command: "extension.toggle",
      title: "Toggle",
      category: "Concise Syntax",
      enablement: "!extension.disposed && extension.calibrated"
    },
    {
      command: "extension.calibrate",
      title: "Calibrate",
      category: "Concise Syntax",
      enablement: "!extension.disposed"
    }
  ]
};
const devDependencies = {
  "@types/node": "^20.10.5",
  "comment-json": "^4.2.3",
  "ts-node": "^10.9.2",
  vite: "4.5.1",
  vscode: "^1.1.37"
};
const packageJson = {
  name: name$1,
  displayName,
  description,
  version,
  publisher,
  type,
  engines,
  categories,
  main,
  activationEvents,
  scripts,
  contributes,
  devDependencies
};
const extensionId = "kauderk.concise-syntax";
const extensionScriptSrc = extensionId + ".js";
const extensionScriptTag = () => new RegExp(
  `<script.+${extensionId.replaceAll(".", "\\.")}.+/script>`,
  "gm"
  // intermittently
);
async function patchWorkbench(res, remoteWorkbenchPath) {
  await fs.promises.copyFile(remoteWorkbenchPath, res.workbench.customPath);
  const hash = ("" + Math.random()).substring(2, 7);
  const newHtml = res.html.replaceAll(extensionScriptTag(), "").replace(
    /(<\/html>)/,
    `<script src="${extensionScriptSrc}?${hash}"><\/script></html>`
  );
  await fs.promises.writeFile(res.workbench.path, newHtml, "utf-8");
}
async function preRead(base) {
  const workbenchPath = path.join(base, "workbench.html");
  const html = await fs.promises.readFile(workbenchPath, "utf-8");
  const wasActive = html.match(extensionScriptTag());
  return {
    html,
    wasActive,
    workbench: {
      path: workbenchPath,
      customPath: path.join(base, extensionScriptSrc)
    }
  };
}
function _catch(e) {
}
function useState(context, key2) {
  return {
    value: "",
    read() {
      return this.value = context.workspaceState.get(key2);
    },
    async write(newState) {
      this.value = newState;
      await context.workspaceState.update(key2, newState);
      return newState;
    }
  };
}
function useGlobal(context, key2) {
  return {
    value: "",
    read() {
      return this.value = context.globalState.get(key2);
    },
    async write(newState) {
      this.value = newState;
      await context.globalState.update(key2, newState);
      return newState;
    }
  };
}
const key = "editor.tokenColorCustomizations";
const name = `${extensionId}.`;
const textMateRules = [
  {
    name: name + "text",
    scope: ["meta.jsx.children.tsx"],
    settings: {
      foreground: "#b5a70000"
    }
  },
  {
    name: name + "redundant",
    scope: [
      "punctuation.definition.tag.begin.tsx",
      "punctuation.definition.tag.end.tsx",
      "punctuation.section.embedded.begin.tsx",
      "punctuation.section.embedded.end.tsx",
      "punctuation.terminator.statement.tsx",
      "concise.redundant-syntax"
    ],
    settings: {
      foreground: "#00b51b00"
    }
  },
  {
    name: name + "quote.begin",
    scope: [
      "punctuation.definition.string.begin.tsx",
      "punctuation.definition.string.template.begin.tsx"
    ],
    settings: {
      foreground: "#b5a90000"
    }
  },
  {
    name: name + "quote.end",
    scope: [
      "punctuation.definition.string.end.tsx",
      "punctuation.definition.string.template.end.tsx"
    ],
    settings: {
      foreground: "#b5030000"
    }
  },
  {
    name: name + "separator",
    scope: ["punctuation.separator.comma.tsx"],
    settings: {
      foreground: "#b5080000"
    }
  }
];
const settingsJsonPath = ".vscode/settings.json";
async function updateSettingsCycle(context, operation) {
  const res = await tryParseSettings();
  if (!res)
    return;
  const { wasEmpty, specialObjectUserRules: userRules } = res;
  const textColor = useState(context, "textColor");
  let diff = false;
  if (operation == "active") {
    if (wasEmpty) {
      diff = true;
      userRules.push(...textMateRules);
      tryPatchTextColor(userRules[0], "patch");
    } else {
      const userIndexToNameMap = new Map(userRules.map((r, i) => [r?.name, i]));
      for (const presetRule of textMateRules) {
        const i = userIndexToNameMap.get(presetRule.name) ?? -1;
        if (i > -1) {
          const userRule = userRules[i];
          if (!userRule) {
            userRules[i] = presetRule;
            tryPatchTextColor(presetRule, "patch");
            diff = true;
            continue;
          }
          if (presetRule.scope.some((s, i2) => s !== userRule.scope?.[i2])) {
            userRule.scope = presetRule.scope;
            diff = true;
          }
          if (!userRule.settings?.foreground?.match(/^#/)) {
            userRule.settings = presetRule.settings;
            tryPatchTextColor(userRule, "patch");
            diff = true;
          }
        } else {
          userRules.push(presetRule);
          tryPatchTextColor(presetRule, "patch");
          diff = true;
        }
      }
    }
  } else {
    if (wasEmpty) {
      diff = false;
      return;
    } else {
      const indexToNameMap = new Map(textMateRules.map((r, i) => [r.name, i]));
      for (let i = userRules.length - 1; i >= 0; i--) {
        const name2 = userRules[i]?.name;
        const j = indexToNameMap.get(name2);
        if (j > -1) {
          diff = true;
          userRules.splice(i, 1);
          tryPatchTextColor(textMateRules[j], "write");
        }
      }
    }
  }
  function tryPatchTextColor(rule, action) {
    if (rule?.name != textMateRules[0].name)
      return;
    const color = textMateRules[0].settings.foreground;
    if (action == "write") {
      textColor.write(rule?.settings?.foreground || color);
    } else {
      rule.settings = rule.settings || {};
      rule.settings.foreground = textColor.read() || color;
    }
  }
  [...textMateRules].reverse().forEach((r, relative, _arr) => {
    const index = userRules.findIndex((_r) => _r?.name == r.name);
    if (index < 0)
      return;
    const end = userRules.length - 1 - relative;
    if (index != end) {
      diff = true;
      move(userRules, index, end);
    }
  });
  if (!diff) {
    return true;
  }
  return res.write;
}
async function tryParseSettings() {
  const workspace = vscode__namespace.workspace.workspaceFolders?.[0].uri;
  if (!workspace) {
    vscode__namespace.window.showErrorMessage(
      "No workspace found: cannot update textMateRules"
    );
    return;
  }
  const userSettingsPath = workspace.fsPath + "/" + settingsJsonPath;
  let raw_json;
  let config;
  try {
    raw_json = await fs__namespace.promises.readFile(userSettingsPath, "utf-8");
    config = JSONC.parse(raw_json);
  } catch (error) {
    config ??= {};
    console.error(error);
  }
  if (raw_json === void 0) {
    vscode__namespace.window.showErrorMessage(
      `Cannot read ${settingsJsonPath}: does not exist or is not valid JSON`
    );
    return;
  }
  let userRules = config?.[key]?.textMateRules;
  if (userRules && !Array.isArray(userRules)) {
    vscode__namespace.window.showErrorMessage(
      `${settingsJsonPath}: ${key}.textMateRules is not an array`
    );
    return;
  }
  const wasEmpty = !userRules || userRules?.length == 0;
  if (!userRules) {
    userRules = [];
    config[key] = { textMateRules: userRules };
  }
  return {
    specialObjectUserRules: userRules,
    wasEmpty,
    async write() {
      try {
        if (raw_json === void 0)
          throw new Error("raw_json is undefined");
        const indent = raw_json.match(/^\s+/)?.[0] ?? "  ";
        const virtualJson = JSONC.stringify(config, null, indent);
        if (virtualJson === raw_json)
          return;
        await fs__namespace.promises.writeFile(userSettingsPath, virtualJson, "utf-8");
      } catch (error) {
        vscode__namespace.window.showErrorMessage(
          "Failed to write textMateRules. Error: " + error.message
        );
      }
    }
  };
}
function move(arr, fromIndex, toIndex) {
  var element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
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
    return Object.values(state).reverse().find((state2) => string?.includes(state2));
  }
};
const calibrateIcon = "go-to-file";
const calibrationFileName = "syntax.tsx";
function iconSelector(icon) {
  return `[id="${extensionId}"]:has(.codicon-${icon})`;
}
function deltaFn(consume = false) {
  let delta;
  return {
    consume() {
      delta?.();
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
function deltaValue(consume) {
  let delta;
  return {
    consume() {
      if (delta)
        consume(delta);
      delta = void 0;
    },
    get value() {
      return delta;
    },
    set value(value) {
      this.consume();
      delta = value;
    }
  };
}
let _item;
const statusIconLoading = "loading~spin";
const iconText = "";
let busy;
let disposeConfiguration = deltaFn();
let crashedMessage = "";
let _calibrate;
let c_busy = false;
let disposeClosedEditor = deltaFn(true);
let calibrate_confirmation_token = deltaValue(
  (t) => t.dispose()
);
async function ExtensionState_statusBarItem(context, setState) {
  const extensionState = getStateStore(context);
  const windowState = getWindowState(context);
  const globalInvalidation = getGlobalAnyInvalidate(context);
  const calibrationState = getAnyCalibrate(context);
  debugger;
  await windowState.write(setState);
  checkDisposedCommandContext(setState);
  async function REC_nextStateCycle(tryNext, settings, overloads = {}) {
    if (!_item) {
      vscode__namespace.window.showErrorMessage("No status bar item found");
      return;
    } else if (crashedMessage) {
      vscode__namespace.window.showErrorMessage(
        `The extension crashed when updating .vscode/settings.json with property ${key}.textMateRules with error: ${crashedMessage}`
      );
      return;
    }
    try {
      busy = true;
      debugger;
      disposeConfiguration.consume();
      if (!(overloads.calibratedThen || calibrationState.read() == state.active)) {
        await defaultWindowState(_item, state.stale);
        busy = false;
        return;
      }
      _item.text = `$(${statusIconLoading})` + iconText;
      const cash = await updateSettingsCycle(context, settings);
      if (typeof cash == "function" && overloads.diff && tryNext == state.active && globalInvalidation.read() != state.active) {
        const res = await vscode__namespace.window.showInformationMessage(
          "The extension settings were invalidated while the extension was running.            Shall we add missing extension textMateRules if any and move them to the end to avoid conflicts?",
          "Yes and remember",
          "No and deactivate"
        );
        const next2 = res?.includes("Yes") ? state.active : state.inactive;
        await globalInvalidation.write(next2);
        await defaultWindowState(_item, next2);
        busy = false;
        return;
      }
      if (typeof cash == "function") {
        const task = createTask();
        const watcher = vscode__namespace.workspace.onDidChangeConfiguration(task.resolve);
        await cash();
        await Promise.race([
          task.promise,
          // either the configuration changes or the timeout
          new Promise((resolve) => setTimeout(resolve, 3e3))
        ]);
        watcher.dispose();
      }
      await defaultWindowState(_item, tryNext);
      if (tryNext == state.active)
        disposeConfiguration.fn = vscode__namespace.workspace.onDidChangeConfiguration(async (config) => {
          if (busy || !config.affectsConfiguration(key))
            return;
          const next2 = windowState.read();
          if (!next2)
            return;
          await REC_nextStateCycle(next2, binary(next2), { diff: true });
        }).dispose;
      busy = false;
    } catch (error) {
      debugger;
      crashedMessage = error?.message || "unknown";
      _item.text = `$(error)` + iconText;
      _item.tooltip = IState.encode(state.error);
      _item.show();
      disposeConfiguration.consume();
    }
  }
  async function defaultWindowState(_item2, next2) {
    await windowState.write(next2);
    _item2.text = `$(${stateIcon})` + iconText;
    _item2.tooltip = IState.encode(next2);
    await hold();
    if (next2 == state.disposed || next2 == state.stale) {
      _item2.hide();
    } else {
      _item2.show();
    }
  }
  if (_item) {
    await REC_nextStateCycle(setState, binary(setState));
    return;
  }
  const toggleCommand = packageJson.contributes.commands[2].command;
  context.subscriptions.push(
    vscode__namespace.commands.registerCommand(toggleCommand, async () => {
      if (extensionState.read() == "disposed") {
        return vscode__namespace.window.showInformationMessage(
          "The extension is disposed. Mount it to use this command."
        );
      }
      if (busy) {
        return vscode__namespace.window.showInformationMessage(
          "The extension is busy. Try again in a few seconds."
        );
      }
      const next2 = flip(windowState.read());
      await REC_nextStateCycle(next2, next2);
    })
  );
  const remoteCalibratePath = path.join(__dirname, calibrationFileName);
  const uriRemote = vscode__namespace.Uri.file(remoteCalibratePath);
  const calibrateCommand = packageJson.contributes.commands[3].command;
  context.subscriptions.push(
    vscode__namespace.commands.registerCommand(calibrateCommand, async () => {
      if (!_calibrate) {
        vscode__namespace.window.showErrorMessage("No status bar item found");
        return;
      }
      if (extensionState.read() == "disposed") {
        return vscode__namespace.window.showInformationMessage(
          "The extension is disposed. Mount it to use this command."
        );
      }
      if (c_busy || busy) {
        vscode__namespace.window.showInformationMessage(
          "The extension is busy. Try again in a few seconds."
        );
        return;
      }
      try {
        c_busy = true;
        calibrate_confirmation_token.consume();
        debugger;
        const calibratedThen = calibrationState.read() === void 0;
        if (calibratedThen || windowState.read() == state.inactive) {
          await REC_nextStateCycle(state.active, state.active, {
            calibratedThen
          });
        }
        await tryUpdateCalibrateState("opening");
        const document = await vscode__namespace.workspace.openTextDocument(uriRemote);
        const editor = await vscode__namespace.window.showTextDocument(document, {
          preview: false,
          preserveFocus: false
        });
        disposeClosedEditor.fn = onDidCloseTextDocument(async (doc) => {
          if (doc.uri.path === uriRemote.path && editor.document.isClosed) {
            await consume_close();
            return true;
          }
        });
        await new Promise((resolve) => setTimeout(resolve, 1e3));
        await tryUpdateCalibrateState("opened", 500);
        checkCalibratedCommandContext(state.active);
        const progressSeconds = 10;
        vscode__namespace.window.withProgress(
          {
            location: vscode__namespace.ProgressLocation.Window,
            title: "Concise Syntax was calibrated you may close the file",
            cancellable: true
          },
          // prettier-ignore
          async () => new Promise(async (resolve) => {
            calibrate_confirmation_token.value = new vscode__namespace.CancellationTokenSource();
            const dispose = calibrate_confirmation_token.value.token.onCancellationRequested(() => {
              calibrate_confirmation_token.consume();
              dispose();
              resolve(null);
            }).dispose;
            for (let i = 0; i < progressSeconds; i++) {
              await hold(1e3);
            }
            resolve(null);
          })
        );
        c_busy = false;
      } catch (error) {
        debugger;
        await consume_close();
        vscode__namespace.window.showErrorMessage(
          `Error: failed to open calibrate file -> ${error?.message}`
        );
      }
      function consume_close() {
        disposeClosedEditor.consume();
        return tryUpdateCalibrateState("closed");
      }
      function tryUpdateCalibrateState(state2, t = 100) {
        _calibrate.tooltip = state2;
        return hold(t);
      }
    })
  );
  async function checkCalibratedCommandContext(next2) {
    vscode__namespace.commands.executeCommand(
      "setContext",
      "extension.calibrated",
      next2 == state.active
    );
    await calibrationState.write(next2);
  }
  _item = vscode__namespace.window.createStatusBarItem(vscode__namespace.StatusBarAlignment.Right, 0);
  _item.command = toggleCommand;
  _calibrate = vscode__namespace.window.createStatusBarItem(
    vscode__namespace.StatusBarAlignment.Right,
    0
  );
  _calibrate.command = calibrateCommand;
  _calibrate.text = `$(${calibrateIcon})`;
  _calibrate.tooltip = "bootUp";
  _calibrate.show();
  const next = windowState.read() ?? "active";
  await REC_nextStateCycle(next, binary(next));
  context.subscriptions.push(_item, {
    dispose() {
      disposeConfiguration.consume();
      disposeClosedEditor.consume();
      calibrate_confirmation_token.consume();
    }
  });
}
function checkDisposedCommandContext(next) {
  vscode__namespace.commands.executeCommand(
    "setContext",
    "extension.disposed",
    next == state.disposed
  );
}
function onDidCloseTextDocument(tryClose) {
  return vscode__namespace.window.tabGroups?.onDidChangeTabs?.(async (changedEvent) => {
    for (const doc of Array.from(changedEvent.closed)) {
      if (await tryClose(doc.input)) {
        return;
      }
    }
  })?.dispose || // this is delayed by 4-5 minutes, so it's not reliable
  vscode__namespace.workspace.onDidCloseTextDocument(async (doc) => {
    if (await tryClose(doc))
      ;
    else {
      for (const editor of vscode__namespace.window.visibleTextEditors) {
        if (await tryClose(editor.document)) {
          return;
        }
      }
    }
  }).dispose;
}
function binary(state2) {
  return state2 == "active" ? "active" : "inactive";
}
function flip(next) {
  return next == "active" ? "inactive" : "active";
}
function getAnyCalibrate(context) {
  return useState(context, extensionId + ".calibrate");
}
function getGlobalAnyInvalidate(context) {
  return useGlobal(context, extensionId + ".global.invalidate");
}
function getWindowState(context) {
  return useState(context, extensionId + ".window");
}
function getStateStore(context) {
  return useState(
    context,
    extensionId + ".extension"
  );
}
function getErrorStore(context) {
  return useState(
    context,
    extensionId + ".error"
  );
}
function createTask() {
  let resolve = (value) => {
  }, reject = () => {
  };
  const promise = new Promise((_resolve, _reject) => {
    reject = _reject;
    resolve = _resolve;
  });
  return { promise, resolve, reject };
}
function hold(t = 100) {
  return new Promise((resolve) => setTimeout(resolve, t));
}
async function installCycle(context) {
  const res = await read();
  if (res.wasActive) {
    console.log("vscode-concise-syntax is active!");
    return res.wasActive;
  }
  let remoteWorkbenchPath;
  let ext = vscode__namespace.extensions.getExtension(extensionId);
  if (ext && ext.extensionPath) {
    remoteWorkbenchPath = path.resolve(ext.extensionPath, "out/workbench.js");
  } else {
    remoteWorkbenchPath = path.resolve(__dirname, "index.js");
  }
  await patchWorkbench(res, remoteWorkbenchPath);
}
async function uninstallCycle(context) {
  const { html, wasActive, workbench } = await read();
  if (wasActive) {
    const newHtml = html.replaceAll(extensionScriptTag(), "");
    await fs__namespace.promises.writeFile(workbench.path, newHtml, "utf-8");
  }
  await fs__namespace.promises.unlink(workbench.customPath).catch(_catch);
  return wasActive;
}
function deactivateCycle() {
  console.log("vscode-concise-syntax is deactivated!");
}
async function read() {
  if (!require.main?.filename) {
    vscode__namespace.window.showErrorMessage(msg.internalError + "no main filename");
    throw new Error("no main filename");
  }
  const appDir = path.dirname(require.main.filename);
  const base = path.join(appDir, "vs", "code", "electron-sandbox", "workbench");
  return await preRead(base);
}
async function activate(context) {
  const extensionState = getStateStore(context);
  const { wasActive } = await read();
  const reloadCommand = packageJson.contributes.commands[0].command;
  context.subscriptions.push(
    vscode__namespace.commands.registerCommand(reloadCommand, async () => {
      try {
        if (extensionState.read() == state.active) {
          vscode__namespace.window.showInformationMessage("Already Mounted");
        } else {
          await uninstallCycle(context);
          await installCycle(context);
          if (!wasActive) {
            await extensionState.write(state.inactive);
            reloadWindowMessage(msg.enabled);
          } else {
            await extensionState.write(state.active);
            await ExtensionState_statusBarItem(context, state.active);
            vscode__namespace.window.showInformationMessage("Mount: using cache");
          }
        }
      } catch (error) {
        __catch(error);
      }
    })
  );
  const disposeCommand = packageJson.contributes.commands[1].command;
  context.subscriptions.push(
    vscode__namespace.commands.registerCommand(disposeCommand, async () => {
      try {
        const wasActive2 = await uninstallCycle(context);
        await extensionState.write(state.disposed);
        await ExtensionState_statusBarItem(context, state.disposed);
        const [message, ...options] = wasActive2 ? ["Disposed", "Reload", "Uninstall"] : ["Already Disposed", "Uninstall"];
        const selection = await vscode__namespace.window.showInformationMessage(message, ...options);
        if (selection == "Reload") {
          vscode__namespace.commands.executeCommand("workbench.action.reloadWindow");
        } else if (selection == "Uninstall") {
          vscode__namespace.commands.executeCommand(
            "workbench.extensions.action.uninstallExtension",
            extensionId
          );
        }
      } catch (error) {
        __catch(error);
      }
    })
  );
  try {
    const previousExtensionState = extensionState.read();
    checkDisposedCommandContext(previousExtensionState);
    if (previousExtensionState != state.disposed) {
      const isActive = await installCycle(context);
      await extensionState.write(state.active);
      if (!wasActive) {
        reloadWindowMessage(msg.enabled);
      } else {
        const windowState = previousExtensionState == state.inactive && isActive ? state.active : binary(getWindowState(context).read() ?? state.active);
        await ExtensionState_statusBarItem(context, windowState);
      }
    }
  } catch (error) {
    __catch(error);
  }
  console.log("vscode-concise-syntax is active");
  function __catch(e) {
    console.error(e);
    const error = getErrorStore(context);
    error.write("unhandled");
  }
}
function reloadWindowMessage(message) {
  vscode__namespace.window.showInformationMessage(message, { title: msg.restartIde }).then((selection) => {
    if (selection) {
      vscode__namespace.commands.executeCommand("workbench.action.reloadWindow");
    }
  });
}
exports.activate = activate;
exports.deactivate = deactivateCycle;
//# sourceMappingURL=extension.js.map
