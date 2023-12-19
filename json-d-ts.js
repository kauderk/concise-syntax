// https://github.com/microsoft/TypeScript/issues/32063#issuecomment-916071942
const fs = require('fs')

const PATTERN = 'package.json'
const DECL_POSTFIX = '.d.ts'

// Remove existing declaration files
const filesToDelete = fs
  .readdirSync('.', { withFileTypes: true })
  .filter(
    (file) =>
      file.isFile() &&
      file.name
        .toLowerCase()
        .endsWith(`${PATTERN.toLowerCase()}${DECL_POSTFIX}`)
  )
  .map((file) => file.name)

filesToDelete.forEach((file) => fs.unlinkSync(file))

// Find JSON files
const jsonFiles = fs
  .readdirSync('.', { withFileTypes: true })
  .filter(
    (file) =>
      file.isFile() && file.name.toLowerCase().endsWith(PATTERN.toLowerCase())
  )
  .map((file) => file.name)

// Generate declaration files
jsonFiles.forEach((file) => {
  const jsonData = JSON.stringify(require(`./${file}`), null, 2)
  fs.writeFileSync(
    `${file}${DECL_POSTFIX}`,
    `/** Generated with \`./json-d-ts.js\` */\ndeclare const data: ${jsonData}\nexport = data`
  )
})

console.log('TypeScript declaration files generated successfully.')
