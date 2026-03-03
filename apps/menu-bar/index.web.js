import { registerRootComponent } from 'expo'
import { AppRegistry } from 'react-native'
import './src/services/i18n'
import App from './src/App'
import './src/windows'

const params = new URL(document.location.href).searchParams
const moduleName = params.get('moduleName')

if (moduleName) {
  try {
    const rootTag = document.getElementById('root')
    if (!rootTag) {
      console.error('[index.web] #root element not found')
    }
    console.log('[index.web] Running module:', moduleName, 'rootTag:', rootTag)
    AppRegistry.runApplication(moduleName, {
      rootTag,
    })
  } catch (err) {
    console.error('[index.web] Failed to run module:', moduleName, err)
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = `<pre style="color:red;padding:16px">${err?.stack || err}</pre>`
    }
  }
} else {
  registerRootComponent(App)
}
