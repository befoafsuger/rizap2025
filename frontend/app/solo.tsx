import { useState, useRef } from 'react'
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@/components/themed'
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera'
import { Mode } from '@/entities/game/mode'
import { uploadVideoForScore } from '@/utils/score'

interface ScoreResponse {
  frames_processed: number
  input_fps: number
  duration_seconds: number
  mode: string
  max_score: number | null
  avg_score: number | null
  last_score: number | null
  processing_time_seconds: number
}

export default function SoloScreen() {
  const router = useRouter()

  // Vision Camera
  const { hasPermission, requestPermission } = useCameraPermission()
  const device = useCameraDevice('front')
  const camera = useRef<Camera>(null)

  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mode, setMode] = useState<Mode>(Mode.AUTO)
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null)

  const handleStartRecording = async () => {
    if (!camera.current) {
      console.log('Camera not ready')
      return
    }

    setIsRecording(true)
    setScoreResult(null)

    try {
      // Vision Cameraで録画開始
      camera.current.startRecording({
        onRecordingFinished: async (video) => {
          setIsRecording(false)
          console.log('Video recorded at:', video.path)

          try {
            setIsProcessing(true)

            // file:// プレフィックスを付ける
            const videoUri = `file://${video.path}`
            const respText = await uploadVideoForScore(videoUri, mode)
            console.log('API Response:', respText)

            try {
              const result: ScoreResponse = JSON.parse(respText)
              console.log('Parsed score:', result)
              setScoreResult(result)
            } catch (parseError) {
              console.error('Failed to parse score:', parseError)
            }

            setIsProcessing(false)
          } catch (error) {
            console.error('Processing failed:', error)
            setIsProcessing(false)
          }
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error)
          setIsRecording(false)
        },
      })

      // 10秒後に録画停止
      setTimeout(async () => {
        if (camera.current) {
          await camera.current.stopRecording()
        }
      }, 10000)

    } catch (error) {
      console.error('Failed to start recording:', error)
      setIsRecording(false)
    }
  }

  // 権限チェック
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>カメラ権限が必要です</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>権限を許可</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>カメラデバイスが見つかりません</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ソロトレーニング</Text>
      </View>

      {/* カメラプレビュー */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={true}
          video={true}
          audio={false}
        />

        {/* モード選択 */}
        <View style={styles.modeRow}>
          {[Mode.AUTO, Mode.RUNNING, Mode.SQUAT, Mode.PUSHUP].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.modeButton, mode === m && styles.modeButtonActive]}
              onPress={() => setMode(m)}
              activeOpacity={0.7}
              disabled={isRecording || isProcessing}
            >
              <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 録画中表示 */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Text style={styles.recordingText}>● 録画中</Text>
          </View>
        )}

        {/* 処理中表示 */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>分析中...</Text>
          </View>
        )}
      </View>

      {/* スコア表示 */}
      {scoreResult && (
        <View style={styles.scoreBox}>
          <Text style={styles.scoreTitle}>スコア結果</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>最高スコア:</Text>
            <Text style={styles.scoreValue}>
              {scoreResult.max_score?.toFixed(1) ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>平均スコア:</Text>
            <Text style={styles.scoreValue}>
              {scoreResult.avg_score?.toFixed(1) ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>最終スコア:</Text>
            <Text style={styles.scoreValue}>
              {scoreResult.last_score?.toFixed(1) ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>処理時間:</Text>
            <Text style={styles.scoreValue}>
              {scoreResult.processing_time_seconds.toFixed(2)}秒
            </Text>
          </View>
        </View>
      )}

      {/* コントロールボタン */}
      <View style={styles.controlBox}>
        <TouchableOpacity
          style={[
            styles.button,
            (isRecording || isProcessing) && styles.buttonDisabled
          ]}
          onPress={handleStartRecording}
          disabled={isRecording || isProcessing}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isRecording ? '録画中...' : isProcessing ? '処理中...' : '録画開始 (10秒)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    color: '#FFF',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
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
    fontWeight: 'bold',
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
  scoreBox: {
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#1a1a1a',
  },
  scoreTitle: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#CCC',
  },
  scoreValue: {
    fontSize: 14,
    color: '#0F0',
    fontWeight: 'bold',
  },
  controlBox: {
    gap: 8,
  },
  button: {
    backgroundColor: '#0F0',
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
})