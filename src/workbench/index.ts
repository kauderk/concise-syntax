import { createSyntaxLifecycle } from './syntax'
import { createHighlightLifeCycle } from './highlight'
import { extensionDisplayName, extensionId, viewLinesSelector } from './keys'
import { calibrateWindowCommandPlaceholder } from './keys'
import { IState, State, calibrationFileName, state } from 'src/shared/state'
import { Calibrate, calibrate } from 'src/shared/state'
import { Opacities, DefaultOpacity } from 'src/shared/state'
import { addRemoveRootStyles, createStyles, toastConsole } from './shared'
import { parseSymbolColors } from './regexToDomToCss'
import { createObservable } from '../shared/observable'
import { createTask, deltaFn } from 'src/shared/utils'
import { BranchObserverTasks, ObserverTasks } from './observableTask'
import { REC_ObservableTaskTree } from './observableTask'
export type { stateObservable, calibrateObservable, opacitiesObservable }
export type { editorObservable }

//#region opacities
const opacitiesStorageKey = `${extensionId}.opacities`
const opacitiesObservable = createObservable<Opacities>({ ...DefaultOpacity })
const opacitiesStyle = createStyles('opacities')
const createOpacitiesSubscription = () =>
  opacitiesObservable.subscribe((opacities) => {
    const cssVars = Object.entries(opacities).reduce((acc, [key, value]) => {
      return acc + `--${key}: ${value};`
    }, '')
    const style = `body { ${cssVars} }`
    opacitiesStyle.styleIt(style)
    window.localStorage.setItem(opacitiesStorageKey, style)
  })
function cacheOpacitiesProc() {
  try {
    const cache = window.localStorage.getItem(opacitiesStorageKey)
    if (cache) opacitiesStyle.styleIt(cache)
    else window.localStorage.removeItem(opacitiesStorageKey)
  } catch (error) {
    window.localStorage.removeItem(opacitiesStorageKey)
  }
}
//#endregion

//#region calibrate
const calibrateStorageKey = `${extensionId}.session.styles`
let tableTask: ReturnType<typeof createTask<Calibrate>> | undefined
export type windowColorsTable = ReturnType<
  typeof parseSymbolColors
>['colorsTable']
const calibrateObservable = createObservable<Calibrate | undefined>(undefined)
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
      extensionDisplayName,
      calibrateWindowCommandPlaceholder,
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
        window.localStorage.setItem(calibrateStorageKey, css)
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

function cacheCalibrateProc() {
  try {
    const cache = window.localStorage.getItem(calibrateStorageKey)
    if (cache) syntaxStyle.styleIt(cache)
    else window.localStorage.removeItem(calibrateStorageKey)
  } catch (error) {
    window.localStorage.removeItem(calibrateStorageKey)
  }
}
const editorObservable = createObservable<string | undefined>(undefined)
const createEditorSubscription = () =>
  editorObservable.$ubscribe((value) => {
    if (!value) return
    cacheCalibrateProc()
    return 'Symbol.dispose'
  })
//#endregion

//#region state
const syntaxStyle = createStyles('hide')
let deltaSubscribers = deltaFn()
const stateObservable = createObservable<State | undefined>(undefined)
// Just use the "using" keyword...
const createStateSubscription = () =>
  stateObservable.$ubscribe((deltaState) => {
    if (deltaState == state.active) {
      addRemoveRootStyles(true)
      cacheCalibrateProc()
      cacheOpacitiesProc()
      highlight.activate(500) // FIXME: find the moment the css finishes loading
      const _ = [
        createOpacitiesSubscription(),
        createCalibrateSubscription(),
        createEditorSubscription(),
      ]
      deltaSubscribers.fn = () => _.forEach((un) => un())
    } else {
      if (deltaState == state.resetDev) {
        window.localStorage.removeItem(calibrateStorageKey)
        window.localStorage.removeItem(opacitiesStorageKey)
      }
      deltaSubscribers.consume()
      addRemoveRootStyles(false)
      syntaxStyle.dispose()
      highlight.dispose() // the unwinding of the editorObservable could cause a stack overflow
    }
  })
//#endregion

//#region cycles
const syntax = createSyntaxLifecycle(
  {
    state: stateObservable,
    calibrate: calibrateObservable,
    opacities: opacitiesObservable,
  },
  IState,
  {
    activate() {
      const unSubscribeState = createStateSubscription()
      return () => {
        stateObservable.value = state.inactive
        unSubscribeState()
      }
    },
  }
)
const highlight = createHighlightLifeCycle(editorObservable)
//#endregion

//#region init
// prettier-ignore
declare global { interface Window { conciseSyntax?: typeof syntax } }
if (window.conciseSyntax) {
  window.conciseSyntax.dispose()
}
window.conciseSyntax = syntax
syntax.activate()
cacheCalibrateProc()
cacheOpacitiesProc()

console.log(extensionId, syntax)
//#endregion
