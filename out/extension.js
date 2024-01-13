"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const JSONC = require("comment-json");
require("child_process");
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
      enablement: "!extension.disposed && extension.running"
    },
    {
      command: "extension.reset",
      title: "Reset then reload (dev)",
      category: "Concise Syntax"
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
const key = "editor.tokenColorCustomizations";
const name = `${extensionId}.`;
const textMateRules = [
  {
    name: name + "text.editable",
    scope: ["meta.jsx.children.tsx"],
    settings: { foreground: "#FF0000" }
  },
  {
    name: name + "tag.begin",
    scope: ["punctuation.definition.tag.begin.tsx"],
    settings: { foreground: "#59ff00" }
  },
  {
    name: name + "tag.end",
    scope: ["punctuation.definition.tag.end.tsx"],
    settings: { foreground: "#59ff00" }
  },
  {
    name: name + "tag.component",
    scope: ["support.class.component.tsx"],
    settings: { foreground: "#ff9900" }
  },
  {
    name: name + "bracket.begin",
    scope: ["punctuation.section.embedded.begin.tsx"],
    settings: { foreground: "#0037ff" }
  },
  {
    name: name + "bracket.end",
    scope: ["punctuation.section.embedded.end.tsx"],
    settings: { foreground: "#0037ff" }
  },
  {
    name: name + "string.begin",
    scope: [
      "punctuation.definition.string.begin.tsx",
      "punctuation.definition.string.template.begin.tsx"
    ],
    settings: { foreground: "#ffb300" }
  },
  {
    name: name + "string.end",
    scope: [
      "punctuation.definition.string.end.tsx",
      "punctuation.definition.string.template.end.tsx"
    ],
    settings: { foreground: "#f2ff00" }
  },
  {
    name: name + "comma",
    scope: ["punctuation.separator.parameter.tsx"],
    settings: { foreground: "#82a4a6" }
  },
  {
    name: name + "lastComma",
    scope: ["punctuation.separator.comma.tsx"],
    settings: { foreground: "#686868" }
  },
  //{"scope":["punctuation.definition.block.tsx",],"settings":{"foreground": "#ffffff" }},
  {
    name: name + "terminator",
    scope: ["punctuation.terminator.statement.tsx"],
    settings: { foreground: "#ff00ee" }
  },
  {
    name: name + "ternary",
    scope: ["keyword.operator.ternary.tsx"],
    settings: { foreground: "#ae00ff" }
  }
];
const settingsJsonPath = ".vscode/settings.json";
async function updateSettingsCycle(context, operation) {
  const res = await tryParseSettings();
  if (!res)
    return;
  const { wasEmpty, specialObjectUserRules: userRules } = res;
  let diff = false;
  if (operation == "active") {
    if (wasEmpty) {
      diff = true;
      userRules.push(...textMateRules);
    } else {
      const userIndexToNameMap = new Map(userRules.map((r, i) => [r?.name, i]));
      for (const presetRule of textMateRules) {
        const i = userIndexToNameMap.get(presetRule.name) ?? -1;
        if (i > -1) {
          const userRule = userRules[i];
          if (!userRule) {
            userRules[i] = presetRule;
            diff = true;
            continue;
          }
          if (presetRule.scope.some((s, i2) => s !== userRule.scope?.[i2])) {
            userRule.scope = presetRule.scope;
            diff = true;
          }
          if (userRule.settings?.foreground !== presetRule.settings.foreground) {
            userRule.settings ??= {};
            userRule.settings.foreground = presetRule.settings.foreground;
            diff = true;
          }
        } else {
          userRules.push(presetRule);
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
        const j = indexToNameMap.get(userRules[i]?.name);
        if (j > -1) {
          diff = true;
          userRules.splice(i, 1);
        }
      }
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
const calibrate = {
  opening: "opening",
  opened: "opened",
  closed: "closed",
  idle: "idle",
  error: "error"
};
function iconSelector(icon) {
  return `[id="${extensionId}"]:has(.codicon-${icon})`;
}
function _catch(e) {
}
function useState(context, key2, type2) {
  const _key = `${extensionId}.workspace.${key2}`;
  return {
    key: _key,
    value: void 0,
    read() {
      return this.value = context.workspaceState.get(_key);
    },
    async write(newState) {
      this.value = newState;
      await context.workspaceState.update(_key, newState);
      return newState;
    }
  };
}
function useGlobal(context, key2, type2) {
  const _key = `${extensionId}.global.${key2}`;
  return {
    key: _key,
    value: void 0,
    read() {
      return this.value = context.globalState.get(_key);
    },
    async write(newState) {
      this.value = newState;
      await context.globalState.update(_key, newState);
      return newState;
    }
  };
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
  (t) => {
    t.cancel();
    t.dispose();
  }
);
async function ExtensionState_statusBarItem(context, setState) {
  const stores = getStores(context);
  await stores.windowState.write(setState);
  const usingContext = { stores, context };
  checkDisposedCommandContext(setState);
  if (_item) {
    return REC_nextWindowStateCycle(setState, binary(setState), usingContext);
  }
  const toggleCommand = packageJson.contributes.commands[2].command;
  _item = vscode__namespace.window.createStatusBarItem(vscode__namespace.StatusBarAlignment.Right, 0);
  _item.command = toggleCommand;
  const remoteCalibratePath = path.join(__dirname, calibrationFileName);
  const uriRemote = vscode__namespace.Uri.file(remoteCalibratePath);
  const calibrateCommand = packageJson.contributes.commands[3].command;
  _calibrate = vscode__namespace.window.createStatusBarItem(vscode__namespace.StatusBarAlignment.Right, 0);
  _calibrate.command = calibrateCommand;
  defaultCalibrate(_calibrate);
  const next = setState ?? "active";
  await REC_nextWindowStateCycle(next, binary(next), usingContext);
  context.subscriptions.push(
    _item,
    vscode__namespace.commands.registerCommand(
      toggleCommand,
      () => toggleCommandCycle(usingContext)
    ),
    _calibrate,
    vscode__namespace.commands.registerCommand(
      calibrateCommand,
      () => calibrateCommandCycle(uriRemote, usingContext)
    ),
    registerWithProgressCommand(),
    {
      dispose() {
        disposeConfiguration.consume();
        disposeClosedEditor.consume();
        calibrate_confirmation_token.consume();
      }
    }
  );
}
async function REC_windowStateSandbox(tryNext, settings, usingContext, recursiveDiff) {
  const { stores, context, _item: _item2 } = usingContext;
  if (stores.calibrationState.read() != state.active) {
    await defaultWindowState(_item2, state.stale, stores.windowState);
    return;
  }
  _item2.text = `$(${statusIconLoading})` + iconText;
  const cash = await updateSettingsCycle(context, settings);
  if (typeof cash == "function" && recursiveDiff && tryNext == state.active && stores.globalInvalidation.read() != state.active) {
    await defaultWindowState(_item2, state.stale, stores.windowState);
    const res = await vscode__namespace.window.showInformationMessage(
      "The extension settings were invalidated while the extension was running.         Shall we add missing extension textMateRules if any and move them to the end to avoid conflicts?",
      "Yes and remember",
      "No and deactivate"
    );
    const next = res?.includes("Yes") ? state.active : state.inactive;
    await stores.globalInvalidation.write(next);
    if (next == state.inactive) {
      await defaultWindowState(_item2, next, stores.windowState);
      return;
    }
  }
  if (typeof cash == "function") {
    if (recursiveDiff) {
      await withProgress({
        title: "revalidating...",
        seconds: 5
      });
    }
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
  await defaultWindowState(_item2, tryNext, stores.windowState);
  if (tryNext == state.active)
    disposeConfiguration.fn = vscode__namespace.workspace.onDidChangeConfiguration(async (config) => {
      if (busy || !config.affectsConfiguration(key))
        return;
      const next = stores.windowState.read();
      if (!next)
        return;
      await REC_nextWindowStateCycle(next, binary(next), usingContext, recursiveDiff);
    }).dispose;
}
async function calibrateStateSandbox(uriRemote, usingContext, _calibrate2) {
  const { stores } = usingContext;
  if (stores.globalCalibration.read() != state.active) {
    const res = await vscode__namespace.window.showInformationMessage(
      "The Concise Syntax extension will add/remove textMateRules in .vscode/settings.json to sync up with the window state.       Do you want to continue?",
      "Yes and remember",
      "No and deactivate"
    );
    const next = res?.includes("Yes") ? state.active : state.inactive;
    await stores.globalCalibration.write(next);
    checkCalibratedCommandContext(next, stores.calibrationState);
    if (next == state.inactive && stores.windowState.read() != state.active) {
      return;
    }
  } else {
    checkCalibratedCommandContext(state.active, stores.calibrationState);
  }
  await withProgress({
    title: "calibrating...",
    seconds: 10
  });
  testShortCircuitWindowState = true;
  await REC_nextWindowStateCycle(state.inactive, state.inactive, usingContext);
  testShortCircuitWindowState = false;
  if (stores.windowState.read() != state.active && _item) {
    await defaultWindowState(_item, "active", stores.windowState);
  }
  await tryUpdateCalibrateState(calibrate.opening, _calibrate2);
  const document = await vscode__namespace.workspace.openTextDocument(uriRemote);
  const editor = await vscode__namespace.window.showTextDocument(document, {
    preview: false,
    preserveFocus: false
  });
  disposeClosedEditor.fn = onDidCloseTextDocument(async (doc) => {
    if (doc.uri.path === uriRemote.path || editor.document.isClosed) {
      await consume_close(_calibrate2);
      return true;
    }
  });
  await tryUpdateCalibrateState(calibrate.opened, _calibrate2, 1500);
  await REC_nextWindowStateCycle(state.active, state.active, usingContext);
  await tryUpdateCalibrateState(calibrate.idle, _calibrate2, 500);
  await withProgress({
    title: "calibrated you may close the file",
    seconds: 5
  });
}
async function REC_nextWindowStateCycle(tryNext, settings, usingContext, recursiveDiff) {
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
    disposeConfiguration.consume();
    calibrate_confirmation_token.consume();
    await REC_windowStateSandbox(
      tryNext,
      settings,
      Object.assign(usingContext, { _item }),
      recursiveDiff
    );
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
let testShortCircuitWindowState = false;
async function defaultWindowState(_item2, next, windowState) {
  if (testShortCircuitWindowState)
    return;
  await windowState.write(next);
  _item2.text = `$(${stateIcon})` + iconText;
  _item2.tooltip = IState.encode(next);
  const failure = next == state.disposed || next == state.stale || next == state.error;
  await hold(failure ? 1e3 : 100);
  if (failure) {
    _item2.hide();
  } else {
    _item2.show();
  }
}
async function calibrateCommandCycle(uriRemote, usingContext) {
  const { stores } = usingContext;
  if (!_calibrate) {
    vscode__namespace.window.showErrorMessage("No status bar item found");
    return;
  }
  if (stores.extensionState.read() == "disposed") {
    vscode__namespace.window.showInformationMessage(
      "The extension is disposed. Mount it to use this command."
    );
    return;
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
    await calibrateStateSandbox(uriRemote, usingContext, _calibrate);
    c_busy = false;
  } catch (error) {
    debugger;
    testShortCircuitWindowState = false;
    await consume_close(_calibrate);
    vscode__namespace.window.showErrorMessage(
      `Error: failed to open calibrate file -> ${error?.message}`
    );
  }
}
async function toggleCommandCycle(usingContext) {
  const { stores } = usingContext;
  if (stores.extensionState.read() == "disposed") {
    vscode__namespace.window.showInformationMessage(
      "The extension is disposed. Mount it to use this command."
    );
    return;
  }
  if (busy) {
    vscode__namespace.window.showInformationMessage(
      "The extension is busy. Try again in a few seconds."
    );
    return;
  }
  const next = flip(stores.windowState.read());
  await REC_nextWindowStateCycle(next, next, usingContext);
}
function defaultCalibrate(_calibrate2) {
  _calibrate2.text = `$(${calibrateIcon})`;
  _calibrate2.tooltip = "bootUp";
  _calibrate2.show();
}
function consume_close(_calibrate2) {
  disposeClosedEditor.consume();
  return tryUpdateCalibrateState(calibrate.closed, _calibrate2);
}
function tryUpdateCalibrateState(state2, _calibrate2, t = 100) {
  _calibrate2.tooltip = state2;
  return hold(t);
}
async function checkCalibratedCommandContext(next, calibrationState) {
  vscode__namespace.commands.executeCommand(
    "setContext",
    "extension.calibrated",
    next == state.active
  );
  await calibrationState.write(next);
}
function getStores(context) {
  return {
    extensionState: getStateStore(context),
    windowState: getWindowState(context),
    globalInvalidation: getGlobalAnyInvalidate(context),
    globalCalibration: getGlobalAnyCalibrate(context),
    calibrationState: getAnyCalibrate(context)
  };
}
async function wipeAllState(context) {
  const states = getStores(context);
  for (const iterator of Object.values(states)) {
    await iterator.write(void 0);
  }
  return context;
}
async function withProgress(params) {
  let _progress;
  vscode__namespace.window.withProgress(
    {
      location: vscode__namespace.ProgressLocation.Window,
      title: "Concise Syntax: ",
      cancellable: true
    },
    // prettier-ignore
    async (progress, token) => new Promise(async (resolve) => {
      _progress = progress;
      if (calibrate_confirmation_token.value?.token.isCancellationRequested) {
        resolve(null);
        return;
      }
      calibrate_confirmation_token.value = new vscode__namespace.CancellationTokenSource();
      const dispose = calibrate_confirmation_token.value.token.onCancellationRequested(() => {
        calibrate_confirmation_token.consume();
        dispose();
        resolve(null);
      }).dispose;
      for (let i = 0; i < params.seconds; i++) {
        await hold(1e3);
      }
      resolve(null);
    })
  );
  await hold(500);
  _progress.report({ message: params.title });
}
function registerWithProgressCommand() {
  return vscode__namespace.commands.registerCommand(
    "extension.withProgress",
    async (title, seconds, cancellable = true) => {
      return vscode__namespace.window.withProgress(
        {
          location: vscode__namespace.ProgressLocation.Window,
          title,
          cancellable: true
        },
        // prettier-ignore
        async (progress, token) => new Promise(async (resolve) => {
          if (calibrate_confirmation_token.value?.token.isCancellationRequested) {
            resolve(null);
            return;
          }
          calibrate_confirmation_token.value = new vscode__namespace.CancellationTokenSource();
          const dispose = calibrate_confirmation_token.value.token.onCancellationRequested(() => {
            calibrate_confirmation_token.consume();
            dispose();
            resolve(null);
          }).dispose;
          for (let i = 0; i < seconds; i++) {
            await hold(1e3);
          }
          resolve(null);
        })
      );
    }
  );
}
function checkDisposedCommandContext(next) {
  vscode__namespace.commands.executeCommand(
    "setContext",
    "extension.disposed",
    next == state.disposed
  );
  vscode__namespace.commands.executeCommand(
    "setContext",
    "extension.running",
    next == state.active || next == state.inactive
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
  return useState(context, "calibrate");
}
function getGlobalAnyCalibrate(context) {
  return useGlobal(context, "calibrate");
}
function getGlobalAnyInvalidate(context) {
  return useGlobal(context, "invalidate");
}
function getWindowState(context) {
  return useState(context, "window");
}
function getStateStore(context) {
  return useState(context, "extension");
}
function getErrorStore(context) {
  return useState(context, "error");
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
  const resetCommand = packageJson.contributes.commands[4].command;
  context.subscriptions.push(
    vscode__namespace.commands.registerCommand(
      resetCommand,
      () => wipeAllState(context).then(uninstallCycle).then(
        () => vscode__namespace.commands.executeCommand("workbench.action.reloadWindow")
      )
    )
  );
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
