import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionId, viewLinesSelector } from './keys'
import { IState, State, calibrationFileName, state } from 'src/shared/state'
import { ICalibrate, Calibrate, calibrate } from 'src/shared/state'
import { addRemoveRootStyles, createStyles, toastConsole } from './shared'
import { parseSymbolColors } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
import { createTask, deltaFn } from 'src/shared/utils'
import { type calibrateWIndowPlaceholder } from 'src/extension/statusBarItem'
import {
  BranchObserverTasks,
  ObserverTasks,
  REC_ObservableTaskTree,
} from './observableTask'
export type { editorObservable, stateObservable, calibrateObservable }

const editorObservable = createObservable<undefined | string>(undefined)
const stateObservable = createObservable<State | undefined>(undefined)
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)

const sessionKey = `${extensionId}.session.styles`

createStyles('calibrate').styleIt(
  `${ICalibrate.selector}{display: none !important}`
)

let tableTask: ReturnType<typeof createTask<Calibrate>> | undefined
export type windowColorsTable = ReturnType<
  typeof parseSymbolColors
>['colorsTable']
const createCalibrateSubscription = () =>
  calibrateObservable.$ubscribe((state) => {
    //#region opened -> idle -> reset
    if (state == calibrate.error) {
      tableTask?.reject(calibrate.error)
      return
    }
    if (!(state == calibrate.opened || state == calibrate.idle)) return
    // prettier-ignore
    // FIXME: use proper uri or shared file path between extension and workbench
    const lineEditor = document.querySelector<HTMLElement>(`[data-uri$="concise-syntax/out/${calibrationFileName}"] ${viewLinesSelector}`)
    if (!lineEditor) {
      return toastConsole.error('Calibrate Editor not found')
    }
    if (tableTask && state == calibrate.opened) {
      toastConsole.error('Calibrate Window already opened')
      return
    }

    // FIXME: overcomplicated state for the sake of the following async procedure
    if (!tableTask) {
      tableTask = createTask()
    } else if (state == calibrate.idle) {
      tableTask.resolve(state)
      return
    }
    //#endregion

    syntaxStyle.dispose()
    const snapshot = parseSymbolColors(lineEditor)
    BonkersExecuteCommand(
      'Concise Syntax',
      'Calibrate Window' satisfies calibrateWIndowPlaceholder,
      JSON.stringify(snapshot.colorsTable)
    )
      .catch(() => {
        toastConsole.error('Failed to run Calibrate Window command')
        BonkersExecuteCommand.shadow(false, getInput())
      })
      // FIXME: here is where the window should resolve the 'Calibrate Window' task
      // take a look at src/extension/statusBarItem.ts calibrateStateSandbox procedure
      .then(() => tableTask!.promise)
      .then(() => {
        const css = parseSymbolColors(lineEditor).process(snapshot.payload)
        window.localStorage.setItem(sessionKey, css)
        syntaxStyle.styleIt(css)
      })
      .catch(() => toastConsole.error('Failed to get colors table'))
      .finally(() => (tableTask = undefined))
  })

