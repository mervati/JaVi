import { useEffect, useRef, useState } from 'react'
import { fireSeriesConfetti } from '../lib/confetti'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeriesDetails, getSeasonEpisodes, getBackdropUrl, getPosterUrl, getThumbUrl, getCredits, getWatchProviders, getSimilar, getVideos } from '../lib/tmdb'
import { PosterImage } from '../components/PosterImage'
import { EpisodeCheckbox } from '../components/EpisodeCheckbox'
import { useEpisodes } from '../hooks/useEpisodes'
import { useLibrary } from '../hooks/useLibrary'
import { RatingPrompt } from '../components/RatingPrompt'
import { TrailerPlayer } from '../components/TrailerPlayer'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

interface Episode {
  id: number
  episode_number: number
  name: string
  still_path: string | null
  runtime: number | null
}

interface Season {
  id: number
  season_number: number
  name: string
  episode_count: number
  poster_path: string | null
}

interface Series {
  id: number
  name: string
  overview: string
  backdrop_path: string | null
  poster_path: string | null
  first_air_date: string
  last_air_date: string
  status: string
  seasons: Season[]
  number_of_seasons: number
  genres: { id: number; name: string }[]
  vote_average: number
}

interface PendingEp {
  season: number
  episode: number
  prevUnwatched: number[]
}

function ConfirmPreviousModal({
  onMarkAll,
  onJustThis,
  onNever,
}: {
  onMarkAll: () => void
  onJustThis: () => void
  onNever: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-12">
      <div className="absolute inset-0 bg-black/75" onClick={onJustThis} />
      <div className="relative w-[72%] bg-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 pt-7 pb-6 text-center">
          <p className="text-white font-bold text-xl leading-snug mb-3">
            Marcar episódios anteriores?
          </p>
          <p className="text-[#aaa] text-sm leading-relaxed">
            Você deseja marcar todos os episódios anteriores como assistidos?
          </p>
        </div>

        <div className="border-t border-[#3a3a3a]">
          <button
            onClick={onMarkAll}
            className="w-full py-5 text-[#4a9eff] font-semibold text-lg active:bg-[#333] transition-colors"
          >
            Sim
          </button>
        </div>

        <div className="border-t border-[#3a3a3a]">
          <button
            onClick={onJustThis}
            className="w-full py-5 text-[#4a9eff] font-semibold text-lg active:bg-[#333] transition-colors"
          >
            Não
          </button>
        </div>

        <div className="border-t border-[#3a3a3a]">
          <button
            onClick={onNever}
            className="w-full py-5 text-[#4a9eff] font-semibold text-lg active:bg-[#333] transition-colors"
          >
            Nunca para esta série
          </button>
        </div>
      </div>
    </div>
  )
}

