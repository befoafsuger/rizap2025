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

// ダミーユーザーデータ
const DUMMY_USERS: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    displayName: 'Player1',
    level: 5,
    totalXp: 500,
    createdAt: new Date().toISOString(),
  },
]

// 全ユーザー取得（バックエンド: GET /users）
export const getUsers = async (): Promise<User[]> => {
  const url = '/users'
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    return DUMMY_USERS
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
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      displayName: user.displayName,
      level: user.level || 1,
      totalXp: user.totalXp || 0,
      createdAt: new Date().toISOString(),
    }
    DUMMY_USERS[0] = newUser
    return newUser
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

// ダミー敵データ
const DUMMY_ENEMIES: Enemy[] = [
  {
    id: '1',
    name: 'スライム',
    hp: 350,
    assetUrl: null,
    attackPattern: {},
    isActive: true,
  },
  {
    id: '2',
    name: 'ゴブリン',
    hp: 400,
    assetUrl: null,
    attackPattern: {},
    isActive: true,
  },
  {
    id: '3',
    name: 'オーク',
    hp: 450,
    assetUrl: null,
    attackPattern: {},
    isActive: true,
  },
]

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
    return DUMMY_ENEMIES
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
    const dummyLog: BattleLog = {
      id: Math.random().toString(36).substring(7),
      ...battleLog,
      createdAt: new Date().toISOString(),
    }
    return dummyLog
  }
}

export const getCurrentUser = async (): Promise<User> => {
  const users = await getUsers()
  if (!users || users.length === 0) {
    throw new Error('No users found')
  }
  return users[0]
}
