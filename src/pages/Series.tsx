import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PillTabs } from '../components/PillTabs'
import { UndoToast } from '../components/UndoToast'
import { PosterImage } from '../components/PosterImage'
import { EpisodeCheckbox } from '../components/EpisodeCheckbox'
import { useRegisterRefresh } from '../contexts/RefreshContext'
import { useLibrary } from '../hooks/useLibrary'
import { useEpisodes } from '../hooks/useEpisodes'
import { getSeriesDetails, getSeasonEpisodes, getPosterUrl } from '../lib/tmdb'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { StarRating } from '../components/StarRating'
import type { LibraryItem } from '../hooks/useLibrary'

function ProgressBar({ watched, total, status }: { watched: number; total: number; status?: string }) {
  if (total === 0) return null
  const pct = status === 'watched' && watched === 0
    ? 100
    : Math.min(100, Math.round((watched / total) * 100))
  if (pct === 0) return null
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct === 100 ? '#5cb85c' : '#f5b730',
          borderRadius: '999px',
          transition: 'width 0.4s ease',
        }} />
      </div>
      <p style={{ color: '#444', fontSize: '10px', marginTop: '3px' }}>
        {watched} / {total} ep. · {pct}%
      </p>
    </div>
  )
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  watching:  { label: 'Assistindo',  color: 'text-[#4a9eff] border-[#4a9eff]' },
  watchlist: { label: 'Quero ver',   color: 'text-[#f5b730] border-[#f5b730]' },
  watched:   { label: 'Concluído',   color: 'text-[#5cb85c] border-[#5cb85c]' },
  abandoned: { label: 'Abandonado',  color: 'text-[#555] border-[#555]' },
}

interface NextEp { season: number; episode: number; name: string; displayNumber?: number }

