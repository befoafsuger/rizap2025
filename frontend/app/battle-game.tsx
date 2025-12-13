import { useEffect, useState } from 'react'
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { getCurrentUser, createBattleLog } from '@/utils/api'
import { Text } from '@/components/themed'

export default function BattleGameScreen() {
  const router = useRouter()
  const { enemyId, enemyName } = useLocalSearchParams()
  const [userLevel, setUserLevel] = useState(1)
  const [userHp, setUserHp] = useState(100)
  const [userMaxHp, setUserMaxHp] = useState(100)
  const [enemyHp, setEnemyHp] = useState(100)
  const [enemyMaxHp, setEnemyMaxHp] = useState(100)
  const [logMessages, setLogMessages] = useState<string[]>([])
  const [isGameOver, setIsGameOver] = useState(false)
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      setUserLevel(user.level)
      const maxHp = 100 + user.level * 10
      setUserMaxHp(maxHp)
      setUserHp(maxHp)

      // 敵のHPは仮の値
      setEnemyMaxHp(80)
      setEnemyHp(80)

      addLog('戦闘開始！')
    }
    init()
  }, [])

  const addLog = (msg: string) => {
    setLogMessages((prev) => [...prev, msg])
  }

  const playerAttack = () => {
    if (isGameOver) return

    const damage = Math.floor(Math.random() * 20) + 10
    const newEnemyHp = Math.max(enemyHp - damage, 0)
    setEnemyHp(newEnemyHp)
    addLog(`こうげき！${damage}ダメージ！`)

    if (newEnemyHp <= 0) {
      setIsGameOver(true)
      setWinner('player')
      addLog('敵を倒した！')
      return
    }

    setTimeout(() => enemyAttack(), 800)
  }

  const enemyAttack = () => {
    const damage = Math.floor(Math.random() * 15) + 5
    const newUserHp = Math.max(userHp - damage, 0)
    setUserHp(newUserHp)
    addLog(`敵の攻撃！${damage}ダメージ！`)

    if (newUserHp <= 0) {
      setIsGameOver(true)
      setWinner('enemy')
      addLog('やられた...')
    }
  }

  const handleGameEnd = async () => {
    if (!isGameOver || !winner) return

    try {
      const duration = Math.floor((Date.now() - startTime) / 1000)
      const damageDealt = enemyMaxHp - enemyHp
      const user = await getCurrentUser()

      await createBattleLog({
        userId: user.id,
        enemyId: (enemyId as string) || '',
        damageDealt,
        duration,
        replayData: [],
      })

      router.push(`/battle-result?won=${winner === 'player'}`)
    } catch (error) {
      console.error('Failed to save battle log:', error)
      router.back()
    }
  }

  return (
    <View style={styles.container}>
      {/* 敵情報エリア */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>敵：{enemyName}</Text>
        <Text style={styles.hpBar}>
          HP {enemyHp}/{enemyMaxHp}
        </Text>
        <View style={styles.hpBarContainer}>
          <View
            style={[
              styles.hpFill,
              { width: `${(enemyHp / enemyMaxHp) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* バトルログエリア */}
      <ScrollView style={styles.logBox}>
        {logMessages.map((msg, idx) => (
          <Text key={idx} style={styles.logText}>
            {msg}
          </Text>
        ))}
      </ScrollView>

      {/* プレイヤー情報エリア */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Lv{userLevel} (プレイヤー)</Text>
        <Text style={styles.hpBar}>
          HP {userHp}/{userMaxHp}
        </Text>
        <View style={styles.hpBarContainer}>
          <View
            style={[styles.hpFill, { width: `${(userHp / userMaxHp) * 100}%` }]}
          />
        </View>
      </View>

      {/* コマンドエリア */}
      {!isGameOver ? (
        <View style={styles.commandBox}>
          <TouchableOpacity
            style={styles.commandButton}
            onPress={playerAttack}
            activeOpacity={0.7}
          >
            <Text style={styles.commandText}>こうげき</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.commandButton}
            activeOpacity={0.7}
            onPress={() => {
              alert('にげた！ 戦闘から逃げ出した。')
              router.back()
            }}
          >
            <Text style={styles.commandText}> にげる</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            {winner === 'player' ? '勝利！' : 'ゲームオーバー'}
          </Text>
          <TouchableOpacity style={styles.resultButton} onPress={handleGameEnd}>
            <Text style={styles.resultButtonText}>つづける</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
    justifyContent: 'space-between',
  },
  infoBox: {
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#1a1a1a',
  },
  infoLabel: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 4,
  },
  hpBar: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 4,
  },
  hpBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#FFF',
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#0F0',
    transitionDuration: '300ms',
  },
  logBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  logText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 4,
  },
  commandBox: {
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commandButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#D3D3D3',
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
  },
  commandText: {
    fontSize: 14,
    color: '#000',
  },
  resultBox: {
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 4,
    padding: 16,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 28,
    color: '#FFF',
    marginBottom: 16,
  },
  resultButton: {
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  resultButtonText: {
    fontSize: 16,
    color: '#000',
  },
})
