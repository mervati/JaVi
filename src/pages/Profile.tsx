import { useAuth } from '../contexts/AuthContext'
import { useLibrary } from '../hooks/useLibrary'

export function Profile() {
  const { user, logout } = useAuth()
  const { items } = useLibrary()

  const watched = items.filter(i => i.status === 'watched')
  const watchlist = items.filter(i => i.status === 'watchlist')
  const rated = watched.filter(i => i.rating > 0)
  const avgRating = rated.length
    ? (rated.reduce((s, i) => s + i.rating, 0) / rated.length).toFixed(1)
    : null

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-4 mb-8">
        <img src={user?.photoURL ?? ''} alt="" className="w-16 h-16 rounded-full" />
        <div>
          <p className="text-white font-bold text-lg">{user?.displayName}</p>
          <p className="text-[#555] text-sm">{user?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[#111] rounded-xl p-4 text-center">
          <p className="text-white font-black text-2xl">{watched.length}</p>
          <p className="text-[#555] text-xs mt-1">Assistidos</p>
        </div>
        <div className="bg-[#111] rounded-xl p-4 text-center">
          <p className="text-white font-black text-2xl">{watchlist.length}</p>
          <p className="text-[#555] text-xs mt-1">Quero ver</p>
        </div>
        <div className="bg-[#111] rounded-xl p-4 text-center">
          <p className="text-[#f5b730] font-black text-2xl">{avgRating ?? '—'}</p>
          <p className="text-[#555] text-xs mt-1">Nota média</p>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-4 border border-[#2a2a2a] rounded-xl text-[#888] font-medium text-sm active:bg-[#111] transition-colors"
      >
        Sair da conta
      </button>
    </div>
  )
}
