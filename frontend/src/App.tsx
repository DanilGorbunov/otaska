import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from './store/authStore'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { Browse } from './pages/Browse'
import { NewEntry } from './pages/NewEntry'
import { EntryDetail } from './pages/EntryDetail'
import { ProjectDetail } from './pages/ProjectDetail'
import { Chat } from './pages/Chat'
import { Profile } from './pages/Profile'
import { ProviderProfile } from './pages/ProviderProfile'
import { ChatConversation } from './pages/ChatConversation'
import { Login } from './pages/Auth/Login'
import { Landing } from './pages/Landing'

function GuestOnly({ children }: { children: React.ReactNode }) {
  if (isLoggedIn()) return <Navigate to="/app" replace />
  return <>{children}</>
}

function AuthRequired({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/" replace />
  return <>{children}</>
}

function RouterContent() {
  const location = useLocation()
  const state = location.state as { backgroundLocation?: typeof location } | null
  const bg = state?.backgroundLocation

  return (
    <>
      {/* Main routes — render background page when modal is open */}
      <Routes location={bg || location}>
        <Route path="/" element={<GuestOnly><Landing /></GuestOnly>} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/app" element={<AuthRequired><AppShell /></AuthRequired>}>
          <Route index element={<Dashboard />} />
          <Route path="browse" element={<Browse />} />
          <Route path="entries/:id" element={<EntryDetail />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users/:id" element={<ProviderProfile />} />
        </Route>
      </Routes>

      {/* Modal overlay — rendered on top when /app/new is active */}
      {bg && (
        <Routes>
          <Route path="/app/new" element={<NewEntry />} />
        </Routes>
      )}

      {/* Direct /app/new visit (no background) */}
      {!bg && location.pathname === '/app/new' && (
        <Routes>
          <Route path="/app/new" element={<NewEntry />} />
        </Routes>
      )}

      {/* Chat conversation — fullscreen, no TabBar */}
      {location.pathname.startsWith('/app/chat/') && (
        <Routes>
          <Route path="/app/chat/:id" element={<ChatConversation />} />
        </Routes>
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RouterContent />
    </BrowserRouter>
  )
}
