import { extensionId } from '../workbench/keys'
import type packageJson from '../../package.json'

//#region opacities
// TODO: use the package.json.d.ts
type ExtractLastWord<T extends string> =
  T extends `${infer _}.${infer LastWord}` ? LastWord : T
type opacitiesPropertyNames = ExtractLastWord<
  ExtractLastWord<
    keyof (typeof packageJson)['contributes']['configuration']['properties']
  >
>
export const OpacityNames = {
  baseline: 'b',
  selected: 's',
  hoverAll: 'ha',
  hoverLine: 'hl',
  bleedCurrentLines: 'bcl',
} as const satisfies Record<opacitiesPropertyNames, string>
export const DefaultOpacity = {
  baseline: 0,
  selected: 0.5,
  hoverAll: 0.7,
  hoverLine: 1,
  bleedCurrentLines: 3,
} as const satisfies Opacities
export const OpacityTable = Object.entries(DefaultOpacity).reduce(
  (acc, [key, value]) => {
    // @ts-expect-error
    acc[key] = `var(--${key},${value})`
    return acc
  },
  <{ [key in opacitiesPropertyNames]: `var(--${key},${number})` }>{}
)
export const cssOpacityName = '--concise-syntax-opacity'
export type Opacities = Record<opacitiesPropertyNames, number>
//#endregion

//#region calibrate
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
//#endregion

//#region state
export const stateIcon = 'symbol-keyword'
export const state = {
  resetDev: 'resetDev',
  active: 'active',
  inactive: 'inactive',
  stale: 'stale',
  disposed: 'disposed',
  error: 'error',
} as const
export type State = (typeof state)[keyof typeof state]
//#endregion

/**
 * Exploit the fact that vscode will render strings to the DOM
 */
export const IState = {
  selector: `[id="${extensionId}"]:has(.codicon-${stateIcon})`,
  encode(input: { state: State; calibrate: Calibrate; opacities: Opacities }) {
    const opacities = Object.entries(OpacityNames).reduce(
      (acc, [key, value]) => {
        // @ts-expect-error
        acc[value] = input.opacities[key]
        return acc
      },
      <Record<string, string>>{}
    )
    return `Concise Syntax: ${input.state},${input.calibrate},${JSON.stringify(
      opacities
    )}` as const
  },
  /**
   * VSCode will reinterpret the string: "<?icon>  <extensionName>, <?IState.encode>"
   * @param encoded
   * @returns
   */
  decode(encoded?: string) {
    if (!encoded) return {}
    const regex =
      /Concise Syntax: (?<state>\w+),(?<calibrate>\w+),(?<opacities>\{.+\})/
    const _opacities = JSON.parse(
      regex.exec(encoded)?.groups?.opacities ?? '{}'
    )
    return {
      state: regex.exec(encoded)?.groups?.state,
      calibrate: regex.exec(encoded)?.groups?.calibrate,
      opacities: Object.entries(OpacityNames).reduce((acc, [key, value]) => {
        // @ts-expect-error
        acc[key] = _opacities[value]
        return acc
      }, <Record<opacitiesPropertyNames, unknown>>{}),
    }
  },
}
