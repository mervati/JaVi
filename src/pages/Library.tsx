import { useState } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl } from '../lib/tmdb'
import { StarRating } from '../components/StarRating'
import { useNavigate } from 'react-router-dom'

type Tab = 'watched' | 'watchlist'

export function Library() {
  const { items, saveItem, removeItem } = useLibrary()
  const [tab, setTab] = useState<Tab>('watched')
  const navigate = useNavigate()

  const filtered = items.filter(i => i.status === tab)
  const watchedCount = items.filter(i => i.status === 'watched').length
  const watchlistCount = items.filter(i => i.status === 'watchlist').length

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-[53px] bg-[#0a0a0a] z-30 border-b border-[#1a1a1a]">
        <div className="flex">
          <button
            onClick={() => setTab('watched')}
            className={`flex-1 py-3 text-xs font-bold tracking-wider transition-colors relative ${
              tab === 'watched' ? 'text-white' : 'text-[#555]'
            }`}
          >
            ASSISTIDOS {watchedCount > 0 && <span className="ml-1 text-[#f5b730]">{watchedCount}</span>}
            {tab === 'watched' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
          </button>
          <button
            onClick={() => setTab('watchlist')}
            className={`flex-1 py-3 text-xs font-bold tracking-wider transition-colors relative ${
              tab === 'watchlist' ? 'text-white' : 'text-[#555]'
            }`}
          >
            QUERO VER {watchlistCount > 0 && <span className="ml-1 text-[#f5b730]">{watchlistCount}</span>}
            {tab === 'watchlist' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 py-20 px-8">
          <div className="text-5xl">{tab === 'watched' ? '🎬' : '🍿'}</div>
          <div className="text-center">
            <p className="text-white font-bold mb-1">
              {tab === 'watched' ? 'Nada assistido ainda' : 'Lista vazia'}
            </p>
            <p className="text-[#555] text-sm">
              {tab === 'watched'
                ? 'Marque filmes e séries que você já assistiu'
                : 'Adicione títulos que você quer assistir'
              }
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-[#f5b730] text-black font-bold text-sm px-6 py-3 rounded-full uppercase tracking-wide"
          >
            Buscar títulos
          </button>
        </div>
      ) : (
        <div>
          {filtered.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
              <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                {item.poster
                  ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    item.type === 'tv' ? 'border-[#4a9eff] text-[#4a9eff]' : 'border-[#888] text-[#888]'
                  }`}>
                    {item.type === 'tv' ? 'SÉRIE' : 'FILME'}
                  </span>
                </div>
                <p className="text-white font-bold text-sm leading-tight mb-2">{item.title}</p>
                {item.status === 'watched' && (
                  <StarRating
                    size="sm"
                    value={item.rating}
                    onChange={(rating) => saveItem({ ...item, rating })}
                  />
                )}
              </div>

              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => removeItem(item.id, item.type)}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
                    item.status === 'watched'
                      ? 'bg-[#5cb85c] border-[#5cb85c]'
                      : 'bg-[#f5b730] border-[#f5b730]'
                  }`}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => removeItem(item.id, item.type)}
                  className="text-[#333] text-[10px] font-medium hover:text-[#888] transition-colors"
                >
                  remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
