import { useState } from 'react'
import { getPosterUrl, getWatchProviders } from '../lib/tmdb'
import { useLibrary, type LibraryItem } from '../hooks/useLibrary'
import { useAuth } from '../contexts/AuthContext'
import { StarRating } from './StarRating'

interface Props {
  media: {
    id: number
    media_type: 'movie' | 'tv'
    title?: string
    name?: string
    poster_path: string | null
    overview: string
    release_date?: string
    first_air_date?: string
  }
}

export function MediaCard({ media }: Props) {
  const { user } = useAuth()
  const { saveItem, removeItem, getItem } = useLibrary()
  const [providers, setProviders] = useState<{ link: string; flatrate?: { logo_path: string; provider_name: string }[] } | null>(null)
  const [showProviders, setShowProviders] = useState(false)

  const item = getItem(media.id, media.media_type)
  const title = media.title ?? media.name ?? ''
  const year = (media.release_date ?? media.first_air_date ?? '').slice(0, 4)
  const poster = getPosterUrl(media.poster_path)

  async function toggleProviders() {
    if (!showProviders && !providers) {
      const data = await getWatchProviders(media.id, media.media_type)
      setProviders(data)
    }
    setShowProviders((v) => !v)
  }

  async function handleStatus(status: 'watched' | 'watchlist') {
    if (!user) return
    if (item?.status === status) {
      await removeItem(media.id, media.media_type)
      return
    }
    const newItem: LibraryItem = {
      id: media.id,
      type: media.media_type,
      title,
      poster: media.poster_path,
      status,
      rating: item?.rating ?? 0,
      addedAt: Date.now(),
    }
    await saveItem(newItem)
  }

  async function handleRating(rating: number) {
    if (!user || !item) return
    await saveItem({ ...item, rating })
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800 flex flex-col">
      <div className="relative aspect-[2/3] bg-gray-900">
        {poster ? (
          <img src={poster} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
            Sem capa
          </div>
        )}
        {media.media_type === 'tv' && (
          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
            Série
          </span>
        )}
        {media.media_type === 'movie' && (
          <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded">
            Filme
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-white font-semibold text-sm leading-tight">{title}</h3>
          {year && <p className="text-gray-500 text-xs mt-0.5">{year}</p>}
        </div>

        {item?.status === 'watched' && (
          <StarRating value={item.rating} onChange={handleRating} />
        )}

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => handleStatus('watched')}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
              item?.status === 'watched'
                ? 'bg-green-600 text-white'
                : 'bg-[#2a2a2a] text-gray-300 hover:bg-green-900'
            }`}
          >
            {item?.status === 'watched' ? '✓ Assistido' : 'Assistido'}
          </button>
          <button
            onClick={() => handleStatus('watchlist')}
            className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
              item?.status === 'watchlist'
                ? 'bg-yellow-600 text-white'
                : 'bg-[#2a2a2a] text-gray-300 hover:bg-yellow-900'
            }`}
          >
            {item?.status === 'watchlist' ? '★ Na lista' : 'Quero ver'}
          </button>
        </div>

        <button
          onClick={toggleProviders}
          className="text-xs text-gray-400 hover:text-white transition-colors text-left"
        >
          {showProviders ? 'Ocultar' : '▶ Onde assistir'}
        </button>

        {showProviders && (
          <div className="text-xs">
            {providers?.flatrate?.length ? (
              <div className="flex flex-wrap gap-2">
                {providers.flatrate.map((p) => (
                  <a
                    key={p.provider_name}
                    href={providers.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-300 hover:text-white"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                      alt={p.provider_name}
                      className="w-5 h-5 rounded"
                    />
                    {p.provider_name}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Não disponível no Brasil</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
