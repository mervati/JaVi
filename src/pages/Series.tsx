import { useNavigate } from 'react-router-dom'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl } from '../lib/tmdb'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  watching:  { label: 'Assistindo',  color: 'text-[#4a9eff] border-[#4a9eff]' },
  watchlist: { label: 'Quero ver',   color: 'text-[#f5b730] border-[#f5b730]' },
  watched:   { label: 'Concluído',   color: 'text-[#5cb85c] border-[#5cb85c]' },
}

export function Series() {
  const { items, removeItem } = useLibrary()
  const navigate = useNavigate()
  const series = items.filter(i => i.type === 'tv')

  return (
    <div className="flex flex-col min-h-full">
      {series.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-5 py-20 px-8">
          <div className="text-5xl">📺</div>
          <div className="text-center">
            <p className="text-white font-bold mb-1">Nenhuma série ainda</p>
            <p className="text-[#555] text-sm">Marque um episódio como assistido e a série aparece aqui automaticamente</p>
          </div>
          <button onClick={() => navigate('/explorar')} className="boton-elegante">
            Explorar séries
          </button>
        </div>
      ) : (
        <div>
          {series.map(item => {
            const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.watching
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1a1a] active:bg-[#111] transition-colors"
                onClick={() => navigate(`/series/${item.id}`)}
              >
                <div className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                  {item.poster
                    ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
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
