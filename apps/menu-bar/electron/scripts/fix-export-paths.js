const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, '..', 'dist')
const indexPath = path.join(distDir, 'index.html')
const jsDir = path.join(distDir, '_expo', 'static', 'js', 'web')

const html = fs.readFileSync(indexPath, 'utf8')
const updatedHtml = html.replace(/(src|href)="\/(?!\/)/g, '$1="./').replace(/(src|href)='\/(?!\/)/g, "$1='./")

if (updatedHtml !== html) {
  fs.writeFileSync(indexPath, updatedHtml)
}

if (fs.existsSync(jsDir)) {
  for (const entry of fs.readdirSync(jsDir)) {
    if (!entry.endsWith('.js')) {
      continue
    }

    const filePath = path.join(jsDir, entry)
    const source = fs.readFileSync(filePath, 'utf8')
    const updatedSource = source.replace(/(["'])\/assets\//g, '$1./assets/')

    if (updatedSource !== source) {
      fs.writeFileSync(filePath, updatedSource)
    }
  }
}
