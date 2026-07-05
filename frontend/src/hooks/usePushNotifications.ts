import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useCallback, useEffect, useState } from "react"

const VAPID_PUBLIC_KEY = "BLss353Y3P7Hr-WBVmCRxwKXYz4FcIWfUToNlztuT6KT1dSGE0r1MjaUNUUcwAK7T7dbXcOGCRClM0EWd4p6V6I"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const saveSubscription = useMutation(api.pushSubscriptions.save)
  const removeSubscription = useMutation(api.pushSubscriptions.remove)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window)
    if ("Notification" in window) setPermission(Notification.permission)
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported) return false

    const reg = await navigator.serviceWorker.register("/sw.js")
    await navigator.serviceWorker.ready

    let perm = Notification.permission
    if (perm === "default") {
      perm = await Notification.requestPermission()
    }
    setPermission(perm)
    if (perm !== "granted") return false

    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const json = sub.toJSON()
    await saveSubscription({
      endpoint: sub.endpoint,
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
    })

    return true
  }, [supported, saveSubscription])

  const unsubscribe = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js")
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await removeSubscription({ endpoint: sub.endpoint })
    await sub.unsubscribe()
    setPermission("default")
  }, [removeSubscription])

  return { subscribe, unsubscribe, permission, supported }
}
