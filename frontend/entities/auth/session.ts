import { Session } from '@supabase/supabase-js'

export interface AuthData {
  session: Session | null
  isLoading: boolean
  isLoggedIn: boolean
}
