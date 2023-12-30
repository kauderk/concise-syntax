"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
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
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
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
      category: "Concise Syntax"
    }
  ]
};
const devDependencies = {
  "@types/node": "^20.10.5",
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
async function installCycle(context) {
  const state = getStateStore(context);
  const res = await read();
  if (res.wasActive) {
    console.log("vscode-concise-syntax is active!");
    await statusBarItem(context, true);
    await state.write("active");
    return true;
  }
  let remoteWorkbenchPath;
  let ext = vscode__namespace.extensions.getExtension(extensionId);
  if (ext && ext.extensionPath) {
    remoteWorkbenchPath = path__namespace.resolve(ext.extensionPath, "out/workbench.js");
  } else {
    remoteWorkbenchPath = path__namespace.resolve(__dirname, "index.js");
  }
  await patchWorkbench(res, remoteWorkbenchPath);
  await state.write("restart");
}
async function uninstallCycle(context) {
  const state = getStateStore(context);
  const { html, wasActive, workbench } = await read();
  if (wasActive) {
    const newHtml = html.replaceAll(extensionScriptTag(), "");
    await fs__namespace.promises.writeFile(workbench.path, newHtml, "utf-8");
  }
  await fs__namespace.promises.unlink(workbench.customPath).catch(_catch);
  await state.write("restart");
  return wasActive;
}
function deactivate() {
  console.log("vscode-concise-syntax is deactivated!");
}
async function activate(context) {
  const state = getStateStore(context);
  const { wasActive } = await read();
  const reloadCommand = packageJson.contributes.commands[0].command;
  context.subscriptions.push(
    vscode__namespace.commands.registerCommand(reloadCommand, async () => {
      try {
        if (state.read() == "active") {
          vscode__namespace.window.showInformationMessage("Already Mounted");
        } else {
          await uninstallCycle(context);
          await installCycle(context);
          if (!wasActive) {
            reloadWindowMessage(msg.enabled);
          } else {
            await statusBarItem(context, true);
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
        await statusBarItem(context, false);
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
      } finally {
        await state.write("disposed");
      }
    })
  );
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
  const operation = "add";
  updateSettings:
    try {
      const workspace = vscode__namespace.workspace.workspaceFolders?.[0].uri;
      if (!workspace) {
        vscode__namespace.window.showErrorMessage(
          "No workspace found: cannot update textMateRules"
        );
        break updateSettings;
      }
      const settingsJsonPath = ".vscode/settings.json";
      const userSettingsPath = workspace.fsPath + "/" + settingsJsonPath;
      const read2 = await fs__namespace.promises.readFile(userSettingsPath, "utf-8").then((raw_json2) => [new Function("return " + raw_json2)(), raw_json2]).catch(_catch);
      const [config, raw_json] = read2 ?? [];
      if (!config) {
        vscode__namespace.window.showErrorMessage(
          `Cannot read ${settingsJsonPath}: does not exist or is not valid JSON`
        );
        break updateSettings;
      }
      let userRules = config?.[key]?.textMateRules;
      if (userRules && !Array.isArray(userRules)) {
        vscode__namespace.window.showErrorMessage(
          `${settingsJsonPath}: ${key}.textMateRules is not an array`
        );
        break updateSettings;
      }
      const isEmpty = !userRules || userRules?.length == 0;
      if (operation == "remove")
        ;
      else if (operation == "add") {
        if (isEmpty) {
          userRules = textMateRules;
        } else {
          userRules ??= [];
          let conflictScopes = [];
          conflicts:
            for (let i = 0; i < userRules.length; i++) {
              const userRule = userRules[i];
              if (!userRule || textMateRules.some((r) => r.name == userRule.name))
                continue;
              const userScope = userRule.scope ?? [];
              const potentialConflictScopes = userScope.reduce((acc, scope) => {
                if (scope && textMateRules.some(
                  (r) => r.scope.some((_scope) => _scope === scope)
                )) {
                  acc.push(scope);
                }
                return acc;
              }, []);
              if (!potentialConflictScopes.length)
                continue conflicts;
              conflictScopes.push([
                `${i}: ${userRule.name || ""}`,
                potentialConflictScopes.join(", ")
              ]);
              userRule.scope = userScope.filter(
                (scope) => scope && !potentialConflictScopes.includes(scope)
              );
            }
          userRules = userRules.filter((r) => r?.scope?.length);
          addition:
            for (const rule of textMateRules) {
              const exist = userRules.some((r, i) => {
                const match = r?.name === rule.name;
                if (match) {
                  userRules[i] = rule;
                  return true;
                }
                return match;
              });
              if (!exist) {
                userRules.push(rule);
              }
            }
          config[key].textMateRules = userRules;
          if (conflictScopes.length) {
            const diff = "Show Conflicts";
            const addAnyway = "Write Settings";
            const result = await vscode__namespace.window.showWarningMessage(
              `${settingsJsonPath}: ${key}.textMateRules: Conflict scopes detected`,
              diff,
              addAnyway
            );
            if (result == diff) {
              const remoteSettingsPath = path__namespace.join(
                __dirname,
                "remote.settings.json"
              );
              const userIndentSpaceInt = 2;
              const remoteJson = JSON.stringify(config, null, userIndentSpaceInt);
              await fs__namespace.promises.writeFile(remoteSettingsPath, remoteJson, "utf-8");
              vscode__namespace.commands.executeCommand(
                "vscode.diff",
                vscode__namespace.Uri.file(userSettingsPath),
                vscode__namespace.Uri.file(remoteSettingsPath),
                `${packageJson.displayName} settings.json (diff)`
              );
              const result2 = await vscode__namespace.window.showWarningMessage(
                `Accept settings?`,
                "Show",
                // TODO:
                "More",
                // TODO:
                "Yes",
                "No"
              );
              if (result2 == "Yes") {
                await writeUserSettings(config);
              }
            } else if (result == addAnyway) {
              await writeUserSettings(config);
            }
          }
        }
      }
    } catch (error) {
      if (error?.message) {
        vscode__namespace.window.showErrorMessage(error.message);
      }
      debugger;
    }
  if (state.read() != "disposed") {
    installCycle(context).then(() => {
      if (!wasActive) {
        reloadWindowMessage(msg.enabled);
      }
    }).catch(__catch);
  } else if (wasActive) {
    await statusBarItem(context);
  }
  console.log("vscode-concise-syntax is active");
  async function writeUserSettings(config) {
    await vscode__namespace.workspace.getConfiguration().update(key, config[key], vscode__namespace.ConfigurationTarget.Workspace);
  }
  function __catch(e) {
    console.error(e);
    const error = getErrorStore(context);
    error.write("unhandled").catch(_catch);
  }
}
function _catch(e) {
}
async function read() {
  if (!require.main?.filename) {
    vscode__namespace.window.showErrorMessage(msg.internalError + "no main filename");
    throw new Error("no main filename");
  }
  const appDir = path__namespace.dirname(require.main.filename);
  const base = path__namespace.join(appDir, "vs", "code", "electron-sandbox", "workbench");
  return await preRead(base);
}
function reloadWindowMessage(message) {
  vscode__namespace.window.showInformationMessage(message, { title: msg.restartIde }).then((selection) => {
    if (selection) {
      vscode__namespace.commands.executeCommand("workbench.action.reloadWindow");
    }
  });
}
function getStateStore(context) {
  return stateManager(
    context,
    extensionId + ".state"
  );
}
function getErrorStore(context) {
  return stateManager(
    context,
    extensionId + ".error"
  );
}
function stateManager(context, key) {
  return {
    value: "",
    read() {
      return this.value = context.globalState.get(key);
    },
    async write(newState) {
      this.value = newState;
      await context.globalState.update(key, newState);
      return newState;
    }
  };
}
let _item;
async function statusBarItem(context, wasActive) {
  const active = stateManager(
    context,
    extensionId + ".active"
  );
  if (activate !== void 0) {
    await active.write(wasActive ? "true" : "false");
  }
  const tooltip = (previous) => _item.tooltip = `Concise Syntax: ` + (previous ? "active" : "inactive");
  if (_item) {
    if (wasActive !== void 0) {
      tooltip(wasActive);
    }
    return;
  }
  async function toggle(next) {
    tooltip(next);
    await active.write(next ? "true" : "false");
  }
  const getActive = () => !!JSON.parse(active.read() ?? "false");
  const myCommandId = packageJson.contributes.commands[2].command;
  context.subscriptions.push(
    vscode__namespace.commands.registerCommand(myCommandId, async () => {
      await toggle(!getActive());
    })
  );
  const item = vscode__namespace.window.createStatusBarItem(
    vscode__namespace.StatusBarAlignment.Right,
    100
  );
  _item = item;
  item.command = myCommandId;
  item.text = `$(symbol-keyword) Concise`;
  tooltip(getActive());
  item.show();
  context.subscriptions.push(item);
}
exports.activate = activate;
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
