import { StyleSheet, TouchableOpacity, View, Image, Text } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useState } from 'react'

export default function HomeScreen() {
  const [level] = useState(1)

  return (
    <View style={styles.container}>
      {/* タイトル */}
      <Text style={styles.title}>FIT QUEST</Text>
      {/*設定ボタン*/}
      <TouchableOpacity style={styles.settingsButton}>
        <MaterialIcons name="settings" size={32} color="#fff" />
      </TouchableOpacity>

      {/* キャラクター表示エリア */}
      <View style={styles.characterContainer}>
        <Image
          source={require('@/assets/images/home-character.gif')}
          style={{ width: 200, height: 200, alignSelf: 'center' }}
        />
      </View>

      {/* ゲームモード選択ボタン */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.modeButton} activeOpacity={0.7}>
          <MaterialIcons name="bolt" size={32} color="#000" />
          <Text style={styles.buttonText}>対戦モード</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.modeButton} activeOpacity={0.7}>
          <MaterialIcons name="fitness-center" size={32} color="#000" />
          <Text style={styles.buttonText}>ソロモード</Text>
        </TouchableOpacity>
      </View>

      {/* プレースホルダーボタン */}
      <View style={styles.placeholderContainer}>
        <View style={styles.placeholderButton}>
          <Text style={styles.placeholderButtonText}>Lv{level}</Text>
        </View>
        <View style={styles.placeholderButton}>
          <Text style={styles.placeholderButtonText}>Lv{level}</Text>
        </View>
        <View style={styles.placeholderButton}>
          <Text style={styles.placeholderButtonText}>Lv{level}</Text>
        </View>
      </View>
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
    fontFamily: 'DotGothic16-Regular',
    fontSize: 36,
    color: '#FFF',
    marginBottom: 30,
    letterSpacing: 2,
  },
  characterContainer: {
    width: '100%',
    maxWidth: 300,
    height: 200,
    borderWidth: 4,
    borderColor: '#FFF',
    backgroundColor: '#000',
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  character: {
    width: 120,
    height: 150,
    position: 'relative',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
    marginBottom: 40,
  },
  modeButton: {
    backgroundColor: '#D3D3D3', // 明るいグレー
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: '#fff',

    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 15,
  },
  buttonText: {
    fontFamily: 'DotGothic16-Regular',
    fontSize: 20,
    color: '#000',
  },
  placeholderContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
  },
  placeholderButton: {
    width: 100,
    height: '100%',
    backgroundColor: '#D3D3D3',
    borderRadius: 8,
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  placeholderButtonText: {
    fontFamily: 'DotGothic16-Regular',
    fontSize: 20,
    lineHeight: 50,
    color: '#000',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
})
