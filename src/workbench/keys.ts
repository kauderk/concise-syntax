import type packageJson from '../../package.json'
// FIXME: find a way to compile/tree shake the import package.json
export const publisher: (typeof packageJson)['publisher'] = 'kauderk'
export const extensionName: (typeof packageJson)['name'] = `concise-syntax`
export const extensionDisplayName: (typeof packageJson)['displayName'] = `Concise Syntax`
export const calibrateWindowCommandPlaceholder = `Calibrate Window`

export const extensionId = `${publisher}.${extensionName}` as const
export const extensionScriptSrc = `${extensionId}.js` as const
export const windowId = `window.${extensionId}` as const
// exploit the fact that vscode renders data to the dom, could be any other attribute
export const bridgeBetweenVscodeExtension = 'aria-label'

export const editorSelector = '.editor-instance'
export const idSelector = '[data-mode-id="typescriptreact"]'
export const viewLinesSelector = '.view-lines.monaco-mouse-cursor-text'
export const linesSelector = `${idSelector} ${viewLinesSelector}`
export const overlaySelector = '.view-overlays'
export const highlightSelector = `${idSelector} ${overlaySelector}`
export const selectedSelector = '.selected-text'
export const currentSelector = '.current-line'
export const languages = ['typescriptreact', 'javascriptreact']
export const splitViewContainerSelector = '.split-view-container'

export const calibrateTimeout = 5_000
