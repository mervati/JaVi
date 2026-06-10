import { useNavigate, useParams } from 'react-router-dom'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl } from '../lib/tmdb'
import { PosterImage } from '../components/PosterImage'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  watching:  { label: 'Assistindo',  color: 'text-[#4a9eff] border-[#4a9eff]' },
  watched:   { label: 'Assistidos',  color: 'text-[#5cb85c] border-[#5cb85c]' },
  watchlist: { label: 'Quero ver',   color: 'text-[#f5b730] border-[#f5b730]' },
  abandoned: { label: 'Abandonados', color: 'text-[#555] border-[#555]' },
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  movie: { label: 'FILME',  color: 'text-[#4a9eff] border-[#4a9eff]' },
  tv:    { label: 'SÉRIE',  color: 'text-[#a78bfa] border-[#a78bfa]' },
}

export function StatusList() {
  const { status = '' } = useParams<{ status: string }>()
  const navigate = useNavigate()
  const { items } = useLibrary()

  const config = STATUS_CONFIG[status]
  const filtered = [...items.filter(i => i.status === status)]
    .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))

  const isGrayed = status === 'abandoned'

  return (
    <div className="flex flex-col" style={{ height: '100svh', background: '#0a0a0a' }}>
      {/* header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 bg-[#0a0a0a] border-b border-[#1a1a1a]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: '14px' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full active:bg-[#1a1a1a]"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <p className="text-white font-black text-lg leading-tight">{config?.label ?? status}</p>
          <p className="text-[#555] text-xs">{filtered.length} {filtered.length === 1 ? 'item' : 'itens'}</p>
        </div>
      </div>

      {/* lista */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-8">
            <p className="text-[#555] text-sm text-center">Nenhum item nesta lista ainda</p>
          </div>
        ) : (
          filtered.map(item => {
            const typeConf = TYPE_LABEL[item.type]
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 px-5 py-3 border-b border-[#1a1a1a] active:bg-[#111] cursor-pointer"
                style={isGrayed ? { opacity: 0.5 } : {}}
                onClick={() => navigate(item.type === 'tv' ? `/series/${item.id}` : `/movie/${item.id}`)}
              >
                <div
                  className="w-14 h-20 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0"
                  style={isGrayed ? { filter: 'grayscale(1)' } : {}}
                >
                  <PosterImage src={getPosterUrl(item.poster)} alt={item.title} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base leading-tight mb-2 line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${typeConf.color}`}>
                      {typeConf.label}
                    </span>
                    {item.rating > 0 && (
                      <span className="text-[#f5b730] text-xs font-bold">★ {item.rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>

                <svg className="w-4 h-4 text-[#333] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
