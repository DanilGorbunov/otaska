import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { TabBar } from './TabBar'
import { useEffect } from 'react'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

const TAB_ROOTS = ['/app', '/app/browse', '/app/chat', '/app/profile']

export function AppShell() {
  const location = useLocation()
  const navType = useNavigationType()
  const { subscribe, permission, supported } = usePushNotifications()

  const unreadCount = useQuery(api.messages.unreadCount) ?? 0

  // Auto-subscribe on first app open if not yet decided
  useEffect(() => {
    if (supported && permission === 'default') {
      subscribe()
    }
  }, [supported]) // eslint-disable-line react-hooks/exhaustive-deps

  // App badge — червона крапка на іконці PWA
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void>
      clearAppBadge?: () => Promise<void>
    }
    if (!nav.setAppBadge) return
    if (unreadCount > 0) {
      nav.setAppBadge(unreadCount).catch(() => {})
    } else {
      nav.clearAppBadge?.().catch(() => {})
    }
  }, [unreadCount])


  const isTabSwitch = TAB_ROOTS.includes(location.pathname)
  const animation = isTabSwitch
    ? 'none'
    : navType === 'POP'
      ? 'slideInLeft 0.32s cubic-bezier(0.25,0.46,0.45,0.94) both'
      : 'slideInRight 0.32s cubic-bezier(0.25,0.46,0.45,0.94) both'

  return (
    <div style={{
      background: '#F2F2F7', minHeight: '100dvh',
      overflow: 'hidden', position: 'relative',
    }}>
      <div
        key={location.key}
        style={{
          width: '100%', maxWidth: 430, margin: '0 auto',
          paddingBottom: 72,
          animation,
          willChange: 'transform',
        }}
      >
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}
