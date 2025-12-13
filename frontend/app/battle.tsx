import { useEffect, useState } from 'react'
import { StyleSheet, View, FlatList, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Enemy, getEnemies } from '@/utils/api'
import { EnemyCard } from '@/components/battle/EnemyCard'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { BackButton } from '@/components/common/BackButton'

export default function BattleScreen() {
  const router = useRouter()
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getEnemies()
        setEnemies(list)
      }
      finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const renderItem = ({ item }: { item: Enemy }) => (
    <EnemyCard
      name={item.name}
      hp={item.hp}
      onPress={() =>
        router.push({ pathname: '/battle-game', params: { enemyId: item.id, enemyName: item.name } })
      }
    />
  )

  return (
    <View style={styles.container}>
      <ScreenHeader title="対戦相手を選ぶ" />
      {loading && <ActivityIndicator color="#fff" />}
      {!loading && (
        <FlatList
          data={enemies}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
      <BackButton onPress={() => router.back()} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  list: {
    gap: 12,
  },
  error: {
    fontSize: 16,
    color: '#f88',
    marginBottom: 12,
  },
})
