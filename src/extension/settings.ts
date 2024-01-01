import * as vscode from 'vscode'
import * as fs from 'fs'
import { _catch, useState } from './utils'
import JSONC from 'comment-json'
import { JSON_MAP } from '../shared/serialize'

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
export async function updateSettingsCycle(
  context: vscode.ExtensionContext,
  operation: 'inactive' | 'active'
) {
  const res = await tryParseSettings()
  if (!res) return
  const { wasEmpty, specialObjectUserRules: userRules } = res

  const sessionStore = useState(context, 'textMateRules')
  const sessionRules: Map<number, (typeof userRules)[number]> =
    JSON_MAP.parseOrNew(sessionStore.read())

  // could be more elegant...
  // this has to be faster than writing the file every time, otherwise it's not worth it
  let diff = false
  if (operation == 'active') {
    if (wasEmpty) {
      diff = true
      if (sessionRules.size == textMateRules.length) {
        userRules.push(...sessionRules.values())
      } else {
        if (sessionRules.size == 0) {
          textMateRules.forEach((r, i) => sessionRules.set(i, r))
        } else {
          for (let i = 0; i < textMateRules.length; i++) {
            if (!sessionRules.get(i)) {
              sessionRules.set(i, textMateRules[i])
            }
          }
        }
        userRules.push(...sessionRules.values())
        await sessionStore.write(JSON_MAP.stringify(sessionRules))
      }
    } else {
      const userIndexToNameMap = new Map(userRules.map((r, i) => [r?.name, i]))
      for (const presetRule of textMateRules) {
        const i = userIndexToNameMap.get(presetRule.name) ?? -1
        if (i >= 0) {
          const userRule = userRules[i]
          if (!userRule) {
            userRules[i] = JSONC.assign(userRule ?? {}, presetRule)
            diff = true
            continue
          }

          if (presetRule.scope.some((s, i) => s !== userRule.scope?.[i])) {
            userRule.scope = presetRule.scope // it's better to overwrite than to merge
            diff = true
          }
          if (!userRule.settings?.foreground?.match(/^#/)) {
            // prettier-ignore
            userRule.settings = JSONC.assign(userRule.settings ?? {}, presetRule.settings)
            diff = true
          }
        } else {
          userRules.push(presetRule)
          diff = true
        }
      }
    }
  } else {
    if (wasEmpty) {
      diff = false
      return
    } else {
      const indexToNameMap = new Map(textMateRules.map((r, i) => [r.name, i]))
      for (let i = userRules.length - 1; i >= 0; i--) {
        const j = indexToNameMap.get(userRules[i]?.name!)!
        if (j >= 0) {
          diff = true
          sessionRules.set(j, userRules[i])
          userRules.splice(i, 1)
        }
      }
      await sessionStore.write(JSON_MAP.stringify(sessionRules))
    }
  }
  if (!diff) {
    return true
  }

  debugger
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
    specialObjectUserRules: userRules,
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
