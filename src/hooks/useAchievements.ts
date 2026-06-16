import { useEffect, useRef, useState } from 'react'
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { getDetails, getSeriesDetails } from '../lib/tmdb'
import { ACHIEVEMENTS, type AchievementDef } from '../lib/achievements'
import type { LibraryItem } from './useLibrary'

function localDateStr(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcStreak(items: LibraryItem[]): number {
  const dateSet = new Set<string>()
  items.forEach(item => {
    if (item.lastWatchedAt) dateSet.add(localDateStr(item.lastWatchedAt))
    if (item.status === 'watched') dateSet.add(localDateStr(item.addedAt))
  })
  const todayTs = new Date().setHours(12, 0, 0, 0) as number
  const todayStr = localDateStr(todayTs)
  const yestStr = localDateStr(todayTs - 864e5)
  const start = dateSet.has(todayStr) ? 0 : dateSet.has(yestStr) ? 1 : null
  if (start === null) return 0
  let streak = 0
  for (let i = start; i < 365; i++) {
    if (dateSet.has(localDateStr(todayTs - i * 864e5))) streak++
    else break
  }
  return streak
}

export function useAchievements(items: LibraryItem[]) {
  const { user } = useAuth()
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [storedLoaded, setStoredLoaded] = useState(false)
  const unlockedRef = useRef<Set<string>>(new Set())
  const [newUnlock, setNewUnlock] = useState<AchievementDef | null>(null)

  useEffect(() => {
    if (!newUnlock) return
    const t = setTimeout(() => setNewUnlock(null), 5000)
    return () => clearTimeout(t)
  }, [newUnlock])

  useEffect(() => {
    if (!user) return
    return onSnapshot(collection(db, 'users', user.uid, 'achievements'), snap => {
      const ids = new Set(snap.docs.map(d => d.id))
      unlockedRef.current = ids
      setUnlockedIds(new Set(ids))
      setStoredLoaded(true)
    })
  }, [user])

  const computeKey = items.map(i => `${i.id}:${i.status}:${i.rating}`).join('|')

  useEffect(() => {
    if (!user || !items.length || !storedLoaded) return
    let cancelled = false

    const timer = setTimeout(async () => {
      if (cancelled) return
      const should = new Set<string>()

      const watched = items.filter(i => i.status === 'watched')
      const watchedMovies = watched.filter(i => i.type === 'movie')
      const watchedTv = watched.filter(i => i.type === 'tv')
      const watchlist = items.filter(i => i.status === 'watchlist')
      const ratedItems = items.filter(i => i.rating > 0)
      const consumed = items.filter(i => i.status === 'watched' || i.status === 'watching')

      if (items.length > 0) should.add('primeiros-passos')
      if (watchedTv.length >= 5) should.add('devorador-i')
      if (watchedTv.length >= 20) should.add('devorador-ii')
      if (watchedTv.length >= 50) should.add('devorador-iii')
      if (watchedMovies.length >= 50) should.add('cinefilo')
      if (calcStreak(items) >= 7) should.add('habito-diario')
      if (ratedItems.length >= 10) should.add('critico-cinema')
      if (watchlist.length >= 15) should.add('planejador')

      const timestamps = items.flatMap(i =>
        [i.lastWatchedAt, i.addedAt].filter((v): v is number => !!v)
      )

      for (const ts of timestamps) {
        const d = new Date(ts)
        const h = d.getHours()
        const dow = d.getDay()
        if (h >= 0 && h < 5) should.add('madrugador')
        if (dow === 5 && h >= 18) should.add('sextou')
        if (h >= 12 && h < 14) should.add('almoco')
      }

      // Fiel ao Domingo: 4 domingos consecutivos
      const sundaySet = new Set<number>()
      for (const ts of timestamps) {
        const d = new Date(ts)
        if (d.getDay() === 0) {
          const midnight = new Date(d)
          midnight.setHours(0, 0, 0, 0)
          sundaySet.add(midnight.getTime())
        }
      }
      if (sundaySet.size >= 4) {
        const sorted = Array.from(sundaySet).sort((a, b) => a - b)
        const WEEK = 7 * 24 * 60 * 60 * 1000
        let max = 1, cur = 1
        for (let i = 1; i < sorted.length; i++) {
          if (Math.round((sorted[i] - sorted[i - 1]) / WEEK) === 1) {
            cur++
            if (cur > max) max = cur
          } else {
            cur = 1
          }
        }
        if (max >= 4) should.add('fiel-domingo')
      }

      // TMDB-based checks
      if (consumed.length > 0 && !cancelled) {
        try {
          const details = await Promise.all(
            consumed.map(i => i.type === 'movie' ? getDetails(i.id, 'movie') : getSeriesDetails(i.id))
          )
          if (cancelled) return

          let horror = 0, romance = 0, doc = 0
          const countries = new Set<string>()

          details.forEach((d, idx) => {
            const gs: string[] = (d.genres ?? []).map((g: any) => g.name as string)
            if (gs.some(g => g === 'Terror' || g === 'Thriller')) horror++
            if (gs.includes('Romance') && gs.includes('Comédia')) romance++
            if (gs.some(g => g === 'Documentário' || g === 'História')) doc++

            const item = consumed[idx]
            const c = item.type === 'tv'
              ? d.origin_country?.[0]
              : d.production_countries?.[0]?.iso_3166_1
            if (c) countries.add(c)
          })

          if (horror >= 5) should.add('sem-medo')
          if (romance >= 5) should.add('romantico')
          if (doc >= 1) should.add('historiador')
          if (countries.size >= 5) should.add('cidadao-mundo')

          // Do Fundo do Baú: filme com ≥25 anos
          const currentYear = new Date().getFullYear()
          watchedMovies.forEach(movie => {
            const idx = consumed.findIndex(c => c.id === movie.id && c.type === 'movie')
            if (idx < 0) return
            const year = details[idx]?.release_date?.slice(0, 4)
            if (year && (currentYear - parseInt(year, 10)) >= 25) should.add('fundo-bau')
          })

        } catch {
          // TMDB indisponível — pular checks de gênero
        }
      }

      if (cancelled) return

      const newOnes = Array.from(should).filter(id => !unlockedRef.current.has(id))
      for (const id of newOnes) {
        try {
          await setDoc(doc(db, 'users', user!.uid, 'achievements', id), { unlockedAt: Date.now() })
        } catch { /* non-blocking */ }
      }

      if (!cancelled && newOnes.length > 0) {
        const def = ACHIEVEMENTS.find(a => a.id === newOnes[0])
        if (def) setNewUnlock(def)
      }
    }, 600)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [computeKey, storedLoaded])

  return {
    unlockedIds,
    newUnlock,
    clearNewUnlock: () => setNewUnlock(null),
  }
}
