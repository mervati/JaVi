import { useState } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl } from '../lib/tmdb'
import { StarRating } from '../components/StarRating'

type Filter = 'all' | 'watched' | 'watchlist'

export function Library() {
  const { items, saveItem, removeItem } = useLibrary()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = items.filter((i) => filter === 'all' || i.status === filter)

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex gap-2 mb-6">
        {(['all', 'watched', 'watchlist'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#e50914] text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Tudo' : f === 'watched' ? 'Assistidos' : 'Quero ver'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center mt-16">Nada aqui ainda.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {filtered.map((item) => (
          <div key={`${item.type}-${item.id}`} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800 flex flex-col">
            <div className="aspect-[2/3] bg-gray-900">
              {item.poster ? (
                <img
                  src={getPosterUrl(item.poster) ?? ''}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                  Sem capa
                </div>
              )}
            </div>
            <div className="p-3 flex flex-col gap-2 flex-1">
              <p className="text-white text-sm font-semibold leading-tight">{item.title}</p>
              <span className={`text-xs px-2 py-0.5 rounded w-fit ${
                item.status === 'watched' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
              }`}>
                {item.status === 'watched' ? 'Assistido' : 'Quero ver'}
              </span>
              {item.status === 'watched' && (
                <StarRating
                  value={item.rating}
                  onChange={(rating) => saveItem({ ...item, rating })}
                />
              )}
              <button
                onClick={() => removeItem(item.id, item.type)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors mt-auto text-left"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
