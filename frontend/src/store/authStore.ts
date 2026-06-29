import { api, TOKEN_KEY } from '../lib/api'

export interface LocalUser {
  id: string
  name: string
  email: string
  city?: string
  verified?: boolean
  created_at: string
  // backwards compat alias
  createdAt?: string
}

const SESSION_KEY = 'otaska_session'

function saveSession(user: LocalUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

async function fetchMe(): Promise<LocalUser> {
  const res = await api.get<LocalUser>('/auth/me')
  return res.data
}

export async function register(name: string, email: string, password: string, city?: string): Promise<LocalUser> {
  const res = await api.post<{ access_token: string }>('/auth/register', { name, email, password, city })
  localStorage.setItem(TOKEN_KEY, res.data.access_token)
  const user = await fetchMe()
  saveSession(user)
  return user
}

export async function login(email: string, password: string): Promise<LocalUser> {
  const res = await api.post<{ access_token: string }>('/auth/login', { email, password })
  localStorage.setItem(TOKEN_KEY, res.data.access_token)
  const user = await fetchMe()
  saveSession(user)
  return user
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

export function getSession(): LocalUser | null {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') } catch { return null }
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem(TOKEN_KEY) && getSession() !== null
}
