import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '@/services/database/supabase'

interface UseSession {
  session: Session | null
  isLoading: boolean
}

export function useSession(): UseSession {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setSession(data.session ?? null)
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
      }
    )

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  return { session, isLoading }
}

interface UseAccessToken {
  accessToken: string | null
}

export function useAccessToken(): UseAccessToken {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const { session } = useSession()
  useEffect(() => {
    if (session) {
      setAccessToken(session.access_token)
    }
  }, [session])
  return { accessToken }
}
