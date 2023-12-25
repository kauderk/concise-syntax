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

export const idSelector = '[data-mode-id="typescriptreact"]'
export const linesSelector =
  idSelector + ` .view-lines.monaco-mouse-cursor-text`
export const highlightSelector = idSelector + ` .view-overlays`
export const languages = ['typescriptreact', 'javascriptreact']
