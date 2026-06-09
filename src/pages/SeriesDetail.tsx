import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSeriesDetails, getSeasonEpisodes, getBackdropUrl, getPosterUrl, getThumbUrl } from '../lib/tmdb'
import { useEpisodes } from '../hooks/useEpisodes'

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
}

function SeasonRow({
  seriesId,
  season,
}: {
  seriesId: number
  season: Season
}) {
  const [open, setOpen] = useState(false)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(false)
  const { isWatched, toggleEpisode, markSeason, countWatchedInSeason } = useEpisodes(seriesId)

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
  }

  return (
    <div className="border-b border-[#1a1a1a]">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleOpen} className="flex items-center gap-2 flex-1 text-left">
            <span className="text-white font-bold text-sm">{season.name}</span>
            <svg
              className={`w-4 h-4 text-[#555] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[#888] text-xs">{watched}/{season.episode_count}</span>
            <button
              onClick={handleMarkSeason}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                allWatched ? 'bg-[#5cb85c] border-[#5cb85c]' : 'border-[#444]'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${allWatched ? 'text-white' : 'text-[#444]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div key={ep.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-[#111]">
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
                  <p className="text-[#888] text-[11px] font-bold">
                    T{String(season.season_number).padStart(2, '0')} | E{String(ep.episode_number).padStart(2, '0')}
                  </p>
                  <p className="text-white text-sm font-medium leading-tight line-clamp-1">{ep.name}</p>
                  {ep.runtime && <p className="text-[#555] text-[11px] mt-0.5">{ep.runtime} min</p>}
                </div>

                <button
                  onClick={() => toggleEpisode(season.season_number, ep.episode_number)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${
                    isWatched(season.season_number, ep.episode_number)
                      ? 'bg-[#5cb85c] border-[#5cb85c]'
                      : 'border-[#333]'
                  }`}
                >
                  <svg
                    className={`w-3.5 h-3.5 ${isWatched(season.season_number, ep.episode_number) ? 'text-white' : 'text-[#333]'}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function SeriesDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [series, setSeries] = useState<Series | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sobre' | 'episodios'>('episodios')

  const seriesId = Number(id)

  useEffect(() => {
    setLoading(true)
    getSeriesDetails(seriesId).then(data => {
      setSeries(data)
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
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-white"
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
            className={`flex-1 py-3 text-xs font-bold tracking-wider relative transition-colors ${
              tab === t ? 'text-white' : 'text-[#555]'
            }`}
          >
            {t === 'sobre' ? 'SOBRE' : 'EPISÓDIOS'}
            {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
          </button>
        ))}
      </div>

      {tab === 'sobre' && (
        <div className="px-4 py-5">
          {series.overview
            ? <p className="text-[#aaa] text-sm leading-relaxed">{series.overview}</p>
            : <p className="text-[#555] text-sm">Sem sinopse disponível.</p>
          }
        </div>
      )}

      {tab === 'episodios' && (
        <div>
          {seasons.length === 0
            ? <p className="text-[#555] text-sm px-4 py-6">Nenhuma temporada disponível.</p>
            : seasons.map(season => (
                <SeasonRow key={season.id} seriesId={seriesId} season={season} />
              ))
          }
        </div>
      )}
    </div>
  )
}
