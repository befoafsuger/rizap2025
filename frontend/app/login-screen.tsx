import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { useState } from 'react'

interface LoginScreenProps {
  onLogin: () => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = () => {
    // 簡単なバリデーション
    if (email.trim() && password.trim()) {
      onLogin()
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
          onPress={handleLogin}
          disabled={!email.trim() || !password.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.loginButtonText}>ログイン</Text>
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
})
