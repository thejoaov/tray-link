import Clipboard from '@react-native-clipboard/clipboard'
import { useState } from 'react'
import { TouchableOpacity } from 'react-native'

import { Text } from '../Text'
import { View } from '../View'

export const ObjectInspector = ({ obj, name }: { obj: unknown; name?: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const isObject = typeof obj === 'object' && obj !== null
  const isArray = Array.isArray(obj)
  const objectValue = isObject ? (obj as Record<string, unknown>) : null

  return (
    <TouchableOpacity
      onPress={() => {
        if (isObject) {
          setIsOpen((prev) => !prev)
        } else {
          Clipboard.setString(String(obj))
        }
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: 5,
          flex: 1,
        }}
      >
        {isObject ? (
          <Text>
            {isOpen ? '▼' : '▶'} {name ? `${name}: ` : ''}
          </Text>
        ) : (
          <Text>
            {name ? `${name}: ` : ''}
            {String(obj)}
          </Text>
        )}
        {isObject && !isOpen ? (
          <Text style={{ opacity: 0.6, marginLeft: 6 }} numberOfLines={1}>
            {JSON.stringify(obj)}
          </Text>
        ) : null}
      </View>
      {isObject && isOpen ? (
        <View style={{ marginLeft: 10 }}>
          {Object.keys(objectValue ?? {}).map((key) => (
            <ObjectInspector key={key} obj={objectValue?.[key]} name={isArray ? `[${key}]` : key} />
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  )
}
