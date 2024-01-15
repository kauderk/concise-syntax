import fs from 'fs'
import path from 'path'
import packageJson from '../../package.json'

// FIXME: find a way to compile only the properties that are being used
export { extensionId } from '../workbench/keys'
import { extensionScriptSrc, extensionId } from '../workbench/keys'
export const extensionScriptTag = () =>
  new RegExp(
    `<script.+${extensionId.replaceAll('.', '\\.')}.+\/script>`,
    'gm' // intermittently
  )

export async function patchWorkbench(
  res: Awaited<ReturnType<typeof preRead>>,
  remoteWorkbenchPath: string
) {
  await fs.promises.copyFile(remoteWorkbenchPath, res.workbench.customPath)

  const hash = ('' + Math.random()).substring(2, 7)
  const newHtml = res.html
    .replaceAll(extensionScriptTag(), '')
    .replace(
      /(<\/html>)/,
      `<script src="${extensionScriptSrc}?${hash}"></script>` + '</html>'
    )

  await fs.promises.writeFile(res.workbench.path, newHtml, 'utf-8')
}
export async function preRead(base: string) {
  const workbenchPath = path.join(base, 'workbench.html')
  const html = await fs.promises.readFile(workbenchPath, 'utf-8')
  const wasActive = html.match(extensionScriptTag())
  return {
    html,
    wasActive,
    workbench: {
      path: workbenchPath,
      customPath: path.join(base, extensionScriptSrc),
    },
  }
}
