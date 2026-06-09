import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeriesDetails, getSeasonEpisodes, getBackdropUrl, getPosterUrl, getThumbUrl, getCredits } from '../lib/tmdb'
import { useEpisodes } from '../hooks/useEpisodes'
import { useLibrary } from '../hooks/useLibrary'
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
}: {
  ep: Episode
  seasonNumber: number
  watched: boolean
  onTap: () => void
}) {
  const [offsetX, setOffsetX] = useState(0)
  const startX = useRef(0)
  const dragging = useRef(false)
  const THRESHOLD = -70
  const MAX_SWIPE = -80

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    dragging.current = true
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging.current) return
    const dx = e.touches[0].clientX - startX.current
    if (dx < 0) setOffsetX(Math.max(dx, MAX_SWIPE))
  }

  function onTouchEnd() {
    dragging.current = false
    if (offsetX <= THRESHOLD) onTap()
    setOffsetX(0)
  }

  return (
    <div className="relative overflow-hidden border-t border-[#111]">
      <div className={`absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center ${watched ? 'bg-[#e53e3e]' : 'bg-[#5cb85c]'}`}>
        {watched
          ? <FaEyeSlash className="text-white text-2xl" />
          : <FaEye className="text-white text-2xl" />
        }
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: dragging.current ? 'none' : 'transform 0.25s ease',
          background: '#0a0a0a',
        }}
        className="flex items-center gap-3 px-5 py-3"
      >
        <div className="w-20 h-12 bg-[#1a1a1a] rounded overflow-hidden flex-shrink-0">
          {ep.still_path
            ? <img src={getThumbUrl(ep.still_path) ?? ''} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center">
                <svg className="w-4 h-4 text-[#333]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[#888] text-xs font-bold">
            T{String(seasonNumber).padStart(2, '0')} | E{String(ep.episode_number).padStart(2, '0')}
          </p>
          <p className="text-white text-base font-medium leading-tight line-clamp-1">{ep.name}</p>
          {ep.runtime && <p className="text-[#555] text-xs mt-0.5">{ep.runtime} min</p>}
        </div>

        <button
          onClick={onTap}
          className={`w-11 h-11 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
            watched ? 'bg-[#5cb85c] border-[#5cb85c]' : 'border-[#333]'
          }`}
        >
          <svg
            className={`w-5 h-5 ${watched ? 'text-white' : 'text-[#333]'}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
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
  const [pending, setPending] = useState<PendingEp | null>(null)
  const { isWatched, toggleEpisode, markSeason, countWatchedInSeason } = useEpisodes(seriesId)
  const neverAskKey = `javi_noask_${seriesId}`
  const neverAsk = localStorage.getItem(neverAskKey) === 'true'

  const watched = countWatchedInSeason(season.season_number, season.episode_count)
  const allWatched = watched === season.episode_count && season.episode_count > 0
  const progress = season.episode_count > 0 ? (watched / season.episode_count) * 100 : 0

  async function handleOpen() {
    if (!open && episodes.length === 0) {
      setLoading(true)
      const data = await getSeasonEpisodes(seriesId, season.season_number)
      setEpisodes(data.episodes ?? [])
      setLoading(false)
    }
    setOpen(v => !v)
  }

  async function handleMarkSeason() {
    const eps = episodes.length > 0
      ? episodes.map(e => e.episode_number)
      : Array.from({ length: season.episode_count }, (_, i) => i + 1)
    await markSeason(season.season_number, eps, !allWatched)
    if (!allWatched) onEpisodeWatched()
  }

  async function handleEpisodeTap(ep: Episode) {
    const alreadyWatched = isWatched(season.season_number, ep.episode_number)

    if (alreadyWatched) {
      await toggleEpisode(season.season_number, ep.episode_number)
      return
    }

    const prevUnwatched = Array.from(
      { length: ep.episode_number - 1 },
      (_, i) => i + 1
    ).filter(n => !isWatched(season.season_number, n))

    if (prevUnwatched.length > 0 && !neverAsk) {
      setPending({ season: season.season_number, episode: ep.episode_number, prevUnwatched })
    } else {
      await toggleEpisode(season.season_number, ep.episode_number)
      onEpisodeWatched()
    }
  }

  async function handleMarkAll() {
    if (!pending) return
    const all = [...pending.prevUnwatched, pending.episode]
    await markSeason(pending.season, all, true)
    setPending(null)
    onEpisodeWatched()
  }

  async function handleJustThis() {
    if (!pending) return
    await toggleEpisode(pending.season, pending.episode)
    setPending(null)
    onEpisodeWatched()
  }

  async function handleNever() {
    if (!pending) return
    localStorage.setItem(neverAskKey, 'true')
    await toggleEpisode(pending.season, pending.episode)
    setPending(null)
    onEpisodeWatched()
  }

  return (
    <>
      {pending && (
        <ConfirmPreviousModal
          onMarkAll={handleMarkAll}
          onJustThis={handleJustThis}
          onNever={handleNever}
        />
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
              <button
                onClick={handleMarkSeason}
                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                  allWatched ? 'bg-[#5cb85c] border-[#5cb85c]' : 'border-[#444]'
                }`}
              >
                <svg className={`w-5 h-5 ${allWatched ? 'text-white' : 'text-[#444]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
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
              episodes.map(ep => (
                <SwipeableEpisode
                  key={ep.id}
                  ep={ep}
                  seasonNumber={season.season_number}
                  watched={isWatched(season.season_number, ep.episode_number)}
                  onTap={() => handleEpisodeTap(ep)}
                />
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
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sobre' | 'episodios'>('episodios')
  const { saveItem, getItem } = useLibrary()

  const seriesId = Number(id)
  const { countWatchedInSeason, watchedCount } = useEpisodes(seriesId)

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
    const newStatus = allComplete ? 'watched' : 'watching'
    if (existing.status !== newStatus) {
      saveItem({ ...existing, status: newStatus })
    }
  }, [watchedCount, series])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getSeriesDetails(seriesId),
      getCredits(seriesId, 'tv'),
    ]).then(([data, credits]) => {
      setSeries(data)
      setCast(credits.slice(0, 20))
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
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
          {series.overview
            ? <p className="text-[#aaa] text-sm leading-relaxed">{series.overview}</p>
            : <p className="text-[#555] text-sm">Sem sinopse disponível.</p>
          }

          {cast.length > 0 && (
            <div className="mt-6">
              <p className="text-white font-bold text-sm mb-3">Elenco</p>
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
