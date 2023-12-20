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
const crypto_1 = require("crypto");
const package_json_1 = __importDefault(require("../package.json"));
const extensionId = package_json_1.default.publisher + '.' + package_json_1.default.name;
function getWorkBenchHtmlData() {
    if (!require.main?.filename) {
        vscode.window.showErrorMessage(messages_1.default.internalError + 'no main filename');
        throw new Error('no main filename');
    }
    const appDir = path.dirname(require.main.filename);
    const base = path.join(appDir, 'vs', 'code');
    const workbenchPath = path.join(base, 'electron-sandbox', 'workbench', 'workbench.html');
    const getBackupPath = (uuid) => path.join(base, 'electron-sandbox', 'workbench', `workbench.${uuid}.bak-concise-syntax`);
    return { path: workbenchPath, getBackupPath };
}
async function installCycle(context) {
    const file = getWorkBenchHtmlData();
    const state = getStateStore(context);
    const backupUuid = await getBackupUuid(file.path);
    if (backupUuid) {
        console.log('vscode-concise-syntax is active!');
        statusBarItem(context).show();
        await state.write('active');
        return true;
    }
    const error = getErrorStore(context);
    const uuidSession = (0, crypto_1.randomUUID)();
    // await createBackup(uuidSession)
    {
        try {
            const html = await fs.promises
                .readFile(file.path, 'utf-8')
                .then(clearExistingPatches);
            await fs.promises.writeFile(file.getBackupPath(uuidSession), html, 'utf-8');
        }
        catch (e) {
            vscode.window.showInformationMessage(messages_1.default.admin);
            await error.write('throw');
            throw e;
        }
    }
    // await performPatch(uuidSession)
    {
        let workbenchPath;
        let ext = vscode.extensions.getExtension(extensionId);
        if (ext && ext.extensionPath) {
            workbenchPath = path.resolve(ext.extensionPath, 'out/workbench.js');
        }
        else {
            workbenchPath = path.resolve(__dirname, 'workbench.js');
        }
        const indicatorJsContent = await fs.promises.readFile(workbenchPath, 'utf-8');
        const iifeWorkbench = `<script>${indicatorJsContent}</script>`;
        // prettier-ignore
        const html = (await fs.promises
            .readFile(file.path, 'utf-8')
            .then(clearExistingPatches))
            .replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, '')
            .replace(/(<\/html>)/, `<!-- !! VSCODE-CONCISE-SYNTAX-SESSION-ID ${uuidSession} !! -->\n` +
            '<!-- !! VSCODE-CONCISE-SYNTAX-START !! -->\n' +
            iifeWorkbench +
            '<!-- !! VSCODE-CONCISE-SYNTAX-END !! -->\n</html>');
        const error = getErrorStore(context);
        try {
            await fs.promises.writeFile(file.path, html, 'utf-8');
        }
        catch (e) {
            vscode.window.showInformationMessage(messages_1.default.admin);
            reloadWindowMessage(messages_1.default.disabled);
            await error.write('error');
            return;
        }
        // enabledRestart()
        await state.write('restart');
        return;
    }
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
function clearExistingPatches(html) {
    return html
        .replace(/<!-- !! VSCODE-CONCISE-SYNTAX-START !! -->[\s\S]*?<!-- !! VSCODE-CONCISE-SYNTAX-END !! -->\n*/, '')
        .replace(/<!-- !! VSCODE-CONCISE-SYNTAX-SESSION-ID [\w-]+ !! -->\n*/g, '');
}
async function getBackupUuid(path) {
    try {
        const uid = (await fs.promises.readFile(path, 'utf-8')) //
            .match(/<!-- !! VSCODE-CONCISE-SYNTAX-SESSION-ID ([0-9a-fA-F-]+) !! -->/);
        if (!uid)
            return null;
        else
            return uid[1];
    }
    catch (e) {
        vscode.window.showInformationMessage(messages_1.default.somethingWrong + e);
        throw e;
    }
}
async function uninstallCycle(context) {
    const file = getWorkBenchHtmlData();
    const state = getStateStore(context);
    const error = getErrorStore(context);
    // if typescript wont won't freak out about promises then nothing matters :D
    // getBackupUuid
    const backupUuid = await getBackupUuid(file.path);
    if (!backupUuid) {
        // const message = msg.somethingWrong + 'no backup uuid found'
        // vscode.window.showInformationMessage(message)
        // await error.write('error')
        return backupUuid;
    }
    // restoreBackup
    const backupFilePath = file.getBackupPath(backupUuid);
    {
        try {
            if (fs.existsSync(backupFilePath)) {
                await fs.promises.unlink(file.path);
                await fs.promises.copyFile(backupFilePath, file.path);
            }
        }
        catch (e) {
            vscode.window.showInformationMessage(messages_1.default.admin);
            await error.write('throw');
            throw e;
        }
    }
    // deleteBackupFiles
    {
        const htmlDir = path.dirname(file.path);
        const htmlDirItems = await fs.promises.readdir(htmlDir);
        for (const item of htmlDirItems) {
            if (item.endsWith('.bak-concise-syntax')) {
                await fs.promises.unlink(path.join(htmlDir, item));
            }
        }
    }
    await state.write('restart');
    return backupUuid;
}
// how do you make javascript freak out about promises/errors?
function deactivate() {
    // FIXME: why is this hook not working? :(
    console.log('vscode-concise-syntax is deactivated!');
}
exports.deactivate = deactivate;
function getStateStore(context) {
    return stateManager(context, extensionId + '.state');
}
function getErrorStore(context) {
    return stateManager(context, extensionId + '.error');
}
async function activate(context) {
    const state = getStateStore(context);
    // FIXME: use a better state manager or state machine
    const file = getWorkBenchHtmlData();
    const backup = await getBackupUuid(file.path);
    const reloadCommand = package_json_1.default.contributes.commands[0].command;
    context.subscriptions.push(vscode.commands.registerCommand(reloadCommand, async () => {
        try {
            if (state.read() == 'active') {
                vscode.window.showInformationMessage('Already Mounted');
            }
            else {
                await uninstallCycle(context);
                await installCycle(context);
                if (!backup) {
                    reloadWindowMessage(messages_1.default.enabled);
                }
                else {
                    statusBarItem(context).show();
                    vscode.window.showInformationMessage('Mount: using cache');
                }
            }
        }
        catch (error) {
            _catch(error);
        }
    }));
    const disposeCommand = package_json_1.default.contributes.commands[1].command;
    context.subscriptions.push(vscode.commands.registerCommand(disposeCommand, async () => {
        try {
            const backup = await uninstallCycle(context);
            statusBarItem(context).hide();
            const [message, ...options] = backup
                ? ['Disposed', 'Reload', 'Uninstall']
                : ['Already Disposed', 'Uninstall'];
            // prettier-ignore
            const selection = await vscode.window.showInformationMessage(message, ...options);
            if (selection == 'Reload') {
                vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
            else if (selection == 'Uninstall') {
                vscode.commands.executeCommand('workbench.extensions.action.uninstallExtension', extensionId);
            }
        }
        catch (error) {
            _catch(error);
        }
        finally {
            await state.write('disposed');
        }
    }));
    if (state.read() != 'disposed') {
        installCycle(context).catch(_catch);
    }
    else if (backup) {
        statusBarItem(context).show();
    }
    console.log('vscode-concise-syntax is active');
    function _catch(e) {
        console.error(e);
        const error = getErrorStore(context);
        error.write('unhandled').catch(() => { });
    }
}
exports.activate = activate;
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
function statusBarItem({ subscriptions }) {
    if (_item)
        return _item;
    // FIXME: find a way to apply custom css on the client side from here
    // const myCommandId = packageJson.contributes.commands[1].command
    // subscriptions.push(
    //   vscode.commands.registerCommand(myCommandId, () => {
    //     vscode.window.showInformationMessage(
    //       `Clicked on concise syntax indicator`
    //     )
    //   })
    // )
    const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    // myStatusBarItem.command = myCommandId
    item.text = `$(symbol-keyword) Concise`;
    item.tooltip = `Concise Syntax: pending`;
    item.show();
    subscriptions.push(item);
    return (_item = item);
}
//# sourceMappingURL=extension.js.map