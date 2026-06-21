import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RefreshContext } from './contexts/RefreshContext'
import { AchievementsProvider, useAchievementsContext } from './contexts/AchievementsContext'
import { LoginPage } from './components/LoginPage'
import { BottomNav } from './components/BottomNav'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return (
    <>
      <div className="fixed inset-0 z-[60]" style={{ background: 'rgba(0,0,0,0.6)' }} />
      <div
        className="fixed z-[60] rounded-2xl flex flex-col items-center"
        style={{ background: '#0f0f0f', border: '1px solid #222', padding: '28px 24px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 48px)', maxWidth: '340px' }}
      >
        <div className="w-10 h-1 rounded-full" style={{ background: '#333', marginBottom: '20px' }} />
        <p className="text-[#888] text-xs font-bold uppercase tracking-widest mb-2">Nova versão</p>
        <p className="text-white font-black text-lg text-center leading-tight mb-3 px-2">
          Atualização disponível
        </p>
        <p className="text-[#666] text-sm text-center leading-relaxed px-2" style={{ marginBottom: '20px' }}>
          Uma nova versão do app está pronta. Deseja atualizar agora?
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={() => setNeedRefresh(false)}
            className="flex-1 py-[14px] rounded-xl text-[15px] font-bold"
            style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a' }}
          >
            Agora não
          </button>
          <button
            onClick={() => { sessionStorage.setItem('app_just_updated', '1'); updateServiceWorker(true) }}
            className="flex-1 py-[14px] rounded-xl text-[15px] font-bold"
            style={{ background: '#f5b730', color: '#000', border: '1px solid #e6a820' }}
          >
            Atualizar
          </button>
        </div>
      </div>
    </>
  )
}

const Home        = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const Search      = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })))
const Series      = lazy(() => import('./pages/Series').then(m => ({ default: m.Series })))
const Movies      = lazy(() => import('./pages/Movies').then(m => ({ default: m.Movies })))
const Profile     = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))
const SeriesDetail = lazy(() => import('./pages/SeriesDetail').then(m => ({ default: m.SeriesDetail })))
const MovieDetail  = lazy(() => import('./pages/MovieDetail').then(m => ({ default: m.MovieDetail })))
const StatusList   = lazy(() => import('./pages/StatusList').then(m => ({ default: m.StatusList })))

const PTR_THRESHOLD = 72

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { newUnlock, clearNewUnlock } = useAchievementsContext()
  const isDetail = location.pathname.startsWith('/series/') || location.pathname.startsWith('/movie/')
  const prevUser = useRef(user)

  const [showUpdatedToast, setShowUpdatedToast] = useState(() => sessionStorage.getItem('app_just_updated') === '1')
  useEffect(() => {
    if (showUpdatedToast) {
      sessionStorage.removeItem('app_just_updated')
      const t = setTimeout(() => setShowUpdatedToast(false), 4000)
      return () => clearTimeout(t)
    }
  }, [showUpdatedToast])

  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const refreshFnRef = useRef<(() => Promise<void>) | undefined>(undefined)
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

    function handleStart(e: TouchEvent) {
      if (refreshingRef.current) return
      if (isDetail) return
      if (el!.scrollTop > 0) return
      startYRef.current = e.touches[0].clientY
      pullingRef.current = true
    }

    function handleMove(e: TouchEvent) {
      if (!pullingRef.current || refreshingRef.current) return
      if (el!.scrollTop > 0) { pullingRef.current = false; setPullY(0); return }
      const dy = e.touches[0].clientY - startYRef.current
      if (dy > 0) {
        if (e.cancelable) e.preventDefault()
        const clamped = Math.min(dy * 0.45, PTR_THRESHOLD + 20)
        pullYRef.current = clamped
        setPullY(clamped)
      }
    }

    async function handleEnd() {
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

    el.addEventListener('touchstart',       handleStart, { passive: true })
    document.addEventListener('touchmove',  handleMove,  { passive: false })
    document.addEventListener('touchend',   handleEnd)
    return () => {
      el.removeEventListener('touchstart',       handleStart)
      document.removeEventListener('touchmove',  handleMove)
      document.removeEventListener('touchend',   handleEnd)
    }
  }, [])

  const pct = Math.min(pullY / PTR_THRESHOLD, 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <RefreshContext.Provider value={registerRefresh}>
      <div className="flex flex-col" style={{ height: '100dvh' }}>
        {!isDetail && (
          <header className="flex-shrink-0 flex items-center justify-center px-5 bg-[#0a0a0a] border-b border-[#1a1a1a] z-40"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: '14px' }}>
            <div className="flex items-center gap-2">
              <img src="/icon-192.png" alt="JáVi" className="w-9 h-9 rounded-lg" />
              <span className="text-white font-black text-2xl tracking-tight">JáVi</span>
            </div>
          </header>
        )}

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
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 70px)', overscrollBehaviorY: 'contain' }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/explorar" element={<Search />} />
              <Route path="/tv" element={<Series />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/series/:id" element={<SeriesDetail />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/lista/:status" element={<StatusList />} />
            </Routes>
          </Suspense>
        </main>

        <BottomNav />
        {showUpdatedToast && (
          <div
            className="fixed z-[70] rounded-2xl flex items-center gap-3"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 80px)', left: '16px', right: '16px', background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#4caf50' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-sm font-semibold">App atualizado com sucesso!</p>
          </div>
        )}

        {newUnlock && (
          <div
            className="fixed z-[70] left-4 right-4 flex items-center gap-3 rounded-2xl"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)', background: '#1a1a1a', border: '1px solid #f5b730', padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}
          >
            <div className="flex-shrink-0 overflow-hidden" style={{ width: 44, height: 44, borderRadius: 8, background: '#fff' }}>
              <img src={newUnlock.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#f5b730] text-[10px] font-black uppercase tracking-widest mb-0.5">Conquista desbloqueada!</p>
              <p className="text-white font-bold text-sm leading-tight">{newUnlock.name}{newUnlock.tier ? ` ${newUnlock.tier}` : ''}</p>
              <p className="text-[#666] text-[11px] leading-tight mt-0.5">{newUnlock.description}</p>
            </div>
            <button onClick={clearNewUnlock} className="text-[#555] flex-shrink-0" style={{ fontSize: '22px', lineHeight: 1 }}>×</button>
          </div>
        )}
      </div>
    </RefreshContext.Provider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AchievementsProvider>
          <AppContent />
          <UpdatePrompt />
        </AchievementsProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
