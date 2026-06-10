import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PillTabs } from '../components/PillTabs'
import { useLibrary } from '../hooks/useLibrary'
import { useEpisodes } from '../hooks/useEpisodes'
import { getSeriesDetails, getSeasonEpisodes, getPosterUrl } from '../lib/tmdb'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { StarRating } from '../components/StarRating'
import type { LibraryItem } from '../hooks/useLibrary'

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
  const isWatchedRef = useRef(isWatched)
  isWatchedRef.current = isWatched

  const [offsetX, setOffsetX] = useState(0)
  const startXRef = useRef(0)
  const dragging = useRef(false)
  const THRESHOLD_LEFT = -70
  const MAX_SWIPE_LEFT = -80
  const THRESHOLD_RIGHT = 70
  const MAX_SWIPE_RIGHT = 80

  useEffect(() => {
    getSeriesDetails(item.id)
      .then(data => {
        setSeasons(data.seasons?.filter((s: any) => s.season_number > 0) ?? [])
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
      if (!cancelled) { setReady(true); setNextEp(null) }
    }

    run().catch(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [seasons, watchedCount, item.id])

  function onTouchStart(e: React.TouchEvent) {
    startXRef.current = e.touches[0].clientX
    dragging.current = true
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startXRef.current
    if (dx < 0) setOffsetX(Math.max(dx, MAX_SWIPE_LEFT))
    else setOffsetX(Math.min(dx, MAX_SWIPE_RIGHT))
  }

  async function handleMarkEpisode(wasWatched: boolean) {
    if (!nextEp) return
    await toggleEpisode(nextEp.season, nextEp.episode)
    if (!wasWatched) {
      saveItem({ ...item, lastWatchedAt: Date.now() })
    }
  }

  async function onTouchEnd() {
    dragging.current = false
    if (offsetX <= THRESHOLD_LEFT && nextEp) {
      await handleMarkEpisode(false)
    } else if (offsetX >= THRESHOLD_RIGHT) {
      await saveItem({ ...item, status: 'abandoned' })
    }
    setOffsetX(0)
  }

  if (!ready) {
    return (
      <div className="flex items-center gap-3 border-b border-[#1a1a1a]" style={{ padding: '12px 20px' }}>
        <div className="w-12 h-16 bg-[#1a1a1a] rounded-lg animate-pulse flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-24" />
          <div className="h-4 bg-[#1a1a1a] rounded animate-pulse w-1/2" />
          <div className="h-3 bg-[#1a1a1a] rounded animate-pulse w-3/4" />
        </div>
      </div>
    )
  }

  if (!nextEp) return null

  const epWatched = isWatched(nextEp.season, nextEp.episode)

  return (
    <div className="relative overflow-hidden border-b border-[#1a1a1a]">
      {/* fundo esquerdo: arquivar (swipe direito) */}
      <div className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-[#1a6ef5]">
        <FaEyeSlash className="text-white text-2xl" />
      </div>
      {/* fundo direito: marcar episódio (swipe esquerdo) */}
      <div className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center ${epWatched ? 'bg-[#e53e3e]' : 'bg-[#5cb85c]'}`}>
        {epWatched ? <FaEyeSlash className="text-white text-2xl" /> : <FaEye className="text-white text-2xl" />}
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
          {item.poster
            ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
          }
        </div>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => navigate(`/series/${item.id}`)}
            className="flex items-center gap-0.5 mb-1 active:opacity-70"
          >
            <span className="text-[#aaa] text-[11px] font-bold uppercase tracking-wide">{item.title}</span>
            <span className="text-[#666] text-xs ml-0.5">›</span>
          </button>
          <p className="text-white text-sm font-black">
            T{String(nextEp.season).padStart(2, '0')} | E{String(nextEp.displayNumber ?? nextEp.episode).padStart(2, '0')}
          </p>
          <p className="text-[#888] text-xs leading-tight line-clamp-1 mt-0.5">{nextEp.name}</p>
        </div>

        <button
          onClick={() => handleMarkEpisode(epWatched)}
          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
            epWatched ? 'bg-[#5cb85c] border-[#5cb85c]' : 'border-[#333]'
          }`}
        >
          <svg className={`w-4 h-4 ${epWatched ? 'text-white' : 'text-[#333]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function SeriesRow({ item }: { item: LibraryItem }) {
  const navigate = useNavigate()
  const { saveItem, removeItem } = useLibrary()
  const [confirm, setConfirm] = useState(false)
  const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.watching
  const isCompleted = item.status === 'abandoned' || item.status === 'watched'

  return (
    <div className="relative overflow-hidden border-b border-[#1a1a1a]">
      {confirm && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(10,10,10,0.97)' }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-white text-sm font-bold text-center px-4">Remover "{item.title}" da biblioteca?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirm(false)}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => { removeItem(item.id, item.type); setConfirm(false) }}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#e05555', color: '#fff' }}
            >
              Remover
            </button>
          </div>
        </div>
      )}

      <div style={isCompleted ? { opacity: 0.4 } : {}}>
        <div
          className="flex items-center gap-3 active:bg-[#111] transition-colors"
          style={{ padding: '12px 20px' }}
          onClick={() => navigate(`/series/${item.id}`)}
        >
          <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
            {item.poster
              ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" style={isCompleted ? { filter: 'grayscale(1)' } : {}} />
              : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
            }
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
          </div>
          <button
            onClick={e => { e.stopPropagation(); setConfirm(true) }}
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

  const watching = items.filter(i => i.type === 'tv' && (i.status === 'watching' || i.status === 'watched'))
  const watchingKey = watching.map(i => i.id).join(',')

  useEffect(() => {
    if (!watchingKey) { setEntries([]); setLoading(false); return }
    setLoading(true)
    Promise.all(
      watching.map(async item => {
        try {
          const details = await getSeriesDetails(item.id)
          return { item, nextEp: details.next_episode_to_air ?? null, seriesStatus: details.status ?? '' } as CalEntry
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
  const noDate   = entries.filter(e => !e.nextEp?.air_date && e.seriesStatus !== 'Ended' && e.seriesStatus !== 'Canceled')
  const ended    = entries.filter(e => !e.nextEp?.air_date && (e.seriesStatus === 'Ended' || e.seriesStatus === 'Canceled'))

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
                {item.poster
                  ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#888] text-[11px] font-bold uppercase tracking-wide line-clamp-1 mb-0.5">{item.title}</p>
                <p className="text-white font-black text-sm">
                  T{String(nextEp!.season_number).padStart(2, '0')} | E{String(nextEp!.episode_number).padStart(2, '0')}
                </p>
                <p className="text-[#555] text-xs mt-0.5 line-clamp-1">{nextEp!.name}</p>
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
  const { items } = useLibrary()
  const navigate  = useNavigate()
  const [tab, setTab] = useState<'lista' | 'calendario'>('lista')
  const [sortBy, setSortBy] = useState<SortBy>('date')

  const series    = items.filter(i => i.type === 'tv')
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
      <div className="tabs-nav sticky top-0 bg-[#0a0a0a] z-30">
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
            <div>
              <div style={{ padding: '20px 20px 10px 20px', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#f5b730', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  ASSISTIR A SEGUIR
                </span>
              </div>
              {watching.map(item => <NextEpisodeCard key={item.id} item={item} />)}
            </div>
          )}

          {watchlist.length > 0 && (
            <div style={watching.length > 0 ? { marginTop: '24px' } : {}}>
              <div style={{ padding: watching.length > 0 ? '16px 20px 10px 20px' : '20px 20px 10px 20px', borderTop: watching.length > 0 ? '1px solid #1a1a1a' : 'none', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#f5b730', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  QUERO VER
                </span>
              </div>
              {watchlist.map(item => (
                <SeriesRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div style={watching.length > 0 || watchlist.length > 0 ? { marginTop: '24px' } : {}}>
              <div style={{ padding: '16px 20px 10px 20px', borderTop: watching.length > 0 || watchlist.length > 0 ? '1px solid #1a1a1a' : 'none', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#9c7420', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  TODAS AS SÉRIES
                </span>
              </div>
              {completed.map(item => (
                <SeriesRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}

        </>
      )}

      {tab === 'calendario' && <CalendarioTab />}
    </div>
  )
}
