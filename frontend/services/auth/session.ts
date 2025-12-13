import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../database/supabase'

interface UseSession {
  session: Session | null
}

export function useSession(): UseSession {
  const [session, setSession] = useState<Session | null>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return { session }
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
