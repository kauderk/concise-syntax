/** Generated with `./json-d-ts.js` */
declare const data: {
  "name": "concise-syntax",
  "displayName": "Concise Syntax",
  "description": "Hide unnecessary syntax or markup from programming languages",
  "version": "0.0.1",
  "publisher": "kauderk",
  "type": "commonjs",
  "engines": {
    "vscode": "^1.70.0"
  },
  "categories": [
    "Programming Languages"
  ],
  "main": "./out/extension",
  "activationEvents": [
    "*"
  ],
  "scripts": {
    "preparation": "node json-d-ts.js",
    "build": "tsc",
    "watch": "tsc -watch",
    "vscode:prepublish": "npm run build",
    "vscode:uninstall": "node ./out/uninstall"
  },
  "contributes": {
    "commands": [
      {
        "command": "extension.reload",
        "title": "Concise Syntax: Mount Extension",
        "category": "Concise Syntax"
      },
      {
        "command": "extension.disposeExtension",
        "title": "Concise Syntax: Dispose Extension (free memory)",
        "category": "Concise Syntax"
      }
    ],
    "themes": [
      {
        "label": "Concise Syntax",
        "uiTheme": "vs-dark",
        "path": "./themes/tokens.json"
      }
    ],
    "grammars": [
      {
        "path": "./syntaxes/injection.json",
        "scopeName": "source.concise",
        "injectTo": [
          "source.js",
          "source.ts",
          "source.tsx",
          "source.jsx",
          "source.abc"
        ]
      }
    ]
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "vscode": "^1.1.37"
  }
}
export = data