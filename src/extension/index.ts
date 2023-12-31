import * as vscode from 'vscode'
import msg from '../shared/messages'
import packageJson from '../../package.json'
import { extensionId } from '../shared/write'
import { _catch } from './utils'
import { getErrorStore, getStateStore, statusBarItem } from './statusBarItem'
import { installCycle, read, uninstallCycle } from './extensionCycle'
import { createSettingsCycle } from './settings'
export { deactivateCycle as deactivate } from './extensionCycle'

export async function activate(context: vscode.ExtensionContext) {
  const state = getStateStore(context)

  // FIXME: use a better state manager or state machine
  const { wasActive } = await read()

  const reloadCommand = packageJson.contributes.commands[0].command
  context.subscriptions.push(
    vscode.commands.registerCommand(reloadCommand, async () => {
      try {
        if (state.read() == 'active') {
          vscode.window.showInformationMessage('Already Mounted')
        } else {
          await uninstallCycle(context)
          await installCycle(context)
          if (!wasActive) {
            reloadWindowMessage(msg.enabled)
          } else {
            await statusBarItem(context, true)
            vscode.window.showInformationMessage('Mount: using cache')
          }
        }
      } catch (error) {
        __catch(error)
      }
    })
  )
  const disposeCommand = packageJson.contributes.commands[1].command
  context.subscriptions.push(
    vscode.commands.registerCommand(disposeCommand, async () => {
      try {
        const wasActive = await uninstallCycle(context)
        await statusBarItem(context, false)

        const [message, ...options] = wasActive
          ? ['Disposed', 'Reload', 'Uninstall']
          : ['Already Disposed', 'Uninstall']
        // prettier-ignore
        const selection = await vscode.window.showInformationMessage(message, ...options)

        if (selection == 'Reload') {
          vscode.commands.executeCommand('workbench.action.reloadWindow')
        } else if (selection == 'Uninstall') {
          vscode.commands.executeCommand(
            'workbench.extensions.action.uninstallExtension',
            extensionId
          )
        }
      } catch (error) {
        __catch(error)
      } finally {
        await state.write('disposed')
      }
    })
  )

  try {
    createSettingsCycle()
  } catch (error) {
    debugger
    vscode.window.showErrorMessage(
      msg.internalError + 'failed to validate user settings'
    )
  }

  if (state.read() != 'disposed') {
    installCycle(context)
      .then(() => {
        if (!wasActive) {
          reloadWindowMessage(msg.enabled)
        }
      })
      .catch(__catch)
  } else if (wasActive) {
    await statusBarItem(context) // FIXME: this is not persistent
  }

  console.log('vscode-concise-syntax is active')

  function __catch(e: unknown) {
    console.error(e)
    const error = getErrorStore(context)
    error.write('unhandled').catch(_catch)
  }
}

function reloadWindowMessage(message: string) {
  vscode.window
    .showInformationMessage(message, { title: msg.restartIde })
    .then((selection) => {
      if (selection) {
        vscode.commands.executeCommand('workbench.action.reloadWindow')
      }
    })
}
