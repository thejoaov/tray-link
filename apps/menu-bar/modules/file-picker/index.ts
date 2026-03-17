import FilePickerModule from './src/FilePickerModule'

export function pickFolder(): Promise<string> {
  return FilePickerModule.pickFolder()
}

export function pickFolders(): Promise<string[]> {
  return FilePickerModule.pickFolders()
}

export function getAppAsync(): Promise<string> {
  return FilePickerModule.pickFileWithFilenameExtension(
    ['app', 'exe', 'appimage', 'desktop', 'png', 'ico', 'icns', 'apk', 'ipa', 'tar', 'gzip'],
    'Select',
  )
}
