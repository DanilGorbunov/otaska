import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth.store'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Browse } from './pages/Browse'
import { NewEntry } from './pages/NewEntry'
import { EntryDetail } from './pages/EntryDetail'
import { ProjectDetail } from './pages/ProjectDetail'
import { Chat } from './pages/Chat'
import { Profile } from './pages/Profile'
import { Login } from './pages/Auth/Login'
import { Landing } from './pages/Landing'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (token) return <Navigate to="/app" replace />
  return <>{children}</>
}

export default function App() {
  const { fetchMe } = useAuthStore()

  useEffect(() => {
    fetchMe()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        <Route path="/app" element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }>
          <Route index element={<Dashboard />} />
          <Route path="browse" element={<Browse />} />
          <Route path="new" element={<NewEntry />} />
          <Route path="entries/:id" element={<EntryDetail />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
