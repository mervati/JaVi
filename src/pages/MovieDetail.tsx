import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDetails, getWatchProviders, getBackdropUrl, getPosterUrl } from '../lib/tmdb'
import { useLibrary } from '../hooks/useLibrary'
import { StarRating } from '../components/StarRating'

interface Movie {
  id: number
  title: string
  overview: string
  backdrop_path: string | null
  poster_path: string | null
  release_date: string
  runtime: number | null
  vote_average: number
  genres: { id: number; name: string }[]
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
  const [providers, setProviders] = useState<Providers | null>(null)
  const [loading, setLoading] = useState(true)
  const { saveItem, removeItem, getItem } = useLibrary()

  const movieId = Number(id)
  const item = getItem(movieId, 'movie')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getDetails(movieId, 'movie'),
      getWatchProviders(movieId, 'movie'),
    ]).then(([details, prov]) => {
      setMovie(details)
      setProviders(prov)
      setLoading(false)
    })
  }, [movieId])

  function handleStatus(status: 'watched' | 'watchlist') {
    if (!movie) return
    if (item?.status === status) {
      removeItem(movie.id, 'movie')
      return
    }
    saveItem({
      id: movie.id,
      type: 'movie',
      title: movie.title,
      poster: movie.poster_path,
      status,
      rating: item?.rating ?? 0,
      addedAt: item?.addedAt ?? Date.now(),
    })
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
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white font-black text-2xl leading-tight mb-1">{movie.title}</h1>
          <p className="text-[#888] text-sm">
            {year}
            {movie.runtime ? ` • ${movie.runtime} min` : ''}
            {movie.vote_average > 0 ? ` • ★ ${movie.vote_average.toFixed(1)}` : ''}
          </p>
        </div>
      </div>

      <div className="flex gap-3 px-4 py-4 border-b border-[#1a1a1a]">
        <button
          onClick={() => handleStatus('watched')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
            item?.status === 'watched'
              ? 'bg-[#5cb85c] text-white'
              : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]'
          }`}
        >
          {item?.status === 'watched' ? '✓ Assistido' : 'Marcar como visto'}
        </button>
        <button
          onClick={() => handleStatus('watchlist')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
            item?.status === 'watchlist'
              ? 'bg-[#f5b730] text-black'
              : 'bg-[#1a1a1a] text-[#888] border border-[#2a2a2a]'
          }`}
        >
          {item?.status === 'watchlist' ? '★ Na lista' : 'Quero ver'}
        </button>
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

      {movie.genres?.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '12px 16px 16px', borderBottom: '1px solid #1a1a1a' }}>
          {movie.genres.map(g => (
            <span key={g.id} style={{ padding: '4px 10px', borderRadius: '999px', background: '#f5b730', color: '#000', fontSize: '11px', fontWeight: 'bold' }}>
              {g.name}
            </span>
          ))}
        </div>
      )}

      {movie.overview ? (
        <div className="px-4 py-4 border-b border-[#1a1a1a]">
          <p className="text-[#aaa] text-sm leading-relaxed">{movie.overview}</p>
        </div>
      ) : null}

      {allProviders.length > 0 && (
        <div className="px-4 py-4">
          <p className="text-[#888] text-xs font-bold mb-3 uppercase tracking-wider">Onde assistir</p>
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
    </div>
  )
}
