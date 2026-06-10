import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/LoginPage'
import { Home } from './pages/Home'
import { Search } from './pages/Search'
import { Series } from './pages/Series'
import { Movies } from './pages/Movies'
import { Profile } from './pages/Profile'
import { SeriesDetail } from './pages/SeriesDetail'
import { MovieDetail } from './pages/MovieDetail'
import { BottomNav } from './components/BottomNav'
import { useEffect, useRef } from 'react'

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isDetail = location.pathname.startsWith('/series/') || location.pathname.startsWith('/movie/')
  const prevUser = useRef(user)

  useEffect(() => {
    if (!prevUser.current && user) {
      navigate('/', { replace: true })
    }
    prevUser.current = user
  }, [user])

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
      </Routes>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: '100svh' }}>
      <header className="flex-shrink-0 flex items-center justify-center px-5 bg-[#0a0a0a] border-b border-[#1a1a1a] z-40"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: '14px' }}>
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="JáVi" className="w-9 h-9 rounded-lg" />
          <span className="text-white font-black text-2xl tracking-tight">JáVi</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}>
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
