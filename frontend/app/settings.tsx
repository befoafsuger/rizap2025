import { StyleSheet, View, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Text } from '@/components/themed'


export default function SettingScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>設定</Text>
      {/* 後で実装 */}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>ホームに戻る</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#D3D3D3',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 20,
    color: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
})