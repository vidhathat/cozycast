import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

class Storage {
  async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } else {
        const item = await AsyncStorage.getItem(key)
        return item ? JSON.parse(item) : null
      }
    } catch (error) {
      console.error('Error getting item from storage:', error)
      return null
    }
  }

  async setItem(key, value) {
    try {
      const stringValue = JSON.stringify(value)
      if (Platform.OS === 'web') {
        localStorage.setItem(key, stringValue)
      } else {
        await AsyncStorage.setItem(key, stringValue)
      }
      return true
    } catch (error) {
      console.error('Error setting item in storage:', error)
      return false
    }
  }

  async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key)
      } else {
        await AsyncStorage.removeItem(key)
      }
      return true
    } catch (error) {
      console.error('Error removing item from storage:', error)
      return false
    }
  }
}

export const storage = new Storage() 