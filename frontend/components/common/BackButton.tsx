import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import React from 'react'

export type BackButtonProps = {
  onPress: () => void
}

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>戻る</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#D3D3D3',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 20,
    color: '#000',
  },
})