//#region BonkersExecuteCommand
const calibrateWindowStyle = createStyles('calibrate.window')
// prettier-ignore
function BonkersExecuteCommand(displayName: string, commandName: string, value: string) {
  BonkersExecuteCommand.shadow(true)
  const widgetSelector = '.quick-input-widget'
  const inputSelector = `${widgetSelector}:not([style*="display: none"]) div.quick-input-box input`
  let shadowInput: any
  
  const commandWidgetTasks = [
    [
      `${inputSelector}`,
      (el) => {
        shadowEventListeners(shadowInput=el)
        el.value = `>${displayName}`
        el.dispatchEvent(new Event('input'))
      },
    ],
    [
      `.quick-input-list [aria-label*="${displayName}: ${commandName}"] label`,
      (el) => el.click(),
    ],
    [
      `${inputSelector}[placeholder="${commandName}"]`,
      (el) => {
        el.value = value
        el.dispatchEvent(new Event('input'))
      },
    ],
    [
      `${inputSelector}[title="${commandName}"][aria-describedby="quickInput_message"]`,
      (el) => {
        if (shadowInput !== el) {
          return new Error('shadowInput!==target')
        } else {
          BonkersExecuteCommand.shadow(false, el)
        }
        el.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
            composed: true,
          })
        )
      },
    ],
  ] as const satisfies ObserverTasks
  
  // TODO: pass OR branch types
  const branchTasks = [
    [
      'li.action-item.command-center-center',
      tapVsCode,
      [widgetSelector, commandWidgetTasks]
    ],
    [
      `.menubar-menu-button[aria-label="View"]`,
      tapVsCode,
      [
        `[class="action-item"]:has([aria-label="Command Palette..."])`,
        tapVsCode,
        [widgetSelector, commandWidgetTasks]
      ]
    ],
  ] as const satisfies BranchObserverTasks
  
  return REC_ObservableTaskTree(document.body, branchTasks).promise

  function tapVsCode(el:Element) {
    el.dispatchEvent(new CustomEvent('-monaco-gesturetap', {}))
  }
}
BonkersExecuteCommand.shadow = (block: boolean, input?: any) => {
  const styles = block ? '* {pointer-events:none;}' : ''
  calibrateWindowStyle.styleIt(styles)

  const shadow = block ? shadowEventListeners : cleanShadowedEvents
  shadow(window)
  if (input) {
    shadow(input) // FIXME: get me out of here
  }
}
const shadowEventListeners = events((e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  return false
})
const cleanShadowedEvents = events(null)
function events(fn: any) {
  return (el: HTMLElement | Window) => {
    // prettier-ignore
    el.onclick=el.onkeydown=el.onkeyup=el.onmousedown=el.onmouseup=el.onblur=el.onfocus=fn
  }
}
type H = HTMLInputElement | undefined
function getInput() {
  return document.querySelector('div.quick-input-box input') as H
}

//#endregion

function cacheProc() {
  try {
    const cache = window.localStorage.getItem(sessionKey)
    if (cache) syntaxStyle.styleIt(cache)
    else throw new Error('cache is empty')
  } catch (error) {
    window.localStorage.removeItem(sessionKey)
  }
}
const createEditorSubscription = () =>
  editorObservable.$ubscribe((value) => {
    if (!value) return
    cacheProc()
    return 'Symbol.dispose'
  })

const syntaxStyle = createStyles('hide')
let deltaSubscribers = deltaFn()
// Just use the "using" keyword...
const createStateSubscription = () =>
  stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      addRemoveRootStyles(true)
      cacheProc()
      calibration.activate(500)
      highlight.activate(500) // FIXME: find the moment the css finishes loading
      const _ = [createCalibrateSubscription(), createEditorSubscription()]
      deltaSubscribers.fn = () => _.forEach((un) => un())
    } else {
      deltaSubscribers.consume()
      addRemoveRootStyles(false)
      syntaxStyle.dispose()
      highlight.dispose() // the unwinding of the editorObservable could cause a stack overflow
      calibration.dispose()
    }
  })

const syntax = createSyntaxLifecycle(stateObservable, IState, {
  activate() {
    const unSubscribeState = createStateSubscription()
    return () => {
      stateObservable.value = state.inactive
      unSubscribeState()
    }
  },
})
// TODO: merge extension _calibrate and _state icons/bridges
const calibration = createSyntaxLifecycle(calibrateObservable, ICalibrate)
const highlight = createHighlightLifeCycle(editorObservable)

// prettier-ignore
declare global { interface Window { conciseSyntax?: typeof syntax } }
if (window.conciseSyntax) {
  window.conciseSyntax.dispose()
}
window.conciseSyntax = syntax
syntax.activate()
cacheProc()

console.log(extensionId, syntax)

/**
 * FIXME
 * handle drastic user changes for example when changing vscode's profile
 */
