import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/LoginPage'
import { Search } from './pages/Search'
import { Library } from './pages/Library'
import { Profile } from './pages/Profile'
import { BottomNav } from './components/BottomNav'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#f5b730] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <div className="pb-20">
      <header className="flex items-center justify-between px-4 h-[53px] bg-[#0a0a0a] border-b border-[#1a1a1a] sticky top-0 z-40">
        <span className="text-white font-black text-xl tracking-tight">JáVi</span>
        <div className="w-2 h-2 rounded-full bg-[#f5b730]" />
      </header>

      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/library" element={<Library />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

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
