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
        await statusBarItem(context, true);
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
    await active.write(wasActive ? 'true' : 'false');
    const tooltip = (previous) => (_item.tooltip = `Concise Syntax: ` + (previous ? 'active' : 'inactive'));
    if (_item) {
        tooltip(wasActive);
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