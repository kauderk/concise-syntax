import { extensionId } from 'src/workbench/keys'
import * as vscode from 'vscode'

// FIXME: handle the errors where it is being used
export function _catch(e: unknown) {}

export function useState<S extends string, T extends string>(
  context: vscode.ExtensionContext,
  key: S,
  type: T // I don't like weaning my type hat
) {
  const _key = `${extensionId}.workspace.${key}` as const
  return {
    key: _key,
    value: <T | undefined>undefined,
    read() {
      return (this.value = context.workspaceState.get(_key))
    },
    async write(newState: T) {
      this.value = newState
      await context.workspaceState.update(_key, newState)
      return newState
    },
  }
}
export function useGlobal<S extends string, T extends string>(
  context: vscode.ExtensionContext,
  key: S,
  type: T // I don't like weaning my type hat
) {
  const _key = `${extensionId}.global.${key}` as const
  return {
    key: _key,
    value: <T | undefined>undefined,
    read() {
      return (this.value = context.globalState.get(_key))
    },
    async write(newState: T) {
      this.value = newState
      await context.globalState.update(_key, newState)
      return newState
    },
  }
}
