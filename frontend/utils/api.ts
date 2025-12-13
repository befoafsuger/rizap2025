export type User = {
  id: string
  displayName: string
  level: number
  totalXp: number
  createdAt: string
}

export type CreateUserRequest = {
  displayName: string
  level?: number
  totalXp?: number
}

export const getUser = async (): Promise<User[]> => {
  const url = '/users'
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const createUser = async (user: CreateUserRequest): Promise<User> => {
  const url = '/users'
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

// Enemy types
export type Enemy = {
  id: string
  name: string
  hp: number
  assetUrl: string | null
  attackPattern: Record<string, unknown>
  isActive: boolean
}

export type GetEnemiesOptions = {
  includeInactive?: boolean
}

// BattleLog types
export type ReplayData = Array<{
  t: number // time
  d: number // damage
  c: boolean // critical
}>

export type BattleLog = {
  id: string
  userId: string
  enemyId: string
  damageDealt: number
  duration: number // seconds
  replayData: ReplayData
  createdAt: string
}

export type CreateBattleLogRequest = {
  userId: string
  enemyId: string
  damageDealt: number
  duration: number // seconds
  replayData: ReplayData
}

export type GetBattleLogsOptions = {
  userId?: string
}

// 敵の API
export const getEnemies = async (
  options?: GetEnemiesOptions
): Promise<Enemy[]> => {
  const params = new URLSearchParams()
  if (options?.includeInactive) {
    params.append('includeInactive', 'true')
  }
  const url = `/enemies${params.toString() ? `?${params.toString()}` : ''}`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

// バトルログの API
export const getBattleLogs = async (
  options?: GetBattleLogsOptions
): Promise<BattleLog[]> => {
  const params = new URLSearchParams()
  if (options?.userId) {
    params.append('userId', options.userId)
  }
  const url = `/battle-logs${params.toString() ? `?${params.toString()}` : ''}`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const createBattleLog = async (
  battleLog: CreateBattleLogRequest
): Promise<BattleLog> => {
  const url = '/battle-logs'
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(battleLog),
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error)
    throw error
  }
}
