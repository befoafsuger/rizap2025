import { Mode } from '@/entities/game/mode'

const SCORE_API_URL = 'https://sponsored-media-compatibility-captured.trycloudflare.com/api/debug'

// ダミーモード（開発用）
const USE_MOCK = true  // false にすると本物のAPIを使う

export interface ScoreResponse {
  frames_processed: number
  input_fps: number
  duration_seconds: number
  mode: string
  max_score: number | null
  avg_score: number | null
  last_score: number | null
  processing_time_seconds: number
}

// ダミーデータ生成
const generateMockScore = (mode: Mode): ScoreResponse => {
  const baseScore = Math.random() * 100  // 0-100のランダムスコア
  const variation = Math.random() * 20 - 10  // ±10の変動

  return {
    frames_processed: 90,
    input_fps: 30.0,
    duration_seconds: 3.0,
    mode: mode,
    max_score: Math.min(100, Math.max(0, baseScore + variation)),
    avg_score: Math.min(100, Math.max(0, baseScore)),
    last_score: Math.min(100, Math.max(0, baseScore - variation)),
    processing_time_seconds: 0.5 + Math.random() * 0.5,
  }
}

export const uploadVideoForScore = async (
  videoUri: string,
  mode: Mode,
): Promise<string> => {
  console.log('Video URI:', videoUri)
  console.log('Mode:', mode)
  console.log('Mock mode:', USE_MOCK)

  // ダミーモード
  if (USE_MOCK) {

    // 処理時間をシミュレート（1-2秒）
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

    const mockData = generateMockScore(mode)
    console.log('Mock score generated:', mockData)

    return JSON.stringify(mockData)
  }

  // 本物のAPI呼び出し
  console.log('Sending request to:', SCORE_API_URL)

  const formData = new FormData()

  const filename = `video_${Date.now()}.mp4`

  formData.append('file', {
    uri: videoUri,
    type: 'video/mp4',
    name: filename,
  } as any)

  formData.append('mode', mode as string)

  try {
    const response = await fetch(SCORE_API_URL, {
      method: 'POST',
      body: formData,
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error Response:', errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const responseText = await response.text()
    console.log('API Response:', responseText)
    return responseText

  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}