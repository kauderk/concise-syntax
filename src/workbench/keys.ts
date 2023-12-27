export const extensionId = 'kauderk.concise-syntax'
export const windowId = 'window.' + extensionId
// exploit the fact that vscode renders data to the dom, could be any other attribute
export const bridgeBetweenVscodeExtension = 'aria-label'
export const customCSS = `
	.view-lines {
		--r: transparent;
	}
	.view-lines:has(.dummy:hover) {
		--r: red;
	}
	.dummy {
		color: var(--r);
	}
	`

export const editorSelector = '.editor-instance'
export const idSelector = '[data-mode-id="typescriptreact"]'
export const linesSelector =
  idSelector + ` .view-lines.monaco-mouse-cursor-text`
export const overlaySelector = '.view-overlays'
export const highlightSelector = idSelector + ` ` + overlaySelector
export const selectedSelector = '.selected-text'
export const currentSelector = '.current-line'
export const languages = ['typescriptreact', 'javascriptreact']