function SwipeableEpisode({
  ep,
  seasonNumber,
  watched,
  onTap,
  onLongPress,
  selectionMode,
  selected,
  onSelect,
}: {
  ep: Episode
  seasonNumber: number
  watched: boolean
  onTap: () => void
  onLongPress: () => void
  selectionMode: boolean
  selected: boolean
  onSelect: () => void
}) {
  const [offsetX, setOffsetX] = useState(0)
  const startX = useRef(0)
  const startY = useRef(0)
  const dragging = useRef(false)
  const dir = useRef<'h' | 'v' | null>(null)
  const THRESHOLD = -80
  const MAX_SWIPE = -90
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    dragging.current = true
    dir.current = null
    longPressFired.current = false
    if (!selectionMode) {
      longPressTimer.current = setTimeout(() => {
        longPressFired.current = true
        dragging.current = false
        setOffsetX(0)
        onLongPress()
      }, 500)
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current
    if (longPressTimer.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (selectionMode) return
    if (dir.current === null) {
      if (Math.abs(dx) > Math.abs(dy) + 4) dir.current = 'h'
      else if (Math.abs(dy) > Math.abs(dx) + 4) { dir.current = 'v'; dragging.current = false; return }
      else return
    }
    if (dir.current !== 'h') return
    if (dx < 0) setOffsetX(Math.max(dx, MAX_SWIPE))
  }

  function onTouchEnd() {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    if (longPressFired.current) { dragging.current = false; return }
    dragging.current = false
    if (selectionMode) {
      setOffsetX(0)
      onSelect()
      return
    }
    if (offsetX <= THRESHOLD) onTap()
    setOffsetX(0)
  }

  return (
    <div className="relative overflow-hidden border-t border-[#111]">
      {!selectionMode && (
        <div className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center ${watched ? 'bg-[#e53e3e]' : 'bg-[#5cb85c]'}`}>
          {watched
            ? <FaEyeSlash className="text-white text-2xl" />
            : <FaEye className="text-white text-2xl" />
          }
        </div>
      )}

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: selectionMode ? 'none' : `translateX(${offsetX}px)`,
          transition: (selectionMode || dragging.current) ? 'none' : 'transform 0.25s ease',
          background: selectionMode && selected ? '#1a1500' : '#0a0a0a',
        }}
        className="flex items-center gap-3 px-5 py-3"
      >
        <div className="w-20 h-12 bg-[#1a1a1a] rounded overflow-hidden flex-shrink-0">
          <PosterImage src={getThumbUrl(ep.still_path)} alt="" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[#888] text-xs font-bold">
            T{String(seasonNumber).padStart(2, '0')} | E{String(ep.episode_number).padStart(2, '0')}
          </p>
          <p className="text-white text-base font-medium leading-tight line-clamp-1">{ep.name}</p>
          {ep.runtime && <p className="text-[#555] text-xs mt-0.5">{ep.runtime} min</p>}
        </div>

        {selectionMode ? (
          <div style={{
            position: 'relative',
            height: '1.6em',
            width: '1.6em',
            fontSize: '26px',
            borderRadius: '50%',
            flexShrink: 0,
            background: selected
              ? 'linear-gradient(144deg, #c98000, #f5b730 50%, #ffd55a)'
              : '#ffeded38',
            opacity: selected ? 0.9 : 0.4,
            transition: 'all 0.2s ease',
          }}>
            <div style={{
              position: 'absolute',
              left: '0.61em',
              top: '0.43em',
              width: '0.25em',
              height: '0.5em',
              border: `solid ${selected ? '#fff' : 'rgba(255,255,255,0.45)'}`,
              borderWidth: '0 0.15em 0.15em 0',
              transform: 'rotate(45deg)',
              transition: 'border-color 0.2s ease',
            }} />
          </div>
        ) : (
          <EpisodeCheckbox checked={watched} onChange={onTap} />
        )}
      </div>
    </div>
  )
}

function SeasonRow({
  seriesId,
  season,
  onEpisodeWatched,
}: {
  seriesId: number
  season: Season
  onEpisodeWatched: () => void
}) {
  const [open, setOpen] = useState(false)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)
  const [pending, setPending] = useState<PendingEp | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedEps, setSelectedEps] = useState<Set<number>>(new Set())
  const { isWatched, toggleEpisode, markSeason, countWatchedInSeason } = useEpisodes(seriesId)
  const neverAskKey = `javi_noask_${seriesId}`
  const neverAsk = localStorage.getItem(neverAskKey) === 'true'
  const epRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current) }
  }, [])

  function handleCancelSelection() {
    setSelectionMode(false)
    setSelectedEps(new Set())
  }

  function handleLongPress(episodeIdx: number) {
    setSelectionMode(true)
    setSelectedEps(new Set([episodeIdx]))
  }

  function handleSelect(episodeIdx: number) {
    setSelectedEps(prev => {
      const next = new Set(prev)
      if (next.has(episodeIdx)) next.delete(episodeIdx)
      else next.add(episodeIdx)
      return next
    })
  }

  async function handleConfirmSelection() {
    if (selectedEps.size === 0) { handleCancelSelection(); return }
    const epList = [...selectedEps]
    const allSelectedWatched = epList.every(idx => isWatched(season.season_number, idx))
    await markSeason(season.season_number, epList, !allSelectedWatched)
    setSelectionMode(false)
    setSelectedEps(new Set())
    onEpisodeWatched()
  }

  const watched = countWatchedInSeason(season.season_number, season.episode_count)
  const allWatched = watched === season.episode_count && season.episode_count > 0
  const progress = season.episode_count > 0 ? (watched / season.episode_count) * 100 : 0

  function scheduleScrollToNext(epIdx: number) {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      epRefs.current.get(epIdx + 1)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      scrollTimerRef.current = null
    }, 1000)
  }

  async function handleOpen() {
    if (open && selectionMode) handleCancelSelection()
    if (!open && episodes.length === 0) {
      setLoading(true)
      const data = await getSeasonEpisodes(seriesId, season.season_number)
      setEpisodes(data.episodes ?? [])
      setLoading(false)
    }
    setOpen(v => !v)
  }

  async function handleMarkSeason() {
    if (marking) return
    setMarking(true)
    try {
      // usa sempre índice sequencial 1..N — consistente com countWatchedInSeason
      const eps = Array.from({ length: season.episode_count }, (_, i) => i + 1)
      const wasAllWatched = allWatched
      await markSeason(season.season_number, eps, !wasAllWatched)
      if (!wasAllWatched) onEpisodeWatched()
    } finally {
      setMarking(false)
    }
  }

  // episodeIdx é a posição sequencial (1-based) no array da temporada
  // independente do ep.episode_number do TMDB (que pode ser absoluto)
  async function handleEpisodeTap(_ep: Episode, episodeIdx: number) {
    const alreadyWatched = isWatched(season.season_number, episodeIdx)

    if (alreadyWatched) {
      await toggleEpisode(season.season_number, episodeIdx)
      return
    }

    const prevUnwatched = Array.from(
      { length: episodeIdx - 1 },
      (_, i) => i + 1
    ).filter(n => !isWatched(season.season_number, n))

    if (prevUnwatched.length > 0 && !neverAsk) {
      setPending({ season: season.season_number, episode: episodeIdx, prevUnwatched })
    } else {
      await toggleEpisode(season.season_number, episodeIdx)
      onEpisodeWatched()
      scheduleScrollToNext(episodeIdx)
    }
  }

  async function handleMarkAll() {
    if (!pending) return
    const all = [...pending.prevUnwatched, pending.episode]
    const lastIdx = pending.episode
    await markSeason(pending.season, all, true)
    setPending(null)
    onEpisodeWatched()
    scheduleScrollToNext(lastIdx)
  }

  async function handleJustThis() {
    if (!pending) return
    const epIdx = pending.episode
    await toggleEpisode(pending.season, pending.episode)
    setPending(null)
    onEpisodeWatched()
    scheduleScrollToNext(epIdx)
  }

  async function handleNever() {
    if (!pending) return
    localStorage.setItem(neverAskKey, 'true')
    const epIdx = pending.episode
    await toggleEpisode(pending.season, pending.episode)
    setPending(null)
    onEpisodeWatched()
    scheduleScrollToNext(epIdx)
  }

  const selectedAllWatched = selectedEps.size > 0 && [...selectedEps].every(idx => isWatched(season.season_number, idx))

  return (
    <>
      {pending && (
        <ConfirmPreviousModal
          onMarkAll={handleMarkAll}
          onJustThis={handleJustThis}
          onNever={handleNever}
        />
      )}

      {selectionMode && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4"
          style={{
            background: '#111',
            borderTop: '1px solid #2a2a2a',
            paddingTop: '12px',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 70px + 12px)',
          }}
        >
          <button
            onClick={handleCancelSelection}
            className="flex-1 py-3 rounded-xl text-sm font-bold"
            style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmSelection}
            className="flex-1 py-3 rounded-xl text-sm font-bold"
            style={{
              background: selectedEps.size > 0 ? '#f5b730' : '#222',
              color: selectedEps.size > 0 ? '#000' : '#555',
              border: '1px solid #2a2a2a',
              transition: 'all 0.15s',
            }}
          >
            {selectedEps.size === 0
              ? 'Selecionar episódios'
              : selectedAllWatched
                ? `Desmarcar ${selectedEps.size}`
                : `Marcar ${selectedEps.size} como assistidos`
            }
          </button>
        </div>
      )}

      <div className="border-b border-[#1a1a1a]">
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handleOpen} className="flex items-center gap-3 flex-1 text-left">
              <span className="text-white font-bold text-lg">{season.name}</span>
              <svg
                className={`w-5 h-5 text-[#555] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-[#888] text-sm">{watched}/{season.episode_count}</span>
              <EpisodeCheckbox checked={allWatched} onChange={handleMarkSeason} disabled={marking || selectionMode} />
            </div>
          </div>

          {watched > 0 && (
            <div className="h-0.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f5b730] rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {open && (
          <div>
            {loading ? (
              <div className="px-4 py-6 flex justify-center">
                <div className="w-5 h-5 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              episodes.map((ep, idx) => (
                <div key={ep.id} ref={el => { if (el) epRefs.current.set(idx + 1, el); else epRefs.current.delete(idx + 1) }}>
                  <SwipeableEpisode
                    ep={ep}
                    seasonNumber={season.season_number}
                    watched={isWatched(season.season_number, idx + 1)}
                    onTap={() => handleEpisodeTap(ep, idx + 1)}
                    onLongPress={() => handleLongPress(idx + 1)}
                    selectionMode={selectionMode}
                    selected={selectedEps.has(idx + 1)}
                    onSelect={() => handleSelect(idx + 1)}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}

export function SeriesDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [series, setSeries] = useState<Series | null>(null)
  const [cast, setCast] = useState<any[]>([])
  const [providers, setProviders] = useState<any>(null)
  const [similar, setSimilar] = useState<any[]>([])
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sobre' | 'episodios'>('episodios')
  const [showRating, setShowRating] = useState(false)
  const { saveItem, getItem } = useLibrary()

  const seriesId = Number(id)
  const { countWatchedInSeason, watchedCount } = useEpisodes(seriesId)
  const prevAllComplete = useRef<boolean | null>(null)

  function handleEpisodeWatched() {
    if (!series) return
    const existing = getItem(series.id, 'tv')
    if (!existing) {
      saveItem({
        id: series.id,
        type: 'tv',
        title: series.name,
        poster: series.poster_path,
        status: 'watching',
        rating: 0,
        addedAt: Date.now(),
      })
    }
  }

  useEffect(() => {
    if (!series) return
    const existing = getItem(series.id, 'tv')
    if (!existing) return
    const seasons = series.seasons.filter(s => s.season_number > 0 && s.episode_count > 0)
    if (seasons.length === 0) return
    const allComplete = seasons.every(s =>
      countWatchedInSeason(s.season_number, s.episode_count) === s.episode_count
    )

    if (allComplete && prevAllComplete.current === false) {
      fireSeriesConfetti()
    }
    prevAllComplete.current = allComplete

    const newStatus = allComplete ? 'watched' : 'watching'
    if (existing.status !== newStatus) {
      saveItem({ ...existing, status: newStatus })
      if (newStatus === 'watched') setShowRating(true)
    }
  }, [watchedCount, series])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getSeriesDetails(seriesId),
      getCredits(seriesId, 'tv'),
      getWatchProviders(seriesId, 'tv'),
      getSimilar(seriesId, 'tv'),
      getVideos(seriesId, 'tv'),
    ]).then(([data, credits, prov, sim, videos]) => {
      setSeries(data)
      setCast(credits.slice(0, 20))
      setProviders(prov)
      setSimilar(sim.slice(0, 20))
      const yt = (videos as any[]).filter((v: any) => v.site === 'YouTube')
      const t = yt.find((v: any) => v.type === 'Trailer' && v.official)
        ?? yt.find((v: any) => v.type === 'Trailer')
        ?? yt.find((v: any) => v.type === 'Teaser')
        ?? yt[0]
      setTrailerKey(t?.key ?? null)
      setLoading(false)
    })
  }, [seriesId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!series) return null

  const seasons = (series.seasons ?? []).filter(s => s.season_number > 0)
  const startYear = series.first_air_date?.slice(0, 4)
  const endYear = series.status === 'Ended' ? series.last_air_date?.slice(0, 4) : null

  const existingItem = getItem(seriesId, 'tv')

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {showRating && (
        <RatingPrompt
          title={series.name}
          onSave={rating => {
            if (existingItem) saveItem({ ...existingItem, rating })
            setShowRating(false)
          }}
          onSkip={() => setShowRating(false)}
        />
      )}
      <div className="relative">
        <div className="h-64 bg-[#111] overflow-hidden">
          {(series.backdrop_path || series.poster_path) && (
            <img
              src={getBackdropUrl(series.backdrop_path) ?? getPosterUrl(series.poster_path) ?? ''}
              alt=""
              className="w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 w-10 h-10 flex items-center justify-center text-white"
          style={{ top: 'calc(env(safe-area-inset-top) + 10px)' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white font-black text-2xl leading-tight mb-1">{series.name}</h1>
          <p className="text-[#888] text-sm">
            {series.number_of_seasons} temporada{series.number_of_seasons !== 1 ? 's' : ''}
            {startYear && ` • ${startYear}${endYear && endYear !== startYear ? `–${endYear}` : endYear ? '' : '–'}`}
            {series.status === 'Ended' ? ' • Encerrada' : ' • Em andamento'}
            {series.vote_average > 0 ? ` • ★ ${series.vote_average.toFixed(1)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex border-b border-[#1a1a1a] sticky top-0 bg-[#0a0a0a] z-10">
        {(['sobre', 'episodios'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn flex-1 ${tab === t ? 'btn-active' : ''}`}
          >
            {t === 'sobre' ? 'SOBRE' : 'EPISÓDIOS'}
          </button>
        ))}
      </div>

      {tab === 'sobre' && (
        <div className="px-4 py-5">
          {series.genres?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '16px' }}>
              {series.genres.map(g => (
                <span key={g.id} style={{ padding: '4px 10px', borderRadius: '999px', background: '#f5b730', color: '#000', fontSize: '11px', fontWeight: 'bold' }}>
                  {g.name}
                </span>
              ))}
            </div>
          )}
          <p className="text-white text-xs font-bold uppercase tracking-wider mb-2">Sinopse</p>
          {series.overview
            ? <p className="text-[#aaa] text-sm leading-relaxed mb-5">{series.overview}</p>
            : <p className="text-[#555] text-sm mb-5">Sem sinopse disponível.</p>
          }

          {providers && (() => {
            const all = [
              ...(providers.flatrate ?? []),
              ...(providers.rent ?? []),
              ...(providers.buy ?? []),
            ].filter((p: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.provider_id === p.provider_id) === i)
            return all.length > 0 ? (
              <div style={{ marginTop: '28px', marginBottom: '32px' }}>
                <p className="text-white text-xs font-bold mb-3 uppercase tracking-wider">Onde assistir</p>
                <div className="flex gap-3 flex-wrap">
                  {all.map((p: any) => (
                    <div key={p.provider_id} className="flex flex-col items-center gap-1">
                      <img
                        src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                        alt={p.provider_name}
                        className="w-10 h-10 rounded-lg"
                      />
                      <span className="text-[9px] text-[#555] text-center max-w-[48px] leading-tight">{p.provider_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          })()}

          {cast.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <p className="text-white text-xs font-bold mb-3 uppercase tracking-wider">Elenco</p>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', marginLeft: '-16px', marginRight: '-16px', paddingLeft: '16px', paddingRight: '16px' }}>
                {cast.map(actor => (
                  <div key={actor.id} className="flex-shrink-0 w-20 flex flex-col items-center gap-1.5">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1a1a1a] flex-shrink-0">
                      {actor.profile_path
                        ? <img src={getThumbUrl(actor.profile_path) ?? ''} alt={actor.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[#555] text-xl font-bold">
                            {actor.name?.[0] ?? '?'}
                          </div>
                      }
                    </div>
                    <p className="text-white text-[10px] font-bold text-center leading-tight line-clamp-2">{actor.name}</p>
                    <p className="text-[#888] text-[10px] text-center leading-tight line-clamp-2">{actor.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trailerKey && (
            <div style={{ marginBottom: '32px' }}>
              <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Trailer</p>
              <TrailerPlayer videoKey={trailerKey} title={series.name} />
            </div>
          )}

          {similar.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p className="text-white text-xs font-bold mb-3 uppercase tracking-wider">Títulos similares</p>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', marginLeft: '-16px', marginRight: '-16px', paddingLeft: '16px', paddingRight: '16px' }}>
                {similar.map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/series/${item.id}`)}
                    className="flex-shrink-0 cursor-pointer active:opacity-70"
                  >
                    <div className="w-24 h-36 bg-[#1a1a1a] rounded-xl overflow-hidden mb-1.5">
                      <PosterImage src={getPosterUrl(item.poster_path)} alt={item.name} />
                    </div>
                    <p className="text-white text-[11px] font-medium w-24 line-clamp-2 leading-tight">{item.name}</p>
                    {item.vote_average > 0 && (
                      <p className="text-[#f5b730] text-[10px] font-bold mt-0.5">★ {item.vote_average.toFixed(1)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'episodios' && (
        <div>
          {seasons.length === 0
            ? <p className="text-[#555] text-sm px-4 py-6">Nenhuma temporada disponível.</p>
            : seasons.map(season => (
                <SeasonRow key={season.id} seriesId={seriesId} season={season} onEpisodeWatched={handleEpisodeWatched} />
              ))
          }
        </div>
      )}
    </div>
  )
}
