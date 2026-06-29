import { Outlet, useLocation, useNavigationType } from 'react-router-dom'
import { TabBar } from './TabBar'

const TAB_ROOTS = ['/app', '/app/browse', '/app/chat', '/app/profile']

export function AppShell() {
  const location = useLocation()
  const navType = useNavigationType()

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
