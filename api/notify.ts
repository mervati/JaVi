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

async function sendTelegram(token: string, chatId: string, text: string, photo?: string) {
  if (photo) {
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo, caption: text, parse_mode: 'Markdown' }),
    })
  } else {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    })
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // modo teste: envia mensagem direto para todos os usuários com telegramChatId
  const isTest = req.query?.test === 'true' || (req.url ?? '').includes('test=true')
  if (isTest) {
    const TG = process.env.TELEGRAM_BOT_TOKEN
    if (!TG) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN ausente' })
    const db = getDB()
    const userRefs = await db.collection('users').listDocuments()
    const debug: any[] = []
    let sent = 0
    for (const userRef of userRefs) {
      const snap = await userRef.get()
      const chatId = snap.data()?.telegramChatId as string | undefined
      const entry: any = { uid: userRef.id, docExists: snap.exists, hasChatId: !!chatId }
      if (!chatId) { debug.push(entry); continue }
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TG}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
            caption: '📺 *The Last of Us* — T02E05 — Atravessando\n\n_Exemplo de como as notificações vão chegar._',
            parse_mode: 'Markdown',
          }),
        })
        const tgJson = await tgRes.json()
        entry.telegramOk = tgRes.ok
        entry.telegramError = tgRes.ok ? undefined : tgJson.description
        if (tgRes.ok) sent++
      } catch (e) {
        entry.telegramError = String(e)
      }
      debug.push(entry)
    }
    return res.status(200).json({ ok: true, sent, debug })
  }

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

      const tgMessages: { text: string; photo?: string }[] = []

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

        const poster = series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : undefined
        tgMessages.push({ text: `📺 *${series.name}* — T${s}E${e}${epName}`, photo: poster })
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

        const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined
        tgMessages.push({ text: `🎥 *${movie.title}* — estreia hoje!`, photo: poster })
        await sentRef.set({ sentAt: todayStr })
      }

      if (hasTelegram && tgMessages.length) {
        if (tgMessages.length > 5) {
          const text = '🎬 *JáVi — Estreias de hoje*\n\n' + tgMessages.map(m => m.text).join('\n')
          await sendTelegram(TG_TOKEN!, telegramChatId!, text)
        } else {
          for (const msg of tgMessages) {
            await sendTelegram(TG_TOKEN!, telegramChatId!, msg.text, msg.photo)
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
