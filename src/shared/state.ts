import { extensionId } from '../workbench/keys'

export const stateIcon = 'symbol-keyword'
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
  selector: iconSelector(stateIcon),
  encode(state: State) {
    return `Concise Syntax: ${state}` as const
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

export const calibrateIcon = 'go-to-file'
export const calibrate = {
  opening: 'opening',
  opened: 'opened',
  closed: 'closed',
  error: 'error',
} as const
export type Calibrate = (typeof calibrate)[keyof typeof calibrate]
/**
 * Exploit the fact that vscode will render strings to the DOM
 */
export const ICalibrate = {
  selector: iconSelector(calibrateIcon),
  encode(state: Calibrate) {
    return `Concise Syntax (calibrate): ${state}` as const
  },
  /**
   * VSCode will reinterpret the string: "<?icon>  <extensionName>, <?IState.encode>"
   * @param string
   * @returns
   */
  decode(string?: string) {
    return Object.values(calibrate)
      .reverse()
      .find((state) => string?.includes(state))
  },
}

function iconSelector(icon: string) {
  return `[id="${extensionId}"]:has(.codicon-${icon})` as const
}
