import * as vscode from 'vscode'
import * as fs from 'fs'
import { _catch } from './utils'
import JSONC from 'comment-json'

export const key = 'editor.tokenColorCustomizations'
const textMateRules = [
  {
    name: 'kauderk.concise-syntax.text',
    scope: ['meta.jsx.children.tsx'],
    settings: {
      foreground: '#B59E7A',
    },
  },
  {
    name: 'kauderk.concise-syntax.redundant',
    scope: [
      'punctuation.definition.tag.begin.tsx',
      'punctuation.definition.tag.end.tsx',
      'punctuation.section.embedded.begin.tsx',
      'punctuation.section.embedded.end.tsx',
      'punctuation.terminator.statement.tsx',
      'concise.redundant-syntax',
    ],
    settings: {
      foreground: '#00b51b00',
    },
  },
  {
    name: 'kauderk.concise-syntax.quote.begin',
    scope: ['punctuation.definition.string.begin.tsx'],
    settings: {
      foreground: '#b5a90000',
    },
  },
  {
    name: 'kauderk.concise-syntax.quote.end',
    scope: ['punctuation.definition.string.end.tsx'],
    settings: {
      foreground: '#b5030000',
    },
  },
]
const settingsJsonPath = '.vscode/settings.json'
const remoteSettingsJsonPath = 'remote.settings.jsonc'

// TODO: avoid writing defensive code, someone else surely knows a better way to do this
export async function updateSettingsCycle(operation: 'inactive' | 'active') {
  const res = await tryParseSettings()
  if (!res) return
  const { wasEmpty, userRules } = res

  if (operation == 'active') {
    if (wasEmpty) {
      userRules.push(...textMateRules)
    } else {
      // add what is missing
      for (const rule of textMateRules) {
        const exist = userRules.some((r, i) =>
          r?.name === rule.name ? (userRules![i] = rule) : false
        )
        if (!exist) {
          userRules.push(rule)
        }
      }
    }
  } else {
    if (wasEmpty) {
      return
    } else {
      for (let i = userRules.length - 1; i >= 0; i--) {
        const rule = userRules[i]
        if (rule && textMateRules.find((r) => r.name == rule.name)) {
          userRules.splice(i, 1)
        }
      }
    }
  }

  await res.write()
}

async function tryParseSettings() {
  const workspace = vscode.workspace.workspaceFolders?.[0].uri
  if (!workspace) {
    vscode.window.showErrorMessage(
      'No workspace found: cannot update textMateRules'
    )
    return
  }

  const userSettingsPath = workspace.fsPath + '/' + settingsJsonPath

  let raw_json: string | undefined
  let config: any
  try {
    raw_json = await fs.promises.readFile(userSettingsPath, 'utf-8')
    config = JSONC.parse(raw_json)
  } catch (error) {
    config ??= {}
    console.error(error)
  }

  if (raw_json === undefined) {
    vscode.window.showErrorMessage(
      `Cannot read ${settingsJsonPath}: does not exist or is not valid JSON`
    )
    return
  }

  // NOTE: This is a special object https://www.npmjs.com/package/comment-json#commentarray
  let userRules: DeepPartial<typeof textMateRules> | undefined =
    config?.[key]?.textMateRules

  if (userRules && !Array.isArray(userRules)) {
    vscode.window.showErrorMessage(
      `${settingsJsonPath}: ${key}.textMateRules is not an array`
    )
    return
  }

  const wasEmpty = !userRules || userRules?.length == 0
  if (!userRules) {
    userRules = []
    config[key] = { textMateRules: userRules }
  }
  return {
    userRules,
    wasEmpty,
    async write() {
      try {
        if (raw_json === undefined) throw new Error('raw_json is undefined')
        const indent = raw_json.match(/^\s+/)?.[0] ?? '  '
        const virtualJson = JSONC.stringify(config, null, indent)
        if (virtualJson === raw_json) return
        await fs.promises.writeFile(userSettingsPath, virtualJson, 'utf-8')
      } catch (error: any) {
        vscode.window.showErrorMessage(
          'Failed to write textMateRules. Error: ' + error.message
        )
      }
    },
  }
}

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
