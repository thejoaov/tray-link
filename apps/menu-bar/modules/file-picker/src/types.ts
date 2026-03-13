export interface NativeFilePickerModule {
  pickFolder(): Promise<string>
  pickFolders(): Promise<string[]>
  pickFileWithFilenameExtension(filenameExtensions: string[], prompt: string): Promise<string>
}
