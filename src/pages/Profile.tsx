import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl } from '../lib/tmdb'
import type { LibraryItem } from '../hooks/useLibrary'

function SeriesSection({ title, items, emptyMsg }: { title: string; items: LibraryItem[]; emptyMsg: string }) {
  const navigate = useNavigate()

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-white font-bold text-base">{title}</p>
        <span className="text-[#555] text-xs">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-[#444] text-sm px-4">{emptyMsg}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
          {items.map(item => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => item.type === 'tv' ? navigate(`/series/${item.id}`) : navigate(`/movie/${item.id}`)}
              className="flex-shrink-0 cursor-pointer active:opacity-70 transition-opacity"
            >
              <div className="w-24 h-36 bg-[#1a1a1a] rounded-xl overflow-hidden mb-1">
                {item.poster
                  ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
                }
              </div>
              <p className="text-white text-xs font-medium w-24 line-clamp-2 leading-tight">{item.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Profile() {
  const { user, logout } = useAuth()
  const { items } = useLibrary()

  const watched   = items.filter(i => i.status === 'watched')
  const watchlist = items.filter(i => i.status === 'watchlist')
  const watching  = items.filter(i => i.status === 'watching')
  const abandoned = items.filter(i => i.status === 'abandoned')
  const rated     = watched.filter(i => i.rating > 0)
  const avgRating = rated.length
    ? (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1)
    : null
  const completedCount = watched.length

  return (
    <div className="py-6">
      <div className="flex items-center gap-4 mb-8 px-4">
        {user?.photoURL
          ? <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full" />
          : <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#555] text-2xl font-bold">
              {user?.displayName?.[0] ?? '?'}
            </div>
        }
        <div>
          <p className="text-white font-bold text-lg">{user?.displayName}</p>
          <p className="text-[#555] text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2 px-4">
        <div className="bg-[#111] rounded-xl p-3 text-center">
          <p className="text-white font-black text-xl">{watching.length}</p>
          <p className="text-[#555] text-[10px] mt-1">Assistindo</p>
        </div>
        <div className="bg-[#111] rounded-xl p-3 text-center">
          <p className="text-white font-black text-xl">{completedCount}</p>
          <p className="text-[#555] text-[10px] mt-1">Assistidos</p>
        </div>
        <div className="bg-[#111] rounded-xl p-3 text-center">
          <p className="text-white font-black text-xl">{watchlist.length}</p>
          <p className="text-[#555] text-[10px] mt-1">Quero ver</p>
        </div>
        <div className="bg-[#111] rounded-xl p-3 text-center">
          <p className="text-[#f5b730] font-black text-xl">{avgRating ?? '—'}</p>
          <p className="text-[#555] text-[10px] mt-1">Nota média</p>
        </div>
      </div>

      {abandoned.length > 0 && (
        <div className="mx-4 mb-8 bg-[#111] rounded-xl p-3 flex items-center justify-between">
          <p className="text-[#555] text-[10px] font-bold uppercase tracking-wide">Abandonados</p>
          <p className="text-[#555] font-black text-lg">{abandoned.length}</p>
        </div>
      )}

      <SeriesSection
        title="Assistindo"
        items={watching}
        emptyMsg="Nenhuma série em andamento"
      />

      <SeriesSection
        title="Quero ver"
        items={watchlist}
        emptyMsg="Nenhum título na lista"
      />

      {abandoned.length > 0 && (
        <div className="mb-6 opacity-50">
          <div className="flex items-center justify-between px-4 mb-3">
            <p className="text-white font-bold text-base">Abandonados</p>
            <span className="text-[#555] text-xs">{abandoned.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
            {abandoned.map(item => (
              <div key={`${item.type}-${item.id}`} className="flex-shrink-0">
                <div className="w-24 h-36 bg-[#1a1a1a] rounded-xl overflow-hidden mb-1" style={{ filter: 'grayscale(1)' }}>
                  {item.poster
                    ? <img src={getPosterUrl(item.poster) ?? ''} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-[#333] text-xs">?</div>
                  }
                </div>
                <p className="text-[#555] text-xs font-medium w-24 line-clamp-2 leading-tight">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 mt-4">
        <button
          onClick={logout}
          className="w-full py-4 border border-[#2a2a2a] rounded-xl text-[#888] font-medium text-sm active:bg-[#111] transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
