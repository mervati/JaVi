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

async function sendTelegram(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const TMDB_TOKEN    = process.env.VITE_TMDB_TOKEN
  const VAPID_PUBLIC  = process.env.VITE_VAPID_PUBLIC_KEY
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
  const VAPID_EMAIL   = process.env.VAPID_EMAIL ?? 'mailto:javi@app.com'
  const TG_TOKEN      = process.env.TELEGRAM_BOT_TOKEN

  if (!TMDB_TOKEN || !VAPID_PUBLIC || !VAPID_PRIVATE) {
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
      const userDoc  = await userRef.get()
      const telegramChatId = userDoc.data()?.telegramChatId as string | undefined

      const hasPush     = !subsSnap.empty
      const hasTelegram = !!(TG_TOKEN && telegramChatId)
      if (!hasPush && !hasTelegram) continue

      const librarySnap = await userRef.collection('library').get()
      const libraryDocs = librarySnap.docs.map(d => d.data())

      const watchingIds: number[] = libraryDocs
        .filter(d => d.type === 'tv' && d.status === 'watching')
        .map(d => d.id as number)

      const watchlistMovieIds: number[] = libraryDocs
        .filter(d => d.type === 'movie' && d.status === 'watchlist')
        .map(d => d.id as number)

      async function sendPush(payload: string) {
        if (!hasPush) return
        for (const subDoc of subsSnap.docs) {
          const sub = subDoc.data()
          try {
            await webPush.sendNotification(
              { endpoint: sub.endpoint as string, keys: sub.keys as { p256dh: string; auth: string } },
              payload
            )
            sent++
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) await subDoc.ref.delete()
          }
        }
      }

      const tgSeriesLines: string[] = []
      const tgMovieLines:  string[] = []

      for (const seriesId of watchingIds) {
        let series: any
        try {
          const resp = await fetch(
            `https://api.themoviedb.org/3/tv/${seriesId}?language=pt-BR`,
            { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
          )
          series = await resp.json()
        } catch { skipped++; continue }

        const nextEp = series.next_episode_to_air
        const lastEp = series.last_episode_to_air
        const ep = nextEp?.air_date === todayStr ? nextEp : lastEp?.air_date === todayStr ? lastEp : null
        if (!ep) continue

        const s = String(ep.season_number).padStart(2, '0')
        const e = String(ep.episode_number).padStart(2, '0')
        const epName: string = ep.name ? ` — ${ep.name}` : ''

        const dedupId = `${seriesId}-S${s}E${e}-${todayStr}`
        const sentRef = userRef.collection('notifications_sent').doc(dedupId)
        if ((await sentRef.get()).exists) { skipped++; continue }

        await sendPush(JSON.stringify({
          title: series.name ?? 'JáVi',
          body: `T${s}E${e}${epName} vai ao ar hoje! 🎬`,
          url: `/series/${seriesId}`,
          tag: `ep-${seriesId}-S${s}E${e}`,
        }))

        tgSeriesLines.push(`• *${series.name}* — T${s}E${e}${epName}`)
        await sentRef.set({ sentAt: todayStr })
      }

      for (const movieId of watchlistMovieIds) {
        let movie: any
        try {
          const resp = await fetch(
            `https://api.themoviedb.org/3/movie/${movieId}?language=pt-BR`,
            { headers: { Authorization: `Bearer ${TMDB_TOKEN}` } }
          )
          movie = await resp.json()
        } catch { skipped++; continue }

        if (movie.release_date !== todayStr) continue

        const dedupId = `movie-${movieId}-${todayStr}`
        const sentRef = userRef.collection('notifications_sent').doc(dedupId)
        if ((await sentRef.get()).exists) { skipped++; continue }

        await sendPush(JSON.stringify({
          title: movie.title ?? 'JáVi',
          body: `Estreia hoje! Não perca. 🎬`,
          url: `/movie/${movieId}`,
          tag: `movie-${movieId}-${todayStr}`,
        }))

        tgMovieLines.push(`• *${movie.title}*`)
        await sentRef.set({ sentAt: todayStr })
      }

      if (hasTelegram && (tgSeriesLines.length || tgMovieLines.length)) {
        let text = '🎬 *JáVi — Estreias de hoje*\n\n'
        if (tgSeriesLines.length) text += '📺 *Séries:*\n' + tgSeriesLines.join('\n') + '\n\n'
        if (tgMovieLines.length)  text += '🎥 *Filmes:*\n'  + tgMovieLines.join('\n')
        await sendTelegram(TG_TOKEN!, telegramChatId!, text)
      }
    }

    return res.status(200).json({ ok: true, sent, skipped, date: todayStr })
  } catch (err) {
    console.error('[notify]', err)
    return res.status(500).json({ error: String(err) })
  }
}
