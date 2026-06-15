import { useNavigate } from 'react-router-dom'
import { getPosterUrl } from '../lib/tmdb'
import { PosterImage } from './PosterImage'
import { useLibrary, type LibraryItem } from '../hooks/useLibrary'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  media: {
    id: number
    media_type: 'movie' | 'tv'
    title?: string
    name?: string
    original_title?: string
    original_name?: string
    original_language?: string
    poster_path: string | null
    overview: string
    release_date?: string
    first_air_date?: string
  }
}

export function MediaCard({ media }: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { saveItem, removeItem, getItem } = useLibrary()

  const item = getItem(media.id, media.media_type)
  const ptbrTitle = media.title ?? media.name ?? ''
  const title = ptbrTitle
  const originalTitle = media.original_title ?? media.original_name ?? ''
  const isEnglishOrigin = media.original_language === 'en' || media.original_language === 'pt'
  const displayTitle = isEnglishOrigin ? (originalTitle || ptbrTitle) : ptbrTitle
  const subtitle = isEnglishOrigin && originalTitle !== ptbrTitle ? ptbrTitle : ''
  const year = (media.release_date ?? media.first_air_date ?? '').slice(0, 4)
  const poster = getPosterUrl(media.poster_path)
  const isWatched = item?.status === 'watched'
  const isWatchlist = item?.status === 'watchlist'

  async function handleWatched() {
    if (!user) return
    if (isWatched) { await removeItem(media.id, media.media_type); return }
    const newItem: LibraryItem = {
      id: media.id, type: media.media_type, title,
      poster: media.poster_path, status: 'watched',
      rating: item?.rating ?? 0, addedAt: Date.now(),
    }
    await saveItem(newItem)
  }

  async function handleWatchlist() {
    if (!user) return
    if (isWatchlist) { await removeItem(media.id, media.media_type); return }
    const newItem: LibraryItem = {
      id: media.id, type: media.media_type, title,
      poster: media.poster_path, status: 'watchlist',
      rating: 0, addedAt: Date.now(),
    }
    await saveItem(newItem)
  }

  function handleRowTap() {
    if (media.media_type === 'tv') {
      navigate(`/series/${media.id}`)
    } else {
      navigate(`/movie/${media.id}`)
    }
  }


  return (
    <div className="border-b border-[#1a1a1a]">
      <div className="flex items-center gap-3 px-4 py-3 active:bg-[#111] transition-colors" onClick={handleRowTap}>
        <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
          <PosterImage src={poster} alt={title} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              media.media_type === 'tv'
                ? 'border-[#4a9eff] text-[#4a9eff]'
                : 'border-[#888] text-[#888]'
            }`}>
              {media.media_type === 'tv' ? 'SÉRIE' : 'FILME'}
            </span>
            {year && <span className="text-[#555] text-xs">{year}</span>}
          </div>
          <p className="text-white font-bold text-sm leading-tight line-clamp-2">{displayTitle}</p>
          {subtitle && <p className="text-[#666] text-xs leading-tight line-clamp-1 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleWatched() }}
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
              isWatched ? 'bg-[#5cb85c] border-[#5cb85c]' : 'border-[#444] bg-transparent'
            }`}
          >
            <svg className={`w-4 h-4 ${isWatched ? 'text-white' : 'text-[#444]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleWatchlist() }}
            className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all active:scale-90 ${
              isWatchlist ? 'bg-[#f5b730] border-[#f5b730]' : 'border-[#f5b730] bg-transparent'
            }`}
          >
            <svg className={`w-3.5 h-3.5 ${isWatchlist ? 'text-black' : 'text-[#f5b730]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isWatchlist
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              }
            </svg>
          </button>
        </div>
      </div>

    </div>
  )
}
