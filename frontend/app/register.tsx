import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSignUp } from '@/services/auth/signup'

export default function RegisterScreen() {
  const router = useRouter()
  const { formik, loading } = useSignUp({
    onSuccess: () => {
      router.replace('/')
    },
  })

  const isFormValid = formik.isValid

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIT QUEST</Text>
      <Text style={styles.subtitle}>新規登録</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>表示名</Text>
          <TextInput
            style={[
              styles.input,
              formik.touched.displayName &&
                formik.errors.displayName &&
                styles.inputError,
            ]}
            placeholder="表示名を入力"
            placeholderTextColor="#888"
            value={formik.values.displayName}
            onChangeText={formik.handleChange('displayName')}
            onBlur={formik.handleBlur('displayName')}
            autoCapitalize="none"
          />
          {formik.touched.displayName && formik.errors.displayName && (
            <Text style={styles.errorText}>{formik.errors.displayName}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>メールアドレス</Text>
          <TextInput
            style={[
              styles.input,
              formik.touched.email && formik.errors.email && styles.inputError,
            ]}
            placeholder="email@example.com"
            placeholderTextColor="#888"
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {formik.touched.email && formik.errors.email && (
            <Text style={styles.errorText}>{formik.errors.email}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>パスワード</Text>
          <TextInput
            style={[
              styles.input,
              formik.touched.password &&
                formik.errors.password &&
                styles.inputError,
            ]}
            placeholder="パスワードを入力"
            placeholderTextColor="#888"
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            secureTextEntry
          />
          {formik.touched.password && formik.errors.password && (
            <Text style={styles.errorText}>{formik.errors.password}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            (!isFormValid || loading) && styles.registerButtonDisabled,
          ]}
          onPress={() => formik.handleSubmit()}
          disabled={!isFormValid || loading}
          activeOpacity={0.7}
        >
          <Text style={styles.registerButtonText}>
            {loading ? '登録中...' : '登録'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/login')}
          activeOpacity={0.7}
          style={styles.switchModeButton}
        >
          <Text style={styles.switchModeText}>ログインに戻る</Text>
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
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    marginTop: 4,
    fontFamily: 'DotGothic16-Regular',
    fontSize: 14,
    color: '#ff6b6b',
  },
  registerButton: {
    backgroundColor: '#D3D3D3',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  registerButtonText: {
    fontFamily: 'DotGothic16-Regular',
    fontSize: 20,
    color: '#000',
    letterSpacing: 1,
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
