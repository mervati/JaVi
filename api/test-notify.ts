import webPush from 'web-push'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getDB() {
  if (!getApps().length) {
    const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT!, 'base64').toString('utf-8')
    initializeApp({ credential: cert(JSON.parse(raw)) })
  }
  return getFirestore()
}

export default async function handler(req: any, res: any) {
  const VAPID_PUBLIC  = process.env.VITE_VAPID_PUBLIC_KEY
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
  const VAPID_EMAIL   = process.env.VAPID_EMAIL ?? 'mailto:javi@app.com'

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'Variáveis VAPID ausentes' })
  }

  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)

  const db = getDB()
  const payload = JSON.stringify({
    title: 'JáVi 🎬',
    body: 'Notificação de teste funcionando!',
    url: '/perfil',
    tag: 'test-' + Date.now(),
  })

  let sent = 0
  const userRefs = await db.collection('users').listDocuments()

  for (const userRef of userRefs) {
    const subsSnap = await userRef.collection('push_subscriptions').get()
    for (const subDoc of subsSnap.docs) {
      const sub = subDoc.data()
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint as string, keys: sub.keys as any },
          payload
        )
        sent++
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) await subDoc.ref.delete()
      }
    }
  }

  return res.status(200).json({ ok: true, sent })
}
