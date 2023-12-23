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
    "watch": "concurrently \"vite build -c vite.config.workbench.ts --watch\" \"vite build --watch\"",
    "vscode:prepublish": "concurrently \"vite build -c vite.config.workbench.ts\" \"vite build\"",
    "vscode:uninstall": "node ./out/uninstall"
  },
  "contributes": {
    "commands": [
      {
        "command": "extension.reload",
        "title": "Mount Extension",
        "category": "Concise Syntax"
      },
      {
        "command": "extension.disposeExtension",
        "title": "Dispose Extension (free memory)",
        "category": "Concise Syntax"
      },
      {
        "command": "extension.toggle",
        "title": "Toggle",
        "category": "Concise Syntax"
      }
    ]
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "concurrently": "^8.2.2",
    "vite": "4.5.1",
    "vscode": "^1.1.37"
  }
}
export = data