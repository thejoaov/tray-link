Pod::Spec.new do |s|
  s.name           = 'Storage'
  s.version        = '1.0.0'
  s.summary        = 'Storage native module for TrayLink'
  s.description    = 'Persistent key-value storage backed by config.json'
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
