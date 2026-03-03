Pod::Spec.new do |s|
  s.name           = 'ShellUtils'
  s.version        = '1.0.0'
  s.summary        = 'Shell utility native module for TrayLink'
  s.description    = 'Opens editor/terminal/finder and file removal helpers'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platform       = :osx, '11.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
