import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { TabBar } from './TabBar'
import { Sidebar } from './Sidebar'
import { useEffect, useState } from 'react'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

const TAB_ROOTS = ['/app', '/app/browse', '/app/chat', '/app/profile']
const DESKTOP_BP = 768

export function AppShell() {
  const location = useLocation()
  const navType = useNavigationType()
  const { subscribe, permission, supported } = usePushNotifications()
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= DESKTOP_BP)

  const unreadCount = useQuery(api.messages.unreadCount) ?? 0

  useEffect(() => {
    if (supported && permission === 'default') subscribe()
  }, [supported]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BP}px)`)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (count: number) => Promise<void>
      clearAppBadge?: () => Promise<void>
    }
    if (!nav.setAppBadge) return
    if (unreadCount > 0) nav.setAppBadge(unreadCount).catch(() => {})
    else nav.clearAppBadge?.().catch(() => {})
  }, [unreadCount])

  const isTabSwitch = TAB_ROOTS.includes(location.pathname)
  const animation = isTabSwitch
    ? 'none'
    : navType === 'POP'
      ? 'slideInLeft 0.32s cubic-bezier(0.25,0.46,0.45,0.94) both'
      : 'slideInRight 0.32s cubic-bezier(0.25,0.46,0.45,0.94) both'

  if (isDesktop) {
    return (
      <div style={{ display: 'flex', minHeight: '100dvh', background: '#F2F2F7' }}>
        <Sidebar />
        <main
          key={location.key}
          style={{
            flex: 1, minWidth: 0,
            overflowY: 'auto',
            animation,
            willChange: 'transform',
          }}
        >
          <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 40px' }}>
            <Outlet />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100dvh', overflow: 'hidden', position: 'relative' }}>
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
