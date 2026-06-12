import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

export function useEpisodes(seriesId: number) {
  const { user } = useAuth()
  const [watched, setWatched] = useState<Set<string>>(new Set())
  const [watchedAt, setWatchedAt] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!user || !seriesId) return
    const ref = doc(db, 'users', user.uid, 'series_progress', String(seriesId))
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setWatched(new Set(snap.data().watched ?? []))
        setWatchedAt(snap.data().watchedAt ?? {})
      } else {
        setWatched(new Set())
        setWatchedAt({})
      }
    })
    return unsub
  }, [user, seriesId])

  function key(season: number, episode: number) {
    return `${season}-${episode}`
  }

  async function toggleEpisode(season: number, episode: number) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'series_progress', String(seriesId))
    const next = new Set(watched)
    const nextWatchedAt = { ...watchedAt }
    const k = key(season, episode)
    if (next.has(k)) {
      next.delete(k)
      delete nextWatchedAt[k]
    } else {
      next.add(k)
      nextWatchedAt[k] = Date.now()
    }
    await setDoc(ref, { watched: Array.from(next), watchedAt: nextWatchedAt }, { merge: true })
  }

  async function markSeason(season: number, episodeNumbers: number[], asWatched: boolean) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'series_progress', String(seriesId))
    const next = new Set(watched)
    const nextWatchedAt = { ...watchedAt }
    const now = Date.now()
    if (asWatched) {
      episodeNumbers.forEach(ep => {
        const k = key(season, ep)
        next.add(k)
        if (!nextWatchedAt[k]) nextWatchedAt[k] = now
      })
    } else {
      episodeNumbers.forEach(ep => {
        const k = key(season, ep)
        next.delete(k)
        delete nextWatchedAt[k]
      })
    }
    await setDoc(ref, { watched: Array.from(next), watchedAt: nextWatchedAt }, { merge: true })
  }

  function isWatched(season: number, episode: number) {
    return watched.has(key(season, episode))
  }

  function countWatchedInSeason(season: number, total: number) {
    let count = 0
    for (let i = 1; i <= total; i++) {
      if (watched.has(key(season, i))) count++
    }
    return count
  }

  return { isWatched, toggleEpisode, markSeason, countWatchedInSeason, watchedCount: watched.size, watchedAt }
}
