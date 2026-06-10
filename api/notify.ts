import webPush from 'web-push'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

function getDB() {
  if (!getApps().length) {
    const raw = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT!, 'base64').toString('utf-8')
    const serviceAccount = JSON.parse(raw)
    initializeApp({ credential: cert(serviceAccount) })
  }
  return getFirestore()
}

function todayUTC(): string {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const TMDB_KEY = process.env.VITE_TMDB_API_KEY
  const VAPID_PUBLIC = process.env.VITE_VAPID_PUBLIC_KEY
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
  const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:javi@app.com'

  if (!TMDB_KEY || !VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'Variáveis de ambiente ausentes' })
  }

  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)

  const db = getDB()
  const todayStr = todayUTC()
  let sent = 0
  let skipped = 0

  try {
    const userRefs = await db.collection('users').listDocuments()

    for (const userRef of userRefs) {
      const subsSnap = await userRef.collection('push_subscriptions').get()
      if (subsSnap.empty) continue

      const librarySnap = await userRef.collection('library').get()
      const watchingIds: number[] = librarySnap.docs
        .filter(d => d.data().type === 'tv' && d.data().status === 'watching')
        .map(d => d.data().id as number)

      if (!watchingIds.length) continue

      for (const seriesId of watchingIds) {
        let series: any
        try {
          const resp = await fetch(
            `https://api.themoviedb.org/3/tv/${seriesId}?api_key=${TMDB_KEY}&language=pt-BR`
          )
          series = await resp.json()
        } catch {
          skipped++
          continue
        }

        const nextEp = series.next_episode_to_air
        if (!nextEp || nextEp.air_date !== todayStr) continue

        const s = String(nextEp.season_number).padStart(2, '0')
        const e = String(nextEp.episode_number).padStart(2, '0')
        const epName: string = nextEp.name ? ` — ${nextEp.name}` : ''

        const payload = JSON.stringify({
          title: series.name ?? 'JáVi',
          body: `T${s}E${e}${epName} vai ao ar hoje! 🎬`,
          url: `/series/${seriesId}`,
          tag: `ep-${seriesId}-S${s}E${e}`,
        })

        for (const subDoc of subsSnap.docs) {
          const sub = subDoc.data()
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint as string, keys: sub.keys as webPush.RequestOptions['vapidDetails'] },
              payload
            )
            sent++
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await subDoc.ref.delete()
            }
          }
        }
      }
    }

    return res.status(200).json({ ok: true, sent, skipped, date: todayStr })
  } catch (err) {
    console.error('[notify]', err)
    return res.status(500).json({ error: String(err) })
  }
}
