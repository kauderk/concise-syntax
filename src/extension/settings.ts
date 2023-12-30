import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import packageJson from '../../package.json'
import { _catch } from './utils'

const key = 'editor.tokenColorCustomizations'
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

export async function createSettingsCycle() {
  const operation = 'add' as 'remove' | 'add'
  // TODO: avoid writing defensive code, someone else surely knows a better way to do this

  const workspace = vscode.workspace.workspaceFolders?.[0].uri
  if (!workspace) {
    vscode.window.showErrorMessage(
      'No workspace found: cannot update textMateRules'
    )
    return //break updateSettings
  }

  const settingsJsonPath = '.vscode/settings.json'
  const userSettingsPath = workspace.fsPath + '/' + settingsJsonPath

  const read = await fs.promises
    .readFile(userSettingsPath, 'utf-8')
    // https://stackoverflow.com/a/73298406 parse JSON with comments
    .then((raw_json) => [new Function('return ' + raw_json)(), raw_json])
    .catch(_catch)
  const [config, raw_json] = read ?? []
  if (!config) {
    vscode.window.showErrorMessage(
      `Cannot read ${settingsJsonPath}: does not exist or is not valid JSON`
    )
    return //break updateSettings
  }
  // FIXME: figure out why this method returns a Proxy with global values such as Light and Dark themes
  // let tokens: typeof shape | undefined = await vscode.workspace.getConfiguration(undefined, workspace)?.get(key)
  let userRules: DeepPartial<typeof textMateRules> | undefined =
    config?.[key]?.textMateRules

  if (userRules && !Array.isArray(userRules)) {
    vscode.window.showErrorMessage(
      `${settingsJsonPath}: ${key}.textMateRules is not an array`
    )
    return //break updateSettings
  }
  const isEmpty = !userRules || userRules?.length == 0

  if (operation == 'remove') {
    if (isEmpty) {
      return //break updateSettings
    } else {
      // remove only the extension's textMateRules
      userRules = userRules?.filter(
        (rule) => !textMateRules.find((r) => r.name == rule?.name)
      )
    }
  } else if (operation == 'add') {
    if (isEmpty) {
      userRules = textMateRules
    } else {
      userRules ??= []
      let conflictScopes: [description: string, string][] = []

      conflicts: for (let i = 0; i < userRules.length; i++) {
        const userRule = userRules[i]
        if (!userRule || textMateRules.some((r) => r.name == userRule.name))
          continue
        const userScope = userRule.scope ?? []
        const potentialConflictScopes = userScope.reduce((acc, scope) => {
          if (
            scope &&
            textMateRules.some((r) =>
              r.scope.some((_scope) => _scope === scope)
            )
          ) {
            acc.push(scope)
          }
          return acc
        }, <string[]>[])

        if (!potentialConflictScopes.length) continue conflicts
        conflictScopes.push([
          `${i}: ${userRule.name || ''}`,
          potentialConflictScopes.join(', '),
        ])

        // TODO: this should be an option...
        userRule.scope = userScope.filter(
          (scope) => scope && !potentialConflictScopes.includes(scope)
        )
      }
      // TODO: this should be an option...
      userRules = userRules.filter((r) => r?.scope?.length)

      // add what is missing
      addition: for (const rule of textMateRules) {
        const exist = userRules.some((r, i) => {
          const match = r?.name === rule.name
          if (match) {
            userRules![i] = rule // ! userRules is ok
            return true
          }
          return match
        })
        if (!exist) {
          userRules.push(rule)
        }
      }
      // FIXME: make this explicit, don't change by value
      config[key].textMateRules = userRules

      if (conflictScopes.length) {
        const diff = 'Show Conflicts'
        const addAnyway = 'Write Settings'
        const result = await vscode.window.showWarningMessage(
          `${settingsJsonPath}: ${key}.textMateRules: Conflict scopes detected`,
          diff,
          addAnyway
        )

        if (result == diff) {
          const remoteSettingsPath = path.join(
            __dirname,
            'remote.settings.json'
          )
          // create a remote file with the new changes
          const userIndentSpaceInt = 2 // TODO: parse from user settings
          // TODO: maintain last empty line?
          const remoteJson = JSON.stringify(config, null, userIndentSpaceInt)
          // TODO: write the remote file to directory without git tracking to avoid annoying Toast notifications
          await fs.promises.writeFile(remoteSettingsPath, remoteJson, 'utf-8')

          vscode.commands.executeCommand(
            'vscode.diff',
            vscode.Uri.file(userSettingsPath),
            vscode.Uri.file(remoteSettingsPath),
            `${packageJson.displayName} settings.json (diff)`
          )
          // TODO: IF the user closes the Toast add a command to continue/check settings updates
          const result = await vscode.window.showWarningMessage(
            `Accept settings?`,
            'Show', // TODO:
            'More', // TODO:
            'Yes',
            'No'
          )
          if (result == 'Yes') {
            await writeUserSettings(config)
          }
        } else if (result == addAnyway) {
          await writeUserSettings(config)
        }
      }
    }
  }
}
// Overwrite entire parent setting
async function writeUserSettings(config: any) {
  await vscode.workspace
    .getConfiguration()
    .update(key, config[key], vscode.ConfigurationTarget.Workspace)
}
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
