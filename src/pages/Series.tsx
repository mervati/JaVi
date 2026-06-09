import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLibrary } from '../hooks/useLibrary'
import { useEpisodes } from '../hooks/useEpisodes'
import { getSeriesDetails, getSeasonEpisodes, getPosterUrl } from '../lib/tmdb'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import type { LibraryItem } from '../hooks/useLibrary'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  watching:  { label: 'Assistindo',  color: 'text-[#4a9eff] border-[#4a9eff]' },
  watchlist: { label: 'Quero ver',   color: 'text-[#f5b730] border-[#f5b730]' },
  watched:   { label: 'Concluído',   color: 'text-[#5cb85c] border-[#5cb85c]' },
  abandoned: { label: 'Abandonado',  color: 'text-[#555] border-[#555]' },
}

interface NextEp { season: number; episode: number; name: string }

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
    getSeriesDetails(item.id).then(data => {
      setSeasons(data.seasons?.filter((s: any) => s.season_number > 0) ?? [])
    })
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
          for (const ep of seasonCache.current[sn]) {
            if (!check(sn, ep.episode_number)) {
              if (!cancelled) {
                setNextEp({ season: sn, episode: ep.episode_number, name: ep.name })
                setReady(true)
              }
              return
            }
          }
        }
      }
      if (!cancelled) { setReady(true); setNextEp(null) }
    }

    run()
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

  async function onTouchEnd() {
    dragging.current = false
    if (offsetX <= THRESHOLD_LEFT && nextEp) {
      await toggleEpisode(nextEp.season, nextEp.episode)
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
            T{String(nextEp.season).padStart(2, '0')} | E{String(nextEp.episode).padStart(2, '0')}
          </p>
          <p className="text-[#888] text-xs leading-tight line-clamp-1 mt-0.5">{nextEp.name}</p>
        </div>

        <button
          onClick={() => toggleEpisode(nextEp.season, nextEp.episode)}
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

export function Series() {
  const { items, removeItem } = useLibrary()
  const navigate = useNavigate()
  const series = items.filter(i => i.type === 'tv')
  const watching = series.filter(i => i.status === 'watching')
  const others = series.filter(i => i.status !== 'watching')

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

      {others.length > 0 && (
        <div style={watching.length > 0 ? { marginTop: '24px' } : {}}>
          {watching.length > 0 && (
            <div style={{ padding: '16px 20px 10px 20px', borderTop: '1px solid #1a1a1a', textAlign: 'center' }}>
              <span className="boton-elegante" style={{ color: '#9c7420', fontSize: '10px', padding: '6px 16px', letterSpacing: '0.12em', display: 'inline-block' }}>
                TODAS AS SÉRIES
              </span>
            </div>
          )}
          {others.map(item => {
            const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.watching
            const isAbandoned = item.status === 'abandoned' || item.status === 'watched'
            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`flex items-center gap-3 border-b border-[#1a1a1a] active:bg-[#111] transition-colors ${isAbandoned ? 'opacity-40' : ''}`}
                style={{ padding: '12px 20px' }}
                onClick={() => navigate(`/series/${item.id}`)}
              >
                <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                  {item.poster
                    ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover grayscale" style={isAbandoned ? {} : { filter: 'none' }} />
                    : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base leading-tight mb-2">{item.title}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); removeItem(item.id, item.type) }}
                  className="p-2 text-[#333] hover:text-[#888] transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
