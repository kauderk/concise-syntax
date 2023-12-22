"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.deactivate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const messages_1 = __importDefault(require("./messages"));
const package_json_1 = __importDefault(require("../package.json"));
const write_1 = require("./write");
async function installCycle(context) {
    const state = getStateStore(context);
    const res = await read();
    if (res.wasActive) {
        console.log('vscode-concise-syntax is active!');
        await statusBarItem(context, true);
        await state.write('active');
        return true;
    }
    let remoteWorkbenchPath;
    let ext = vscode.extensions.getExtension(write_1.extensionId);
    if (ext && ext.extensionPath) {
        remoteWorkbenchPath = path.resolve(ext.extensionPath, 'out/workbench.js');
    }
    else {
        remoteWorkbenchPath = path.resolve(__dirname, 'workbench.js');
    }
    await (0, write_1.patchWorkbench)(res, remoteWorkbenchPath);
    await state.write('restart');
}
async function uninstallCycle(context) {
    const state = getStateStore(context);
    const { html, wasActive, workbench } = await read();
    if (wasActive) {
        const newHtml = html.replaceAll((0, write_1.extensionScriptTag)(), '');
        await fs.promises.writeFile(workbench.path, newHtml, 'utf-8');
    }
    await fs.promises.unlink(workbench.customPath).catch(_catch);
    await state.write('restart');
    return wasActive;
}
// how do you make javascript freak out about promises/errors?
function deactivate() {
    // FIXME: why is this hook not working? :(
    console.log('vscode-concise-syntax is deactivated!');
}
exports.deactivate = deactivate;
async function activate(context) {
    const state = getStateStore(context);
    // FIXME: use a better state manager or state machine
    const { wasActive } = await read();
    const reloadCommand = package_json_1.default.contributes.commands[0].command;
    context.subscriptions.push(vscode.commands.registerCommand(reloadCommand, async () => {
        try {
            if (state.read() == 'active') {
                vscode.window.showInformationMessage('Already Mounted');
            }
            else {
                await uninstallCycle(context);
                await installCycle(context);
                if (!wasActive) {
                    reloadWindowMessage(messages_1.default.enabled);
                }
                else {
                    await statusBarItem(context, true);
                    vscode.window.showInformationMessage('Mount: using cache', 'Reload');
                }
            }
        }
        catch (error) {
            __catch(error);
        }
    }));
    const disposeCommand = package_json_1.default.contributes.commands[1].command;
    context.subscriptions.push(vscode.commands.registerCommand(disposeCommand, async () => {
        try {
            const wasActive = await uninstallCycle(context);
            await statusBarItem(context, false);
            const [message, ...options] = wasActive
                ? ['Disposed', 'Reload', 'Uninstall']
                : ['Already Disposed', 'Uninstall'];
            // prettier-ignore
            const selection = await vscode.window.showInformationMessage(message, ...options);
            if (selection == 'Reload') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
            else if (selection == 'Uninstall') {
                vscode.commands.executeCommand('workbench.extensions.action.uninstallExtension', write_1.extensionId);
            }
        }
        catch (error) {
            __catch(error);
        }
        finally {
            await state.write('disposed');
        }
    }));
    const key = 'editor.tokenColorCustomizations';
    const textMateRules = [
        {
            name: 'kauderk.concise-syntax.text',
            scope: ['meta.jsx.children.tsx'],
            settings: {
                foreground: '#B59E7A',
            },
        },
        {
            name: 'kauderk.concise-syntax.redundant',
            scope: [
                'punctuation.definition.tag.begin.tsx',
                'punctuation.definition.tag.end.tsx',
                'punctuation.section.embedded.begin.tsx',
                'punctuation.section.embedded.end.tsx',
                'punctuation.terminator.statement.tsx',
                'concise.redundant-syntax',
            ],
            settings: {
                foreground: '#00b51b00',
            },
        },
        {
            name: 'kauderk.concise-syntax.quote.begin',
            scope: ['punctuation.definition.string.begin.tsx'],
            settings: {
                foreground: '#b5a90000',
            },
        },
        {
            name: 'kauderk.concise-syntax.quote.end',
            scope: ['punctuation.definition.string.end.tsx'],
            settings: {
                foreground: '#b5030000',
            },
        },
    ];
    const operation = 'add';
    // TODO: avoid writing defensive code, someone else surely knows a better way to do this
    updateSettings: try {
        const workspace = vscode.workspace.workspaceFolders?.[0].uri;
        if (!workspace) {
            vscode.window.showErrorMessage('No workspace found: cannot update textMateRules');
            break updateSettings;
        }
        const path = '.vscode/settings.json';
        const config = await fs.promises
            .readFile(workspace?.fsPath + '/' + path, 'utf-8')
            // https://stackoverflow.com/a/73298406 parse JSON with comments
            .then((invalid_json) => new Function('return ' + invalid_json)())
            .catch(_catch);
        if (!config) {
            vscode.window.showErrorMessage(`Cannot read ${path}: does not exist or is not valid JSON`);
            break updateSettings;
        }
        // FIXME: figure out why this method returns a Proxy with global values such as Light and Dark themes
        // let tokens: typeof shape | undefined = await vscode.workspace.getConfiguration(undefined, workspace)?.get(key)
        let userRules = config?.[key]?.textMateRules;
        if (userRules && !Array.isArray(userRules)) {
            vscode.window.showErrorMessage(`${path}: ${key}.textMateRules is not an array`);
            break updateSettings;
        }
        const isEmpty = !userRules || userRules?.length == 0;
        if (operation == 'remove') {
            if (isEmpty) {
                break updateSettings;
            }
            else {
                // remove only the extension's textMateRules
                userRules = userRules?.filter((rule) => !textMateRules.find((r) => r.name == rule?.name));
            }
        }
        else if (operation == 'add') {
            if (isEmpty) {
                userRules = textMateRules;
            }
            else {
                userRules ??= [];
                const lookup = textMateRules.reduce((acc, rule) => {
                    acc.push([rule.name, rule.scope]);
                    return acc;
                }, []);
                let conflictScopes = [];
                conflicts: for (let i = 0; i < userRules.length; i++) {
                    const userRule = userRules[i];
                    if (!userRule || textMateRules.some((r) => r.name == userRule.name))
                        continue;
                    const userScope = userRule.scope ?? [];
                    const potentialConflictScopes = userScope.reduce((acc, scope) => {
                        if (scope &&
                            textMateRules.some((r) => r.scope.some((value) => userScope.includes(value)))) {
                            acc.push(scope);
                        }
                        return acc;
                    }, []);
                    if (!potentialConflictScopes.length)
                        continue conflicts;
                    conflictScopes.push([
                        `${i}: ${userRule.name || ''}`,
                        potentialConflictScopes.join(', '),
                    ]);
                }
                if (conflictScopes.length) {
                    vscode.window.showWarningMessage(`${path}: ${key}.textMateRules: Conflict scopes detected       🛠️ Remove them when using Concise-Syntax 🛠️        ${conflictScopes
                        .map(([name, scopes]) => `[${name} -> ${scopes}]`)
                        .join(', ')}`);
                }
                // add what is missing
                addition: for (const rule of textMateRules) {
                    const exist = userRules.some((r, i) => {
                        const match = r?.name === rule.name;
                        if (match) {
                            userRules[i] = rule; // ! userRules is ok
                            return true;
                        }
                        return match;
                    });
                    if (!exist) {
                        userRules.push(rule);
                    }
                }
            }
        }
        config[key].textMateRules = userRules;
        // Overwrite entire parent setting
        await vscode.workspace
            .getConfiguration()
            .update(key, config[key], vscode.ConfigurationTarget.Workspace);
    }
    catch (error) {
        if (error?.message) {
            vscode.window.showErrorMessage(error.message);
        }
        debugger;
    }
    if (state.read() != 'disposed') {
        installCycle(context)
            .then(() => {
            if (!wasActive) {
                reloadWindowMessage(messages_1.default.enabled);
            }
        })
            .catch(__catch);
    }
    else if (wasActive) {
        await statusBarItem(context);
    }
    console.log('vscode-concise-syntax is active');
    function __catch(e) {
        console.error(e);
        const error = getErrorStore(context);
        error.write('unhandled').catch(_catch);
    }
}
exports.activate = activate;
function _catch(e) { }
async function read() {
    if (!require.main?.filename) {
        vscode.window.showErrorMessage(messages_1.default.internalError + 'no main filename');
        throw new Error('no main filename');
    }
    const appDir = path.dirname(require.main.filename);
    const base = path.join(appDir, 'vs', 'code', 'electron-sandbox', 'workbench');
    return await (0, write_1.preRead)(base);
}
function reloadWindowMessage(message) {
    vscode.window
        .showInformationMessage(message, { title: messages_1.default.restartIde })
        .then((selection) => {
        if (selection) {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
    });
}
function getStateStore(context) {
    return stateManager(context, write_1.extensionId + '.state');
}
function getErrorStore(context) {
    return stateManager(context, write_1.extensionId + '.error');
}
function stateManager(context, key) {
    return {
        value: '',
        read() {
            return (this.value = context.globalState.get(key));
        },
        async write(newState) {
            this.value = newState;
            await context.globalState.update(key, newState);
            return newState;
        },
    };
}
let _item;
/**
 * The icon's purpose is to indicate the workbench.ts script the extension is active.
 */
async function statusBarItem(context, wasActive) {
    const active = stateManager(context, write_1.extensionId + '.active');
    if (activate !== undefined) {
        await active.write(wasActive ? 'true' : 'false');
    }
    const tooltip = (previous) => (_item.tooltip = `Concise Syntax: ` + (previous ? 'active' : 'inactive'));
    if (_item) {
        if (wasActive !== undefined) {
            tooltip(wasActive);
        }
        return;
    }
    async function toggle(next) {
        tooltip(next);
        await active.write(next ? 'true' : 'false');
    }
    const getActive = () => !!JSON.parse(active.read() ?? 'false');
    const myCommandId = package_json_1.default.contributes.commands[2].command;
    context.subscriptions.push(vscode.commands.registerCommand(myCommandId, async () => {
        await toggle(!getActive());
    }));
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    _item = item;
    item.command = myCommandId;
    item.text = `$(symbol-keyword) Concise`;
    tooltip(getActive());
    item.show();
    context.subscriptions.push(item);
}
//# sourceMappingURL=extension.js.map