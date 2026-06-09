import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/LoginPage'
import { Search } from './pages/Search'
import { Series } from './pages/Series'
import { Movies } from './pages/Movies'
import { Profile } from './pages/Profile'
import { SeriesDetail } from './pages/SeriesDetail'
import { BottomNav } from './components/BottomNav'
import { useEffect, useRef } from 'react'

function AppContent() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isDetail = location.pathname.startsWith('/series/')
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

  return (
    <div className={isDetail ? '' : 'pb-20'}>
      {!isDetail && (
        <header className="flex items-center px-5 bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-40"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 14px)', paddingBottom: '14px' }}>
          <span className="text-white font-black text-xl tracking-tight">JáVi</span>
        </header>
      )}

      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/tv" element={<Series />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
      </Routes>

      {!isDetail && <BottomNav />}
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
