import * as vscode from 'vscode'
import msg from '../shared/messages'
import packageJson from '../../package.json'
import { extensionId } from '../shared/write'
import { _catch } from './utils'
import {
  getErrorStore,
  getStateStore,
  ExtensionState_statusBarItem,
  getWindowState,
  binary,
} from './statusBarItem'
import { installCycle, read, uninstallCycle } from './extensionCycle'
import { state } from '../shared/state'
export { deactivateCycle as deactivate } from './extensionCycle'

export async function activate(context: vscode.ExtensionContext) {
  const extensionState = getStateStore(context) // why do I need two active states?

  // FIXME: use a better state manager or state machine
  const { wasActive } = await read()

  const reloadCommand = packageJson.contributes.commands[0].command
  context.subscriptions.push(
    vscode.commands.registerCommand(reloadCommand, async () => {
      try {
        if (extensionState.read() == state.active) {
          vscode.window.showInformationMessage('Already Mounted')
        } else {
          await uninstallCycle(context)
          await installCycle(context)
          await extensionState.write(state.active)

          if (!wasActive) {
            reloadWindowMessage(msg.enabled)
          } else {
            await ExtensionState_statusBarItem(context, state.active)
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
        await ExtensionState_statusBarItem(context, state.disposed)

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
        await extensionState.write(state.disposed)
      }
    })
  )

  try {
    if (extensionState.read() != state.disposed) {
      await installCycle(context)
      await extensionState.write(state.active)

      if (!wasActive) {
        reloadWindowMessage(msg.enabled)
      } else {
        const windowState = binary(
          getWindowState(context).read() ?? state.active
        )
        await ExtensionState_statusBarItem(context, windowState)
      }
    }
  } catch (error) {
    __catch(error)
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
