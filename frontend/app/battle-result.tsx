import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Text } from '@/components/themed'

export default function BattleResultScreen() {
  const router = useRouter()
  const { won } = useLocalSearchParams()
  const isWon = won === 'true'

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIT QUEST</Text>

      <View style={styles.resultBox}>
        <Text style={styles.resultText}>
          {isWon ? '勝利！' : 'ゲームオーバー'}
        </Text>
        {isWon && <Text style={styles.rewardText}>つぎの戦いへ進もう！</Text>}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>ホームへ戻る</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => router.push('/battle')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>別の敵に挑む</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    color: '#FFF',
    marginBottom: 60,
  },
  resultBox: {
    borderWidth: 4,
    borderColor: '#FFF',
    borderRadius: 8,
    padding: 32,
    marginBottom: 60,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 48,
    color: '#FFF',
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 8,
  },
  rewardValue: {
    fontSize: 28,
    color: '#FFD700',
  },
  levelUpText: {
    fontSize: 24,
    color: '#0F0',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#D3D3D3',
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#999',
  },
  buttonText: {
    fontSize: 20,
    color: '#000',
  },
})
