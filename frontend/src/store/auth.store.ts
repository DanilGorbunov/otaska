import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../lib/api'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; city?: string; first_task?: string }) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    set({ loading: true })
    try {
      const res = await authApi.login({ email, password })
      const token = res.data.access_token
      localStorage.setItem('token', token)
      set({ token })
      const me = await authApi.me()
      set({ user: me.data })
    } finally {
      set({ loading: false })
    }
  },

  register: async (data) => {
    set({ loading: true })
    try {
      const res = await authApi.register(data)
      const token = res.data.access_token
      localStorage.setItem('token', token)
      set({ token })
      const me = await authApi.me()
      set({ user: me.data })
    } finally {
      set({ loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const me = await authApi.me()
      set({ user: me.data, token })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },
}))
