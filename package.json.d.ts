/** Generated with `./json-d-ts.js` */
declare const data: {
  "name": "concise-syntax",
  "displayName": "Concise Syntax",
  "description": "Hide unnecessary syntax or markup from programming languages",
  "version": "0.0.1",
  "publisher": "kauderk",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/kauderk/concise-syntax"
  },
  "bugs": {
    "url": "https://github.com/kauderk/concise-syntax/issues"
  },
  "type": "commonjs",
  "engines": {
    "vscode": "^1.70.0"
  },
  "categories": [
    "Programming Languages"
  ],
  "main": "./out/extension",
  "activationEvents": [
    "onStartupFinished"
  ],
  "scripts": {
    "watch": "ts-node vite.config.custom.ts --watch",
    "vscode:prepublish": "ts-node vite.config.custom.ts",
    "vscode:uninstall": "node ./out/uninstall"
  },
  "contributes": {
    "commands": [
      {
        "command": "extension.reload",
        "title": "Mount Extension",
        "category": "Concise Syntax",
        "enablement": "extension.disposed"
      },
      {
        "command": "extension.disposeExtension",
        "title": "Dispose Extension (free memory)",
        "category": "Concise Syntax",
        "enablement": "!extension.disposed"
      },
      {
        "command": "extension.toggle",
        "title": "Toggle",
        "category": "Concise Syntax",
        "enablement": "!extension.disposed && extension.calibrated && extension.running"
      },
      {
        "command": "extension.calibrate",
        "title": "Calibrate",
        "category": "Concise Syntax",
        "enablement": "!extension.disposed && !extension.calibrateWindow && extension.running"
      },
      {
        "command": "extension.calibrateWindow",
        "title": "Calibrate Window",
        "category": "Concise Syntax",
        "enablement": "!extension.disposed && extension.calibrateWindow && extension.running"
      },
      {
        "command": "extension.reset",
        "title": "Reset then reload (dev)",
        "category": "Concise Syntax"
      }
    ],
    "configuration": {
      "title": "Concise Syntax",
      "properties": {
        "concise-syntax.base": {
          "type": "number",
          "default": 0,
          "description": "Base opacity for all concise-syntax characters in the document."
        },
        "concise-syntax.selected": {
          "type": "number",
          "default": 0.5,
          "description": "When a line has any selected range: all concise-syntax characters in the line gain opacity."
        },
        "concise-syntax.current": {
          "type": "number",
          "default": 0.6,
          "description": "When a line has focus/caret: all concise-syntax characters in the line gain opacity."
        },
        "concise-syntax.hoverAll": {
          "type": "number",
          "default": 0.7,
          "description": "When a concise-syntax character is hovered in the document: all concise-syntax characters gain opacity."
        },
        "concise-syntax.hoverLine": {
          "type": "number",
          "default": 1,
          "description": "When a line is hovered in the document: all concise-syntax characters in the line gain opacity."
        },
        "concise-syntax.bleedCurrentLines": {
          "type": "number",
          "default": 1,
          "description": "When a line has focus/caret: how many lines above and below should gain opacity."
        }
      }
    },
    "configurationDefaults": {
      "files.readonlyInclude": {
        "**/*concise-syntax*/out/syntax.tsx": true
      }
    }
  },
  "devDependencies": {
    "@types/vscode": "^1.70.0",
    "@types/node": "^20.10.5",
    "ts-node": "^10.9.2",
    "vite": "4.5.1",
    "vscode": "^1.1.37"
  }
}
export = data