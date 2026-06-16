import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PillTabs } from '../components/PillTabs'
import { PosterImage } from '../components/PosterImage'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl, getDetails } from '../lib/tmdb'
import { StarRating } from '../components/StarRating'
import { RatingPrompt } from '../components/RatingPrompt'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import type { LibraryItem } from '../hooks/useLibrary'

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

interface MovieCalEntry {
  item: LibraryItem
  releaseDate: string | null
}

function MoviesCalendarioTab() {
  const { items } = useLibrary()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<MovieCalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const watchlist = items.filter(i => i.type === 'movie' && i.status === 'watchlist')
  const watchlistKey = watchlist.map(i => i.id).join(',')

  useEffect(() => {
    if (!watchlistKey) { setEntries([]); setLoading(false); return }
    setLoading(true)
    Promise.all(
      watchlist.map(async item => {
        try {
          const details = await getDetails(item.id, 'movie')
          return { item, releaseDate: details.release_date ?? null } as MovieCalEntry
        } catch {
          return { item, releaseDate: null } as MovieCalEntry
        }
      })
    ).then(results => { setEntries(results); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlistKey])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 px-8">
        <p className="text-[#555] text-sm text-center">Nenhum filme na lista "Quero ver"</p>
      </div>
    )
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const upcoming = entries
    .filter(e => e.releaseDate && new Date(e.releaseDate + 'T12:00:00') > today)
    .sort((a, b) => a.releaseDate!.localeCompare(b.releaseDate!))

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 px-8">
        <p className="text-[#555] text-sm text-center">Nenhum filme aguardando estreia</p>
      </div>
    )
  }

  const grouped: Record<string, MovieCalEntry[]> = {}
  for (const entry of upcoming) {
    const d = entry.releaseDate!
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
          {dayEntries.map(({ item }) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1a1a] active:bg-[#111] cursor-pointer"
              onClick={() => navigate(`/movie/${item.id}`)}
            >
              <div className="w-10 h-14 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                <PosterImage src={getPosterUrl(item.poster)} alt={item.title} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm line-clamp-2">{item.title}</p>
                <p className="text-[#555] text-xs mt-0.5">Estreia em breve</p>
              </div>
              <svg className="w-4 h-4 text-[#333] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  watched:   { label: 'Assistido',  color: 'text-[#5cb85c] border-[#5cb85c]' },
  watchlist: { label: 'Quero ver',  color: 'text-[#f5b730] border-[#f5b730]' },
  abandoned: { label: 'Abandonado', color: 'text-[#555] border-[#555]' },
}

function SwipeableMovieRow({ item, onRemove, isNewRelease }: { item: LibraryItem; onRemove: (item: LibraryItem) => void; isNewRelease?: boolean }) {
  const navigate = useNavigate()
  const { saveItem } = useLibrary()
  const [offsetX, setOffsetX] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const dragging = useRef(false)
  const dirRef = useRef<'h' | 'v' | null>(null)
  const THRESHOLD_LEFT = -80
  const MAX_SWIPE_LEFT = -90
  const THRESHOLD_RIGHT = 80
  const MAX_SWIPE_RIGHT = 90

  const isWatched = item.status === 'watched'
  const isAbandoned = item.status === 'abandoned'
  const isCompleted = isWatched || isAbandoned

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

  async function onTouchEnd() {
    dragging.current = false
    if (offsetX <= THRESHOLD_LEFT) {
      if (isCompleted) {
        setConfirm(true)
      } else {
        saveItem({ ...item, status: 'watched' })
        setShowRating(true)
      }
    } else if (offsetX >= THRESHOLD_RIGHT) {
      saveItem({ ...item, status: 'abandoned' })
    }
    setOffsetX(0)
  }

  return (
    <>
    {showRating && (
      <RatingPrompt
        title={item.title}
        onSave={rating => { saveItem({ ...item, status: 'watched', rating }); setShowRating(false) }}
        onSkip={() => setShowRating(false)}
      />
    )}
    <div className="relative overflow-hidden border-b border-[#1a1a1a]">
      {/* modal de confirmação — fora da camada com opacity */}
      {confirm && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(10,10,10,0.97)' }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-white text-sm font-bold text-center px-4">Remover "{item.title}" dos assistidos?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirm(false)}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #333' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => { saveItem({ ...item, status: 'watchlist' }); setConfirm(false) }}
              className="px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: '#e05555', color: '#fff' }}
            >
              Remover
            </button>
          </div>
        </div>
      )}

      {/* conteúdo com opacity quando assistido/abandonado */}
      <div style={isCompleted ? { opacity: 0.4 } : {}}>
        {/* fundos de swipe — ocultos para itens concluídos */}
        {!isCompleted && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-[#1a6ef5]">
              <FaEyeSlash className="text-white text-2xl" />
            </div>
            <div className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center ${isWatched ? 'bg-[#e53e3e]' : 'bg-[#5cb85c]'}`}>
              {isWatched ? <FaEyeSlash className="text-white text-2xl" /> : <FaEye className="text-white text-2xl" />}
            </div>
          </>
        )}

        <div
          onTouchStart={isCompleted ? undefined : onTouchStart}
          onTouchMove={isCompleted ? undefined : onTouchMove}
          onTouchEnd={isCompleted ? undefined : onTouchEnd}
          onClick={() => navigate(`/movie/${item.id}`)}
          style={{
            transform: `translateX(${offsetX}px)`,
            transition: dragging.current ? 'none' : 'transform 0.25s ease',
            background: '#0a0a0a',
            padding: '12px 20px',
          }}
          className="flex items-center gap-3"
        >
          <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0"
            style={isCompleted ? { filter: 'grayscale(1)' } : {}}>
            <PosterImage src={getPosterUrl(item.poster)} alt={item.title} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight mb-2">{item.title}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_LABEL[item.status]?.color ?? 'text-[#555] border-[#555]'}`}>
                {STATUS_LABEL[item.status]?.label ?? item.status}
              </span>
              {isNewRelease && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#e05555] text-[#e05555]">
                  Lançamento
                </span>
              )}
            </div>
            {(isWatched || isAbandoned) && (
              <div className="mt-1" onClick={e => e.stopPropagation()}>
                <StarRating
                  size="sm"
                  value={item.rating}
                  onChange={rating => saveItem({ ...item, rating })}
                />
              </div>
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
    </>
  )
}

type SortBy = 'date' | 'title' | 'rating'


function sortItems(arr: LibraryItem[], by: SortBy): LibraryItem[] {
  return [...arr].sort((a, b) => {
    if (by === 'title')  return a.title.localeCompare(b.title, 'pt-BR')
    if (by === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
    return (b.addedAt ?? 0) - (a.addedAt ?? 0)
  })
}

export function Movies() {
  const { items, removeItem } = useLibrary()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'lista' | 'calendario'>('lista')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [confirmItem, setConfirmItem] = useState<LibraryItem | null>(null)
  const [releaseDates, setReleaseDates] = useState<Record<number, string>>({})

  const watchlistMovies = items.filter(i => i.type === 'movie' && i.status === 'watchlist')
  const watchlistKey = watchlistMovies.map(i => i.id).join(',')

  useEffect(() => {
    if (!watchlistKey) { setReleaseDates({}); return }
    Promise.all(
      watchlistMovies.map(async item => {
        if (item.releaseDate) return { id: item.id, releaseDate: item.releaseDate }
        try {
          const details = await getDetails(item.id, 'movie')
          return { id: item.id, releaseDate: details.release_date ?? '' }
        } catch { return { id: item.id, releaseDate: '' } }
      })
    ).then(results => {
      const map: Record<number, string> = {}
      results.forEach(r => { if (r.releaseDate) map[r.id] = r.releaseDate })
      setReleaseDates(map)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlistKey])

  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const movies    = items.filter(i => i.type === 'movie')
  const active    = sortItems(movies.filter(i =>
    (i.status === 'watchlist' || i.status === 'watching') &&
    !(i.status === 'watchlist' && releaseDates[i.id] > today)
  ), sortBy)
  const completed = sortItems(movies.filter(i => i.status === 'watched' || i.status === 'abandoned'), sortBy)

  return (
    <div className="flex flex-col min-h-full">
      <div className="tabs-nav tabs-full sticky top-0 bg-[#0a0a0a] z-30">
        <button className={`btn ${tab === 'lista' ? 'btn-active' : ''}`} onClick={() => setTab('lista')}>
          Lista
        </button>
        <button className={`btn ${tab === 'calendario' ? 'btn-active' : ''}`} onClick={() => setTab('calendario')}>
          Calendário
        </button>
      </div>

      {tab === 'calendario' && <MoviesCalendarioTab />}

      {tab === 'lista' && (movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 py-20 px-8">
          <div className="text-5xl">🎬</div>
          <div className="text-center">
            <p className="text-white font-bold mb-1">Nenhum filme ainda</p>
            <p className="text-[#555] text-sm">Marque um filme como assistido e ele aparece aqui automaticamente</p>
          </div>
          <button onClick={() => navigate('/explorar')} className="boton-elegante boton-sm" style={{ padding: '6.6px 15.4px', fontSize: '0.85rem' }}>
            Explorar filmes
          </button>
        </div>
      ) : (
        <div>
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

          {/* Quero ver */}
          {active.length > 0 && (
            <div>
              <div style={{ padding: '20px 20px 10px 20px', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#f5b730', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  QUERO VER
                </span>
              </div>
              {active.map(item => (
                <SwipeableMovieRow
                  key={`${item.type}-${item.id}`}
                  item={item}
                  onRemove={setConfirmItem}
                  isNewRelease={
                    item.status === 'watchlist' &&
                    !!releaseDates[item.id] &&
                    releaseDates[item.id] >= thirtyDaysAgo &&
                    releaseDates[item.id] <= today
                  }
                />
              ))}
            </div>
          )}

          {/* Assistidos/Abandonados */}
          {completed.length > 0 && (
            <div style={active.length > 0 ? { marginTop: '24px' } : {}}>
              <div style={{ padding: active.length > 0 ? '16px 20px 10px 20px' : '20px 20px 10px 20px', borderTop: active.length > 0 ? '1px solid #1a1a1a' : 'none', textAlign: 'center' }}>
                <span className="boton-elegante" style={{ color: '#9c7420', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                  ASSISTIDOS
                </span>
              </div>
              {completed.map(item => (
                <SwipeableMovieRow key={`${item.type}-${item.id}`} item={item} onRemove={setConfirmItem} />
              ))}
            </div>
          )}
        </div>
      ))}

      {confirmItem && (
        <>
          <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setConfirmItem(null)} />
          <div
            className="fixed z-50 rounded-2xl flex flex-col items-center"
            style={{ background: '#0f0f0f', border: '1px solid #222', padding: '28px 24px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 48px)', maxWidth: '340px' }}
          >
            <div className="w-10 h-1 rounded-full" style={{ background: '#333', marginBottom: '20px' }} />
            <p className="text-[#888] text-xs font-bold uppercase tracking-widest mb-2">Remover da lista</p>
            <p className="text-white font-black text-lg text-center leading-tight mb-3 px-2">
              {confirmItem.title}
            </p>
            <p className="text-[#666] text-sm text-center leading-relaxed px-2" style={{ marginBottom: '20px' }}>
              Deseja remover este filme da sua lista?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 py-[14px] rounded-xl text-[15px] font-bold"
                style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a' }}
              >
                Não
              </button>
              <button
                onClick={() => { removeItem(confirmItem.id, confirmItem.type); setConfirmItem(null) }}
                className="flex-1 py-[14px] rounded-xl text-[15px] font-bold"
                style={{ background: '#f5b730', color: '#000', border: '1px solid #e6a820' }}
              >
                Sim
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
