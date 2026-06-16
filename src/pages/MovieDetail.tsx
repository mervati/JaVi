import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDetails, getWatchProviders, getBackdropUrl, getPosterUrl, getThumbUrl, getCredits, getSimilar, getVideos } from '../lib/tmdb'
import { PosterImage } from '../components/PosterImage'
import { useLibrary } from '../hooks/useLibrary'
import { StarRating } from '../components/StarRating'
import { RatingPrompt } from '../components/RatingPrompt'
import { TrailerPlayer } from '../components/TrailerPlayer'

interface Movie {
  id: number
  title: string
  original_title: string
  overview: string
  backdrop_path: string | null
  poster_path: string | null
  release_date: string
  runtime: number | null
  vote_average: number
  genres: { id: number; name: string }[]
  production_countries: { iso_3166_1: string; name: string }[]
}

interface Provider {
  provider_id: number
  provider_name: string
  logo_path: string
}

interface Providers {
  flatrate?: Provider[]
  rent?: Provider[]
  buy?: Provider[]
}

export function MovieDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [enTitle, setEnTitle] = useState<string>('')
  const [providers, setProviders] = useState<Providers | null>(null)
  const [cast, setCast] = useState<any[]>([])
  const [similar, setSimilar] = useState<any[]>([])
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [tab, setTab] = useState<'sobre' | 'elenco'>('sobre')
  const [loading, setLoading] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [showStickyBack, setShowStickyBack] = useState(false)
  const { saveItem, removeItem, getItem } = useLibrary()

  useEffect(() => {
    const container = document.querySelector('main')
    if (!container) return
    const onScroll = () => setShowStickyBack(container.scrollTop > 180)
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [])

  const movieId = Number(id)
  const item = getItem(movieId, 'movie')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getDetails(movieId, 'movie'),
      getWatchProviders(movieId, 'movie'),
      getCredits(movieId, 'movie'),
      getSimilar(movieId, 'movie'),
      getVideos(movieId, 'movie'),
    ]).then(([details, prov, credits, sim, videos]) => {
      setMovie(details)
      setProviders(prov)
      setCast(credits.slice(0, 20))
      setSimilar(sim.slice(0, 20))
      const yt = (videos as any[]).filter((v: any) => v.site === 'YouTube')
      const t = yt.find((v: any) => v.type === 'Trailer' && v.official)
        ?? yt.find((v: any) => v.type === 'Trailer')
        ?? yt.find((v: any) => v.type === 'Teaser')
        ?? yt[0]
      setTrailerKey(t?.key ?? null)
      setLoading(false)
      getDetails(movieId, 'movie', 'en-US').then(en => setEnTitle(en.title ?? ''))
    })
  }, [movieId])

  function handleAbandon() {
    if (!movie || !item) return
    saveItem({ ...item, status: 'abandoned' })
  }

  function handleStatus(status: 'watched' | 'watchlist') {
    if (!movie) return
    if (item?.status === status) {
      removeItem(movie.id, 'movie')
      return
    }
    const wasWatched = item?.status === 'watched'
    saveItem({
      id: movie.id,
      type: 'movie',
      title: movie.title,
      poster: movie.poster_path,
      status,
      rating: item?.rating ?? 0,
      addedAt: item?.addedAt ?? Date.now(),
      releaseDate: movie.release_date || undefined,
    })
    if (status === 'watched' && !wasWatched) setShowRating(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!movie) return null

  const year = movie.release_date?.slice(0, 4)
  const allProviders = [
    ...(providers?.flatrate ?? []),
    ...(providers?.rent ?? []),
    ...(providers?.buy ?? []),
  ].filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      <div className="relative">
        <div className="h-64 bg-[#111] overflow-hidden">
          {(movie.backdrop_path || movie.poster_path) && (
            <img
              src={getBackdropUrl(movie.backdrop_path) ?? getPosterUrl(movie.poster_path) ?? ''}
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
          <h1 className="text-white font-black text-2xl leading-tight mb-0.5">{enTitle || movie.title}</h1>
          {enTitle && enTitle !== movie.title && (
            <p className="text-[#aaa] text-sm mb-1">{movie.title}</p>
          )}
          <p className="text-[#888] text-sm">
            {movie.production_countries?.[0]?.name ?? ''}
            {year ? `${movie.production_countries?.[0] ? ' • ' : ''}${year}` : ''}
            {movie.runtime ? ` • ${movie.runtime} min` : ''}
            {movie.vote_average > 0 ? ` • ★ ${movie.vote_average.toFixed(1)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-4 border-b border-[#1a1a1a]">
        <button
          onClick={() => handleStatus('watched')}
          className={`flex-1 py-4 rounded-xl text-base font-extrabold transition-colors ${
            item?.status === 'watched'
              ? 'bg-[#5cb85c] text-white'
              : 'bg-[#1a1a1a] text-[#888] border-2 border-[#2a2a2a]'
          }`}
        >
          {item?.status === 'watched' ? '✓ Assistido' : 'Marcar como visto'}
        </button>
        <button
          onClick={() => handleStatus('watchlist')}
          className={`flex-1 py-4 rounded-xl text-base font-extrabold transition-colors ${
            item?.status === 'watchlist'
              ? 'bg-[#f5b730] text-black'
              : 'bg-[#1a1a1a] text-[#888] border-2 border-[#2a2a2a]'
          }`}
        >
          {item?.status === 'watchlist' ? '★ Na lista' : 'Quero ver'}
        </button>
        {(item?.status === 'watching' || item?.status === 'watchlist') && (
          <button
            onClick={handleAbandon}
            className="py-4 rounded-xl text-sm font-bold"
            style={{ background: '#e05555', color: '#fff', border: '1px solid #c04444', paddingLeft: '5px', paddingRight: '5px' }}
          >
            Abandonar
          </button>
        )}
      </div>

      {item?.status === 'watched' && (
        <div className="px-4 py-4 border-b border-[#1a1a1a] flex items-center gap-3">
          <span className="text-[#888] text-sm">Sua nota:</span>
          <StarRating
            value={item.rating}
            onChange={rating => saveItem({ ...item, rating })}
          />
        </div>
      )}

      <div className="flex items-center border-b border-[#1a1a1a] sticky top-0 bg-[#0a0a0a] z-10">
        {showStickyBack && (
          <button onClick={() => navigate(-1)} className="flex items-center justify-center w-11 h-11 flex-shrink-0 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {(['sobre', 'elenco'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn flex-1 ${tab === t ? 'btn-active' : ''}`}
          >
            {t === 'sobre' ? 'SOBRE' : 'ELENCO'}
          </button>
        ))}
      </div>

      {tab === 'sobre' && (
        <div className="px-4 py-5">
          {movie.genres?.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {movie.genres.map(g => (
                <span key={g.id} style={{ padding: '4px 10px', borderRadius: '999px', background: '#f5b730', color: '#000', fontSize: '11px', fontWeight: 'bold' }}>
                  {g.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-white text-xs font-bold uppercase tracking-wider mb-2">Sinopse</p>
          {movie.overview ? (
            <p className="text-[#aaa] text-sm leading-relaxed" style={{ marginBottom: '24px' }}>{movie.overview}</p>
          ) : <p className="text-[#555] text-sm" style={{ marginBottom: '24px' }}>Sem sinopse disponível.</p>}

          {allProviders.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <p className="text-white text-xs font-bold mb-3 uppercase tracking-wider">Onde assistir</p>
              <div className="flex gap-3 flex-wrap">
                {allProviders.map(p => (
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
          )}

          {trailerKey && (
            <div style={{ marginBottom: '32px' }}>
              <p className="text-white text-xs font-bold uppercase tracking-wider mb-3">Trailer</p>
              <TrailerPlayer videoKey={trailerKey} title={movie.title} />
            </div>
          )}

          {similar.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p className="text-white text-xs font-bold mb-3 uppercase tracking-wider">Títulos similares</p>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', marginLeft: '-16px', marginRight: '-16px', paddingLeft: '16px', paddingRight: '16px' }}>
                {similar.map(item => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/movie/${item.id}`)}
                    className="flex-shrink-0 cursor-pointer active:opacity-70"
                  >
                    <div className="w-24 h-36 bg-[#1a1a1a] rounded-xl overflow-hidden mb-1.5">
                      <PosterImage src={getPosterUrl(item.poster_path)} alt={item.title} />
                    </div>
                    <p className="text-white text-[11px] font-medium w-24 line-clamp-2 leading-tight">{item.title}</p>
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

      {showRating && movie && (
        <RatingPrompt
          title={movie.title}
          onSave={rating => {
            if (item) saveItem({ ...item, rating })
            setShowRating(false)
          }}
          onSkip={() => setShowRating(false)}
        />
      )}

      {tab === 'elenco' && cast.length > 0 && (
        <div className="px-4 py-5">
          <div className="flex gap-4 flex-wrap">
            {cast.map(actor => (
              <div key={actor.id} className="w-20 flex flex-col items-center gap-1.5">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#1a1a1a]">
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
  )
}
