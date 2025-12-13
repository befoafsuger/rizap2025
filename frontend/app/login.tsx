import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { supabase } from '@/services/database/supabase'

export default function LoginRoute() {
  const router = useRouter()

  return <LoginScreen onSuccess={() => router.replace('/')} />
}

interface LoginScreenProps {
  onSuccess?: () => void
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    setErrorMessage(null)
    if (!email.trim() || !password.trim()) return

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) {
          setErrorMessage(error.message)
          return
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) {
          setErrorMessage(error.message)
          return
        }
      }

      onSuccess?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIT QUEST</Text>
      <Text style={styles.subtitle}>ログイン</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>メールアドレス</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>パスワード</Text>
          <TextInput
            style={styles.input}
            placeholder="パスワードを入力"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            (!email.trim() || !password.trim()) && styles.loginButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!email.trim() || !password.trim() || isSubmitting}
          activeOpacity={0.7}
        >
          <Text style={styles.loginButtonText}>
            {mode === 'login' ? 'ログイン' : '登録'}
          </Text>
        </TouchableOpacity>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          onPress={() => {
            if (mode === 'login') {
              router.push('/register')
            } else {
              setMode('login')
            }
          }}
          activeOpacity={0.7}
          style={styles.switchModeButton}
        >
          <Text style={styles.switchModeText}>
            {mode === 'login' ? 'アカウントを作成する' : 'ログインに戻る'}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'DotGothic16-Regular',
    fontSize: 48,
    color: '#FFF',
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'DotGothic16-Regular',
    fontSize: 24,
    color: '#FFF',
    marginBottom: 50,
    letterSpacing: 1,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'DotGothic16-Regular',
    fontSize: 16,
    color: '#FFF',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontFamily: 'DotGothic16-Regular',
    fontSize: 16,
    color: '#FFF',
  },
  loginButton: {
    backgroundColor: '#D3D3D3',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  loginButtonText: {
    fontFamily: 'DotGothic16-Regular',
    fontSize: 20,
    color: '#000',
    letterSpacing: 1,
  },
  errorText: {
    marginTop: 8,
    fontFamily: 'DotGothic16-Regular',
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
  },
  switchModeButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  switchModeText: {
    fontFamily: 'DotGothic16-Regular',
    fontSize: 16,
    color: '#FFF',
    textDecorationLine: 'underline',
  },
})
