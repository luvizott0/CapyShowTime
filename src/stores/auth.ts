import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'

export interface User {
  id: number
  name: string
  username: string
  email: string
  avatar_url?: string
  banner_url?: string
  status: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('capyshowtime_token') || localStorage.getItem('capihouse_token'))
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function checkAuth() {
    if (!token.value) {
      user.value = null
      return false
    }

    try {
      isLoading.value = true
      const response = await apiClient.get('/auth/me')
      user.value = response.data
      return true
    } catch {
      clearAuth()
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function login(loginInput: string, passwordInput: string) {
    isLoading.value = true
    try {
      const response = await apiClient.post('/auth/login', {
        login: loginInput,
        password: passwordInput,
        device_name: 'CapyShowTime PWA'
      })

      const newToken = response.data.token || response.data.access_token
      token.value = newToken
      localStorage.setItem('capyshowtime_token', newToken)
      user.value = response.data.user

      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Credenciais inválidas'
      }
    } finally {
      isLoading.value = false
    }
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('capyshowtime_token')
  }

  async function logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // ignore
    } finally {
      clearAuth()
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    checkAuth,
    login,
    logout,
    clearAuth
  }
})
