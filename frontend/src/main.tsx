import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined

const root = document.getElementById('root')!

if (!convexUrl) {
  root.innerHTML = `
    <div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui;background:#F5F4F1;color:#1A1612;padding:20px;text-align:center">
      <svg width="52" height="52" viewBox="0 0 32 32" fill="none" style="margin-bottom:20px">
        <polygon points="16,1.5 28.5,8.75 28.5,23.25 16,30.5 3.5,23.25 3.5,8.75" fill="#EF9F27" stroke="#BA7517" stroke-width="1"/>
        <polyline points="9,16.5 13.5,21.5 23,10.5" stroke="#1A1612" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <h2 style="font-size:24px;font-weight:800;margin:0 0 12px">Потрібен Convex</h2>
      <p style="color:#9A8060;margin:0 0 24px;max-width:400px;line-height:1.6">
        Запусти в терміналі, щоб підключити базу даних та авторизацію:
      </p>
      <code style="background:#fff;border:1.5px solid #EDE8DF;border-radius:10px;padding:12px 20px;font-size:15px;display:block;margin-bottom:8px">
        cd frontend && npx convex dev
      </code>
      <p style="font-size:13px;color:#B4A898">Відкриє браузер → увійди в convex.dev → перезапусти</p>
    </div>
  `
} else {
  const convex = new ConvexReactClient(convexUrl)

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ConvexAuthProvider client={convex}>
        <App />
      </ConvexAuthProvider>
    </React.StrictMode>
  )
}
