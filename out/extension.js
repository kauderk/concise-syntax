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
      enablement: "!extension.disposed && extension.running"
    },
    {
      command: "extension.calibrateWindow",
      title: "Calibrate Window",
      category: "Concise Syntax",
      enablement: "!extension.disposed && extension.calibrateWindow"
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
const key = "editor.tokenColorCustomizations";
const name = `${extensionId}.`;
const TextMateRules = [
  {
    name: "text",
    scope: ["meta.jsx.children.tsx"],
    settings: { foreground: "#FF0000" }
  },
  {
    name: "tag.begin",
    scope: ["punctuation.definition.tag.begin.tsx"],
    settings: { foreground: "#59ff00" }
  },
  {
    name: "tag.end",
    scope: ["punctuation.definition.tag.end.tsx"],
    settings: { foreground: "#59ff00" }
  },
  {
    name: "tag.entity",
    scope: ["entity.name.tag.tsx"],
    settings: { foreground: "#ff3900" }
  },
  {
    name: "tag.component",
    scope: ["support.class.component.tsx"],
    settings: { foreground: "#ff9900" }
  },
  {
    name: "bracket.begin",
    scope: ["punctuation.section.embedded.begin.tsx"],
    settings: { foreground: "#0037ff" }
  },
  {
    name: "bracket.end",
    scope: ["punctuation.section.embedded.end.tsx"],
    settings: { foreground: "#0037ff" }
  },
  {
    name: "string.begin",
    scope: [
      "punctuation.definition.string.begin.tsx",
      "punctuation.definition.string.template.begin.tsx"
    ],
    settings: { foreground: "#ffb300" }
  },
  {
    name: "string.end",
    scope: [
      "punctuation.definition.string.end.tsx",
      "punctuation.definition.string.template.end.tsx"
    ],
    settings: { foreground: "#f2ff00" }
  },
  {
    name: "comma",
    scope: ["punctuation.separator.parameter.tsx"],
    settings: { foreground: "#82a4a6" }
  },
  {
    name: "lastComma",
    scope: ["punctuation.separator.comma.tsx"],
    settings: { foreground: "#686868" }
  },
  {
    name: "terminator",
    scope: ["punctuation.terminator.statement.tsx"],
    settings: { foreground: "#ff00ee" }
  },
  {
    name: "ternary",
    scope: ["keyword.operator.ternary.tsx"],
    settings: { foreground: "#ae00ff" }
  }
];
function getTextMateRules(context) {
  return useState(context, "textMateRules");
}
async function updateWriteTextMateRules(context, cb) {
  const store = await getOrDefaultTextMateRules(context);
  cb(store, name);
  await getTextMateRules(context).write(JSON.stringify(store));
}
const settingsJsonPath = ".vscode/settings.json";
async function updateSettingsCycle(context, operation) {
  const res = await tryParseSettings();
  if (!res)
    return;
  const { wasEmpty, specialObjectUserRules: userRules } = res;
  const textMateRules = await getOrDefaultTextMateRules(context);
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
const DefaultTextMateRules = () => Clone(
  TextMateRules.map((r) => ({ ...r, name: `${name}${r.name}` }))
);
async function getOrDefaultTextMateRules(context) {
  try {
    const serialized = await getTextMateRules(context).read();
    if (serialized) {
      const parsed = JSON.parse(serialized);
      if (!Array.isArray(parsed)) {
        throw new Error("textMateRules is not an array");
      }
      for (let i = 0; i < TextMateRules.length; i++) {
        const rule = TextMateRules[i];
        if (name + rule.name != parsed[i].name) {
          parsed[i] = rule;
        }
      }
      parsed.length = TextMateRules.length;
      return parsed;
    } else {
      return DefaultTextMateRules();
    }
  } catch (error) {
    vscode__namespace.window.showErrorMessage(
      "Failed to parse textMateRules. Error: " + error?.message
    );
    return DefaultTextMateRules();
  }
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
let calibrate_confirmation_task = deltaValue((t) => {
  t.resolve();
});
let calibrate_window_task = deltaValue((t) => {
  t.resolve();
});
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
  const calibrateWIndowCommand = packageJson.contributes.commands[4].command;
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
    vscode__namespace.commands.registerCommand(
      calibrateWIndowCommand,
      () => calibrateWindowCommandCycle(usingContext)
    ),
    {
      dispose() {
        disposeConfiguration.consume();
        disposeClosedEditor.consume();
        calibrate_confirmation_task.consume();
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
      vscode__namespace.window.withProgress(
        {
          location: vscode__namespace.ProgressLocation.Window,
          title: packageJson.displayName
        },
        async (progress) => {
          progress.report({ message: "revalidating..." });
          for (let i = 0; i < 5; i++) {
            await hold(1e3);
          }
        }
      );
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
      await REC_nextWindowStateCycle(next, binary(next), usingContext, true);
    }).dispose;
}
async function calibrateStateSandbox(uriRemote, usingContext, _calibrate2) {
  const { stores } = usingContext;
  if (stores.globalCalibration.read() != state.active) {
    const res2 = await vscode__namespace.window.showInformationMessage(
      "The Concise Syntax extension will add/remove textMateRules in .vscode/settings.json to sync up with the window state.       Do you want to continue?",
      "Yes and remember",
      "No and deactivate"
    );
    const next = res2?.includes("Yes") ? state.active : state.inactive;
    await stores.globalCalibration.write(next);
    checkCalibratedCommandContext(next, stores.calibrationState);
    if (next == state.inactive && stores.windowState.read() != state.active) {
      return;
    }
  } else {
    checkCalibratedCommandContext(state.active, stores.calibrationState);
  }
  calibrate_confirmation_task.consume();
  const taskProgress = withProgress();
  calibrate_confirmation_task.value = taskProgress.task;
  taskProgress.progress.report({ message: "calibrating extension" });
  testShortCircuitWindowState = true;
  const error = await REC_nextWindowStateCycle(state.inactive, state.inactive, usingContext);
  if (error instanceof Error) {
    throw error;
  }
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
  taskProgress.progress.report({ message: "calibrating window" });
  if (calibrate_window_task.value) {
    throw new Error("calibrate_window_task is busy with a previous task");
  }
  calibrate_window_task.value = createTask();
  await vscode__namespace.window.showInformationMessage("about to sync window", "ok");
  await checkCalibrateWindowCommandContext(state.active);
  await tryUpdateCalibrateState(calibrate.opened, _calibrate2, 1500);
  await vscode__namespace.window.showInformationMessage("about to check window task", "ok");
  if (!calibrate_window_task.value?.promise) {
    throw new Error("calibrate_window_task is undefined");
  }
  let whyIsThisNotRejecting = false;
  const res = await Promise.race([
    calibrate_window_task.value.promise,
    new Promise((reject) => {
      setTimeout(() => {
        whyIsThisNotRejecting = true;
        reject(new Error("calibrate_window_task timed out"));
      }, 5e3);
    })
  ]);
  if (whyIsThisNotRejecting || res instanceof Error) {
    throw res || new Error("calibrate_window_task timed out");
  }
  taskProgress.progress.report({ message: "calibrating syntax and theme" });
  const error2 = await REC_nextWindowStateCycle(state.active, state.active, usingContext);
  if (error2 instanceof Error) {
    throw error2;
  }
  await tryUpdateCalibrateState(calibrate.idle, _calibrate2, 500);
  calibrate_window_task.consume();
  await checkCalibrateWindowCommandContext(state.inactive);
  taskProgress.progress.report({ message: "calibrated you may close the file" });
  setTimeout(() => {
    calibrate_confirmation_task.consume();
  }, 5e3);
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
    await REC_windowStateSandbox(
      tryNext,
      settings,
      Object.assign(usingContext, { _item }),
      recursiveDiff
    );
    busy = false;
  } catch (error) {
    showCrashIcon(_item, error);
    return error;
  }
}
function showCrashIcon(_item2, error) {
  debugger;
  crashedMessage = error?.message || "unknown";
  _item2.text = `$(error)` + iconText;
  _item2.tooltip = IState.encode(state.error);
  _item2.show();
  disposeConfiguration.consume();
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
    await calibrateStateSandbox(uriRemote, usingContext, _calibrate);
    c_busy = false;
  } catch (error) {
    debugger;
    if (_item) {
      showCrashIcon(_item, error);
    }
    calibrate_confirmation_task.consume();
    testShortCircuitWindowState = false;
    await consume_close(_calibrate);
    vscode__namespace.window.showErrorMessage(
      `Error: failed to open calibrate file -> ${error?.message}`
    );
  }
}
async function calibrateWindowCommandCycle(usingContext) {
  const input = await vscode__namespace.window.showInputBox({
    placeHolder: "Calibrate Window",
    prompt: `Calibrate Window using session's syntax and theme`,
    value: ""
  });
  if (!input) {
    calibrate_window_task.value?.reject(
      new Error("No window input was provided")
    );
    return;
  }
  try {
    const table = JSON.parse(input);
    await updateWriteTextMateRules(
      usingContext.context,
      (textMateRules, nameSuffix) => {
        const len = textMateRules.length;
        for (let i = 0; i < len; i++) {
          const value = textMateRules[i];
          const tableValue = table[value.name.replace(nameSuffix, "")];
          if (tableValue && tableValue.color) {
            const divergence = i / len / len + 0.9;
            value.settings.foreground = rgbToHexDivergent(tableValue.color, divergence) ?? value.settings.foreground;
          }
        }
        const begin = textMateRules.find(
          (r) => r.name.includes("bracket.begin")
        );
        const end = textMateRules.find((r) => r.name.includes("bracket.end"));
        if (begin && end) {
          end.settings.foreground = begin.settings.foreground;
        }
      }
    );
    await vscode__namespace.window.showInformationMessage("Calibrated window", "ok");
    calibrate_window_task.value?.resolve();
  } catch (error) {
    vscode__namespace.window.showErrorMessage("Failed to parse window input");
    calibrate_window_task.value?.reject(
      new Error("Failed to parse window input")
    );
  }
}
function rgbToHexDivergent(rgbString, scalar = 1) {
  const cleanedString = rgbString.replace(/\s/g, "").toLowerCase();
  const isRgba = cleanedString.includes("rgba");
  const values = cleanedString.match(/\d+(\.\d+)?/g);
  if (values && (isRgba ? values.length === 4 : values.length === 3)) {
    const hexValues = values.map((value, index) => {
      const intValue = parseFloat(value);
      const scaledValue = Math.min(255, Math.round(intValue * scalar));
      const hex = scaledValue.toString(16).padStart(2, "0");
      return index < 3 ? hex : scaledValue.toString(16).padStart(2, "0");
    });
    return `#${hexValues.join("")}`;
  } else {
    vscode__namespace.window.showErrorMessage(`Failed to parse rbg to hex: ${rgbString}`);
    return null;
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
    calibrationState: getAnyCalibrate(context),
    textMateRules: getTextMateRules(context)
  };
}
async function wipeAllState(context) {
  const states = getStores(context);
  for (const iterator of Object.values(states)) {
    await iterator.write(void 0);
  }
  return context;
}
function withProgress() {
  const task = createTask();
  let _progress;
  vscode__namespace.window.withProgress(
    {
      location: vscode__namespace.ProgressLocation.Window,
      title: packageJson.displayName
    },
    async (progress, token) => {
      _progress = progress;
      await task.promise;
    }
  );
  return {
    task,
    get progress() {
      if (!_progress)
        throw new Error("progress is undefined");
      return _progress;
    }
  };
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
async function checkCalibrateWindowCommandContext(next) {
  await vscode__namespace.commands.executeCommand(
    "setContext",
    "extension.calibrateWindow",
    next == state.active
  );
  await hold(500);
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
  }, reject = (value) => {
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
  const resetCommand = packageJson.contributes.commands[5].command;
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
