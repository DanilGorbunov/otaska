self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, icon, url, badgeCount } = data

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        icon: icon || '/icon.svg',
        badge: '/icon.svg',
        data: { url: url || '/' },
        vibrate: [100, 50, 100],
        silent: false,
      }),
      // Оновити бейдж на іконці
      navigator.setAppBadge
        ? navigator.setAppBadge(badgeCount ?? 1).catch(() => {})
        : Promise.resolve(),
      // Повідомити відкриті вкладки щоб програли звук
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' }))
      }),
    ])
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
