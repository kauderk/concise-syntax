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
exports.activate = exports.uninstall = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const messages_1 = __importDefault(require("./messages"));
const crypto_1 = require("crypto");
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
async function installImpl() {
    const file = getWorkBenchHtmlData();
    const backupUuid = await getBackupUuid(file.path);
    if (backupUuid) {
        console.log('vscode-concise-syntax is active!');
        return;
    }
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
            throw e;
        }
    }
    // await performPatch(uuidSession)
    {
        let workbenchPath;
        let ext = vscode.extensions.getExtension('kauderk.vscode-concise-syntax');
        if (ext && ext.extensionPath) {
            workbenchPath = path.resolve(ext.extensionPath, 'dist/workbench.js');
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
        try {
            await fs.promises.writeFile(file.path, html, 'utf-8');
        }
        catch (e) {
            vscode.window.showInformationMessage(messages_1.default.admin);
            disabledRestart();
            return;
        }
        // enabledRestart()
        vscode.window
            .showInformationMessage(messages_1.default.enabled, { title: messages_1.default.restartIde })
            .then(reloadWindow);
    }
    console.log('vscode-concise-syntax is active!');
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
async function uninstall() {
    return uninstallImpl().then(disabledRestart).catch(_catch);
}
exports.uninstall = uninstall;
async function uninstallImpl() {
    const file = getWorkBenchHtmlData();
    // if typescript wont won't freak out about promises then nothing matters :D
    // getBackupUuid
    const backupUuid = await getBackupUuid(file.path);
    if (!backupUuid) {
        vscode.window.showInformationMessage(messages_1.default.somethingWrong + 'no backup uuid found');
        return;
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
}
function reloadWindow() {
    // reload vscode-window
    vscode.commands.executeCommand('workbench.action.reloadWindow');
}
function disabledRestart() {
    vscode.window
        .showInformationMessage(messages_1.default.disabled, { title: messages_1.default.restartIde })
        .then(reloadWindow);
}
function _catch(e) {
    console.error(e);
}
// how do you make javascript freak out about promises/errors?
// export function deactivate() {
//   return uninstallImpl().catch(_catch)
// }
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.updateConciseSyntax', () => {
        return uninstallImpl().then(installImpl).catch(_catch);
    }));
    return installImpl().catch(_catch);
}
exports.activate = activate;
