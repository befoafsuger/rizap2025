import React from 'react'
import { TextInput as RNTextInput, TextInputProps } from 'react-native'

export function TextInput(props: TextInputProps) {
  return (
    <RNTextInput
      {...props}
      style={[{ fontFamily: 'DotGothic16-Regular' }, props.style]}
    />
  )
}
