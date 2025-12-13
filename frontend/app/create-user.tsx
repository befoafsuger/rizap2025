import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { createUser } from '@/utils/api'
import { Text, TextInput } from '@/components/themed'

export default function CreateUserScreen() {
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCreateUser = async () => {
    if (!displayName.trim()) {
      Alert.alert('名前を入力してください')
      return
    }
    setIsLoading(true)
    try {
      await createUser({ displayName: displayName.trim() })
      Alert.alert('成功', 'ユーザーが作成されました', [
        { text: 'OK', onPress: () => router.replace('/') },
      ])
    } catch (error) {
      console.error('Failed to create user:', error)
      Alert.alert('ユーザーの作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FIT QUEST</Text>
      <Text style={styles.subtitle}>ユーザー登録</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>プレイヤー名</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="名前を入力"
          placeholderTextColor="#666"
          maxLength={20}
          editable={!isLoading}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCreateUser}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '作成中...' : 'はじめる'}
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
    fontSize: 48,
    color: '#FFF',
    marginBottom: 20,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 24,
    color: '#FFF',
    marginBottom: 60,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 10,
  },
  input: {
    fontSize: 20,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 30,
    color: '#000',
  },
  button: {
    backgroundColor: '#D3D3D3',
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 24,
    color: '#000',
  },
})
