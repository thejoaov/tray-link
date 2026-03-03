const fs = require('fs')
const path = require('path')

const target = path.join('node_modules', 'electron')
const source = path.join('..', '..', '..', '..', 'node_modules', 'electron')

try {
  fs.lstatSync(target)
} catch {
  fs.mkdirSync('node_modules', { recursive: true })
  fs.symlinkSync(source, target, 'junction')
}
