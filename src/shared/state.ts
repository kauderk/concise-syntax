export const state = {
  active: 'active',
  inactive: 'inactive',
  disposed: 'disposed',
  error: 'error',
} as const
export type State = (typeof state)[keyof typeof state]

/**
 * Exploit the fact that vscode will render strings to the DOM
 */
export const IState = {
  /**
   *
   * @param state
   * @returns
   */
  encode(state: State) {
    return `Concise Syntax: ` + state
  },
  /**
   * VSCode will reinterpret the string: "<?icon>  <extensionName>, <?IState.encode>"
   * @param string
   * @returns
   */
  decode(string?: string) {
    return Object.values(state)
      .reverse()
      .find((state) => string?.includes(state))
  },
}
