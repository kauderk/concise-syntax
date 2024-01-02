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

  type UserRule = (typeof userRules)[number]
  const sessionStore = useState(context, 'textMateRules')
  const sessionRules: Map<number, UserRule> = JSON_MAP.parseOrNew(
    sessionStore.read()
  )

  /**
   * {textMateRules} the extension's preset data
   * {userRules}     the user's data -> from the settings.json file
   * {sessionRules}  the user's data -> from the previous session
   */
  // could be more elegant... this must be a pattern or something
  // this has to be faster than writing the file every time, otherwise it's not worth it
  let diff = false
  if (operation == 'active') {
    if (wasEmpty) {
      diff = true
      syncSessionRules()
      userRules.push(...sessionRules.values())
    } else {
      syncSessionRules()
      const indexToNameMap = new Map(textMateRules.map((r, i) => [r.name, i]))
      const userIndexToNameMap = new Map(userRules.map((r, i) => [r?.name, i]))
      const updateSessionDiff = (rule: UserRule) => {
        diff = true // well, this is awkward
        const j = indexToNameMap.get(rule?.name!)!
        if (j > -1) {
          sessionRules.set(j, rule)
        }
      }
      const pick = (rule: (typeof textMateRules)[number]) => {
        const j = indexToNameMap.get(rule.name)!
        return {
          foreground:
            sessionRules.get(j)?.settings?.foreground ||
            rule.settings.foreground,
        }
      }

      for (const presetRule of textMateRules) {
        const i = userIndexToNameMap.get(presetRule.name) ?? -1
        if (i > -1) {
          const userRule = userRules[i]
          if (!userRule) {
            userRules[i] = JSONC.assign(presetRule, {
              settings: pick(presetRule),
            })
            updateSessionDiff(userRules[i])
            continue
          }

          if (presetRule.scope.some((s, i) => s !== userRule.scope?.[i])) {
            userRule.scope = presetRule.scope // it's better to overwrite than to merge
            updateSessionDiff(userRule)
          }
          if (!userRule.settings?.foreground?.match(/^#/)) {
            // prettier-ignore
            userRule.settings = JSONC.assign(userRule.settings ?? {}, pick(presetRule))
            updateSessionDiff(userRule)
          }
        } else {
          userRules.push(presetRule)
          updateSessionDiff(presetRule)
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
        if (j > -1) {
          diff = true
          sessionRules.set(j, userRules[i])
          userRules.splice(i, 1)
        }
      }
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

  await sessionStore.write(JSON_MAP.stringify(sessionRules))
  await res.write()

  // TODO: this is doing too much
  function syncSessionRules() {
    if (sessionRules.size == textMateRules.length) {
      return true
    }
    if (sessionRules.size == 0) {
      textMateRules.forEach((r, i) => sessionRules.set(i, r))
    } else {
      for (let i = 0; i < textMateRules.length; i++) {
        if (!sessionRules.get(i)) {
          sessionRules.set(i, textMateRules[i])
        }
      }
    }
  }
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
