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
        "concise-syntax.opacity.baseline": {
          "type": "number",
          "default": 0,
          "description": "Baseline for all the concise-syntax characters in the editor."
        },
        "concise-syntax.opacity.selected": {
          "type": "number",
          "default": 0.5,
          "description": "When a line has any selected range, all the concise-syntax characters in the line are highlighted."
        },
        "concise-syntax.opacity.hoverAll": {
          "type": "number",
          "default": 0.7,
          "description": "When a concise-syntax character is hovered in the editor, all the lines are highlighted."
        },
        "concise-syntax.opacity.hoverLine": {
          "type": "number",
          "default": 1,
          "description": "When a line is hovered in the editor. All the concise-syntax characters in the line are highlighted."
        },
        "concise-syntax.bleedCurrentLines": {
          "type": "number",
          "default": 3,
          "description": "When a line has focus/caret how many lines above and below should be highlighted."
        }
      }
    }
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "comment-json": "^4.2.3",
    "ts-node": "^10.9.2",
    "vite": "4.5.1",
    "vscode": "^1.1.37"
  }
}
export = data