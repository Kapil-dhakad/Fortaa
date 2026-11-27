import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_STORAGE_KEY = '@fortaa_user_session';
const TOKEN_STORAGE_KEY = '@fortaa_auth_token';

/**
 * Persist user session to storage
 * @param {Object} userData
 */
export async function saveUserSession(userData) {
  try {
    if (!userData) return;
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(USER_STORAGE_KEY, jsonValue);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(USER_STORAGE_KEY, jsonValue);
    }
  } catch (e) {
    console.warn('Failed to save user session:', e);
  }
}

/**
 * Retrieve saved user session on app launch
 * @returns {Promise<Object|null>}
 */
export async function getUserSession() {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (jsonValue) {
      return JSON.parse(jsonValue);
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      const webVal = window.localStorage.getItem(USER_STORAGE_KEY);
      if (webVal) return JSON.parse(webVal);
    }
  } catch (e) {
    console.warn('Failed to retrieve user session:', e);
  }
  return null;
}

/**
 * Clear user session on logout
 */
export async function clearUserSession() {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(USER_STORAGE_KEY);
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to clear user session:', e);
  }
}
