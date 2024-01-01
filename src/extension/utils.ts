import * as vscode from 'vscode'

// FIXME: handle the errors where it is being used
export function _catch(e: unknown) {}

export function useState<T extends string>(
  context: vscode.ExtensionContext,
  key: string
) {
  return {
    value: '' as any,
    read() {
      return (this.value = context.workspaceState.get(key) as T | undefined)
    },
    async write(newState: T) {
      this.value = newState
      await context.workspaceState.update(key, newState)
      return newState
    },
  }
}