function NextEpisodeCard({ item }: { item: LibraryItem }) {
  const navigate = useNavigate()
  const { saveItem } = useLibrary()
  const { isWatched, toggleEpisode, watchedCount } = useEpisodes(item.id)
  const [nextEp, setNextEp] = useState<NextEp | null>(null)
  const [seasons, setSeasons] = useState<any[]>([])
  const [ready, setReady] = useState(false)
  const seasonCache = useRef<Record<number, any[]>>({})
  const [frozenNextEp, setFrozenNextEp] = useState<NextEp | null>(null)
  const frozenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isWatchedRef = useRef(isWatched)
  isWatchedRef.current = isWatched

  const [offsetX, setOffsetX] = useState(0)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const dragging = useRef(false)
  const dirRef = useRef<'h' | 'v' | null>(null)
  const THRESHOLD_LEFT = -80
  const MAX_SWIPE_LEFT = -90
  const THRESHOLD_RIGHT = 80
  const MAX_SWIPE_RIGHT = 90

  useEffect(() => {
    getSeriesDetails(item.id)
      .then(data => {
        const filtered = data.seasons?.filter((s: any) => s.season_number > 0) ?? []
        setSeasons(filtered)
        if (filtered.length === 0) setReady(true)
      })
      .catch(() => setReady(true))
  }, [item.id])

  useEffect(() => {
    if (!seasons.length) return
    let cancelled = false
    const check = isWatchedRef.current

    async function run() {
      for (const season of seasons) {
        const sn = season.season_number
        let allWatched = true
        for (let ep = 1; ep <= season.episode_count; ep++) {
          if (!check(sn, ep)) { allWatched = false; break }
        }
        if (!allWatched) {
          if (!seasonCache.current[sn]) {
            const data = await getSeasonEpisodes(item.id, sn)
            if (cancelled) return
            seasonCache.current[sn] = data.episodes ?? []
          }
          const eps: any[] = seasonCache.current[sn]
          for (let i = 0; i < eps.length; i++) {
            const ep = eps[i]
            const idx = i + 1
            if (!check(sn, idx)) {
              if (!cancelled) {
                setNextEp({ season: sn, episode: idx, name: ep.name, displayNumber: ep.episode_number })
                setReady(true)
              }
              return
            }
          }
        }
      }
      if (!cancelled) {
        setReady(true)
        setNextEp(null)
        if (item.status !== 'watched') saveItem({ ...item, status: 'watched' })
      }
    }

    run().catch(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [seasons, watchedCount, item.id])

  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    startYRef.current = e.touches[0].clientY
    dragging.current = true
    dirRef.current = null
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startXRef.current
    const dy = e.touches[0].clientY - startYRef.current
    if (dirRef.current === null) {
      if (Math.abs(dx) > Math.abs(dy) + 4) dirRef.current = 'h'
      else if (Math.abs(dy) > Math.abs(dx) + 4) { dirRef.current = 'v'; dragging.current = false; return }
      else return
    }
    if (dirRef.current !== 'h') return
    if (dx < 0) setOffsetX(Math.max(dx, MAX_SWIPE_LEFT))
    else setOffsetX(Math.min(dx, MAX_SWIPE_RIGHT))
  }

  useEffect(() => {
    return () => { if (frozenTimerRef.current) clearTimeout(frozenTimerRef.current) }
  }, [])

  async function handleMarkEpisode(wasWatched: boolean) {
    if (!nextEp || frozenNextEp) return
    if (!wasWatched) {
      const snap = nextEp
      setFrozenNextEp(snap)
      if (frozenTimerRef.current) clearTimeout(frozenTimerRef.current)
      frozenTimerRef.current = setTimeout(() => {
        setFrozenNextEp(null)
        frozenTimerRef.current = null
      }, 1000)
    }
    await toggleEpisode(nextEp.season, nextEp.episode)
    if (!wasWatched) saveItem({ ...item, lastWatchedAt: Date.now() })
  }

  async function onTouchEnd() {
    dragging.current = false
    if (offsetX <= THRESHOLD_LEFT && nextEp && !frozenNextEp) {
      await handleMarkEpisode(false)
    } else if (offsetX >= THRESHOLD_RIGHT) {
      await saveItem({ ...item, status: 'abandoned' })
    }
    setOffsetX(0)
  }

  const displayEp = frozenNextEp ?? nextEp

  if (!ready || !displayEp) return null

  const epWatched = isWatched(displayEp.season, displayEp.episode)
  const showChecked = frozenNextEp != null ? true : epWatched

  return (
    <div className="relative overflow-hidden border-b border-[#1a1a1a]">
      {/* fundo esquerdo: arquivar (swipe direito) */}
      <div className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-[#1a6ef5]">
        <FaEyeSlash className="text-white text-2xl" />
      </div>
      {/* fundo direito: marcar episódio (swipe esquerdo) */}
      <div className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center ${showChecked ? 'bg-[#e53e3e]' : 'bg-[#5cb85c]'}`}>
        {showChecked ? <FaEyeSlash className="text-white text-2xl" /> : <FaEye className="text-white text-2xl" />}
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging.current ? 'none' : 'transform 0.25s ease',
          background: '#0a0a0a',
          padding: '12px 20px',
        }}
        className="flex items-center gap-3"
      >
        <div
          className="w-12 h-16 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0 cursor-pointer active:opacity-70"
          onClick={() => navigate(`/series/${item.id}`)}
        >
          <PosterImage src={getPosterUrl(item.poster)} alt={item.title} />
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/series/${item.id}`)}
            className="flex items-center gap-0.5 mb-1 active:opacity-70"
          >
            <span className="text-[#aaa] text-[11px] font-bold uppercase tracking-wide">{item.title}</span>
            <span className="text-[#666] text-xs ml-0.5">›</span>
          </button>
          {(() => {
            const total = seasons.reduce((s: number, season: any) => s + (season.episode_count ?? 0), 0)
            const remaining = total > 0 ? total - watchedCount : 0
            return (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-white text-sm font-black">
                    T{String(displayEp.season).padStart(2, '0')} | E{String(displayEp.displayNumber ?? displayEp.episode).padStart(2, '0')}
                  </span>
                  {remaining > 0 && (
                    <span style={{ color: '#fff', fontSize: '11px', fontWeight: 500 }}>
                      +{remaining}
                    </span>
                  )}
                </div>
                <p className="text-[#888] text-xs leading-tight line-clamp-1 mt-0.5">{displayEp.name}</p>
                <ProgressBar watched={watchedCount} total={total} />
              </>
            )
          })()}
        </div>

        <EpisodeCheckbox checked={showChecked} onChange={() => handleMarkEpisode(epWatched)} size="sm" disabled={frozenNextEp != null} />
      </div>
    </div>
  )
}

