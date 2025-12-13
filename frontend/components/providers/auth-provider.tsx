import { Text } from '@/components/themed'
import { createContext, useContext } from 'react'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { Redirect, useSegments, type Href } from 'expo-router'
import { useSession } from '@/services/auth/session'
import { AuthData } from '@/entities/auth/session'

const AuthContext = createContext<AuthData>({
  session: null,
  isLoading: true,
  isLoggedIn: false,
})

export const useAuthContext = (): AuthData => useContext(AuthContext)

/**
 * 認証用Provider
 *
 * 未認証+ログイン画面以外　-> redirect("/login")
 *
 * 認証済み+ログイン画面　-> redirect("/")
 */
export default function AuthProvider({ children }: PropsWithChildren) {
  const { session, isLoading } = useSession()
  const segments = useSegments()
  console.log('session', session)

  const value = useMemo(
    () => ({
      session,
      isLoading,
      isLoggedIn: !!session,
    }),
    [session, isLoading]
  )

  if (isLoading) {
    return (
      <AuthContext.Provider value={value}>
        <Text>読み込み中...</Text>
      </AuthContext.Provider>
    )
  }

  // 認証不要のルート（パブリックルート）
  const publicRoutes = ['login', 'register']
  const currentRoute = segments[0]
  const isPublicRoute = publicRoutes.includes(currentRoute || '')

  // 未ログインでパブリックルート以外の場合はログイン画面にリダイレクト
  if (!value.isLoggedIn && !isPublicRoute) {
    return (
      <AuthContext.Provider value={value}>
        <Redirect href={'/login' as Href} />
      </AuthContext.Provider>
    )
  }

  // ログイン済みでログイン/登録画面の場合はホームにリダイレクト
  if (value.isLoggedIn && isPublicRoute) {
    return (
      <AuthContext.Provider value={value}>
        <Redirect href={'/' as Href} />
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
