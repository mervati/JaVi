import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useLibrary } from '../hooks/useLibrary'
import { getPosterUrl, getDetails, getSeriesDetails } from '../lib/tmdb'
import { db } from '../lib/firebase'
import type { LibraryItem } from '../hooks/useLibrary'

// ── helpers ──────────────────────────────────────────────────────────────────

function minutesToMDH(total: number) {
  const h = Math.floor(total / 60)
  const months = Math.floor(h / (24 * 30))
  const rem    = h % (24 * 30)
  const days   = Math.floor(rem / 24)
  const hours  = rem % 24
  return { months, days, hours }
}

function fmtNum(n: number) {
  return n.toLocaleString('pt-BR')
}

// ── stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, title, loading, children,
}: {
  icon: React.ReactNode
  title: string
  loading?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
      style={{ width: '170px', border: '1px solid #222', background: '#0f0f0f' }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #222' }}>
        <span className="text-white text-base">{icon}</span>
        <span className="text-white text-[12px] font-semibold leading-tight">{title}</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-4">
        {loading
          ? <div className="w-16 h-6 bg-[#1a1a1a] rounded animate-pulse" />
          : children
        }
      </div>
    </div>
  )
}

function TimeBreakdown({ months, days, hours }: { months: number; days: number; hours: number }) {
  return (
    <div className="flex gap-3 items-end">
      {[
        { val: months, label: 'MESES' },
        { val: days,   label: days === 1 ? 'DIA' : 'DIAS' },
        { val: hours,  label: 'HORAS' },
      ].map(({ val, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-white font-black text-2xl leading-none">{val}</span>
          <span className="text-[#555] text-[9px] font-bold mt-1 tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── seção horizontal de posters ───────────────────────────────────────────────

function SeriesSection({ title, items }: { title: string; items: LibraryItem[] }) {
  const navigate = useNavigate()
  if (!items.length) return null
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', marginBottom: '14px' }}>
        <p className="text-white font-bold text-base">{title}</p>
        <span className="text-[#555] text-xs">{items.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map(item => (
          <div
            key={`${item.type}-${item.id}`}
            onClick={() => navigate(item.type === 'tv' ? `/series/${item.id}` : `/movie/${item.id}`)}
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
    </div>
  )
}

function AbandonedSection({ items }: { items: LibraryItem[] }) {
  const navigate = useNavigate()
  if (!items.length) return null
  return (
    <div className="mb-8 opacity-50">
      <div className="flex items-center justify-between px-4 mb-3">
        <p className="text-white font-bold text-base">Abandonados</p>
        <span className="text-[#555] text-xs">{items.length}</span>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {items.map(item => (
          <div
            key={`${item.type}-${item.id}`}
            onClick={() => navigate(item.type === 'tv' ? `/series/${item.id}` : `/movie/${item.id}`)}
            className="flex-shrink-0 cursor-pointer"
          >
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
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export function Profile() {
  const { user, logout } = useAuth()
  const { items } = useLibrary()

  const watched   = items.filter(i => i.status === 'watched')
  const watchlist = items.filter(i => i.status === 'watchlist')
  const watching  = items.filter(i => i.status === 'watching')
  const abandoned = items.filter(i => i.status === 'abandoned')

  // episódios assistidos (de todas as séries)
  const [totalEpisodes, setTotalEpisodes] = useState<number | null>(null)
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'series_progress'))
    const unsub = onSnapshot(q, snap => {
      const total = snap.docs.reduce((sum, d) => sum + ((d.data().watched ?? []).length), 0)
      setTotalEpisodes(total)
    })
    return unsub
  }, [user])

  // tempo vendo filmes (busca runtime de cada filme assistido)
  const [movieMinutes, setMovieMinutes] = useState<number | null>(null)
  useEffect(() => {
    const watchedMovies = watched.filter(i => i.type === 'movie')
    if (!watchedMovies.length) { setMovieMinutes(0); return }
    Promise.all(watchedMovies.map(m => getDetails(m.id, 'movie')))
      .then(results => {
        const total = results.reduce((sum, r) => sum + (r.runtime ?? 0), 0)
        setMovieMinutes(total)
      })
      .catch(() => setMovieMinutes(0))
  }, [watched.filter(i => i.type === 'movie').map(i => i.id).join(',')])

  // tempo vendo TV (runtime médio por série × episódios assistidos)
  const [tvMinutes, setTvMinutes] = useState<number | null>(null)
  useEffect(() => {
    if (totalEpisodes === null) return
    const tvItems = items.filter(i => i.type === 'tv')
    if (!tvItems.length) { setTvMinutes(0); return }
    Promise.all(tvItems.map(s => getSeriesDetails(s.id)))
      .then(async results => {
        // série_id → runtime por episódio
        const runtimeMap: Record<number, number> = {}
        results.forEach((r, idx) => {
          runtimeMap[tvItems[idx].id] = r.episode_run_time?.[0] ?? 45
        })
        // buscar progresso para calcular total
        const q = query(collection(db, 'users', user!.uid, 'series_progress'))
        // usamos snapshot uma vez (já temos totalEpisodes, mas precisamos por série)
        const snap = await new Promise<any>(resolve => {
          const unsub = onSnapshot(q, s => { unsub(); resolve(s) })
        })
        let total = 0
        snap.docs.forEach((d: any) => {
          const seriesId = Number(d.id)
          const count    = (d.data().watched ?? []).length
          total += count * (runtimeMap[seriesId] ?? 45)
        })
        setTvMinutes(total)
      })
      .catch(() => setTvMinutes(0))
  }, [totalEpisodes, items.filter(i => i.type === 'tv').map(i => i.id).join(',')])

  const movieMDH = movieMinutes !== null ? minutesToMDH(movieMinutes) : null
  const tvMDH    = tvMinutes    !== null ? minutesToMDH(tvMinutes)    : null

  const statCards = [
    {
      icon: '📺',
      title: 'Episódios assistidos',
      loading: totalEpisodes === null,
      content: <span className="text-white font-black text-3xl">{fmtNum(totalEpisodes ?? 0)}</span>,
    },
    {
      icon: '📺',
      title: 'Tempo vendo TV',
      loading: !tvMDH,
      content: tvMDH ? <TimeBreakdown {...tvMDH} /> : null,
    },
    {
      icon: '🎬',
      title: 'Filmes assistidos',
      loading: false,
      content: <span className="text-white font-black text-3xl">{fmtNum(watched.filter(i => i.type === 'movie').length)}</span>,
    },
    {
      icon: '🎬',
      title: 'Tempo vendo filmes',
      loading: !movieMDH,
      content: movieMDH ? <TimeBreakdown {...movieMDH} /> : null,
    },
  ]

  return (
    <div className="py-6">
      {/* cabeçalho */}
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

      {/* grid de contagens */}
      <div className="grid grid-cols-4 gap-2 px-4" style={{ marginBottom: '28px' }}>
        <div className="bg-[#111] rounded-xl p-3 text-center">
          <p className="text-white font-black text-xl">{watching.length}</p>
          <p className="font-black text-[10px] mt-1" style={{ color: '#f5b730' }}>Assistindo</p>
        </div>
        <div className="bg-[#111] rounded-xl p-3 text-center">
          <p className="text-white font-black text-xl">{watched.length}</p>
          <p className="font-black text-[10px] mt-1" style={{ color: '#f5b730' }}>Assistidos</p>
        </div>
        <div className="bg-[#111] rounded-xl p-3 text-center">
          <p className="text-white font-black text-xl">{watchlist.length}</p>
          <p className="font-black text-[10px] mt-1" style={{ color: '#f5b730' }}>Quero ver</p>
        </div>
        <div className="bg-[#111] rounded-xl p-3 text-center">
          <p className="text-white font-black text-xl">{abandoned.length}</p>
          <p className="font-black text-[10px] mt-1" style={{ color: '#f5b730' }}>Abandonados</p>
        </div>
      </div>

      {/* listas de posters */}
      <SeriesSection title="Assistindo"  items={watching}  />
      <SeriesSection title="Quero ver"   items={watchlist} />
      <AbandonedSection items={abandoned} />

      {/* estatísticas */}
      <div className="px-4" style={{ paddingTop: '32px' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-black text-xl">Estatísticas</p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {statCards.map(card => (
            <StatCard key={card.title} icon={card.icon} title={card.title} loading={card.loading}>
              {card.content}
            </StatCard>
          ))}
        </div>
      </div>

      {/* botão sair */}
      <div className="px-4" style={{ paddingTop: '24px', paddingBottom: '16px' }}>
        <button
          onClick={logout}
          className="rounded-xl font-medium"
          style={{ background: '#e05555', color: '#fff', padding: '13px', fontSize: '14px', width: '90%', display: 'block', margin: '0 auto' }}
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
