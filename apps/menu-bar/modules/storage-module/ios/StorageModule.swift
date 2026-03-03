import ExpoModulesCore

public class StorageModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Storage")
    
    // We'll use MMKV via react-native-mmkv directly instead of exposing it via Swift
    // This file is kept as a placeholder just in case we need Swift-level storage
  }
}
