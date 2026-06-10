import { doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

export const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buf = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return view
}

function subId(endpoint: string): string {
  return btoa(endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(0, 28)
}

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()

  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = sub.toJSON()
  const id = subId(json.endpoint!)

  await setDoc(doc(db, 'users', userId, 'push_subscriptions', id), {
    endpoint: json.endpoint,
    keys: json.keys,
    createdAt: Date.now(),
  })

  return true
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  if (!isPushSupported()) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return

  const id = subId(sub.endpoint)
  await deleteDoc(doc(db, 'users', userId, 'push_subscriptions', id))
  await sub.unsubscribe()
}