function SeriesRow({ item, onRemove }: { item: LibraryItem; onRemove: (item: LibraryItem) => void }) {
  const navigate = useNavigate()
  const { saveItem } = useLibrary()
  const { watchedCount } = useEpisodes(item.id)
  const [totalEpisodes, setTotalEpisodes] = useState(0)
  const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.watching
  const isCompleted = item.status === 'abandoned' || item.status === 'watched'

  useEffect(() => {
    if (item.status === 'watchlist') return
    getSeriesDetails(item.id)
      .then(d => setTotalEpisodes(d.number_of_episodes ?? 0))
      .catch(() => {})
  }, [item.id, item.status])

  return (
    <div className="relative overflow-hidden border-b border-[#1a1a1a]">
      <div style={isCompleted ? { opacity: 0.4 } : {}}>
        <div
          className="flex items-center gap-3 active:bg-[#111] transition-colors"
          style={{ padding: '12px 20px' }}
          onClick={() => navigate(`/series/${item.id}`)}
        >
          <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
            <PosterImage src={getPosterUrl(item.poster)} alt={item.title} style={isCompleted ? { filter: 'grayscale(1)' } : undefined} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight mb-2">{item.title}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${status.color}`}>
              {status.label}
            </span>
            {isCompleted && (
              <div className="mt-1" onClick={e => e.stopPropagation()}>
                <StarRating size="sm" value={item.rating} onChange={rating => saveItem({ ...item, rating })} />
              </div>
            )}
            {item.status !== 'watchlist' && totalEpisodes > 0 && (
              <ProgressBar watched={watchedCount} total={totalEpisodes} status={item.status} />
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onRemove(item) }}
            className="p-2 text-[#333] flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

interface CalEntry {
  item: LibraryItem
  nextEp: { air_date: string; season_number: number; episode_number: number; name: string } | null
  seriesStatus: string
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date(); today.setHours(12, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff <= 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff <= 6) {
    const wd = d.toLocaleDateString('pt-BR', { weekday: 'long' })
    return wd.charAt(0).toUpperCase() + wd.slice(1)
  }
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
}

function seriesStatusLabel(status: string): string {
  if (status === 'Ended') return 'Encerrada'
  if (status === 'Canceled') return 'Cancelada'
  if (status === 'In Production') return 'Em produção'
  return 'Renovada, sem data de estreia'
}

function CalendarioTab() {
  const { items } = useLibrary()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<CalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const watching = items.filter(i => i.type === 'tv' && (i.status === 'watching' || i.status === 'watched' || i.status === 'watchlist'))
  const watchingKey = watching.map(i => i.id).join(',')

  useEffect(() => {
    if (!watchingKey) { setEntries([]); setLoading(false); return }
    setLoading(true)
    Promise.all(
      watching.map(async item => {
        try {
          const details = await getSeriesDetails(item.id)
          // Para watchlist: usa first_air_date se for futura como "próximo episódio"
          if (item.status === 'watchlist') {
            const today = new Date().toISOString().slice(0, 10)
            const airDate = details.next_episode_to_air?.air_date ?? details.first_air_date ?? null
            const isFuture = airDate && airDate > today
            return {
              item,
              nextEp: isFuture ? { air_date: airDate, season_number: 1, episode_number: 1, name: 'Estreia' } : null,
              seriesStatus: details.status ?? '',
            } as CalEntry
          }
          const today = new Date().toISOString().slice(0, 10)
          const last = details.last_episode_to_air
          const next = details.next_episode_to_air
          const ep = last?.air_date === today ? last : (next ?? null)
          return { item, nextEp: ep, seriesStatus: details.status ?? '' } as CalEntry
        } catch {
          return { item, nextEp: null, seriesStatus: '' } as CalEntry
        }
      })
    ).then(results => { setEntries(results); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchingKey])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (watching.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 px-8">
        <p className="text-[#555] text-sm text-center">Nenhuma série na biblioteca</p>
      </div>
    )
  }

  const withDate = [...entries.filter(e => e.nextEp?.air_date)]
    .sort((a, b) => a.nextEp!.air_date.localeCompare(b.nextEp!.air_date))
  const noDate   = entries.filter(e => !e.nextEp?.air_date && e.item.status !== 'watchlist' && e.seriesStatus !== 'Ended' && e.seriesStatus !== 'Canceled')
  const ended    = entries.filter(e => !e.nextEp?.air_date && e.item.status !== 'watchlist' && (e.seriesStatus === 'Ended' || e.seriesStatus === 'Canceled'))

  const grouped: Record<string, CalEntry[]> = {}
  for (const entry of withDate) {
    const d = entry.nextEp!.air_date
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(entry)
  }

  return (
    <div style={{ paddingTop: '12px' }}>
      {Object.entries(grouped).map(([date, dayEntries]) => (
        <div key={date} style={{ marginBottom: '8px' }}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#1a1a1a]" style={{ background: '#0d0d0d' }}>
            <span className="text-[#f5b730] font-bold text-sm">{formatDateHeader(date)}</span>
            <span className="text-white text-xs">
              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          </div>
          {dayEntries.map(({ item, nextEp }) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1a1a] active:bg-[#111] cursor-pointer"
              onClick={() => navigate(`/series/${item.id}`)}
            >
              <div className="w-10 h-14 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                <PosterImage src={getPosterUrl(item.poster)} alt={item.title} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#888] text-[11px] font-bold uppercase tracking-wide line-clamp-1 mb-0.5">{item.title}</p>
                {nextEp!.name === 'Estreia' ? (
                  <p className="text-[#f5b730] font-black text-sm">Estreia</p>
                ) : (
                  <>
                    <p className="text-white font-black text-sm">
                      T{String(nextEp!.season_number).padStart(2, '0')} | E{String(nextEp!.episode_number).padStart(2, '0')}
                    </p>
                    <p className="text-[#555] text-xs mt-0.5 line-clamp-1">{nextEp!.name}</p>
                  </>
                )}
              </div>
              <svg className="w-4 h-4 text-[#333] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      ))}

      {noDate.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#1a1a1a]" style={{ background: '#0d0d0d' }}>
            <span className="text-[#444] font-bold text-sm">Sem estreia prevista</span>
          </div>
          {noDate.map(({ item, seriesStatus }) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1a1a] active:bg-[#111] cursor-pointer"
              onClick={() => navigate(`/series/${item.id}`)}
            >
              <div className="w-10 h-14 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0" style={{ filter: 'grayscale(1)', opacity: 0.5 }}>
                {item.poster
                  ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#555] text-sm font-bold line-clamp-1">{item.title}</p>
                <p className="text-[#333] text-xs mt-0.5">{seriesStatusLabel(seriesStatus)}</p>
              </div>
              <svg className="w-4 h-4 text-[#222] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {ended.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#1a1a1a]" style={{ background: '#0d0d0d' }}>
            <span className="text-[#444] font-bold text-sm">Encerrada</span>
          </div>
          {ended.map(({ item }) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1a1a] active:bg-[#111] cursor-pointer"
              onClick={() => navigate(`/series/${item.id}`)}
            >
              <div className="w-10 h-14 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0" style={{ filter: 'grayscale(1)', opacity: 0.4 }}>
                {item.poster
                  ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#444] text-sm font-bold line-clamp-1">{item.title}</p>
                <p className="text-[#333] text-xs mt-0.5">Encerrada</p>
              </div>
              <svg className="w-4 h-4 text-[#222] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type SortBy = 'date' | 'title' | 'rating'


function sortItems(arr: LibraryItem[], by: SortBy): LibraryItem[] {
  return [...arr].sort((a, b) => {
    if (by === 'title')  return a.title.localeCompare(b.title, 'pt-BR')
    if (by === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
    return (b.lastWatchedAt ?? b.addedAt ?? 0) - (a.lastWatchedAt ?? a.addedAt ?? 0)
  })
}

export function Series() {
  const { items, removeItem } = useLibrary()
  const navigate  = useNavigate()
  const [tab, setTab] = useState<'lista' | 'calendario'>('lista')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [calRefreshKey, setCalRefreshKey] = useState(0)

  useRegisterRefresh(async () => setCalRefreshKey(k => k + 1))
  const [pendingRemove, setPendingRemove] = useState<LibraryItem | null>(null)
  const pendingRemoveRef = useRef<LibraryItem | null>(null)

  function requestRemove(item: LibraryItem) {
    if (pendingRemoveRef.current) {
      removeItem(pendingRemoveRef.current.id, pendingRemoveRef.current.type)
    }
    pendingRemoveRef.current = item
    setPendingRemove(item)
  }

  function undoRemove() {
    pendingRemoveRef.current = null
    setPendingRemove(null)
  }

  function confirmRemove() {
    if (pendingRemoveRef.current) {
      removeItem(pendingRemoveRef.current.id, pendingRemoveRef.current.type)
      pendingRemoveRef.current = null
      setPendingRemove(null)
    }
  }

  const series    = items.filter(i => i.type === 'tv' && i.id !== pendingRemove?.id)
  const watching  = sortItems(series.filter(i => i.status === 'watching'), sortBy)
  const watchlist = sortItems(series.filter(i => i.status === 'watchlist'), sortBy)
  const completed = sortItems(series.filter(i => i.status === 'watched' || i.status === 'abandoned'), sortBy)

  if (series.length === 0) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="flex flex-col items-center justify-center flex-1 gap-5 py-20 px-8">
          <div className="text-5xl">📺</div>
          <div className="text-center">
            <p className="text-white font-bold mb-1">Nenhuma série ainda</p>
            <p className="text-[#555] text-sm">Marque um episódio como assistido e a série aparece aqui automaticamente</p>
          </div>
          <button
            onClick={() => navigate('/explorar')}
            className="boton-elegante boton-sm"
            style={{ padding: '6.6px 15.4px', fontSize: '0.85rem' }}
          >
            Explorar séries
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* sub-tabs */}
      <div className="tabs-nav tabs-full sticky top-0 bg-[#0a0a0a] z-30">
        <button className={`btn ${tab === 'lista' ? 'btn-active' : ''}`} onClick={() => setTab('lista')}>
          Lista
        </button>
        <button className={`btn ${tab === 'calendario' ? 'btn-active' : ''}`} onClick={() => setTab('calendario')}>
          Calendário
        </button>
      </div>

      {tab === 'lista' && (
        <>
          {/* barra de ordenação */}
          <div className="flex items-center justify-end px-5 py-2.5 border-b border-[#1a1a1a]">
            <PillTabs
              options={[
                { value: 'date'   as SortBy, label: 'Recentes' },
                { value: 'title'  as SortBy, label: 'A-Z'      },
                { value: 'rating' as SortBy, label: 'Nota'     },
              ]}
              value={sortBy}
              onChange={setSortBy}
              size="sm"
            />
          </div>

          {watching.length > 0 && (
            <div className="nec-section">
              <div className="nec-header" style={{ padding: '20px 20px 10px 20px', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#f5b730', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  ASSISTIR A SEGUIR
                </span>
              </div>
              {watching.map(item => <NextEpisodeCard key={item.id} item={item} />)}
            </div>
          )}

          {watchlist.length > 0 && (
            <div className="series-section">
              <div style={{ padding: '20px 20px 10px 20px', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#f5b730', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  QUERO VER
                </span>
              </div>
              {watchlist.map(item => (
                <SeriesRow key={`${item.type}-${item.id}`} item={item} onRemove={requestRemove} />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="series-section">
              <div style={{ padding: '20px 20px 10px 20px', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#9c7420', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  TODAS AS SÉRIES
                </span>
              </div>
              {completed.map(item => (
                <SeriesRow key={`${item.type}-${item.id}`} item={item} onRemove={requestRemove} />
              ))}
            </div>
          )}

        </>
      )}

      {tab === 'calendario' && <CalendarioTab key={calRefreshKey} />}

      {pendingRemove && (
        <UndoToast
          key={pendingRemove.id}
          title={pendingRemove.title}
          onUndo={undoRemove}
          onExpire={confirmRemove}
        />
      )}
    </div>
  )
}
