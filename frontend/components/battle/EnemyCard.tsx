import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import React from 'react'

export type EnemyCardProps = {
  name: string
  hp: number
  onPress: () => void
}

export function EnemyCard({ name, hp, onPress }: EnemyCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.meta}>HP: {hp}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#D3D3D3',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    color: '#000',
    marginBottom: 4,
  },
  meta: {
    fontSize: 16,
    color: '#000',
  },
})
