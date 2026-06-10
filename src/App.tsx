import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RefreshContext } from './contexts/RefreshContext'
import { LoginPage } from './components/LoginPage'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { Series } from './pages/Series'
import { Movies } from './pages/Movies'
import { Profile } from './pages/Profile'
import { SeriesDetail } from './pages/SeriesDetail'
import { MovieDetail } from './pages/MovieDetail'
import { StatusList } from './pages/StatusList'
import { BottomNav } from './components/BottomNav'
import { useCallback, useEffect, useRef, useState } from 'react'

const PTR_THRESHOLD = 72

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isDetail = location.pathname.startsWith('/series/') || location.pathname.startsWith('/movie/') || location.pathname.startsWith('/lista/')
  const prevUser = useRef(user)

  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const refreshFnRef = useRef<() => Promise<void>>()
  const startYRef = useRef(0)
  const pullingRef = useRef(false)
  const pullYRef = useRef(0)
  const refreshingRef = useRef(false)
  refreshingRef.current = refreshing

  const registerRefresh = useCallback((fn: () => Promise<void>) => {
    refreshFnRef.current = fn
  }, [])

  useEffect(() => {
    if (!prevUser.current && user) {
      navigate('/', { replace: true })
    }
    prevUser.current = user
  }, [user])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    function handleMove(e: TouchEvent) {
      if (!pullingRef.current || refreshingRef.current) return
      if (el.scrollTop > 0) { pullingRef.current = false; setPullY(0); return }
      const dy = e.touches[0].clientY - startYRef.current
      if (dy > 0) {
        e.preventDefault()
        const clamped = Math.min(dy * 0.45, PTR_THRESHOLD + 20)
        pullYRef.current = clamped
        setPullY(clamped)
      }
    }
    el.addEventListener('touchmove', handleMove, { passive: false })
    return () => el.removeEventListener('touchmove', handleMove)
  }, [])

  function onPullStart(e: React.TouchEvent) {
    if (refreshingRef.current) return
    if ((mainRef.current?.scrollTop ?? 0) > 0) return
    startYRef.current = e.touches[0].clientY
    pullingRef.current = true
  }

  async function onPullEnd() {
    if (!pullingRef.current) return
    pullingRef.current = false
    const py = pullYRef.current
    pullYRef.current = 0
    if (py >= PTR_THRESHOLD) {
      setRefreshing(true)
      setPullY(PTR_THRESHOLD)
      try {
        await (refreshFnRef.current?.() ?? new Promise<void>(r => setTimeout(r, 600)))
      } finally {
        setRefreshing(false)
        setPullY(0)
      }
    } else {
      setPullY(0)
    }
  }

  const pct = Math.min(pullY / PTR_THRESHOLD, 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  if (isDetail) {
    return (
      <Routes>
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/lista/:status" element={<StatusList />} />
      </Routes>
    )
  }

  return (
    <RefreshContext.Provider value={registerRefresh}>
      <div className="flex flex-col" style={{ height: '100svh' }}>
        <header className="flex-shrink-0 flex items-center justify-center px-5 bg-[#0a0a0a] border-b border-[#1a1a1a] z-40"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: '14px' }}>
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="JáVi" className="w-9 h-9 rounded-lg" />
            <span className="text-white font-black text-2xl tracking-tight">JáVi</span>
          </div>
        </header>

        {(pullY > 0 || refreshing) && (
          <div style={{
            height: refreshing ? `${PTR_THRESHOLD}px` : `${pullY}px`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: '#0a0a0a',
            transition: pullingRef.current ? 'none' : 'height 0.28s ease',
          }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid #282828',
              borderTopColor: (pct >= 1 || refreshing) ? '#f5b730' : '#3a3a3a',
              animation: refreshing ? 'ptr-spin 0.75s linear infinite' : 'none',
              transform: refreshing ? undefined : `rotate(${pct * 270}deg)`,
              transition: refreshing ? 'none' : 'border-color 0.2s',
            }} />
          </div>
        )}

        <main
          ref={mainRef}
          onTouchStart={onPullStart}
          onTouchEnd={onPullEnd}
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explorar" element={<Search />} />
            <Route path="/tv" element={<Series />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/series/:id" element={<SeriesDetail />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </RefreshContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}
