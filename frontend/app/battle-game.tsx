import { useEffect, useState, useRef } from 'react'
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { getCurrentUser, createBattleLog, getEnemies } from '@/utils/api'
import { Text } from '@/components/themed'
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera'
import { Mode } from '@/entities/game/mode'
import { uploadVideoForScore } from '@/utils/score'

interface ScoreSummary {
  max_score: number | null
  avg_score: number | null
}

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

  // Vision Cameraにする
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice('front')
  const camera = useRef<Camera>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mode, setMode] = useState<Mode>(Mode.AUTO)

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      setUserLevel(user.level)
      const maxHp = 100 + user.level * 10
      setUserMaxHp(maxHp)
      setUserHp(maxHp)

      // 敵データを取得
      const enemies = await getEnemies()
      const enemy = enemies.find(e => e.id === enemyId)
      if (enemy) {
        setEnemyMaxHp(enemy.hp)
        setEnemyHp(enemy.hp)
      }

      addLog('戦闘開始！')
    }
    init()
  }, [enemyId])

  const addLog = (msg: string) => {
    setLogMessages((prev) => [...prev, msg])
  }

  const playerAttack = async () => {
    if (isGameOver) return
    if (!camera.current) {
      addLog('カメラが準備できていません')
      return
    }

    setIsRecording(true)
    addLog('動きを録画中...')

    try {
      // Vision Cameraで録画開始
      camera.current.startRecording({
        onRecordingFinished: async (video) => {
          setIsRecording(false)
          console.log('Video recorded at:', video.path)

          try {
            setIsProcessing(true)
            addLog('動きを分析中...')

            // file:// プレフィックスを付ける
            const videoUri = `file://${video.path}`
            const respText = await uploadVideoForScore(videoUri, mode)
            console.log('API Response:', respText)

            let score: ScoreSummary | null = null
            try {
              score = JSON.parse(respText)
              console.log('Parsed score:', score)
            } catch (parseError) {
              console.error('Failed to parse score:', parseError)
            }

            setIsProcessing(false)

            const baseDamage = 10
            const scoreDamage = score ? Math.floor(score.max_score ?? 0) : 0
            const damage = baseDamage + scoreDamage

            const newEnemyHp = Math.max(enemyHp - damage, 0)
            setEnemyHp(newEnemyHp)

            addLog(`こうげき！${damage}ダメージ！（スコア: ${scoreDamage}）`)

            if (newEnemyHp <= 0) {
              setIsGameOver(true)
              setWinner('player')
              addLog('敵を倒した！')
              return
            }

            setTimeout(() => enemyAttack(), 800)
          } catch (error) {
            console.error('Processing failed:', error)
            setIsProcessing(false)
            addLog('分析失敗...')
          }
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error)
          setIsRecording(false)
          addLog('録画失敗...')
        },
      })

      // 3秒後に録画停止
      setTimeout(async () => {
        if (camera.current) {
          await camera.current.stopRecording()
        }
      }, 3000)

    } catch (error) {
      console.error('Attack failed:', error)
      setIsRecording(false)
      addLog('攻撃失敗...')
    }
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

  // 権限チェックを行う
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoLabel}>カメラ権限が必要です</Text>
        <TouchableOpacity style={styles.commandButton} onPress={requestPermission}>
          <Text style={styles.commandText}>権限を許可</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.infoLabel}>カメラデバイスが見つかりません</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
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

      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={true}
          video={true}
          audio={false}
        />

        <View style={styles.modeRow}>
          {[Mode.AUTO, Mode.RUNNING, Mode.SQUAT, Mode.PUSHUP].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeButton, mode === m && styles.modeButtonActive]}
              onPress={() => setMode(m)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.logOverlay}>
          {logMessages.slice(-3).map((msg, idx) => (
            <Text key={idx} style={styles.logText}>
              {msg}
            </Text>
          ))}
        </View>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Text style={styles.recordingText}>● 録画中</Text>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>分析中...</Text>
          </View>
        )}
      </View>

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

      {!isGameOver ? (
        <View style={styles.commandBox}>
          <TouchableOpacity
            style={[
              styles.commandButton,
              (isRecording || isProcessing) && styles.commandButtonDisabled
            ]}
            onPress={playerAttack}
            disabled={isRecording || isProcessing}
            activeOpacity={0.7}
          >
            <Text style={styles.commandText}>こうげき</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.commandButton}
            activeOpacity={0.7}
            onPress={() => router.push('/')}
          >
            <Text style={styles.commandText}>にげる</Text>
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
  cameraContainer: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  modeRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
    borderRadius: 6,
  },
  modeButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 4,
    backgroundColor: '#111',
  },
  modeButtonActive: {
    borderColor: '#0F0',
    backgroundColor: '#0a0',
  },
  modeText: {
    color: '#ccc',
    fontSize: 10,
  },
  modeTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  logOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
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
  },
  logText: {
    fontSize: 12,
    color: '#FFF',
    marginBottom: 2,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  recordingText: {
    color: '#FFF',
    fontSize: 12,
  },
  processingOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    alignItems: 'center',
  },
  processingText: {
    color: '#FFF',
    marginTop: 8,
    fontSize: 14,
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
  commandButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
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
    color: '#FFF',
  },
})