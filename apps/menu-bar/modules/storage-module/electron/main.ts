import ElectronStore from 'electron-store'
import Store from 'electron-store'

const store = new Store() as ElectronStore

export const StorageMain = {
  setItem: (key: string, value: string) => {
    store.set(key, value)
    return true
  },
  getItem: (key: string) => {
    return store.get(key) as string | null
  },
  removeItem: (key: string) => {
    store.delete(key)
    return true
  },
  getAllKeys: () => {
    return Object.keys(store.store)
  },
  clear: () => {
    store.clear()
    return true
  },
}
