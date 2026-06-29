import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'

export function AppShell() {
  return (
    <div style={{ background: '#F2F2F7', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, flex: 1, paddingBottom: 72, position: 'relative' }}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  )
}
