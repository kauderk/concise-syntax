"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preRead = exports.patchWorkbench = exports.extensionScriptTag = exports.extensionScriptSrc = exports.extensionId = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const package_json_1 = __importDefault(require("../package.json"));
exports.extensionId = package_json_1.default.publisher + '.' + package_json_1.default.name;
exports.extensionScriptSrc = exports.extensionId + '.js';
const extensionScriptTag = () => new RegExp(`<script.+${exports.extensionId.replaceAll('.', '\\.')}.+\/script>`, 'gm' // intermittently
);
exports.extensionScriptTag = extensionScriptTag;
async function patchWorkbench(res, remoteWorkbenchPath) {
    await fs_1.default.promises.copyFile(remoteWorkbenchPath, res.workbench.customPath);
    const hash = ('' + Math.random()).substring(2, 7);
    const newHtml = res.html
        .replaceAll((0, exports.extensionScriptTag)(), '')
        .replace(/(<\/html>)/, `<script src="${exports.extensionScriptSrc}?${hash}"></script>` + '</html>');
    await fs_1.default.promises.writeFile(res.workbench.path, newHtml, 'utf-8');
}
exports.patchWorkbench = patchWorkbench;
async function preRead(base) {
    const workbenchPath = path_1.default.join(base, 'workbench.html');
    const html = await fs_1.default.promises.readFile(workbenchPath, 'utf-8');
    const wasActive = html.match((0, exports.extensionScriptTag)());
    return {
        html,
        wasActive,
        workbench: {
            path: workbenchPath,
            customPath: path_1.default.join(base, exports.extensionScriptSrc),
        },
    };
}
exports.preRead = preRead;
//# sourceMappingURL=write.js.map