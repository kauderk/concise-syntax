import * as vscode from 'vscode'
import * as fs from 'fs'
import { _catch, useState } from './utils'
import JSONC from 'comment-json'
import { extensionId } from 'src/workbench/keys'

export const key = 'editor.tokenColorCustomizations'
const name = `${extensionId}.`
const textMateRules = [
  {
    name: name + 'text',
    scope: ['meta.jsx.children.tsx'],
    settings: {
      foreground: '#B59E7A',
    },
  },
  {
    name: name + 'redundant',
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
    name: name + 'quote.begin',
    scope: [
      'punctuation.definition.string.begin.tsx',
      'punctuation.definition.string.template.begin.tsx',
    ],
    settings: {
      foreground: '#b5a90000',
    },
  },
  {
    name: name + 'quote.end',
    scope: [
      'punctuation.definition.string.end.tsx',
      'punctuation.definition.string.template.end.tsx',
    ],
    settings: {
      foreground: '#b5030000',
    },
  },
  {
    name: name + 'separator',
    scope: ['punctuation.separator.comma.tsx'],
    settings: {
      foreground: '#d4d4d4f0',
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

  const textColor = useState(context, 'textColor')

  // could be more elegant...
  // this has to be faster than writing the file every time, otherwise it's not worth it
  let diff = false
  if (operation == 'active') {
    if (wasEmpty) {
      diff = true
      userRules.push(...textMateRules)
      tryPatchTextColor(userRules[0], 'patch')
    } else {
      const userIndexToNameMap = new Map(userRules.map((r, i) => [r?.name, i]))

      for (const presetRule of textMateRules) {
        const i = userIndexToNameMap.get(presetRule.name) ?? -1
        if (i > -1) {
          const userRule = userRules[i]
          if (!userRule) {
            userRules[i] = presetRule
            tryPatchTextColor(presetRule, 'patch')
            diff = true
            continue
          }

          if (presetRule.scope.some((s, i) => s !== userRule.scope?.[i])) {
            userRule.scope = presetRule.scope
            diff = true
          }
          if (!userRule.settings?.foreground?.match(/^#/)) {
            userRule.settings = presetRule.settings
            tryPatchTextColor(userRule, 'patch')
            diff = true
          }
        } else {
          userRules.push(presetRule)
          tryPatchTextColor(presetRule, 'patch')
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
        const name = userRules[i]?.name!
        const j = indexToNameMap.get(name)!
        if (j > -1) {
          diff = true
          userRules.splice(i, 1)
          tryPatchTextColor(textMateRules[j], 'write')
        }
      }
    }
  }
  // so far this is the only variable that matters, if there's need for other check the previous git commit
  function tryPatchTextColor(rule: any, action: 'write' | 'patch') {
    if (rule?.name != textMateRules[0].name) return
    const color = textMateRules[0].settings.foreground
    if (action == 'write') {
      textColor.write(rule?.settings?.foreground || color)
    } else {
      rule.settings = rule.settings || {}
      rule.settings.foreground = textColor.read() || color
    }
  }

  // sort by textMateRules and put them at the end of userRules
  // send it to the end of the array
  ;[...textMateRules].reverse().forEach((r, relative, _arr) => {
    const index = userRules.findIndex((_r) => _r?.name == r.name)
    if (index < 0) return
    const end = userRules.length - 1 - relative
    if (index != end) {
      diff = true
      move(userRules, index, end)
    }
  })

  if (!diff) {
    return true
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
function move(arr: any[], fromIndex: number, toIndex: number) {
  var element = arr[fromIndex]
  arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, element)
}
