import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { useLibrary } from '../hooks/useLibrary'
import { PosterImage } from '../components/PosterImage'
import { getPosterUrl, getDetails, getSeriesDetails } from '../lib/tmdb'
import { db } from '../lib/firebase'
import {
  isPushSupported,
  isPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/pushNotifications'
import type { LibraryItem } from '../hooks/useLibrary'
import { useAchievements } from '../hooks/useAchievements'
import { ACHIEVEMENTS, type AchievementDef } from '../lib/achievements'

// ── helpers ──────────────────────────────────────────────────────────────────

function localDateStr(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcStreak(items: LibraryItem[]): number {
  const dateSet = new Set<string>()
  items.forEach(item => {
    if (item.lastWatchedAt) dateSet.add(localDateStr(item.lastWatchedAt))
    if (item.status === 'watched') dateSet.add(localDateStr(item.addedAt))
  })

  const todayTs = new Date().setHours(12, 0, 0, 0) as number
  const todayStr = localDateStr(todayTs)
  const yestStr  = localDateStr(todayTs - 864e5)

  const start = dateSet.has(todayStr) ? 0 : dateSet.has(yestStr) ? 1 : null
  if (start === null) return 0

  let streak = 0
  for (let i = start; i < 365; i++) {
    if (dateSet.has(localDateStr(todayTs - i * 864e5))) streak++
    else break
  }
  return streak
}

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
              <PosterImage src={getPosterUrl(item.poster)} alt={item.title} />
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
              <PosterImage src={getPosterUrl(item.poster)} alt={item.title} />
            </div>
            <p className="text-[#555] text-xs font-medium w-24 line-clamp-2 leading-tight">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── achievement card ──────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  Bronze: '#c87833',
  Prata: '#aaaaaa',
  Ouro: '#e6b800',
}

function AchievementCard({ a, unlocked }: { a: AchievementDef; unlocked: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ aspectRatio: '1', background: '#111', border: `1px solid ${unlocked ? '#2a2a2a' : '#161616'}` }}
      >
        <img
          src={a.image}
          alt={a.name}
          className="w-full h-full object-contain p-2"
          style={!unlocked ? { filter: 'grayscale(1)', opacity: 0.35 } : undefined}
        />
        {a.tier && (
          <div
            className="absolute top-1.5 right-1.5 rounded-full px-1.5 py-0.5 text-[8px] font-black"
            style={{ background: TIER_COLORS[a.tier] ?? '#555', color: '#000', opacity: unlocked ? 1 : 0.45 }}
          >
            {a.tier.toUpperCase()}
          </div>
        )}
        {!unlocked && (
          <div className="absolute inset-0 flex items-end justify-end p-2">
            <svg className="w-4 h-4" fill="#333" viewBox="0 0 24 24">
              <path d="M18 10h-1V7c0-2.76-2.24-5-5-5S7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-6 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-7H8.9V7c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v3z"/>
            </svg>
          </div>
        )}
      </div>
      <p
        className="text-[10px] font-bold text-center leading-tight w-full px-0.5"
        style={{ color: unlocked ? '#ddd' : '#383838' }}
      >
        {a.name}{a.tier ? ` ${a.tier}` : ''}
      </p>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export function Profile() {
  const { user, logout } = useAuth()
  const { items } = useLibrary()
  const navigate = useNavigate()
  const { unlockedIds, newUnlock, clearNewUnlock } = useAchievements(items)

  const pushSupported = isPushSupported()
  const [pushEnabled, setPushEnabled] = useState(false)
  useEffect(() => {
    if (!pushSupported) return
    isPushSubscribed().then(setPushEnabled)
  }, [pushSupported])

  async function handlePushToggle() {
    if (!user) return
    if (pushEnabled) {
      await unsubscribeFromPush(user.uid)
      setPushEnabled(false)
    } else {
      const ok = await subscribeToPush(user.uid)
      if (ok) setPushEnabled(true)
    }
  }

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

  // gênero favorito — busca genres de todos os títulos assistidos/assistindo
  const [favoriteGenre, setFavoriteGenre] = useState<string | null | 'loading'>('loading')
  const activeIds = items
    .filter(i => i.status === 'watched' || i.status === 'watching')
    .map(i => `${i.type}-${i.id}`).join(',')
  useEffect(() => {
    const active = items.filter(i => i.status === 'watched' || i.status === 'watching')
    if (!active.length) { setFavoriteGenre(null); return }
    Promise.all(active.map(i => i.type === 'movie' ? getDetails(i.id, 'movie') : getSeriesDetails(i.id)))
      .then(results => {
        const freq: Record<string, number> = {}
        results.forEach(r => (r.genres ?? []).forEach((g: any) => {
          freq[g.name] = (freq[g.name] || 0) + 1
        }))
        const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]
        setFavoriteGenre(top ? top[0] : null)
      })
      .catch(() => setFavoriteGenre(null))
  }, [activeIds])

  // streak e nota média — calculados inline a partir dos itens já carregados
  const streakDays = calcStreak(items)
  const ratedItems = items.filter(i => i.rating > 0)
  const avgRating  = ratedItems.length
    ? (ratedItems.reduce((s, i) => s + i.rating, 0) / ratedItems.length).toFixed(1)
    : null

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
    {
      icon: '🎭',
      title: 'Gênero favorito',
      loading: favoriteGenre === 'loading',
      content: favoriteGenre && favoriteGenre !== 'loading'
        ? <span className="text-white font-black text-lg text-center leading-tight">{favoriteGenre}</span>
        : <span className="text-[#555] text-sm">—</span>,
    },
    {
      icon: '🔥',
      title: 'Dias seguidos',
      loading: false,
      content: (
        <div className="flex flex-col items-center">
          <span className="text-white font-black text-3xl">{streakDays}</span>
          <span className="text-[#555] text-[10px] font-bold mt-1 tracking-wide">DIAS</span>
        </div>
      ),
    },
    {
      icon: '⭐',
      title: 'Nota média',
      loading: false,
      content: avgRating
        ? (
          <div className="flex flex-col items-center">
            <span className="text-white font-black text-3xl">{avgRating}</span>
            <span className="text-[#555] text-[10px] font-bold mt-1 tracking-wide">{ratedItems.length} AVALIAÇÕES</span>
          </div>
        )
        : <span className="text-[#555] text-sm">—</span>,
    },
  ]

  return (
    <div className="py-6">
      {/* cabeçalho */}
      <div className="flex items-center gap-4 mb-8 px-4">
        {user?.photoURL
          ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-16 h-16 rounded-full" />
          : <img src="/icon-192.png" alt="JáVi" className="w-16 h-16 rounded-full" />
        }
        <div>
          <p className="text-white font-bold text-lg">{user?.displayName}</p>
          <p className="text-[#555] text-sm">{user?.email}</p>
        </div>
      </div>

      {/* grid de contagens */}
      <div className="grid grid-cols-4 gap-2 px-4" style={{ marginBottom: '28px' }}>
        {([
          { status: 'watching',  count: watching.length,  label: 'Assistindo'  },
          { status: 'watched',   count: watched.length,   label: 'Assistidos'  },
          { status: 'watchlist', count: watchlist.length, label: 'Quero ver'   },
          { status: 'abandoned', count: abandoned.length, label: 'Abandonados' },
        ] as const).map(({ status, count, label }) => (
          <button
            key={status}
            onClick={() => navigate(`/lista/${status}`)}
            className="bg-[#111] rounded-xl p-3 text-center active:bg-[#1a1a1a] transition-colors"
          >
            <p className="text-white font-black text-xl">{count}</p>
            <p className="font-black text-[10px] mt-1" style={{ color: '#f5b730' }}>{label}</p>
          </button>
        ))}
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

      {/* conquistas */}
      <div className="px-4" style={{ paddingTop: '32px', paddingBottom: '8px' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-black text-xl">Conquistas</p>
          <span className="text-[#555] text-xs font-bold">{unlockedIds.size}/{ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(a => (
            <AchievementCard key={a.id} a={a} unlocked={unlockedIds.has(a.id)} />
          ))}
        </div>
      </div>

      {/* toggle de notificações push */}
      {pushSupported && (
        <div className="px-4" style={{ paddingTop: '24px' }}>
          <button
            onClick={handlePushToggle}
            className="rounded-2xl w-full flex items-center justify-between active:opacity-70"
            style={{ background: '#111', border: '1px solid #222', padding: '16px 20px' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <div className="text-left">
                <p className="text-white text-sm font-bold">Notificações</p>
                <p className="text-[10px] font-medium" style={{ color: '#555' }}>
                  Avisar quando um novo episódio for ao ar
                </p>
              </div>
            </div>
            <div
              className="flex items-center rounded-full flex-shrink-0"
              style={{
                width: '44px',
                height: '24px',
                background: pushEnabled ? '#f5b730' : '#333',
                padding: '2px',
                transition: 'background 0.2s',
              }}
            >
              <div
                className="rounded-full bg-white"
                style={{
                  width: '20px',
                  height: '20px',
                  transform: pushEnabled ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 0.2s',
                }}
              />
            </div>
          </button>
        </div>
      )}

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

      {/* toast: conquista desbloqueada */}
      {newUnlock && (
        <div
          className="fixed z-[70] left-4 right-4 flex items-center gap-3 rounded-2xl"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 84px)',
            background: '#1a1a1a',
            border: '1px solid #f5b730',
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          }}
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#111' }}>
            <img src={newUnlock.image} alt="" className="w-full h-full object-contain p-1" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#f5b730] text-[10px] font-black uppercase tracking-widest mb-0.5">
              Conquista desbloqueada!
            </p>
            <p className="text-white font-bold text-sm leading-tight">
              {newUnlock.name}{newUnlock.tier ? ` ${newUnlock.tier}` : ''}
            </p>
            <p className="text-[#666] text-[11px] leading-tight mt-0.5">{newUnlock.description}</p>
          </div>
          <button
            onClick={clearNewUnlock}
            className="text-[#555] flex-shrink-0"
            style={{ fontSize: '22px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
