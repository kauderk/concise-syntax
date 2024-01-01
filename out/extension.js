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
const name = "concise-syntax";
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
      category: "Concise Syntax"
    },
    {
      command: "extension.disposeExtension",
      title: "Dispose Extension (free memory)",
      category: "Concise Syntax"
    },
    {
      command: "extension.toggle",
      title: "Toggle",
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
  name,
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
const extensionId = packageJson.publisher + "." + packageJson.name;
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
const key = "editor.tokenColorCustomizations";
const textMateRules = [
  {
    name: "kauderk.concise-syntax.text",
    scope: ["meta.jsx.children.tsx"],
    settings: {
      foreground: "#B59E7A"
    }
  },
  {
    name: "kauderk.concise-syntax.redundant",
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
    name: "kauderk.concise-syntax.quote.begin",
    scope: ["punctuation.definition.string.begin.tsx"],
    settings: {
      foreground: "#b5a90000"
    }
  },
  {
    name: "kauderk.concise-syntax.quote.end",
    scope: ["punctuation.definition.string.end.tsx"],
    settings: {
      foreground: "#b5030000"
    }
  }
];
const settingsJsonPath = ".vscode/settings.json";
async function updateSettingsCycle(operation) {
  const res = await tryParseSettings();
  if (!res)
    return;
  const { wasEmpty, userRules } = res;
  let diff = false;
  if (operation == "active") {
    if (wasEmpty) {
      diff = true;
      userRules.push(...textMateRules);
    } else {
      for (const rule of textMateRules) {
        const exist = userRules.some(
          (r, i) => r?.name === rule.name ? userRules[i] = rule : false
        );
        if (!exist) {
          diff = true;
          userRules.push(rule);
        }
      }
    }
  } else {
    if (wasEmpty) {
      diff = false;
      return;
    } else {
      for (let i = userRules.length - 1; i >= 0; i--) {
        const rule = userRules[i];
        if (rule && textMateRules.find((r) => r.name == rule.name)) {
          diff = true;
          userRules.splice(i, 1);
        }
      }
    }
  }
  if (!diff) {
    return true;
  }
  debugger;
  await res.write();
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
    userRules,
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
const state = {
  active: "active",
  inactive: "inactive",
  disposed: "disposed",
  error: "error"
};
const IState = {
  /**
   *
   * @param state
   * @returns
   */
  encode(state2) {
    return `Concise Syntax: ` + state2;
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
let _item;
let statusIcon = "symbol-keyword";
let statusIconLoading = "loading~spin";
const iconText = "";
let busy;
let disposeConfiguration = () => {
};
let crashedMessage = "";
async function ExtensionState_statusBarItem(context, setState) {
  const windowState = getWindowState(context);
  await windowState.write(setState);
  vscode__namespace.commands.executeCommand(
    "setContext",
    "extension.disposed",
    setState == state.disposed
  );
  async function REC_nextStateCycle(next2, settings) {
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
      disposeConfiguration();
      _item.text = `$(${statusIconLoading})` + iconText;
      const task = createTask();
      const watcher = vscode__namespace.workspace.onDidChangeConfiguration(task.resolve);
      const cash = await updateSettingsCycle(settings);
      await windowState.write(next2);
      await Promise.race([
        task.promise,
        // either the configuration changes or the timeout
        new Promise((resolve) => setTimeout(resolve, !cash ? 3e3 : 0))
      ]);
      watcher.dispose();
      _item.text = `$(${statusIcon})` + iconText;
      _item.tooltip = IState.encode(next2);
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (next2 != state.disposed) {
        _item.show();
      } else {
        _item.hide();
      }
      disposeConfiguration = vscode__namespace.workspace.onDidChangeConfiguration(async (config) => {
        if (!config.affectsConfiguration(key))
          return;
        const next3 = windowState.read();
        if (!next3)
          return;
        debugger;
        await REC_nextStateCycle(next3, binary(next3));
      }).dispose;
      busy = false;
    } catch (error) {
      crashedMessage = error?.message || "unknown";
      _item.text = `$(error)` + iconText;
      _item.tooltip = IState.encode(state.error);
      _item.show();
    }
  }
  if (_item) {
    await REC_nextStateCycle(setState, binary(setState));
    return;
  }
  const myCommandId = packageJson.contributes.commands[2].command;
  context.subscriptions.push(
    vscode__namespace.commands.registerCommand(myCommandId, async () => {
      const extensionState = getStateStore(context);
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
  _item = vscode__namespace.window.createStatusBarItem(vscode__namespace.StatusBarAlignment.Right, 0);
  _item.command = myCommandId;
  const next = windowState.read() ?? "active";
  await REC_nextStateCycle(next, binary(next));
  context.subscriptions.push(_item, {
    dispose() {
      disposeConfiguration();
    }
  });
}
function binary(state2) {
  return state2 == "active" ? "active" : "inactive";
}
function flip(next) {
  return next == "active" ? "inactive" : "active";
}
function getWindowState(context) {
  return stateManager(context, extensionId + ".window");
}
function getStateStore(context) {
  return stateManager(
    context,
    extensionId + ".extension"
  );
}
function getErrorStore(context) {
  return stateManager(
    context,
    extensionId + ".error"
  );
}
function stateManager(context, key2) {
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
    vscode__namespace.commands.executeCommand(
      "setContext",
      "extension.disposed",
      previousExtensionState == state.disposed
    );
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
    error.write("unhandled").catch(_catch);
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
