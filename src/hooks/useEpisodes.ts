import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

export function useEpisodes(seriesId: number) {
  const { user } = useAuth()
  const [watched, setWatched] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user || !seriesId) return
    const ref = doc(db, 'users', user.uid, 'series_progress', String(seriesId))
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setWatched(new Set(snap.data().watched ?? []))
      } else {
        setWatched(new Set())
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
    const k = key(season, episode)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    await setDoc(ref, { watched: Array.from(next) }, { merge: true })
  }

  async function markSeason(season: number, episodeNumbers: number[], asWatched: boolean) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'series_progress', String(seriesId))
    const next = new Set(watched)
    episodeNumbers.forEach(ep => {
      const k = key(season, ep)
      if (asWatched) next.add(k)
      else next.delete(k)
    })
    await setDoc(ref, { watched: Array.from(next) }, { merge: true })
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

  return { isWatched, toggleEpisode, markSeason, countWatchedInSeason, watchedCount: watched.size }
}
