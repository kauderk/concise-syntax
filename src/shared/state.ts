import { extensionId } from '../workbench/keys'

export const stateIcon = 'symbol-keyword'
export const state = {
  active: 'active',
  inactive: 'inactive',
  stale: 'stale',
  disposed: 'disposed',
  error: 'error',
} as const
export type State = (typeof state)[keyof typeof state]

/**
 * Exploit the fact that vscode will render strings to the DOM
 */
export const IState = {
  selector: `[id="${extensionId}"]:has(.codicon-${stateIcon})`,
  encode(input: { state: State; calibrate: Calibrate }) {
    return `Concise Syntax: ${input.state},${input.calibrate}` as const
  },
  /**
   * VSCode will reinterpret the string: "<?icon>  <extensionName>, <?IState.encode>"
   * @param encoded
   * @returns
   */
  decode(encoded?: string) {
    if (!encoded) return {}
    const regex = /Concise Syntax: (?<state>\w+),(?<calibrate>\w+)/
    return {
      state: regex.exec(encoded)?.groups?.state,
      calibrate: regex.exec(encoded)?.groups?.calibrate,
    }
  },
}

export const calibrationFileName = 'syntax.tsx'
export const calibrate = {
  bootUp: 'bootUp',
  opening: 'opening',
  opened: 'opened',
  closed: 'closed',
  idle: 'idle',
  error: 'error',
} as const
/**
 * standBy     nothing   / bootUp
 * requesting  click     / opening
 * loaded      dom/click / opened
 * windowState nothing   / closed
 *
 * noting/bootUp > click > opening > opened > dom/click > closed > standBy
 */
export type Calibrate = (typeof calibrate)[keyof typeof calibrate]

export const allPossibleStates = [
  ...Object.values(state),
  ...Object.values(calibrate),
] as const
